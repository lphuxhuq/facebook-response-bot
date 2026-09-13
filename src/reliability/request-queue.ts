import { logger } from '../utils/logger.js';

export type JobPriority = 'critical' | 'normal' | 'background';
export type JobStatus = 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'RETRY' | 'FAILED' | 'CANCELLED';

export interface QueueJob<T> {
  id: string;
  threadId: string;
  priority: JobPriority;
  task: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
  attempt: number;
  maxAttempts: number;
  status: JobStatus;
  createdAt: number;
}

export class RequestQueue {
  private queue: Array<QueueJob<any>> = [];
  private activeJobs = new Map<string, QueueJob<any>>();
  private activePerThread = new Map<string, number>();
  private isProcessing = false;

  constructor(
    private readonly globalConcurrency: number = 3,
    private readonly threadConcurrency: number = 1,
    private readonly maxQueueSize: number = 1000
  ) {}

  enqueue<T>(
    threadId: string,
    task: () => Promise<T>,
    priority: JobPriority = 'normal',
    maxAttempts: number = 3
  ): Promise<T> {
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error(`Queue capacity exceeded (${this.maxQueueSize} jobs)`);
    }

    return new Promise<T>((resolve, reject) => {
      const job: QueueJob<T> = {
        id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        threadId,
        priority,
        task,
        resolve,
        reject,
        attempt: 0,
        maxAttempts,
        status: 'QUEUED',
        createdAt: Date.now(),
      };

      // Priority ordering: critical > normal > background
      const priorityWeights = { critical: 3, normal: 2, background: 1 };
      const idx = this.queue.findIndex((item) => priorityWeights[item.priority] < priorityWeights[priority]);

      if (idx === -1) {
        this.queue.push(job);
      } else {
        this.queue.splice(idx, 0, job);
      }

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0 && this.activeJobs.size < this.globalConcurrency) {
        // Find next eligible job considering per-thread concurrency
        const jobIndex = this.queue.findIndex((j) => {
          const currentThreadActive = this.activePerThread.get(j.threadId) || 0;
          return currentThreadActive < this.threadConcurrency;
        });

        if (jobIndex === -1) {
          // All queued jobs are blocked by their respective thread concurrency limits
          break;
        }

        const [job] = this.queue.splice(jobIndex, 1);
        this.activeJobs.set(job.id, job);
        this.activePerThread.set(job.threadId, (this.activePerThread.get(job.threadId) || 0) + 1);
        job.status = 'RUNNING';
        job.attempt++;

        (async () => {
          try {
            const result = await job.task();
            job.status = 'SUCCESS';
            job.resolve(result);
          } catch (err: any) {
            if (job.attempt < job.maxAttempts && err?.isRetryable !== false) {
              job.status = 'RETRY';
              logger.warn({ jobId: job.id, attempt: job.attempt, err: err.message }, 'Retrying failed queue job');
              this.queue.unshift(job); // Re-insert with priority
            } else {
              job.status = 'FAILED';
              logger.error({ jobId: job.id, err }, 'Queue job permanently failed');
              job.reject(err);
            }
          } finally {
            this.activeJobs.delete(job.id);
            const remainingInThread = (this.activePerThread.get(job.threadId) || 1) - 1;
            if (remainingInThread <= 0) {
              this.activePerThread.delete(job.threadId);
            } else {
              this.activePerThread.set(job.threadId, remainingInThread);
            }
            this.processQueue();
          }
        })();
      }
    } finally {
      this.isProcessing = false;
    }
  }

  get size(): number {
    return this.queue.length;
  }

  get activeCount(): number {
    return this.activeJobs.size;
  }

  clear(): void {
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      job?.reject(new Error('Queue cleared'));
    }
  }
}
