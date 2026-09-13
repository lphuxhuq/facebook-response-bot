import { describe, it, expect } from 'vitest';
import { FakeFacebookTransport } from '../../src/transport/facebook/fake-transport.ts';
import { RequestQueue } from '../../src/reliability/request-queue.ts';
import { CircuitBreaker } from '../../src/reliability/circuit-breaker.ts';
import { HealthMonitor } from '../../src/reliability/health-monitor.ts';
import { Deduplicator } from '../../src/reliability/deduplication.ts';

describe('Failure Simulation & Resilience Tests', () => {
  it('1. Simulate Transport Timeout/500 -> triggers CircuitBreaker opening', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 100 });
    const transport = new FakeFacebookTransport();
    transport.shouldFailSend = true;

    for (let i = 0; i < 3; i++) {
      try {
        await transport.sendMessage('th1', { text: 'test' });
      } catch (e) {
        cb.recordFailure(e);
      }
    }

    expect(cb.getState()).toBe('OPEN');
    expect(() => cb.assertAvailable()).toThrow(/CircuitBreaker is OPEN/);
  });

  it('2. Simulate Auth Failure -> HealthMonitor halts and pauses execution', () => {
    const monitor = new HealthMonitor(true);
    expect(monitor.isExecutionAllowed()).toBe(true);

    // Simulate session expired / checkpoint error
    monitor.setAuthError('Facebook session expired (checkpoint 282)');
    expect(monitor.isExecutionAllowed()).toBe(false);
    expect(monitor.getStatus().status).toBe('AUTH_ERROR');
  });

  it('3. Simulate Duplicate Webhook/MQTT delivery -> Deduplicator discards', () => {
    const dedup = new Deduplicator(5000);
    const messageId = 'fb_mid_duplicate_12345';

    expect(dedup.isDuplicate(messageId)).toBe(false); // First arrival is processed
    expect(dedup.isDuplicate(messageId)).toBe(true);  // Duplicate arrival is ignored
    expect(dedup.isDuplicate(messageId)).toBe(true);  // Triplicate arrival is ignored
  });

  it('4. Simulate Queue Retries on transient error', async () => {
    const queue = new RequestQueue(2, 1);
    let attempts = 0;

    const res = await queue.enqueue(
      'thread_retry',
      async () => {
        attempts++;
        if (attempts < 3) {
          const err: any = new Error('Transient 503 Service Unavailable');
          err.isRetryable = true;
          throw err;
        }
        return 'recovered_ok';
      },
      'normal',
      3
    );

    expect(res).toBe('recovered_ok');
    expect(attempts).toBe(3);
  });
});
