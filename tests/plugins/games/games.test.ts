import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dhbcCommand } from '../../../src/plugins/games/commands/dhbc.js';
import { taixiuCommand } from '../../../src/plugins/games/commands/taixiu.js';
import { bocthamCommand } from '../../../src/plugins/games/commands/boctham.js';
import { SessionManager, InMemorySessionStore } from '../../../src/core/session-manager.js';
import { CommandContext, Role } from '../../../src/core/context.js';

function makeCtx(overrides: Partial<CommandContext> = {}) {
  return {
    platform: 'test' as const,
    userId: 'u1',
    conversationId: 'c1',
    messageId: 'm1',
    text: '!dhbc',
    attachments: [],
    isGroup: false,
    timestamp: Date.now(),
    commandName: 'dhbc',
    args: [],
    rawArgs: '',
    userRole: Role.USER,
    sessionManager: {} as any,
    services: {},
    repositories: {},
    reply: vi.fn(),
    send: vi.fn(),
    react: vi.fn(),
    ...overrides,
  } as unknown as CommandContext;
}

describe('Games Plugin - DHBC (Session Flow)', () => {
  let sm: SessionManager;

  beforeEach(() => {
    sm = new SessionManager(new InMemorySessionStore());
  });

  it('should start a new question session', async () => {
    const ctx = makeCtx({ sessionManager: sm });
    await dhbcCommand.execute(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('ĐỐ VUI BẮT CHỮ'));
    const session = await sm.get('c1', 'u1');
    expect(session).not.toBeNull();
    expect(session?.command).toBe('dhbc');
    expect(typeof session?.state.wordcomplete).toBe('string');

    sm.destroy();
  });

  it('should accept correct answer ignoring diacritics and award coins', async () => {
    await sm.create('c1', 'u1', 'dhbc', { wordcomplete: 'con tim' }, 'await-answer', 300);
    const updateBalance = vi.fn().mockResolvedValue(2000);

    const ctx = makeCtx({
      sessionManager: sm,
      args: ['con', 'tim'],
      rawArgs: 'con tim',
      repositories: { user: { updateBalance } },
    });
    await dhbcCommand.execute(ctx);

    expect(updateBalance).toHaveBeenCalledWith('u1', 2000);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('chính xác'));
    expect(await sm.get('c1', 'u1')).toBeNull();
    sm.destroy();
  });

  it('should give hint on wrong answer and keep session alive', async () => {
    await sm.create('c1', 'u1', 'dhbc', { wordcomplete: 'con tim' }, 'await-answer', 300);
    const ctx = makeCtx({ sessionManager: sm, args: ['xyz'], rawArgs: 'xyz' });
    await dhbcCommand.execute(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('chưa đúng'));
    expect(await sm.get('c1', 'u1')).not.toBeNull();
    sm.destroy();
  });

  it('should exit session on "exit"', async () => {
    await sm.create('c1', 'u1', 'dhbc', { wordcomplete: 'con tim' }, 'await-answer', 300);
    const ctx = makeCtx({ sessionManager: sm, args: ['exit'], rawArgs: 'exit' });
    await dhbcCommand.execute(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('thoát trò chơi'));
    expect(await sm.get('c1', 'u1')).toBeNull();
    sm.destroy();
  });
});

describe('Games Plugin - Taixiu', () => {
  it('should show rules when args missing', async () => {
    const ctx = makeCtx({ commandName: 'taixiu' });
    await taixiuCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('LUẬT CHƠI'));
  });

  it('should reject non-numeric bet', async () => {
    const ctx = makeCtx({ commandName: 'taixiu', args: ['tài', 'abc'], rawArgs: 'tài abc' });
    await taixiuCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('phải là một con số'));
  });

  it('should reject bet below minimum', async () => {
    const ctx = makeCtx({ commandName: 'taixiu', args: ['tài', '50'], rawArgs: 'tài 50' });
    await taixiuCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('tối thiểu'));
  });

  it('should reject invalid choice', async () => {
    const ctx = makeCtx({ commandName: 'taixiu', args: ['hello', '500'], rawArgs: 'hello 500' });
    await taixiuCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('không hợp lệ'));
  });

  it('should roll dice and settle balance on valid bet', async () => {
    const updateBalance = vi.fn().mockResolvedValue(9500);
    const ctx = makeCtx({
      commandName: 'taixiu',
      args: ['tài', '500'],
      rawArgs: 'tài 500',
      repositories: { user: { getBalance: vi.fn().mockResolvedValue(10000), updateBalance } },
    });
    await taixiuCommand.execute(ctx);

    expect(updateBalance).toHaveBeenCalledWith('u1', expect.any(Number));
    const replies = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    expect(replies.some((r) => String(r).includes('Kết quả'))).toBe(true);
  });

  it('should refuse bet when balance insufficient', async () => {
    const ctx = makeCtx({
      commandName: 'taixiu',
      args: ['tài', '500'],
      rawArgs: 'tài 500',
      repositories: { user: { getBalance: vi.fn().mockResolvedValue(300) } },
    });
    await taixiuCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('không có đủ'));
  });
});

describe('Games Plugin - Boctham', () => {
  it('should draw a random challenge', async () => {
    const ctx = makeCtx({ commandName: 'boctham' });
    ctx.getUser = vi.fn().mockResolvedValue({ id: 'u1', name: 'TestUser', role: Role.USER, platform: 'test', createdAt: new Date() });
    await bocthamCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('THỬ THÁCH'));
  });
});
