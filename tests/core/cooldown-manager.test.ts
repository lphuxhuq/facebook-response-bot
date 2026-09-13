import { describe, it, expect } from 'vitest';
import { CooldownManager } from '../../src/core/cooldown-manager.js';
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
