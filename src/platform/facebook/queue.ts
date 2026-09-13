import { logger } from '../../utils/logger.js';

export interface QueuedMessage<T> {
  id: string;
  task: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
}

export class OutgoingMessageQueue {
  private queue: Array<QueuedMessage<any>> = [];
  private activeCount = 0;
  private isProcessing = false;

  constructor(
    private readonly concurrency: number = 5,
    private readonly delayBetweenMs: number = 50
  ) {}

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        task,
        resolve,
        reject,
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.activeCount >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0 && this.activeCount < this.concurrency) {
      const item = this.queue.shift();
      if (!item) break;

      this.activeCount++;

      (async () => {
        try {
          const result = await item.task();
          item.resolve(result);
        } catch (err) {
          logger.error({ err, itemId: item.id }, 'Error executing queued outgoing message');
          item.reject(err);
        } finally {
          this.activeCount--;
          if (this.delayBetweenMs > 0) {
            await new Promise((res) => setTimeout(res, this.delayBetweenMs));
          }
          this.processQueue();
        }
      })();
    }

    this.isProcessing = false;
  }

  get size(): number {
    return this.queue.length;
  }

  get active(): number {
    return this.activeCount;
  }

  clear(): void {
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      item?.reject(new Error('Queue cleared'));
    }
  }
}
