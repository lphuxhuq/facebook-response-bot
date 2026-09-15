import { RateLimitError } from '../utils/errors.js';

export interface CooldownCheckResult {
  allowed: boolean;
  remainingMs: number;
}

export class CooldownManager {
  // Key format: `${userId}:${commandName}` -> expiration timestamp in ms
  private cooldowns = new Map<string, number>();

  check(userId: string, commandName: string, cooldownSec: number): CooldownCheckResult {
    if (cooldownSec <= 0) {
      return { allowed: true, remainingMs: 0 };
    }

    const key = `${userId}:${commandName}`;
    const now = Date.now();
    const expiresAt = this.cooldowns.get(key);

    if (expiresAt && expiresAt > now) {
      return {
        allowed: false,
        remainingMs: expiresAt - now,
      };
    }

    return { allowed: true, remainingMs: 0 };
  }

  set(userId: string, commandName: string, cooldownSec: number): void {
    if (cooldownSec <= 0) return;
    const key = `${userId}:${commandName}`;
    this.cooldowns.set(key, Date.now() + cooldownSec * 1000);
  }

  assertAllowed(userId: string, commandName: string, cooldownSec: number): void {
    const result = this.check(userId, commandName, cooldownSec);
    if (!result.allowed) {
      const waitSec = Math.ceil(result.remainingMs / 1000);
      throw new RateLimitError(
        `Command '${commandName}' is on cooldown. Please wait ${waitSec} second(s).`,
        result.remainingMs
      );
    }
    this.set(userId, commandName, cooldownSec);
  }

  reset(userId: string, commandName: string): void {
    this.cooldowns.delete(`${userId}:${commandName}`);
  }

  clear(): void {
    this.cooldowns.clear();
  }
}

export interface RateLimiterOptions {
  capacity: number;
  refillRate: number;
}

export class TokenBucketRateLimiter {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();
  private readonly capacity: number;
  private readonly refillRate: number;

  constructor(options: RateLimiterOptions = { capacity: 10, refillRate: 2 }) {
    this.capacity = options.capacity;
    this.refillRate = options.refillRate;
  }

  consume(key: string, tokens = 1): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.capacity, lastRefill: now };
      this.buckets.set(key, bucket);
    } else {
      const elapsedSec = (now - bucket.lastRefill) / 1000;
      bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsedSec * this.refillRate);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      return true;
    }
    return false;
  }

  reset(key?: string): void {
    if (key) {
      this.buckets.delete(key);
    } else {
      this.buckets.clear();
    }
  }
}

