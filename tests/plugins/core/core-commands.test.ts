import { describe, it, expect, vi } from 'vitest';
import { pingCommand } from '../../../src/plugins/core/commands/ping.js';
import { helpCommand } from '../../../src/plugins/core/commands/help.js';
import { uptimeCommand } from '../../../src/plugins/core/commands/uptime.js';
import { rulesCommand } from '../../../src/plugins/core/commands/rules.js';
import { CommandContext, Role } from '../../../src/core/context.js';

function createMockCommandContext(args: string[] = [], services: any = {}): CommandContext {
  return {
    platform: 'test',
    userId: 'user1',
    conversationId: 'c1',
    messageId: 'm1',
    text: '!cmd',
    attachments: [],
    isGroup: false,
    timestamp: Date.now(),
    commandName: 'cmd',
    args,
    rawArgs: args.join(' '),
    userRole: Role.USER,
    sessionManager: {},
    services,
    repositories: {},
    reply: vi.fn().mockResolvedValue({ messageId: 'm2', recipientId: 'user1', timestamp: Date.now() }),
    send: vi.fn().mockResolvedValue({ messageId: 'm3', recipientId: 'user1', timestamp: Date.now() }),
    react: vi.fn().mockResolvedValue(undefined),
  };
}

describe('Core Commands', () => {
  it('pingCommand should reply with latency', async () => {
    const ctx = createMockCommandContext();
    await pingCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledTimes(2);
    expect(ctx.reply).toHaveBeenLastCalledWith(expect.stringContaining('Độ trễ phản hồi'));
  });

  it('uptimeCommand should reply with system status', async () => {
    const ctx = createMockCommandContext();
    await uptimeCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('HỆ THỐNG BOT V2'));
  });

  it('rulesCommand should reply with bot guidelines', async () => {
    const ctx = createMockCommandContext();
    await rulesCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('QUY ĐỊNH SỬ DỤNG BOT'));
  });

  it('helpCommand should list all commands or inspect single command', async () => {
    const mockRouter = {
      getAllCommands: () => [pingCommand, helpCommand],
    };

    // List all
    const ctxAll = createMockCommandContext([], { commandRouter: mockRouter });
    await helpCommand.execute(ctxAll);
    expect(ctxAll.reply).toHaveBeenCalledWith(expect.stringContaining('!ping'));

    // Inspect ping
    const ctxInspect = createMockCommandContext(['ping'], { commandRouter: mockRouter });
    await helpCommand.execute(ctxInspect);
    expect(ctxInspect.reply).toHaveBeenCalledWith(expect.stringContaining('Chi tiết lệnh: PING'));
  });
});
