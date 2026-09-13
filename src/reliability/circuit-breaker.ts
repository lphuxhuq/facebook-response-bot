import { logger } from '../utils/logger.js';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  cooldownMs?: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private consecutiveFailures = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.cooldownMs = options.cooldownMs || 60000; // 60 seconds default
  }

  getState(): CircuitState {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.cooldownMs) {
        this.state = 'HALF_OPEN';
        logger.info('CircuitBreaker transitioning from OPEN to HALF_OPEN (probing)');
      }
    }
    return this.state;
  }

  recordSuccess(): void {
    if (this.state !== 'CLOSED') {
      logger.info({ previousState: this.state }, 'CircuitBreaker recovered: transitioning to CLOSED');
    }
    this.consecutiveFailures = 0;
    this.state = 'CLOSED';
  }

  recordFailure(err?: any): void {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();

    logger.warn(
      { failures: this.consecutiveFailures, threshold: this.failureThreshold, err: err?.message },
      'CircuitBreaker recorded failure'
    );

    if (this.consecutiveFailures >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.error('CircuitBreaker failure threshold reached: circuit is now OPEN (requests paused)');
    }
  }

  assertAvailable(): void {
    const currentState = this.getState();
    if (currentState === 'OPEN') {
      const remainingSec = Math.ceil((this.lastFailureTime + this.cooldownMs - Date.now()) / 1000);
      throw new Error(`CircuitBreaker is OPEN. All transport requests paused. Cooldown remaining: ${remainingSec}s`);
    }
  }

  reset(): void {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.lastFailureTime = 0;
  }
}
