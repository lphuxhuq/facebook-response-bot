import { Command, CommandContext, DataAttachment } from '../../../core/context.js';
import { renderRankCard } from '../canvas/rank-card.js';
import { fmt } from '../../shared/data-store.js';

export const rankCommand: Command = {
  name: 'rank',
  aliases: ['card', 'thongtincard', 'rankcard'],
  description: 'Xem thẻ hạng thành viên được render bằng Canvas (EXP, coins, hạng)',
  usage: '!rank',
  category: 'games',
  cooldown: 5,
  async execute(ctx: CommandContext): Promise<void> {
    const userRepo = ctx.repositories?.user;

    // Aggregate ranking position if repo available
    let exp = 0;
    let balance = 0;
    let rank = 1;
    let name: string | undefined;

    if (userRepo) {
      const user = await userRepo.getOrCreate(ctx.userId);
      exp = user.exp ?? 0;
      balance = user.balance ?? 0;
      name = user.name;
      if (typeof (userRepo as any).countUsersWithHigherExp === 'function') {
        rank = (await (userRepo as any).countUsersWithHigherExp(exp)) + 1;
      }
    }

    if (!name) {
      name = (await ctx.getUser?.())?.name || `User ${ctx.userId}`;
    }

    try {
      const png = await renderRankCard({
        userId: ctx.userId,
        name: name!,
        rank,
        exp,
        balance,
        avatarUrl: undefined,
      });

      const attachment: DataAttachment = {
        type: 'image',
        data: png.buffer,
        filename: png.filename,
        contentType: png.contentType,
      };

      await ctx.reply({
        text: `🏆 THẮNG HẠNG CỦA ${name} — Hạng #${rank}`,
        attachments: [attachment],
      });
    } catch {
      await ctx.reply(
        [
          `🏆 THÔNG TIN HẠNG`,
          `👤 Tên: ${name}`,
          `🆔 ID: ${ctx.userId}`,
          `⭐ EXP: ${fmt(exp)}`,
          `💰 Coins: ${fmt(balance)}`,
          `📊 Hạng: #${rank}`,
          '(ảnh canvas không khả dụng)',
        ].join('\n')
      );
    }
  },
};
