import { describe, it, expect } from 'vitest';
import { FakeFacebookTransport } from '../../src/transport/facebook/fake-transport.ts';
import { RequestQueue } from '../../src/reliability/request-queue.ts';

describe('Performance & Load Tests (1,000 Simulated Jobs)', () => {
  it('should process 1,000 jobs through RequestQueue without memory leak or queue deadlock', async () => {
    const queue = new RequestQueue(10, 2, 2000); // 10 global concurrency, 2 per thread
    const transport = new FakeFacebookTransport();
    await transport.connect();

    const initialMem = process.memoryUsage().heapUsed;
    const startTime = Date.now();
    const totalJobs = 1000;

    const promises: Promise<any>[] = [];
    for (let i = 0; i < totalJobs; i++) {
      const threadId = `group_${i % 20}`; // Distributed across 20 group threads
      promises.push(
        queue.enqueue(threadId, async () => {
          return transport.sendMessage(threadId, { text: `Message payload #${i}` });
        })
      );
    }

    const results = await Promise.all(promises);
    const durationMs = Date.now() - startTime;
    const finalMem = process.memoryUsage().heapUsed;
    const memDeltaMb = (finalMem - initialMem) / 1024 / 1024;

    expect(results.length).toBe(totalJobs);
    expect(queue.size).toBe(0);
    expect(queue.activeCount).toBe(0);
    expect(transport.sentMessages.length).toBe(totalJobs);

    // Assert high throughput and bounded memory growth (< 30 MB for 1,000 items)
    expect(memDeltaMb).toBeLessThan(30);
    expect(durationMs).toBeLessThan(5000); // Less than 5 seconds
  });
});
