export interface RateLimiterOptions {
  globalOpsPerSecond?: number;
  perUserWindowMs?: number;
  perUserMaxOps?: number;
}

export class RateLimiter {
  private globalLastOpTime = 0;
  private readonly globalIntervalMs: number;
  private userBuckets = new Map<string, number[]>();
  private readonly userWindowMs: number;
  private readonly userMaxOps: number;

  constructor(options: RateLimiterOptions = {}) {
    const opsPerSec = options.globalOpsPerSecond || 5;
    this.globalIntervalMs = Math.floor(1000 / opsPerSec);
    this.userWindowMs = options.perUserWindowMs || 5000;
    this.userMaxOps = options.perUserMaxOps || 5;
  }

  async acquireGlobal(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.globalLastOpTime;

    if (elapsed < this.globalIntervalMs) {
      const waitTime = this.globalIntervalMs - elapsed;
      this.globalLastOpTime = now + waitTime;
      await new Promise((r) => setTimeout(r, waitTime));
    } else {
      this.globalLastOpTime = now;
    }
  }

  isUserRateLimited(userId: string): boolean {
    const now = Date.now();
    let timestamps = this.userBuckets.get(userId) || [];

    // Filter out timestamps outside window
    timestamps = timestamps.filter((t) => now - t < this.userWindowMs);

    if (timestamps.length >= this.userMaxOps) {
      this.userBuckets.set(userId, timestamps);
      return true;
    }

    timestamps.push(now);
    this.userBuckets.set(userId, timestamps);
    return false;
  }

  clear(): void {
    this.userBuckets.clear();
    this.globalLastOpTime = 0;
  }
}
