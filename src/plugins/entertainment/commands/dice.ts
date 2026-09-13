import { Command, CommandContext } from '../../../core/context.js';

export const diceCommand: Command = {
  name: 'dice',
  aliases: ['roll', 'lacngau', 'coinflip'],
  description: 'Đổ xúc xắc hoặc tung đồng xu may mắn',
  usage: '!dice [6|coin]',
  category: 'entertainment',
  cooldown: 2,
  async execute(ctx: CommandContext): Promise<void> {
    const type = ctx.args[0]?.toLowerCase();

    if (type === 'coin') {
      const isHeads = Math.random() < 0.5;
      const result = isHeads ? '🪙 MẶT NGỬA (Heads)' : '🪙 MẶT SẤP (Tails)';
      await ctx.reply(`🪙 KẾT QUẢ TUNG ĐỒNG XU:\n${result}`);
      return;
    }

    const sides = parseInt(type, 10) || 6;
    const roll = Math.floor(Math.random() * sides) + 1;
    await ctx.reply(`🎲 Bạn đã lắc xúc xắc ${sides} mặt: Ra số [ ${roll} ]!`);
  },
};
