import { describe, it, expect } from 'vitest';
import { CooldownManager, TokenBucketRateLimiter } from '../../src/core/cooldown-manager.js';
import { RateLimitError } from '../../src/utils/errors.js';

describe('CooldownManager', () => {
  it('should allow command on first execution', () => {
    const cm = new CooldownManager();
    const res = cm.check('user1', 'ping', 5);
    expect(res.allowed).toBe(true);
    expect(res.remainingMs).toBe(0);
  });

  it('should block command during active cooldown', () => {
    const cm = new CooldownManager();
    cm.set('user1', 'ping', 5);

    const res = cm.check('user1', 'ping', 5);
    expect(res.allowed).toBe(false);
    expect(res.remainingMs).toBeGreaterThan(0);
  });

  it('should throw RateLimitError when assertAllowed is called during cooldown', () => {
    const cm = new CooldownManager();
    cm.assertAllowed('user1', 'ping', 5);

    expect(() => {
      cm.assertAllowed('user1', 'ping', 5);
    }).toThrow(RateLimitError);
  });

  it('should isolate cooldowns between different users and commands', () => {
    const cm = new CooldownManager();
    cm.set('user1', 'ping', 5);

    expect(cm.check('user2', 'ping', 5).allowed).toBe(true);
    expect(cm.check('user1', 'help', 5).allowed).toBe(true);
  });
});

describe('TokenBucketRateLimiter', () => {
  it('allows burst up to capacity and blocks afterwards', () => {
    const rl = new TokenBucketRateLimiter({ capacity: 3, refillRate: 1 });
    expect(rl.consume('user1')).toBe(true);
    expect(rl.consume('user1')).toBe(true);
    expect(rl.consume('user1')).toBe(true);
    expect(rl.consume('user1')).toBe(false); // exhausted
    // other user unaffected
    expect(rl.consume('user2')).toBe(true);
  });

  it('resets user bucket properly', () => {
    const rl = new TokenBucketRateLimiter({ capacity: 1, refillRate: 1 });
    expect(rl.consume('user1')).toBe(true);
    expect(rl.consume('user1')).toBe(false);
    rl.reset('user1');
    expect(rl.consume('user1')).toBe(true);
  });
});

