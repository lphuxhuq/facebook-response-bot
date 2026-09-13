import { describe, it, expect, vi } from 'vitest';
import { quizCommand } from '../../../src/plugins/entertainment/commands/quiz.js';
import { SessionManager, InMemorySessionStore } from '../../../src/core/session-manager.js';
import { CommandContext, Role } from '../../../src/core/context.js';

describe('Entertainment Plugin - Quiz Command (Session Flow)', () => {
  it('should start a new quiz session on initial call', async () => {
    const sm = new SessionManager(new InMemorySessionStore());

    const ctx: CommandContext = {
      platform: 'test',
      userId: 'u1',
      conversationId: 'c1',
      messageId: 'm1',
      text: '!quiz',
      attachments: [],
      isGroup: false,
      timestamp: Date.now(),
      commandName: 'quiz',
      args: [],
      rawArgs: '',
      userRole: Role.USER,
      sessionManager: sm,
      services: {},
      repositories: {},
      reply: vi.fn(),
      send: vi.fn(),
      react: vi.fn(),
    };

    await quizCommand.execute(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('TRÒ CHƠI ĐỐ VUI'));
    const session = await sm.get('c1', 'u1');
    expect(session).not.toBeNull();
    expect(session?.command).toBe('quiz');
    expect(session?.state.qIndex).toBe(0);

    sm.destroy();
  });

  it('should handle sequential answers across the session', async () => {
    const sm = new SessionManager(new InMemorySessionStore());
    await sm.create('c1', 'u1', 'quiz', { qIndex: 0, score: 0 });

    const ctxAnswerC: CommandContext = {
      platform: 'test',
      userId: 'u1',
      conversationId: 'c1',
      messageId: 'm2',
      text: 'C',
      attachments: [],
      isGroup: false,
      timestamp: Date.now(),
      commandName: 'quiz',
      args: ['C'],
      rawArgs: 'C',
      userRole: Role.USER,
      sessionManager: sm,
      services: {},
      repositories: {},
      reply: vi.fn(),
      send: vi.fn(),
      react: vi.fn(),
    };

    await quizCommand.execute(ctxAnswerC);

    expect(ctxAnswerC.reply).toHaveBeenCalledWith(expect.stringContaining('Chính xác'));
    const updated = await sm.get('c1', 'u1');
    expect(updated?.state.qIndex).toBe(1);
    expect(updated?.state.score).toBe(1);

    sm.destroy();
  });
});
