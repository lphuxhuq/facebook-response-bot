import { describe, it, expect } from 'vitest';
import { RequestQueue } from '../../src/reliability/request-queue.ts';

describe('RequestQueue with Concurrency and Priorities', () => {
  it('should prioritize critical jobs over normal jobs', async () => {
    const queue = new RequestQueue(1, 1);
    const executionOrder: string[] = [];

    // Enqueue normal job first
    const normalPromise = queue.enqueue('thread1', async () => {
      await new Promise((r) => setTimeout(r, 20));
      executionOrder.push('normal');
      return 'normal';
    }, 'normal');

    // Enqueue background job
    const bgPromise = queue.enqueue('thread1', async () => {
      executionOrder.push('background');
      return 'background';
    }, 'background');

    // Enqueue critical job
    const criticalPromise = queue.enqueue('thread1', async () => {
      executionOrder.push('critical');
      return 'critical';
    }, 'critical');

    await Promise.all([normalPromise, bgPromise, criticalPromise]);

    // First running job was normal, but critical should run before background
    expect(executionOrder[0]).toBe('normal');
    expect(executionOrder[1]).toBe('critical');
    expect(executionOrder[2]).toBe('background');
  });

  it('should enforce per-thread concurrency strictly to 1', async () => {
    const queue = new RequestQueue(5, 1); // 5 global, 1 per thread
    let thread1Running = 0;
    let maxConcurrentInThread1 = 0;

    const tasks = Array.from({ length: 5 }).map((_, i) =>
      queue.enqueue('thread1', async () => {
        thread1Running++;
        maxConcurrentInThread1 = Math.max(maxConcurrentInThread1, thread1Running);
        await new Promise((r) => setTimeout(r, 10));
        thread1Running--;
        return i;
      })
    );

    await Promise.all(tasks);
    expect(maxConcurrentInThread1).toBe(1);
  });
});
