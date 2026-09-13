import { describe, it, expect, vi } from 'vitest';
import { aiCommand } from '../../../src/plugins/ai/commands/ai.js';
import { MockAIProvider } from '../../../src/services/ai/mock-provider.js';
import { CommandContext, Role } from '../../../src/core/context.js';

describe('AI Command', () => {
  it('should ask for input when no prompt is provided', async () => {
    const ctx: CommandContext = {
      platform: 'test',
      userId: 'u1',
      conversationId: 'c1',
      messageId: 'm1',
      text: '!ai',
      attachments: [],
      isGroup: false,
      timestamp: Date.now(),
      commandName: 'ai',
      args: [],
      rawArgs: '',
      userRole: Role.USER,
      sessionManager: {},
      services: { aiProvider: new MockAIProvider() },
      repositories: {},
      reply: vi.fn(),
      send: vi.fn(),
      react: vi.fn(),
    };

    await aiCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Bạn muốn trò chuyện gì với tôi?'));
  });

  it('should query AI provider and return response', async () => {
    const mockAi = new MockAIProvider();
    const ctx: CommandContext = {
      platform: 'test',
      userId: 'u1',
      conversationId: 'c1',
      messageId: 'm1',
      text: '!ai Xin chào thế giới',
      attachments: [],
      isGroup: false,
      timestamp: Date.now(),
      commandName: 'ai',
      args: ['Xin', 'chào', 'thế', 'giới'],
      rawArgs: 'Xin chào thế giới',
      userRole: Role.USER,
      sessionManager: {},
      services: { aiProvider: mockAi },
      repositories: {},
      reply: vi.fn(),
      send: vi.fn(),
      react: vi.fn(),
    };

    await aiCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith('💭 Đang suy nghĩ...');
    expect(ctx.reply).toHaveBeenLastCalledWith(expect.stringContaining('Tôi đã nhận được tin nhắn'));
  });
});
