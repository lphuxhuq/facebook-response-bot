import { describe, it, expect, vi } from 'vitest';
import { bankCommand } from '../../../src/plugins/economy/commands/bank.js';
import { CommandContext, Role } from '../../../src/core/context.js';

describe('Economy Plugin - Bank Command', () => {
  it('should display balance', async () => {
    const mockUserRepo = {
      getOrCreate: vi.fn().mockResolvedValue({ id: 'u1', balance: 50000 }),
    };

    const ctx: CommandContext = {
      platform: 'test',
      userId: 'u1',
      conversationId: 'c1',
      messageId: 'm1',
      text: '!bank',
      attachments: [],
      isGroup: false,
      timestamp: Date.now(),
      commandName: 'bank',
      args: [],
      rawArgs: '',
      userRole: Role.USER,
      sessionManager: {},
      services: {},
      repositories: { user: mockUserRepo },
      reply: vi.fn(),
      send: vi.fn(),
      react: vi.fn(),
    };

    await bankCommand.execute(ctx);
    expect(mockUserRepo.getOrCreate).toHaveBeenCalledWith('u1');
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('50.000 coins'));
  });

  it('should give daily coins', async () => {
    const mockUserRepo = {
      updateBalance: vi.fn().mockResolvedValue(55000),
    };

    const ctx: CommandContext = {
      platform: 'test',
      userId: 'u1',
      conversationId: 'c1',
      messageId: 'm1',
      text: '!bank daily',
      attachments: [],
      isGroup: false,
      timestamp: Date.now(),
      commandName: 'bank',
      args: ['daily'],
      rawArgs: 'daily',
      userRole: Role.USER,
      sessionManager: {},
      services: {},
      repositories: { user: mockUserRepo },
      reply: vi.fn(),
      send: vi.fn(),
      react: vi.fn(),
    };

    await bankCommand.execute(ctx);
    expect(mockUserRepo.updateBalance).toHaveBeenCalledWith('u1', 5000);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Điểm danh hằng ngày thành công'));
  });

  it('should perform safe peer-to-peer transfers', async () => {
    const mockUserRepo = {
      getBalance: vi.fn().mockResolvedValue(10000),
      updateBalance: vi.fn().mockResolvedValue(7000),
    };

    const ctx: CommandContext = {
      platform: 'test',
      userId: 'sender1',
      conversationId: 'c1',
      messageId: 'm1',
      text: '!bank pay receiver2 3000',
      attachments: [],
      isGroup: false,
      timestamp: Date.now(),
      commandName: 'bank',
      args: ['pay', 'receiver2', '3000'],
      rawArgs: 'pay receiver2 3000',
      userRole: Role.USER,
      sessionManager: {},
      services: {},
      repositories: { user: mockUserRepo },
      reply: vi.fn(),
      send: vi.fn(),
      react: vi.fn(),
    };

    await bankCommand.execute(ctx);
    expect(mockUserRepo.getBalance).toHaveBeenCalledWith('sender1');
    expect(mockUserRepo.updateBalance).toHaveBeenCalledWith('sender1', -3000);
    expect(mockUserRepo.updateBalance).toHaveBeenCalledWith('receiver2', 3000);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Chuyển khoản thành công'));
  });
});
