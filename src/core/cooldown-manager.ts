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
