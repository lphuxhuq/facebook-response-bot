import { describe, it, expect } from 'vitest';
import { PermissionManager, InMemoryPermissionProvider } from '../../src/core/permission-manager.js';
import { Role } from '../../src/core/context.js';
import { PermissionDeniedError } from '../../src/utils/errors.js';

describe('PermissionManager', () => {
  it('should default normal user to Role.USER', async () => {
    const provider = new InMemoryPermissionProvider('owner123');
    const pm = new PermissionManager(provider);

    expect(await pm.getRole('user456')).toBe(Role.USER);
    expect(await pm.getRole('owner123')).toBe(Role.OWNER);
  });

  it('should authorize roles correctly in hierarchy', async () => {
    const provider = new InMemoryPermissionProvider('owner123');
    const pm = new PermissionManager(provider);

    await pm.setRole('admin1', Role.ADMIN);
    await pm.setRole('mod1', Role.MODERATOR);
    await pm.setRole('user1', Role.USER);
    await pm.setRole('banned1', Role.BANNED);

    // Admin can access MODERATOR and USER commands
    expect(await pm.isAuthorized('admin1', Role.USER)).toBe(true);
    expect(await pm.isAuthorized('admin1', Role.MODERATOR)).toBe(true);
    expect(await pm.isAuthorized('admin1', Role.ADMIN)).toBe(true);
    expect(await pm.isAuthorized('admin1', Role.OWNER)).toBe(false);

    // Moderator cannot access ADMIN
    expect(await pm.isAuthorized('mod1', Role.ADMIN)).toBe(false);

    // Banned user cannot access anything
    expect(await pm.isAuthorized('banned1', Role.USER)).toBe(false);
  });

  it('should throw PermissionDeniedError on assertAuthorized failure', async () => {
    const provider = new InMemoryPermissionProvider('owner123');
    const pm = new PermissionManager(provider);

    await expect(pm.assertAuthorized('user1', Role.ADMIN)).rejects.toThrow(PermissionDeniedError);
  });
});
