import { describe, it, expect, vi } from 'vitest';
import { CommandRouter } from '../../src/core/command-router.js';
import { PermissionManager, InMemoryPermissionProvider } from '../../src/core/permission-manager.js';
import { CooldownManager } from '../../src/core/cooldown-manager.js';
import { SessionManager, InMemorySessionStore } from '../../src/core/session-manager.js';
import { Command, MessageContext, Role } from '../../src/core/context.js';

function createMockContext(text: string, userId = 'user1', role = Role.USER): MessageContext {
  return {
    platform: 'test',
    userId,
    conversationId: 'conv1',
    messageId: 'msg1',
    text,
    attachments: [],
    isGroup: false,
    timestamp: Date.now(),
    reply: vi.fn().mockResolvedValue({ messageId: 'm2', recipientId: userId, timestamp: Date.now() }),
    send: vi.fn().mockResolvedValue({ messageId: 'm3', recipientId: userId, timestamp: Date.now() }),
    react: vi.fn().mockResolvedValue(undefined),
  };
}

describe('CommandRouter', () => {
  it('should route prefixed message to matching command and aliases', async () => {
    const permissionManager = new PermissionManager(new InMemoryPermissionProvider());
    const cooldownManager = new CooldownManager();
    const sessionManager = new SessionManager(new InMemorySessionStore());

    const router = new CommandRouter({
      prefix: '!',
      permissionManager,
      cooldownManager,
      sessionManager,
    });

    const executePing = vi.fn();
    const pingCmd: Command = {
      name: 'ping',
      aliases: ['p', 'pong'],
      description: 'Check ping',
      category: 'core',
      execute: executePing,
    };

    router.register(pingCmd);

    // Test primary name
    const ctx1 = createMockContext('!ping');
    const handled1 = await router.handleMessage(ctx1);
    expect(handled1).toBe(true);
    expect(executePing).toHaveBeenCalledTimes(1);

    // Test alias
    const ctx2 = createMockContext('!p');
    const handled2 = await router.handleMessage(ctx2);
    expect(handled2).toBe(true);
    expect(executePing).toHaveBeenCalledTimes(2);

    // Test non-prefixed message
    const ctx3 = createMockContext('hello');
    const handled3 = await router.handleMessage(ctx3);
    expect(handled3).toBe(false);
    expect(executePing).toHaveBeenCalledTimes(2);

    sessionManager.destroy();
  });

  it('should enforce role restrictions on commands', async () => {
    const permissionManager = new PermissionManager(new InMemoryPermissionProvider('owner1'));
    const cooldownManager = new CooldownManager();
    const sessionManager = new SessionManager(new InMemorySessionStore());

    const router = new CommandRouter({
      prefix: '!',
      permissionManager,
      cooldownManager,
      sessionManager,
    });

    const executeAdmin = vi.fn();
    const adminCmd: Command = {
      name: 'shutdown',
      description: 'Admin only',
      category: 'admin',
      requiredRole: Role.ADMIN,
      execute: executeAdmin,
    };

    router.register(adminCmd);

    // Normal user attempts admin command
    const userCtx = createMockContext('!shutdown', 'normal_user');
    await router.handleMessage(userCtx);
    expect(executeAdmin).not.toHaveBeenCalled();
    expect(userCtx.reply).toHaveBeenCalledWith(expect.stringContaining('Bạn không có quyền'));

    // Owner attempts admin command
    const ownerCtx = createMockContext('!shutdown', 'owner1');
    await router.handleMessage(ownerCtx);
    expect(executeAdmin).toHaveBeenCalledTimes(1);

    sessionManager.destroy();
  });
});
