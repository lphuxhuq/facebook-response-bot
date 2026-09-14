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

  it('should build context from local message history (Phase 21)', async () => {
    const chatSpy = vi.fn().mockResolvedValue({ content: 'ok', provider: 'spy', model: 'm' });
    const mockAi = { name: 'spy', chat: chatSpy };
    const ctx: CommandContext = {
      platform: 'test',
      userId: 'u1',
      conversationId: 'c1',
      messageId: 'm1',
      text: '!ai tiếp tục đi',
      attachments: [],
      isGroup: false,
      timestamp: Date.now(),
      commandName: 'ai',
      args: [],
      rawArgs: 'tiếp tục đi',
      userRole: Role.USER,
      sessionManager: {},
      services: { aiProvider: mockAi },
      repositories: {
        messageHistory: {
          getRecentMessages: vi.fn().mockReturnValue([
            { sender_id: 'u1', text: 'Tin nhắn cũ 1' },
            { sender_id: 'bot', text: 'Phản hồi trước đó' },
          ]),
        },
      },
      reply: vi.fn(),
      send: vi.fn(),
      react: vi.fn(),
    };

    await aiCommand.execute(ctx);

    const request = chatSpy.mock.calls[0][0];
    const roles = request.messages.map((m: any) => m.role);
    expect(roles).toEqual(['system', 'user', 'assistant', 'user']);
    expect(request.messages[1].content).toBe('Tin nhắn cũ 1');
    expect(request.messages[2].content).toBe('Phản hồi trước đó');
    expect(request.messages[3].content).toBe('tiếp tục đi');
  });

  it('should respect per-group ai_enabled=false setting', async () => {
    const ctx: CommandContext = {
      platform: 'test',
      userId: 'u1',
      conversationId: 'group_c1',
      messageId: 'm1',
      text: '!ai hello',
      attachments: [],
      isGroup: true,
      timestamp: Date.now(),
      commandName: 'ai',
      args: [],
      rawArgs: 'hello',
      userRole: Role.USER,
      sessionManager: {},
      services: { aiProvider: new MockAIProvider() },
      repositories: {
        threadSettings: { getSettings: () => ({ aiEnabled: false }) },
      },
      reply: vi.fn(),
      send: vi.fn(),
      react: vi.fn(),
    };

    await aiCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('đã bị tắt trong nhóm'));
  });
});
