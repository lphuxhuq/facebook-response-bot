import { logger } from '../utils/logger.js';

export interface ScheduledTask {
  id: string;
  name: string;
  intervalMs: number;
  runImmediately?: boolean;
  execute: () => Promise<void>;
}

export class Scheduler {
  private timers = new Map<string, NodeJS.Timeout>();
  private isRunning = false;

  schedule(task: ScheduledTask): void {
    if (this.timers.has(task.id)) {
      this.cancel(task.id);
    }

    if (task.runImmediately) {
      task.execute().catch((err) => {
        logger.error({ err, taskId: task.id }, 'Error running scheduled task immediately');
      });
    }

    const timer = setInterval(() => {
      task.execute().catch((err) => {
        logger.error({ err, taskId: task.id }, 'Error running scheduled task');
      });
    }, task.intervalMs);

    if (timer.unref) {
      timer.unref();
    }

    this.timers.set(task.id, timer);
  }

  cancel(taskId: string): boolean {
    const timer = this.timers.get(taskId);
    if (!timer) return false;
    clearInterval(timer);
    this.timers.delete(taskId);
    return true;
  }

  stopAll(): void {
    for (const [id, timer] of this.timers.entries()) {
      clearInterval(timer);
    }
    this.timers.clear();
    this.isRunning = false;
  }
}
