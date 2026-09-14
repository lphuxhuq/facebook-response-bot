import { OutgoingMessage, SendResult } from '../core/context.js';
import { MessageSender } from '../platform/facebook/sender.js';
import { RequestQueue, JobPriority } from '../reliability/request-queue.js';
import { RateLimiter } from '../reliability/rate-limiter.js';
import { CircuitBreaker } from '../reliability/circuit-breaker.js';
import { HealthMonitor } from '../reliability/health-monitor.js';
import { AuthenticationError, RateLimitError, PermissionDeniedError, ValidationError, PlatformError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface OutboundDispatcherOptions {
  globalConcurrency?: number;
  threadConcurrency?: number;
  maxQueueSize?: number;
  failureThreshold?: number;
  circuitCooldownMs?: number;
  globalOpsPerSecond?: number;
  maxRetries?: number;
  baseRetryDelayMs?: number;
  /** Bypasses the dispatcher to alert admins even while paused. */
  adminNotifier?: (text: string) => Promise<void>;
}

export interface OutboundStats {
  queued: number;
  active: number;
  circuit: string;
  health: string;
  paused: boolean;
}

/** Retry policy classification (Phase 13). */
function classifyError(err: any): 'RETRY' | 'BACKOFF' | 'PAUSE' | 'FAIL' {
  if (err instanceof AuthenticationError) return 'PAUSE';
  if (err instanceof RateLimitError) return 'BACKOFF';
  if (err instanceof PermissionDeniedError || err instanceof ValidationError) return 'FAIL';
  if (err instanceof PlatformError) return err.isRetryable ? 'RETRY' : 'FAIL';
  // Network/timeout style errors thrown by fetch are transient
  const code = err?.code || '';
  if (['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'UND_ERR_CONNECT_TIMEOUT'].includes(code)) {
    return 'RETRY';
  }
  if (err?.name === 'AbortError' || /timeout|network/i.test(String(err?.message || ''))) return 'RETRY';
  return 'RETRY';
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Phase 11–14 outbound pipeline. Commands/transport closures call send();
 * nothing reaches the wire without passing:
 *
 *   OutboundQueue (priority, per-thread serialization)
 *     -> Execution gate (HealthMonitor kill switch / AUTH_ERROR)
 *     -> CircuitBreaker (stop spamming a failing transport)
 *     -> Global rate pacing (RateLimiter)
 *     -> Transport (bounded retry: transient=retry, rate-limit=backoff,
 *        auth=pause+notify, permission/validation=fail — Phase 13)
 */
export class OutboundDispatcher implements MessageSender {
  private queue: RequestQueue;
  private rateLimiter: RateLimiter;
  private circuitBreaker: CircuitBreaker;
  private healthMonitor: HealthMonitor;
  private adminNotifier?: (text: string) => Promise<void>;
  private readonly maxRetries: number;
  private readonly baseRetryDelayMs: number;

  constructor(
    private transport: MessageSender,
    healthMonitor: HealthMonitor,
    options: OutboundDispatcherOptions = {}
  ) {
    this.healthMonitor = healthMonitor;
    this.adminNotifier = options.adminNotifier;
    this.maxRetries = options.maxRetries ?? 3;
    this.baseRetryDelayMs = options.baseRetryDelayMs ?? 1000;
    // maxAttempts=1: the dispatcher owns retry policy (classify + backoff),
    // the queue provides priority ordering + per-thread serialization only.
    this.queue = new RequestQueue(
      options.globalConcurrency ?? 3,
      options.threadConcurrency ?? 1,
      options.maxQueueSize ?? 1000
    );
    this.rateLimiter = new RateLimiter({
      globalOpsPerSecond: options.globalOpsPerSecond ?? 5,
    });
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: options.failureThreshold ?? 5,
      cooldownMs: options.circuitCooldownMs ?? 60000,
    });
  }

  send(recipientId: string, message: OutgoingMessage | string): Promise<SendResult> {
    return this.enqueueSend(recipientId, message, 'normal');
  }

  sendCritical(recipientId: string, message: OutgoingMessage | string): Promise<SendResult> {
    return this.enqueueSend(recipientId, message, 'critical');
  }

  private enqueueSend(
    recipientId: string,
    message: OutgoingMessage | string,
    priority: JobPriority
  ): Promise<SendResult> {
    return this.queue.enqueue(recipientId, () => this.dispatchWithRetry(recipientId, message), priority, 1);
  }

  private async dispatchWithRetry(recipientId: string, message: OutgoingMessage | string): Promise<SendResult> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const result = await this.dispatchOnce(recipientId, message);
      if (result.kind === 'ok') return result.value;
      if (result.kind === 'fail') throw result.error;

      lastError = result.error;
      if (attempt < this.maxRetries) {
        const delay = result.kind === 'backoff'
          ? Math.max(result.retryAfterMs ?? 0, this.baseRetryDelayMs * 2 ** attempt)
          : this.baseRetryDelayMs * 2 ** attempt;
        logger.warn(
          { recipientId, attempt: attempt + 1, maxRetries: this.maxRetries, delayMs: delay, error: lastError?.message },
          'Outbound send failed with transient error, backing off before retry'
        );
        await sleep(delay);
      }
    }

    throw lastError ?? new Error('Outbound dispatch exhausted retries');
  }

  private async dispatchOnce(
    recipientId: string,
    message: OutgoingMessage | string
  ): Promise<
    | { kind: 'ok'; value: SendResult }
    | { kind: 'retry'; error: any }
    | { kind: 'backoff'; error: any; retryAfterMs?: number }
    | { kind: 'fail'; error: any }
  > {
    if (!this.healthMonitor.isExecutionAllowed()) {
      return { kind: 'fail', error: new Error('Bot execution is paused (kill switch or auth error)') };
    }

    this.circuitBreaker.assertAvailable();
    await this.rateLimiter.acquireGlobal();

    try {
      const value = await this.transport.send(recipientId, message);
      this.circuitBreaker.recordSuccess();
      return { kind: 'ok', value };
    } catch (err: any) {
      const kind = classifyError(err);

      if (kind === 'PAUSE') {
        // Phase 12: AUTH failure -> PAUSE, notify admin, never retry-loop.
        this.circuitBreaker.recordFailure(err);
        this.healthMonitor.setAuthError(err.message || 'Authentication failed');
        await this.notifyAdmin(`⚠️ Bot paused: Facebook authentication error — ${err.message || 'check session'}`);
        return { kind: 'fail', error: err };
      }

      this.circuitBreaker.recordFailure(err);

      if (kind === 'FAIL') return { kind: 'fail', error: err };
      if (kind === 'BACKOFF') {
        return { kind: 'backoff', error: err, retryAfterMs: err.retryAfterMs };
      }
      return { kind: 'retry', error: err };
    }
  }

  private async notifyAdmin(text: string): Promise<void> {
    if (!this.adminNotifier) return;
    try {
      await this.adminNotifier(text);
    } catch (err) {
      logger.error({ err }, 'Failed to notify admin of transport error');
    }
  }

  getStats(): OutboundStats {
    const hs = this.healthMonitor.getStatus();
    return {
      queued: this.queue.size,
      active: this.queue.activeCount,
      circuit: this.circuitBreaker.getState(),
      health: hs.status,
      paused: !this.healthMonitor.isExecutionAllowed(),
    };
  }

  /** Used by tests/graceful shutdown. */
  clear(): void {
    this.queue.clear();
  }
}
