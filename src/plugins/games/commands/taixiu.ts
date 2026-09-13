import { Command, CommandContext } from '../../../core/context.js';

const MIN_BET = 100;

export const taixiuCommand: Command = {
  name: 'taixiu',
  aliases: ['bantaixiu', 'sicbo'],
  description: 'Chơi tài xỉu / chẵn lẻ cược tiền ảo (offline, không API)',
  usage: '!taixiu <tai|xiu|chan|le> <số tiền>',
  category: 'games',
  cooldown: 5,
  async execute(ctx: CommandContext): Promise<void> {
    const userRepo = ctx.repositories?.user;
    const choice = (ctx.args[0] || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const betStr = ctx.args[1];

    if (!choice || !betStr) {
      await ctx.reply(
        [
          '🎲 TÀI XỈU - LUẬT CHƠI:',
          '• Xỉu: tổng 3 xúc xắc từ 4-10 điểm',
          '• Tài: tổng 3 xúc xắc từ 11-17 điểm',
          '• Nếu 3 xúc xắc cùng số → cả tài và xỉu đều thua',
          '• Chẵn: tổng điểm là số chẵn | Lẻ: tổng điểm là số lẻ',
          '',
          `Cú pháp: !taixiu <tài/xỉu/chẵn/lẻ> <số tiền> (tối thiểu ${MIN_BET})`,
        ].join('\n')
      );
      return;
    }

    const bet = parseInt(betStr, 10);
    if (isNaN(bet)) {
      await ctx.reply('⚠️ Số tiền cược phải là một con số!');
      return;
    }
    if (bet < MIN_BET) {
      await ctx.reply(`⚠️ Tiền cược tối thiểu là ${MIN_BET.toLocaleString('vi-VN')} coins!`);
      return;
    }

    const betType = ['tai', 'xiu', 'chan', 'le'].includes(choice)
      ? { tai: 'tài', xiu: 'xỉu', chan: 'chẵn', le: 'lẻ' }[choice]
      : null;

    if (!betType) {
      await ctx.reply(`⚠️ "${ctx.args[0]}" không hợp lệ. Chỉ chấp nhận: tài, xỉu, chẵn, lẻ.`);
      return;
    }

    if (!userRepo) {
      await ctx.reply('⚠️ Cơ sở dữ liệu kinh tế chưa sẵn sàng.');
      return;
    }

    const balance = await userRepo.getBalance(ctx.userId);
    if (balance < bet) {
      await ctx.reply(`⚠️ Bạn không có đủ ${bet.toLocaleString('vi-VN')} coins để chơi (số dư: ${balance.toLocaleString('vi-VN')}). Hãy dùng !bank work để kiếm tiền!`);
      return;
    }

    await ctx.reply('🎲 Đang lắc xí ngầu...');

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const d3 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2 + d3;

    const isTriple = d1 === d2 && d2 === d3;

    let result: string;
    let win = false;

    if (betType === 'tài' || betType === 'xỉu') {
      if (isTriple) {
        result = ' Tam chất (3 xúc xắc cùng số) — nhà cái ăn hết!';
      } else if (total >= 4 && total <= 10) {
        result = 'xỉu';
        win = betType === 'xỉu';
      } else {
        result = 'tài';
        win = betType === 'tài';
      }
    } else {
      result = total % 2 === 0 ? 'chẵn' : 'lẻ';
      win = betType === result;
    }

    const delta = win ? bet : -bet;
    const newBalance = await userRepo.updateBalance(ctx.userId, delta);

    const diceFace = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    const msg = [
      `🎲 ${diceFace[d1 - 1]} ${diceFace[d2 - 1]} ${diceFace[d3 - 1]}  ( ${d1} + ${d2} + ${d3} = ${total} điểm )`,
      `👉 Kết quả: ${result.toUpperCase()}`,
      '',
      win
        ? `🎉 Bạn cược ${betType.toUpperCase()} và THẮNG +${bet.toLocaleString('vi-VN')} coins!`
        : `😔 Bạn cược ${betType.toUpperCase()} và THUA -${bet.toLocaleString('vi-VN')} coins!`,
      `💰 Số dư mới: ${newBalance.toLocaleString('vi-VN')} coins`,
    ].join('\n');

    await ctx.reply(msg);
  },
};
