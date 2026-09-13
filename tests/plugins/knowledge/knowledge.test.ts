import { describe, it, expect, vi } from 'vitest';
import { mineCommand } from '../../../src/plugins/games/commands/mine.js';
import { hanhtinhCommand } from '../../../src/plugins/knowledge/commands/hanhtinh.js';
import { cadaoCommand, danhngonCommand, truyencuoiCommand, chuctetCommand } from '../../../src/plugins/knowledge/commands/text.js';
import { CommandContext, Role } from '../../../src/core/context.js';

function makeCtx(overrides: Partial<CommandContext> = {}) {
  return {
    platform: 'test' as const,
    userId: 'u1',
    conversationId: 'c1',
    messageId: 'm1',
    text: '!mine',
    attachments: [],
    isGroup: false,
    timestamp: Date.now(),
    commandName: 'mine',
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

describe('Games - Mine', () => {
  const testRunId = `mine-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  it('should show menu without args', async () => {
    const ctx = makeCtx();
    await mineCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('HỆ THỐNG ĐÀO KHOÁNG SẢN'));
  });

  it('should register a miner', async () => {
    const ctx = makeCtx({ userId: testRunId, args: ['dangky'], rawArgs: 'dangky' });
    ctx.getUser = vi.fn().mockResolvedValue({ id: testRunId, name: 'Miner A' });
    await mineCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Chúc mừng'));
  });

  it('should show pickaxe shop', async () => {
    const ctx = makeCtx({ userId: testRunId, args: ['shop'], rawArgs: 'shop' });
    await mineCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('CỬA HÀNG CÚP ĐÀO'));
  });

  it('should refuse buy when not registered', async () => {
    const ctx = makeCtx({ userId: `${testRunId}-no-reg`, args: ['buy', '1'], rawArgs: 'buy 1' });
    await mineCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('chưa đăng ký'));
  });

  it('should require registration before shop actions', async () => {
    const ctx = makeCtx({ userId: `${testRunId}-no-reg2`, args: ['dao'], rawArgs: 'dao' });
    await mineCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('chưa đăng ký'));
  });
});

describe('Knowledge - Hanhtinh', () => {
  it('should show planet menu', async () => {
    const ctx = makeCtx({ commandName: 'hanhtinh' });
    await hanhtinhCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('HÀNH TINH'));
  });

  it('should return planet detail with image', async () => {
    const ctx = makeCtx({ commandName: 'hanhtinh', args: ['5'], rawArgs: '5' });
    await hanhtinhCommand.execute(ctx);
    const call = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.text).toContain('SAO MỘC');
    expect(call.attachments[0].url).toMatch(/^https:\/\//);
  });

  it('should reject out-of-range selection', async () => {
    const ctx = makeCtx({ commandName: 'hanhtinh', args: ['99'], rawArgs: '99' });
    await hanhtinhCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('1-10'));
  });
});

describe('Knowledge - Text commands', () => {
  it('cadao should return a verse with timestamp', async () => {
    const ctx = makeCtx({ commandName: 'cadao' });
    await cadaoCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('CA DAO'));
  });

  it('danhngon should return a saying', async () => {
    const ctx = makeCtx({ commandName: 'danhngon' });
    await danhngonCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('DANH NGÔN'));
  });

  it('truyencuoi should return a joke', async () => {
    const ctx = makeCtx({ commandName: 'truyencuoi' });
    await truyencuoiCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('CHUYỆN CƯỜI'));
  });

  it('chuctet should send wish with image attachment', async () => {
    const ctx = makeCtx({ commandName: 'chuctet' });
    await chuctetCommand.execute(ctx);
    const call = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.attachments).toBeDefined();
    expect(call.attachments[0].type).toBe('image');
  });
});
