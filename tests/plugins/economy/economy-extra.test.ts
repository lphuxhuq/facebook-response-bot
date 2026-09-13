import { describe, it, expect, vi } from 'vitest';
import { dailyCommand } from '../../../src/plugins/economy/commands/daily.js';
import { lixiCommand } from '../../../src/plugins/economy/commands/lixi.js';
import { casinoCommand } from '../../../src/plugins/economy/commands/casino.js';
import { SessionManager, InMemorySessionStore } from '../../../src/core/session-manager.js';
import { CommandContext, Role } from '../../../src/core/context.js';

function makeCtx(overrides: Partial<CommandContext> = {}) {
  return {
    platform: 'test' as const,
    userId: 'u1',
    conversationId: 'c1',
    messageId: 'm1',
    text: '!daily',
    attachments: [],
    isGroup: false,
    timestamp: Date.now(),
    commandName: 'daily',
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

describe('Economy - Daily Streak', () => {
  const testRunId = `daily-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  it('should grant first daily reward', async () => {
    const updateBalance = vi.fn().mockResolvedValue(5000);
    const ctx = makeCtx({ userId: testRunId, repositories: { user: { updateBalance } } });
    await dailyCommand.execute(ctx);

    expect(updateBalance).toHaveBeenCalledWith(testRunId, expect.any(Number));
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('Điểm danh') })
    );
  });

  it('should refuse double claim same day', async () => {
    const ctx = makeCtx({ userId: testRunId, repositories: { user: { updateBalance: vi.fn() } } } );
    // First claim
    await dailyCommand.execute(ctx);
    const callsBefore = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls.length;
    // Second claim same day
    await dailyCommand.execute(ctx);
    const replyMock = ctx.reply as ReturnType<typeof vi.fn>;
    const lastCall = replyMock.mock.calls[replyMock.mock.calls.length - 1][0];
    expect(String(lastCall)).toContain('đã nhận quà rồi');
    expect(replyMock.mock.calls.length).toBe(callsBefore + 1);
  });

  it('should show info with rewards table', async () => {
    const ctx = makeCtx({ userId: testRunId, args: ['info'], rawArgs: 'info', repositories: { user: {} } });
    await dailyCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('THÔNG TIN PHẦN QUÀ'));
  });

  it('should refuse 7day bonus when streak < 7', async () => {
    const ctx = makeCtx({ userId: `${testRunId}-no7`, args: ['7day'], rawArgs: '7day', repositories: { user: {} } });
    await dailyCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('ngày liên tục'));
  });
});

describe('Economy - Lixi (Session flow)', () => {
  const lixiRunId = `lixi-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  it('should start lixi session with envelope menu', async () => {
    const sm = new SessionManager(new InMemorySessionStore());
    const ctx = makeCtx({ userId: lixiRunId, commandName: 'lixi', sessionManager: sm, repositories: { user: {} } });
    await lixiCommand.execute(ctx);

    const session = await sm.get('c1', lixiRunId);
    expect(session?.command).toBe('lixi');
    const replyMock = ctx.reply as ReturnType<typeof vi.fn>;
    expect(String(replyMock.mock.calls[0][0].text)).toContain('LÌ XÌ');
    sm.destroy();
  });

  it('should grant reward on valid envelope choice', async () => {
    const sm = new SessionManager(new InMemorySessionStore());
    await sm.create('c1', lixiRunId, 'lixi', { opened: false }, 'choose-envelope', 120);
    const updateBalance = vi.fn().mockResolvedValue(999);

    const ctx = makeCtx({
      userId: lixiRunId,
      commandName: 'lixi',
      sessionManager: sm,
      args: ['3'],
      rawArgs: '3',
      repositories: { user: { updateBalance } },
    });
    await lixiCommand.execute(ctx);

    expect(updateBalance).toHaveBeenCalledWith(lixiRunId, expect.any(Number));
    const replyMock = ctx.reply as ReturnType<typeof vi.fn>;
    expect(String(replyMock.mock.calls[replyMock.mock.calls.length - 1][0])).toContain('Chúc mừng');
    expect(await sm.get('c1', lixiRunId)).toBeNull();
    sm.destroy();
  });

  it('should reject invalid envelope number', async () => {
    const sm = new SessionManager(new InMemorySessionStore());
    await sm.create('c1', lixiRunId, 'lixi', { opened: false }, 'choose-envelope', 120);
    const ctx = makeCtx({
      userId: lixiRunId,
      commandName: 'lixi',
      sessionManager: sm,
      args: ['9'],
      rawArgs: '9',
      repositories: { user: {} },
    });
    await lixiCommand.execute(ctx);
    const replyMock = ctx.reply as ReturnType<typeof vi.fn>;
    expect(String(replyMock.mock.calls[replyMock.mock.calls.length - 1][0])).toContain('1 đến 6');
    sm.destroy();
  });
});

describe('Economy - Casino', () => {
  it('should show menu without args', async () => {
    const ctx = makeCtx({ commandName: 'casino' });
    await casinoCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('CASINO'));
  });

  it('slot should settle bet', async () => {
    const updateBalance = vi.fn().mockResolvedValue(1000);
    const ctx = makeCtx({
      commandName: 'casino',
      args: ['slot', '100'],
      rawArgs: 'slot 100',
      repositories: { user: { getBalance: vi.fn().mockResolvedValue(500), updateBalance } },
    });
    await casinoCommand.execute(ctx);
    expect(updateBalance).toHaveBeenCalledWith('u1', expect.any(Number));
    const replyMock = ctx.reply as ReturnType<typeof vi.fn>;
    expect(String(replyMock.mock.calls[replyMock.mock.calls.length - 1][0])).toContain('🎰');
  });

  it('kbb should require valid choice', async () => {
    const ctx = makeCtx({
      commandName: 'casino',
      args: ['kbb', 'xyz', '100'],
      rawArgs: 'kbb xyz 100',
      repositories: { user: {} },
    });
    await casinoCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('kéo, búa hoặc bao'));
  });

  it('kbb should play and settle', async () => {
    const updateBalance = vi.fn().mockResolvedValue(1100);
    const ctx = makeCtx({
      commandName: 'casino',
      args: ['kbb', 'búa', '100'],
      rawArgs: 'kbb búa 100',
      repositories: { user: { getBalance: vi.fn().mockResolvedValue(500), updateBalance } },
    });
    await casinoCommand.execute(ctx);
    const replyMock = ctx.reply as ReturnType<typeof vi.fn>;
    const out = String(replyMock.mock.calls[replyMock.mock.calls.length - 1][0]);
    expect(out).toMatch(/THẮNG|THUA|HÒA/);
  });

  it('taixiu should validate choice', async () => {
    const ctx = makeCtx({
      commandName: 'casino',
      args: ['taixiu', 'hello', '100'],
      rawArgs: 'taixiu hello 100',
      repositories: { user: {} },
    });
    await casinoCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Vui lòng chọn'));
  });

  it('taixiu should roll and settle', async () => {
    const updateBalance = vi.fn().mockResolvedValue(900);
    const ctx = makeCtx({
      commandName: 'casino',
      args: ['taixiu', 'tài', '100'],
      rawArgs: 'taixiu tài 100',
      repositories: { user: { getBalance: vi.fn().mockResolvedValue(500), updateBalance } },
    });
    await casinoCommand.execute(ctx);
    const replyMock = ctx.reply as ReturnType<typeof vi.fn>;
    expect(String(replyMock.mock.calls[replyMock.mock.calls.length - 1][0])).toContain('Kết quả');
  });
});
