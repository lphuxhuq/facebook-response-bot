import { describe, it, expect, vi } from 'vitest';
import { mediaCommand } from '../../../src/plugins/media/commands/media.js';
import { CommandContext, Role } from '../../../src/core/context.js';

function makeCtx(args: string[], repositories: any = {}) {
  return {
    platform: 'test' as const,
    userId: 'u1',
    conversationId: 'c1',
    messageId: 'm1',
    text: '!media',
    attachments: [],
    isGroup: false,
    timestamp: Date.now(),
    commandName: 'media',
    args,
    rawArgs: args.join(' '),
    userRole: Role.USER,
    sessionManager: {},
    services: {},
    repositories,
    reply: vi.fn(),
    send: vi.fn(),
    react: vi.fn(),
  } as unknown as CommandContext;
}

describe('Media Plugin - Random Image Command', () => {
  it('should show category menu when no args', async () => {
    const ctx = makeCtx([]);
    await mediaCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('DANH SÁCH ẢNH'));
  });

  it('should return an image attachment for a valid category', async () => {
    const ctx = makeCtx(['1']);
    await mediaCommand.execute(ctx);
    const call = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(typeof call).toBe('object');
    expect(call.text).toContain('Gái xinh');
    expect(call.attachments[0].type).toBe('image');
    expect(call.attachments[0].url).toMatch(/^https:\/\//);
  });

  it('should reject invalid category', async () => {
    const ctx = makeCtx(['99']);
    await mediaCommand.execute(ctx);
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Không có danh mục'));
  });

  it('should accept alias-style queries (girl/cosplay)', async () => {
    const ctx = makeCtx(['cosplay']);
    await mediaCommand.execute(ctx);
    const call = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.text).toContain('Cosplay');
  });
});
