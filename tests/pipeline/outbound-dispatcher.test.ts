import { describe, it, expect, vi } from 'vitest';
import { OutboundDispatcher } from '../../src/pipeline/outbound-dispatcher.js';
import { HealthMonitor } from '../../src/reliability/health-monitor.js';
import { MessageSender } from '../../src/platform/facebook/sender.js';
import { AuthenticationError, RateLimitError, PermissionDeniedError } from '../../src/utils/errors.js';
import { SendResult } from '../../src/core/context.js';

const okResult: SendResult = { messageId: 'm1', recipientId: 'r1', timestamp: Date.now() };

function makeTransport(impl?: (id: string, msg: any) => Promise<SendResult>): MessageSender & { calls: number } {
  const fn = vi.fn(
    impl ?? (async () => okResult)
  ) as any;
  return { send: fn, get calls() { return fn.mock.calls.length; } };
}

describe('OutboundDispatcher', () => {
  it('routes all sends through the transport and returns results', async () => {
    const hm = new HealthMonitor();
    const transport = makeTransport();
    const dispatcher = new OutboundDispatcher(transport, hm, { globalOpsPerSecond: 100 });

    const result = await dispatcher.send('r1', { text: 'hello' });

    expect(result).toEqual(okResult);
    expect(transport.calls).toBe(1);
    hm.resume();
  });

  it('serializes jobs for the same thread (threadConcurrency=1)', async () => {
    const hm = new HealthMonitor();
    let inFlight = 0;
    let maxInFlightPerThread = 0;
    const transport = makeTransport(async () => {
      inFlight++;
      maxInFlightPerThread = Math.max(maxInFlightPerThread, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      return okResult;
    });
    const dispatcher = new OutboundDispatcher(transport, hm, {
      threadConcurrency: 1,
      globalConcurrency: 5,
      globalOpsPerSecond: 1000,
    });

    await Promise.all([
      dispatcher.send('thread-A', 'a1'),
      dispatcher.send('thread-A', 'a2'),
      dispatcher.send('thread-A', 'a3'),
    ]);

    expect(maxInFlightPerThread).toBe(1);
  });

  it('retries transient failures with bounded attempts', async () => {
    const hm = new HealthMonitor();
    let attempts = 0;
    const transport = makeTransport(async () => {
      attempts++;
      if (attempts < 3) {
        const err: any = new Error('socket hang up');
        err.code = 'ECONNRESET';
        throw err;
      }
      return okResult;
    });
    const dispatcher = new OutboundDispatcher(transport, hm, {
      globalOpsPerSecond: 1000,
      maxRetries: 3,
      baseRetryDelayMs: 1,
    });

    const result = await dispatcher.send('r1', 'hi');
    expect(result).toEqual(okResult);
    expect(attempts).toBe(3);
  });

  it('gives up permanently after exceeding max retries', async () => {
    const hm = new HealthMonitor();
    const transport = makeTransport(async () => {
      const err: any = new Error('ETIMEDOUT');
      err.code = 'ETIMEDOUT';
      throw err;
    });
    const dispatcher = new OutboundDispatcher(transport, hm, {
      globalOpsPerSecond: 1000,
      maxRetries: 1,
      baseRetryDelayMs: 1,
      failureThreshold: 999,
    });

    await expect(dispatcher.send('r1', 'hi')).rejects.toThrow('ETIMEDOUT');
    // 1 initial + 1 retry
    expect(transport.calls).toBe(2);
  });

  it('PAUSE on auth error: no retry loop, health -> AUTH_ERROR, admin notified', async () => {
    const hm = new HealthMonitor();
    const notify = vi.fn().mockResolvedValue(undefined);
    const transport = makeTransport(async () => {
      throw new AuthenticationError('Facebook session expired (checkpoint 282)');
    });
    const dispatcher = new OutboundDispatcher(transport, hm, {
      globalOpsPerSecond: 1000,
      maxRetries: 5,
      baseRetryDelayMs: 1,
      adminNotifier: notify,
    });

    await expect(dispatcher.send('r1', 'hi')).rejects.toThrow(AuthenticationError);

    expect(transport.calls).toBe(1); // no retries on auth failure
    expect(hm.getStatus().status).toBe('AUTH_ERROR');
    expect(hm.isExecutionAllowed()).toBe(false);
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('does not retry a paused dispatch and fails fast', async () => {
    const hm = new HealthMonitor();
    hm.pause('maintenance');
    const transport = makeTransport();
    const dispatcher = new OutboundDispatcher(transport, hm, { globalOpsPerSecond: 1000 });

    await expect(dispatcher.send('r1', 'hi')).rejects.toThrow(/paused/i);
    expect(transport.calls).toBe(0);
  });

  it('opens the circuit after repeated failures and stops transport traffic', async () => {
    const hm = new HealthMonitor();
    const transport = makeTransport(async () => {
      const err: any = new Error('boom');
      err.code = 'ECONNRESET';
      throw err;
    });
    const dispatcher = new OutboundDispatcher(transport, hm, {
      globalOpsPerSecond: 1000,
      maxRetries: 0,
      failureThreshold: 3,
    });

    for (let i = 0; i < 3; i++) {
      await expect(dispatcher.send(`r${i}`, 'x')).rejects.toThrow('boom');
    }

    const callsBeforeOpen = transport.calls;
    // 4th send: circuit OPEN -> fails fast WITHOUT hitting transport
    await expect(dispatcher.send('r9', 'x')).rejects.toThrow(/CircuitBreaker is OPEN/);
    expect(transport.calls).toBe(callsBeforeOpen);
  });

  it('PERMISSION/VALIDATION errors fail immediately without retry', async () => {
    const hm = new HealthMonitor();
    const transport = makeTransport(async () => {
      throw new PermissionDeniedError('not allowed');
    });
    const dispatcher = new OutboundDispatcher(transport, hm, {
      globalOpsPerSecond: 1000,
      maxRetries: 3,
      baseRetryDelayMs: 1,
    });

    await expect(dispatcher.send('r1', 'hi')).rejects.toThrow('not allowed');
    expect(transport.calls).toBe(1);
  });

  it('RATE_LIMIT errors use the server-provided retryAfter backoff', async () => {
    const hm = new HealthMonitor();
    const times: number[] = [];
    let attempts = 0;
    const transport = makeTransport(async () => {
      times.push(Date.now());
      attempts++;
      if (attempts === 1) throw new RateLimitError('slow down', 40);
      return okResult;
    });
    const dispatcher = new OutboundDispatcher(transport, hm, {
      globalOpsPerSecond: 1000,
      maxRetries: 2,
      baseRetryDelayMs: 1,
    });

    await dispatcher.send('r1', 'hi');
    expect(attempts).toBe(2);
    expect(times[1] - times[0]).toBeGreaterThanOrEqual(35); // honored ~40ms retryAfter
  });

  it('getStats reports queue, circuit and pause state', async () => {
    const hm = new HealthMonitor();
    const transport = makeTransport();
    const dispatcher = new OutboundDispatcher(transport, hm, { globalOpsPerSecond: 1000 });

    const stats = dispatcher.getStats();
    expect(stats.circuit).toBe('CLOSED');
    expect(stats.health).toBe('CONNECTED');
    expect(stats.paused).toBe(false);

    hm.pause('x');
    expect(dispatcher.getStats().paused).toBe(true);
  });
});
