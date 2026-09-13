import { describe, it, expect, vi } from 'vitest';
import { adminCommand } from '../../../src/plugins/admin/commands/admin.js';
import { CommandContext, Role } from '../../../src/core/context.js';

describe('AdminCommand', () => {
  it('should show guide if no subcommand is passed', async () => {
    const ctx: CommandContext = {
      platform: 'test',
      userId: 'admin1',
      conversationId: 'c1',
      messageId: 'm1',
      text: '!admin',
      attachments: [],
      isGroup: false,
      timestamp: Date.now(),
      commandName: 'admin',
      args: [],
      rawArgs: '',
      userRole: Role.ADMIN,
      sessionManager: {},
      services: {},
      repositories: {},
      reply: vi.fn(),
      send: vi.fn(),
      react: vi.fn(),
    };

    await adminCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('BẢNG ĐIỀU KHIỂN QUẢN TRỊ VIÊN'));
  });

  it('should allow banning user and write audit log', async () => {
    const mockUserRepo = {
      setUserRole: vi.fn().mockResolvedValue(undefined),
    };
    const mockAuditRepo = {
      log: vi.fn(),
    };

    const ctx: CommandContext = {
      platform: 'test',
      userId: 'admin1',
      conversationId: 'c1',
      messageId: 'm1',
      text: '!admin ban bad_user spam',
      attachments: [],
      isGroup: false,
      timestamp: Date.now(),
      commandName: 'admin',
      args: ['ban', 'bad_user', 'spam'],
      rawArgs: 'ban bad_user spam',
      userRole: Role.ADMIN,
      sessionManager: {},
      services: {},
      repositories: { user: mockUserRepo, audit: mockAuditRepo },
      reply: vi.fn(),
      send: vi.fn(),
      react: vi.fn(),
    };

    await adminCommand.execute(ctx);
    expect(mockUserRepo.setUserRole).toHaveBeenCalledWith('bad_user', Role.BANNED);
    expect(mockAuditRepo.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'BAN_USER', userId: 'admin1' })
    );
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Đã cấm người dùng bad_user'));
  });
});
