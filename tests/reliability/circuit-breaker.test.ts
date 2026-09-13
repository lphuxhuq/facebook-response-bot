import { describe, it, expect } from 'vitest';
import { CircuitBreaker } from '../../src/reliability/circuit-breaker.ts';

describe('CircuitBreaker State Transitions', () => {
  it('should transition from CLOSED to OPEN when threshold reached', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 100 });
    expect(cb.getState()).toBe('CLOSED');

    cb.recordFailure(new Error('err 1'));
    expect(cb.getState()).toBe('CLOSED');

    cb.recordFailure(new Error('err 2'));
    expect(cb.getState()).toBe('CLOSED');

    cb.recordFailure(new Error('err 3'));
    expect(cb.getState()).toBe('OPEN');

    expect(() => cb.assertAvailable()).toThrow(/CircuitBreaker is OPEN/);
  });

  it('should transition to HALF_OPEN after cooldown and back to CLOSED on success', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 50 });
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.getState()).toBe('OPEN');

    // Wait for cooldown to elapse
    await new Promise((r) => setTimeout(r, 60));
    expect(cb.getState()).toBe('HALF_OPEN');

    // Successful probe request recovers circuit
    cb.recordSuccess();
    expect(cb.getState()).toBe('CLOSED');
  });
});
