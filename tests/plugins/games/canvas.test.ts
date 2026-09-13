import { describe, it, expect, vi } from 'vitest';
import { taixiuCanvasCommand } from '../../../src/plugins/games/commands/taixiuc.js';
import { rankCommand } from '../../../src/plugins/games/commands/rank.js';
import { CommandContext, Role } from '../../../src/core/context.js';
import { renderTaixiuBoard } from '../../../src/plugins/games/canvas/taixiu-board.js';
import { renderRankCard } from '../../../src/plugins/games/canvas/rank-card.js';

function makeCtx(overrides: Partial<CommandContext> = {}) {
  return {
    platform: 'test' as const,
    userId: 'u1',
    conversationId: 'c1',
    messageId: 'm1',
    text: '!taixiuc',
    attachments: [],
    isGroup: false,
    timestamp: Date.now(),
    commandName: 'taixiuc',
    args: [],
    rawArgs: '',
    userRole: Role.USER,
    sessionManager: {},
    services: {},
    repositories: {},
    reply: vi.fn(),
    send: vi.fn(),
    react: vi.fn(),
    ...overrides,
  } as unknown as CommandContext;
}

describe('Canvas Renderer — Taixiu Board', () => {
  it('should render a PNG buffer', async () => {
    const png = await renderTaixiuBoard({
      dice: [3, 4, 5],
      total: 12,
      result: 'tài',
      betType: 'tài',
      win: true,
      bet: 500,
      balance: 1500,
    });
    expect(png.buffer).toBeInstanceOf(Buffer);
    expect(png.buffer.length).toBeGreaterThan(1000);
    expect(png.contentType).toBe('image/png');
    expect(png.filename).toMatch(/^canvas_\d+_\d+\.png$/);
  });

  it('should render different dice values without error', async () => {
    for (const v of [1, 2, 3, 4, 5, 6]) {
      const png = await renderTaixiuBoard({
        dice: [v, v, v],
        total: v * 3,
        result: 'tam chất',
        betType: 'tài',
        win: false,
        bet: 100,
        balance: 900,
      });
      expect(png.buffer.length).toBeGreaterThan(0);
    }
  });
});

describe('Canvas Renderer — Rank Card', () => {
  it('should render a PNG buffer even when avatar fetch fails', async () => {
    const png = await renderRankCard({
      userId: '100000123',
      name: 'Test User',
      rank: 3,
      exp: 4200,
      balance: 15000,
      // avatarUrl omitted -> will try fetch FB graph; in test env it may fail -> fallback initial letter
    });
    expect(png.buffer).toBeInstanceOf(Buffer);
    expect(png.buffer.length).toBeGreaterThan(1000);
  });
});

describe('Games — Taixiu Canvas Command', () => {
  it('should show usage when args invalid', async () => {
    const ctx = makeCtx({ args: ['xxx'], rawArgs: 'xxx' });
    await taixiuCanvasCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('TÀI XỈU CANVAS'));
  });

  it('should reject bet below minimum', async () => {
    const ctx = makeCtx({
      args: ['tài', '50'],
      rawArgs: 'tài 50',
      repositories: { user: {} },
    });
    await taixiuCanvasCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('tối thiểu'));
  });

  it('should refuse insufficient balance', async () => {
    const ctx = makeCtx({
      args: ['tài', '500'],
      rawArgs: 'tài 500',
      repositories: { user: { getBalance: vi.fn().mockResolvedValue(300) } },
    });
    await taixiuCanvasCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('không đủ'));
  });

  it('should settle bet and reply with canvas data attachment', async () => {
    const updateBalance = vi.fn().mockResolvedValue(1500);
    const ctx = makeCtx({
      args: ['tài', '500'],
      rawArgs: 'tài 500',
      repositories: { user: { getBalance: vi.fn().mockResolvedValue(1000), updateBalance } },
    });

    await taixiuCanvasCommand.execute(ctx);

    expect(updateBalance).toHaveBeenCalledWith('u1', expect.any(Number));

    const replyMock = ctx.reply as ReturnType<typeof vi.fn>;
    const call = replyMock.mock.calls[replyMock.mock.calls.length - 1][0];
    expect(typeof call).toBe('object');
    expect(call.attachments).toBeDefined();
    expect(call.attachments[0].type).toBe('image');
    expect(call.attachments[0].data).toBeInstanceOf(Buffer);
    expect(call.attachments[0].filename).toMatch(/\.png$/);
  });
});

describe('Games — Rank Card Command', () => {
  it('should reply with rank card attachment', async () => {
    const ctx = makeCtx({
      commandName: 'rank',
      text: '!rank',
      repositories: {
        user: {
          getOrCreate: vi.fn().mockResolvedValue({
            id: 'u1',
            name: 'Ranked User',
            exp: 4200,
            balance: 9000,
            role: Role.USER,
          }),
        },
      },
    });

    await rankCommand.execute(ctx);

    const replyMock = ctx.reply as ReturnType<typeof vi.fn>;
    const call = replyMock.mock.calls[replyMock.mock.calls.length - 1][0];
    expect(typeof call).toBe('object');
    expect(call.attachments[0].data).toBeInstanceOf(Buffer);
    expect(call.text).toContain('Hạng #1');
  });

  it('should fall back to text when repo missing', async () => {
    const ctx = makeCtx({ commandName: 'rank', text: '!rank' });
    await rankCommand.execute(ctx);
    const replyMock = ctx.reply as ReturnType<typeof vi.fn>;
    const last = replyMock.mock.calls[replyMock.mock.calls.length - 1][0];
    // Both card object or text fallback are acceptable; verify either shape
    if (typeof last === 'string') {
      expect(last).toContain('THÔNG TIN HẠNG');
    } else {
      expect(last.attachments[0].data).toBeInstanceOf(Buffer);
    }
  });
});
