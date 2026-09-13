import { Command, CommandContext, DataAttachment } from '../../../core/context.js';
import { renderTaixiuBoard } from '../canvas/taixiu-board.js';
import { fmt } from '../../shared/data-store.js';

const MIN_BET = 100;

function normalize(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export const taixiuCanvasCommand: Command = {
  name: 'taixiuc',
  aliases: ['taixiu2', 'sicboc'],
  description: 'Chơi tài xỉu với hình ảnh bàn cược được render bằng Canvas (phiên bản GUI)',
  usage: '!taixiuc <tài/xỉu/chẵn/lẻ> <số tiền>',
  category: 'games',
  cooldown: 5,
  async execute(ctx: CommandContext): Promise<void> {
    const userRepo = ctx.repositories?.user;
    const choice = normalize(ctx.args[0] || '');
    const bet = parseInt(ctx.args[1] || '', 10);

    if (!['tai', 'xiu', 'chan', 'le'].includes(choice)) {
      await ctx.reply(
        '🎲 TÀI XỈU CANVAS — Cú pháp: !taixiuc <tài/xỉu/chẵn/lẻ> <số tiền>\n(tối thiểu 100 coins)'
      );
      return;
    }

    if (!userRepo) {
      await ctx.reply('⚠️ Cơ sở dữ liệu kinh tế chưa sẵn sàng.');
      return;
    }

    if (isNaN(bet) || bet < MIN_BET) {
      await ctx.reply(`⚠️ Số tiền cược không hợp lệ (tối thiểu ${MIN_BET}).`);
      return;
    }

    const balance = await userRepo.getBalance(ctx.userId);
    if (balance < bet) {
      await ctx.reply(`⚠️ Số dư không đủ (${fmt(balance)} coins).`);
      return;
    }

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const d3 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2 + d3;
    const isTriple = d1 === d2 && d2 === d3;

    const betType = { tai: 'tài', xiu: 'xỉu', chan: 'chẵn', le: 'lẻ' }[choice]!;

    let result: string;
    if (isTriple) {
      result = 'tam chất';
    } else if (choice === 'tai' || choice === 'xiu') {
      result = total <= 10 ? 'xỉu' : 'tài';
    } else {
      result = total % 2 === 0 ? 'chẵn' : 'lẻ';
    }

    const win = !isTriple && result === betType;
    const delta = win ? bet : -bet;
    const newBalance = await userRepo.updateBalance(ctx.userId, delta);

    try {
      const png = await renderTaixiuBoard({
        dice: [d1, d2, d3],
        total,
        result,
        betType,
        win,
        bet,
        balance: newBalance,
        playerName: (await ctx.getUser?.())?.name,
      });

      const attachment: DataAttachment = {
        type: 'image',
        data: png.buffer,
        filename: png.filename,
        contentType: png.contentType,
      };

      const summary =
        win
          ? `🎉 Bạn cược ${betType.toUpperCase()} và THẮNG +${fmt(bet)} coins!`
          : `😔 Bạn cược ${betType.toUpperCase()} và THUA -${fmt(bet)} coins!`;

      await ctx.reply({
        text: `${summary}\n💰 Số dư mới: ${fmt(newBalance)} coins`,
        attachments: [attachment],
      });
    } catch (err) {
      // Canvas render failed — fall back to text-only result
      await ctx.reply(
        [
          `🎲 Kết quả: ${d1} + ${d2} + ${d3} = ${total} (${result})`,
          win ? `🎉 THẮNG +${fmt(bet)} coins!` : `😔 THUA -${fmt(bet)} coins!`,
          `💰 Số dư mới: ${fmt(newBalance)} coins`,
          '(ảnh canvas không khả dụng)',
        ].join('\n')
      );
    }
  },
};
