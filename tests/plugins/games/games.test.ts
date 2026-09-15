import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dhbcCommand } from '../../../src/plugins/games/commands/dhbc.js';
import { taixiuCommand } from '../../../src/plugins/games/commands/taixiu.js';
import { bocthamCommand } from '../../../src/plugins/games/commands/boctham.js';
import { baucuaCommand } from '../../../src/plugins/games/commands/baucua.js';
import { altpCommand, ALTP_QUESTION_BANK } from '../../../src/plugins/games/commands/altp.js';
import { baicaoCommand, evaluateHand, compareHands } from '../../../src/plugins/games/commands/baicao.js';
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


describe('Games Plugin - Baucua', () => {
  it('should show guide if arguments are missing', async () => {
    const ctx = makeCtx({ commandName: 'baucua', args: [] });
    await baucuaCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('BẦU CUA TÔM CÁ - LUẬT CHƠI'));
  });

  it('should reject invalid choice', async () => {
    const ctx = makeCtx({ commandName: 'baucua', args: ['cho', '500'] });
    await baucuaCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('không hợp lệ'));
  });

  it('should reject when balance is insufficient', async () => {
    const ctx = makeCtx({
      commandName: 'baucua',
      args: ['cua', '1000'],
      repositories: { user: { getBalance: vi.fn().mockResolvedValue(200) } },
    });
    await baucuaCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('không có đủ'));
  });

  it('should roll dice and update balance when bet is valid', async () => {
    const updateBalance = vi.fn().mockResolvedValue(9500);
    const ctx = makeCtx({
      commandName: 'baucua',
      args: ['bầu', '500'],
      repositories: { user: { getBalance: vi.fn().mockResolvedValue(10000), updateBalance } },
    });
    await baucuaCommand.execute(ctx);
    expect(updateBalance).toHaveBeenCalledWith('u1', expect.any(Number));
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('KẾT QUẢ BẦU CUA'));
  });
});

describe('Games Plugin - ALTP (Ai La Trieu Phu)', () => {
  let sm: SessionManager;

  beforeEach(() => {
    sm = new SessionManager(new InMemorySessionStore());
  });

  it('should show game rules with info argument', async () => {
    const ctx = makeCtx({ commandName: 'altp', args: ['info'], sessionManager: sm });
    await altpCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('AI LÀ TRIỆU PHÚ - LUẬT CHƠI'));
  });

  it('should start a new session on !altp start', async () => {
    const ctx = makeCtx({ commandName: 'altp', args: ['start'], sessionManager: sm });
    await altpCommand.execute(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('AI LÀ TRIỆU PHÚ'));
    const session = await sm.get('c1', 'u1');
    expect(session).not.toBeNull();
    expect(session?.command).toBe('altp');
    expect(session?.state.level).toBe(1);
  });

  it('should advance level when correct answer chosen', async () => {
    const q = ALTP_QUESTION_BANK[0];
    await sm.create('c1', 'u1', 'altp', { level: 1, question: q, startedAt: Date.now() }, 'playing', 300);

    const ctx = makeCtx({ commandName: 'altp', args: [q.correct], sessionManager: sm });
    await altpCommand.execute(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('đúng! Vượt qua câu 1'));
    const session = await sm.get('c1', 'u1');
    expect(session?.state.level).toBe(2);
  });

  it('should award safe reward on wrong answer and delete session', async () => {
    const q = ALTP_QUESTION_BANK[0];
    const wrong = q.correct === 'A' ? 'B' : 'A';
    await sm.create('c1', 'u1', 'altp', { level: 2, question: q, startedAt: Date.now() }, 'playing', 300);

    const ctx = makeCtx({ commandName: 'altp', args: [wrong], sessionManager: sm });
    await altpCommand.execute(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('sai'));
    const session = await sm.get('c1', 'u1');
    expect(session).toBeNull();
  });

  it('should allow player to stop and take current prize', async () => {
    const q = ALTP_QUESTION_BANK[0];
    await sm.create('c1', 'u1', 'altp', { level: 3, question: q, startedAt: Date.now() }, 'playing', 300);
    const updateBalance = vi.fn().mockResolvedValue(5400);

    const ctx = makeCtx({
      commandName: 'altp',
      args: ['stop'],
      sessionManager: sm,
      repositories: { user: { updateBalance } },
    });
    await altpCommand.execute(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('dừng cuộc chơi'));
    expect(updateBalance).toHaveBeenCalledWith('u1', 400); // level 3 - 1 = level 2 prize = 400
    const session = await sm.get('c1', 'u1');
    expect(session).toBeNull();
  });
});

describe('Games Plugin - Baicao', () => {
  it('should reject invalid or too low bet', async () => {
    const ctx = makeCtx({
      commandName: 'baicao',
      args: ['10'],
      repositories: { user: { getBalance: vi.fn().mockResolvedValue(1000) } },
    });
    await baicaoCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('tối thiểu là 50$'));
  });

  it('should reject when balance insufficient', async () => {
    const ctx = makeCtx({
      commandName: 'baicao',
      args: ['500'],
      repositories: { user: { getBalance: vi.fn().mockResolvedValue(100) } },
    });
    await baicaoCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('không đủ tiền cược'));
  });

  it('should execute bet and update balance on valid game', async () => {
    const updateBalance = vi.fn().mockResolvedValue(1100);
    const ctx = makeCtx({
      commandName: 'baicao',
      args: ['100'],
      repositories: { user: { getBalance: vi.fn().mockResolvedValue(1000), updateBalance } },
    });
    await baicaoCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('BÀI CÀO 3 LÁ'));
  });

  it('evaluates Sap, Ba Tay, and Diem correctly', () => {
    const sapCards = [
      { value: '7', suit: 'hearts', suitIcon: '♥', weight: 7, rank: 7 },
      { value: '7', suit: 'spades', suitIcon: '♠', weight: 7, rank: 7 },
      { value: '7', suit: 'diamonds', suitIcon: '♦', weight: 7, rank: 7 },
    ];
    const sapRes = evaluateHand(sapCards);
    expect(sapRes.type).toBe('SAP');
    expect(sapRes.label).toBe('Sáp 7');

    const batayCards = [
      { value: 'J', suit: 'hearts', suitIcon: '♥', weight: 10, rank: 11 },
      { value: 'Q', suit: 'spades', suitIcon: '♠', weight: 10, rank: 12 },
      { value: 'K', suit: 'diamonds', suitIcon: '♦', weight: 10, rank: 13 },
    ];
    const batayRes = evaluateHand(batayCards);
    expect(batayRes.type).toBe('BATAY');

    const diemCards = [
      { value: '3', suit: 'hearts', suitIcon: '♥', weight: 3, rank: 3 },
      { value: '4', suit: 'spades', suitIcon: '♠', weight: 4, rank: 4 },
      { value: '2', suit: 'diamonds', suitIcon: '♦', weight: 2, rank: 2 },
    ];
    const diemRes = evaluateHand(diemCards);
    expect(diemRes.type).toBe('DIEM');
    expect(diemRes.score).toBe(9);

    // Sap beats Ba Tay, Ba Tay beats Diem
    expect(compareHands(sapRes, batayRes)).toBe(1);
    expect(compareHands(batayRes, diemRes)).toBe(1);
    expect(compareHands(diemRes, sapRes)).toBe(-1);
  });
});

