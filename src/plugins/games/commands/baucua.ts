import { Command, CommandContext } from '../../../core/context.js';

const MIN_BET = 100;

export interface BaucuaItem {
  id: string;
  name: string;
  emoji: string;
}

export const BAUCUA_ITEMS: BaucuaItem[] = [
  { id: 'bau', name: 'BẦU', emoji: '🍐' },
  { id: 'cua', name: 'CUA', emoji: '🦀' },
  { id: 'tom', name: 'TÔM', emoji: '🦞' },
  { id: 'ca',  name: 'CÁ',  emoji: '🐟' },
  { id: 'ga',  name: 'GÀ',  emoji: '🐓' },
  { id: 'nai', name: 'NAI', emoji: '🦌' }
];

export function normalizeBaucuaChoice(input: string): BaucuaItem | null {
  const s = (input || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (['bau', '🍐'].includes(s)) return BAUCUA_ITEMS[0];
  if (['cua', '🦀'].includes(s)) return BAUCUA_ITEMS[1];
  if (['tom', '🦞'].includes(s)) return BAUCUA_ITEMS[2];
  if (['ca', '🐟'].includes(s)) return BAUCUA_ITEMS[3];
  if (['ga', '🐓'].includes(s)) return BAUCUA_ITEMS[4];
  if (['nai', '🦌'].includes(s)) return BAUCUA_ITEMS[5];
  return null;
}

export const baucuaCommand: Command = {
  name: 'baucua',
  aliases: ['bc', 'baucuatomca'],
  description: 'Lắc bầu cua tôm cá cổ truyền cược tiền ảo',
  usage: '!baucua <bầu/cua/tôm/cá/gà/nai> <số tiền|all>',
  category: 'games',
  cooldown: 5,
  async execute(ctx: CommandContext): Promise<void> {
    const userRepo = ctx.repositories?.user;
    const choiceArg = ctx.args[0];
    const betArg = ctx.args[1];

    if (!choiceArg || !betArg) {
      await ctx.reply(
        [
          '🎲 BẦU CUA TÔM CÁ - LUẬT CHƠI:',
          '• Các linh vật: Bầu 🍐 | Cua 🦀 | Tôm 🦞 | Cá 🐟 | Gà 🐓 | Nai 🦌',
          '• Trúng 1 con: Nhận thưởng 1x tiền cược',
          '• Trúng 2 con: Nhận thưởng 2x tiền cược',
          '• Trúng 3 con: Nhận thưởng 3x tiền cược',
          '• Không trúng: Mất tiền cược',
          '',
          `Cú pháp: !baucua <bầu/cua/tôm/cá/gà/nai> <số tiền|all> (tối thiểu ${MIN_BET})`
        ].join('\n')
      );
      return;
    }

    const item = normalizeBaucuaChoice(choiceArg);
    if (!item) {
      await ctx.reply(`⚠️ Lựa chọn "${choiceArg}" không hợp lệ. Hãy chọn: bầu, cua, tôm, cá, gà hoặc nai.`);
      return;
    }

    if (!userRepo) {
      await ctx.reply('⚠️ Cơ sở dữ liệu kinh tế chưa sẵn sàng.');
      return;
    }

    const balance = await userRepo.getBalance(ctx.userId);
    let bet = 0;
    if (betArg.toLowerCase() === 'all') {
      bet = balance;
    } else {
      bet = parseInt(betArg, 10);
    }

    if (isNaN(bet) || bet <= 0) {
      await ctx.reply('⚠️ Số tiền cược không hợp lệ!');
      return;
    }

    if (bet < MIN_BET) {
      await ctx.reply(`⚠️ Tiền cược tối thiểu là ${MIN_BET.toLocaleString('vi-VN')} coins!`);
      return;
    }

    if (balance < bet) {
      await ctx.reply(`⚠️ Bạn không có đủ ${bet.toLocaleString('vi-VN')} coins (số dư: ${balance.toLocaleString('vi-VN')}).`);
      return;
    }

    // Lắc 3 xúc xắc ngẫu nhiên
    const d1 = BAUCUA_ITEMS[Math.floor(Math.random() * 6)];
    const d2 = BAUCUA_ITEMS[Math.floor(Math.random() * 6)];
    const d3 = BAUCUA_ITEMS[Math.floor(Math.random() * 6)];

    const matches = [d1, d2, d3].filter((d) => d.id === item.id).length;
    const win = matches > 0;
    const delta = win ? bet * matches : -bet;
    const newBalance = await userRepo.updateBalance(ctx.userId, delta);

    const msg = [
      `🏮 KẾT QUẢ BẦU CUA:`,
      `[ ${d1.emoji} ${d1.name} ] - [ ${d2.emoji} ${d2.name} ] - [ ${d3.emoji} ${d3.name} ]`,
      '',
      `👉 Bạn chọn: ${item.emoji} ${item.name} (${matches} mặt trúng)`,
      win
        ? `🎉 Chúc mừng! Bạn THẮNG +${delta.toLocaleString('vi-VN')} coins (x${matches})!`
        : `😔 Rất tiếc! Bạn THUA -${bet.toLocaleString('vi-VN')} coins!`,
      `💰 Số dư hiện tại: ${newBalance.toLocaleString('vi-VN')} coins`
    ].join('\n');

    await ctx.reply(msg);
  }
};
