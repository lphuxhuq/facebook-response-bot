import { describe, it, expect, vi } from 'vitest';
import { groupInfoCommand } from '../../../src/plugins/group/commands/groupinfo.ts';
import { groupSettingsCommand } from '../../../src/plugins/group/commands/settings.ts';
import { CommandContext, Role } from '../../../src/core/context.ts';

describe('Group Plugin', () => {
  it('groupInfoCommand should format group statistics and thread settings', async () => {
    const mockThreadSettings = {
      getSettings: vi.fn().mockReturnValue({
        threadId: 'group_123',
        prefix: '#',
        aiEnabled: true,
        welcomeEnabled: true,
        antiSpam: false,
      }),
    };

    const ctx: CommandContext = {
      platform: 'test',
      userId: 'u1',
      conversationId: 'group_123',
      messageId: 'm1',
      text: '!groupinfo',
      attachments: [],
      isGroup: true,
      timestamp: Date.now(),
      commandName: 'groupinfo',
      args: [],
      rawArgs: '',
      userRole: Role.USER,
      sessionManager: {},
      services: {},
      repositories: { threadSettings: mockThreadSettings },
      thread: {
        id: 'group_123',
        name: 'Hội Bạn Thân',
        participants: [{ id: 'u1' }, { id: 'u2' }],
        adminIds: ['u1'],
      },
      reply: vi.fn(),
      send: vi.fn(),
      react: vi.fn(),
    };

    await groupInfoCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Hội Bạn Thân'));
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Tiền tố lệnh (Prefix): #'));
  });

  it('groupSettingsCommand should reject non-admin users', async () => {
    const ctx: CommandContext = {
      platform: 'test',
      userId: 'normal_user',
      conversationId: 'group_123',
      messageId: 'm1',
      text: '!groupsettings prefix #',
      attachments: [],
      isGroup: true,
      timestamp: Date.now(),
      commandName: 'groupsettings',
      args: ['prefix', '#'],
      rawArgs: 'prefix #',
      userRole: Role.USER,
      isThreadAdmin: false,
      sessionManager: {},
      services: {},
      repositories: { threadSettings: { saveSettings: vi.fn() } },
      reply: vi.fn(),
      send: vi.fn(),
      react: vi.fn(),
    };

    await groupSettingsCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Chỉ Quản trị viên nhóm (QTV)'));
  });

  it('groupSettingsCommand should allow group admin to change prefix', async () => {
    const mockSave = vi.fn();
    const ctx: CommandContext = {
      platform: 'test',
      userId: 'group_admin_user',
      conversationId: 'group_123',
      messageId: 'm1',
      text: '!groupsettings prefix $',
      attachments: [],
      isGroup: true,
      timestamp: Date.now(),
      commandName: 'groupsettings',
      args: ['prefix', '$'],
      rawArgs: 'prefix $',
      userRole: Role.USER,
      isThreadAdmin: true,
      sessionManager: {},
      services: {},
      repositories: { threadSettings: { saveSettings: mockSave } },
      reply: vi.fn(),
      send: vi.fn(),
      react: vi.fn(),
    };

    await groupSettingsCommand.execute(ctx);
    expect(mockSave).toHaveBeenCalledWith({ threadId: 'group_123', prefix: '$' });
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining("Đã đổi tiền tố lệnh của nhóm thành: '$'"));
  });
});
