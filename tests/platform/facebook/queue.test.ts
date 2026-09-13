import { describe, it, expect } from 'vitest';
import { OutgoingMessageQueue } from '../../../src/platform/facebook/queue.js';

describe('OutgoingMessageQueue', () => {
  it('should process tasks through queue and return results', async () => {
    const queue = new OutgoingMessageQueue(2, 5);

    const task1 = queue.enqueue(async () => 'res1');
    const task2 = queue.enqueue(async () => 'res2');

    const [r1, r2] = await Promise.all([task1, task2]);
    expect(r1).toBe('res1');
    expect(r2).toBe('res2');
  });

  it('should propagate errors from queued task without crashing queue', async () => {
    const queue = new OutgoingMessageQueue(2, 5);

    const failingTask = queue.enqueue(async () => {
      throw new Error('Send failed');
    });
    const successfulTask = queue.enqueue(async () => 'recovered');

    await expect(failingTask).rejects.toThrow('Send failed');
    const res = await successfulTask;
    expect(res).toBe('recovered');
  });
});
