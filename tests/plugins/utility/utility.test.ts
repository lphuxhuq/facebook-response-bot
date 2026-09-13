import { describe, it, expect, vi } from 'vitest';
import { calcCommand } from '../../../src/plugins/utility/commands/calc.js';
import { quoteCommand } from '../../../src/plugins/utility/commands/quote.js';
import { weatherCommand } from '../../../src/plugins/utility/commands/weather.js';
import { CommandContext, Role } from '../../../src/core/context.js';

function createMockCtx(rawArgs: string, services: any = {}): CommandContext {
  return {
    platform: 'test',
    userId: 'u1',
    conversationId: 'c1',
    messageId: 'm1',
    text: `!cmd ${rawArgs}`,
    attachments: [],
    isGroup: false,
    timestamp: Date.now(),
    commandName: 'cmd',
    args: rawArgs.split(' '),
    rawArgs,
    userRole: Role.USER,
    sessionManager: {},
    services,
    repositories: {},
    reply: vi.fn(),
    send: vi.fn(),
    react: vi.fn(),
  };
}

describe('Utility Plugin', () => {
  it('calcCommand should calculate valid arithmetic correctly', async () => {
    const ctx = createMockCtx('(10 + 5) * 2');
    await calcCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('(10 + 5) * 2 = 30'));
  });

  it('calcCommand should reject malicious expressions with code injection', async () => {
    const ctx = createMockCtx('process.exit()');
    await calcCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Biểu thức chứa ký tự không hợp lệ'));
  });

  it('quoteCommand should return inspirational quote', async () => {
    const ctx = createMockCtx('');
    await quoteCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('DANH NGÔN / CA DAO'));
  });

  it('weatherCommand should format weather report', async () => {
    const mockWeather = {
      getWeather: vi.fn().mockResolvedValue({
        city: 'Hanoi',
        temperature: 29,
        feelsLike: 32,
        humidity: 80,
        description: 'Mây rải rác',
        windSpeed: 4,
      }),
    };
    const ctx = createMockCtx('Hanoi', { weatherService: mockWeather });
    await weatherCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('THỜI TIẾT TẠI: HANOI'));
  });
});
