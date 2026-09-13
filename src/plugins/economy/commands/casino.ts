import { Command, CommandContext } from '../../../core/context.js';
import { fmt } from '../../shared/data-store.js';

const MIN_BET = 50;

type BetType = string;

function normalize(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const SLOT_ITEMS = ['🍇', '🍉', '🍊', '🍏', '🥭', '🍓', '🍒', '🍌', '🥝', '🥑', '🌽'];
const RPS: Record<string, string> = { 'keo': '✌️', 'bua': '👊', 'bao': '✋' };
const RPS_LABEL: Record<string, string> = { 'keo': 'Kéo', 'bua': 'Búa', 'bao': 'Bao' };

export const casinoCommand: Command = {
  name: 'casino',
  aliases: ['cobac', 'gamebai'],
  description: 'Tổng hợp trò cờ bạc: tài xỉu, chẵn lẻ, slot, kéo búa bao (offline)',
  usage: '!casino <taixiu|chanle|slot|kbb> [lựa chọn] [số tiền]',
  category: 'economy',
  cooldown: 3,
  async execute(ctx: CommandContext): Promise<void> {
    const userRepo = ctx.repositories?.user;
    const game = normalize(ctx.args[0] || '');

    if (!game || !['tai', 'xiu', 'chan', 'le', 'slot', 'kbb', 'taixiu', 'chanle'].includes(game)) {
      await ctx.reply(
        [
          '🃏─── CASINO ───🃏',
          '',
          '❯ 1. Tài Xỉu: !casino taixiu <tài/xỉu> <tiền>',
          '❯ 2. Chẵn Lẻ:   !casino chanle <chẵn/lẻ> <tiền>',
          '❯ 3. Slot:        !casino slot <tiền>',
          '❯ 4. Kéo Búa Bao: !casino kbb <kéo/búa/bao> <tiền>',
          '',
          `💰 Mức cược tối thiểu: ${MIN_BET} coins`,
        ].join('\n')
      );
      return;
    }

    if (!userRepo) {
      await ctx.reply('⚠️ Cơ sở dữ liệu kinh tế chưa sẵn sàng.');
      return;
    }

    // Pure luck games without bet choice
    if (game === 'slot') {
      const bet = parseInt(ctx.args[1] || '', 10);
      if (isNaN(bet) || bet < MIN_BET) {
        await ctx.reply(`⚠️ Số tiền cược không hợp lệ (tối thiểu ${MIN_BET}).`);
        return;
      }
      const balance = await userRepo.getBalance(ctx.userId);
      if (balance < bet) {
        await ctx.reply(`⚠️ Số dư không đủ (${fmt(balance)} coins).`);
        return;
      }

      const n = [0, 1, 2].map(() => Math.floor(Math.random() * SLOT_ITEMS.length));
      let win = 0;
      if (n[0] === n[1] && n[1] === n[2]) {
        win = bet * 9;
      } else if (n[0] === n[1] || n[0] === n[2] || n[1] === n[2]) {
        win = bet * 2;
      }

      const delta = win > 0 ? win - bet : -bet;
      const newBal = await userRepo.updateBalance(ctx.userId, delta);
      await ctx.reply(
        [
          '╭──────────╮',
          `ㅤ🎰 » ${SLOT_ITEMS[n[0]]} | ${SLOT_ITEMS[n[1]]} | ${SLOT_ITEMS[n[2]]} 🎰`,
          '╰──────────╯',
          win > 0 ? `🎉 Bạn thắng +${fmt(win)} coins!` : '💸 Bạn thua rồi, xin chia buồn!',
          `💰 Số dư mới: ${fmt(newBal)} coins`,
        ].join('\n')
      );
      return;
    }

    if (game === 'kbb') {
      const choice = normalize(ctx.args[1] || '');
      const bet = parseInt(ctx.args[2] || '', 10);
      if (!RPS[choice]) {
        await ctx.reply('⚠️ Vui lòng chọn: kéo, búa hoặc bao!');
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

      const botChoice = pickOne(['keo', 'bua', 'bao']);
      const userEmoji = RPS[choice];
      const botEmoji = RPS[botChoice];
      const beats: Record<string, string> = { 'keo': 'bao', 'bua': 'keo', 'bao': 'bua' };

      let result: 'win' | 'lose' | 'draw';
      if (choice === botChoice) {
        result = 'draw';
      } else if (beats[choice] === botChoice) {
        result = 'win';
      } else {
        result = 'lose';
      }

      const delta = result === 'win' ? bet : result === 'lose' ? -bet : 0;
      const newBal = await userRepo.updateBalance(ctx.userId, delta);
      await ctx.reply(
        [
          `👤 Bạn: ${userEmoji} (${RPS_LABEL[choice]})   🤖 Bot: ${botEmoji} (${RPS_LABEL[botChoice]})`,
          result === 'win' ? '🎉 BẠN ĐÃ THẮNG!' : result === 'lose' ? '😔 BẠN ĐÃ THUA!' : '🤝 HÒA!',
          result === 'win' ? `💬 Thắng +${fmt(bet)} coins` : result === 'lose' ? `💬 Thua -${fmt(bet)} coins` : '💬 Số dư không đổi',
          `💰 Số dư mới: ${fmt(newBal)} coins`,
        ].join('\n')
      );
      return;
    }

    // Tài xỉu / chẵn lẻ
    const isTaixiu = ['taixiu', 'tai', 'xiu'].includes(game);
    const choiceRaw = normalize(ctx.args[1] || '');
    const bet = parseInt(ctx.args[2] || '', 10);

    const validChoices = isTaixiu ? ['tai', 'xiu'] : ['chan', 'le'];
    if (!validChoices.includes(choiceRaw)) {
      await ctx.reply(`⚠️ Vui lòng chọn: ${isTaixiu ? 'tài hoặc xỉu' : 'chẵn hoặc lẻ'}.`);
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

    let result: string;
    if (isTaixiu) {
      result = d1 === d2 && d2 === d3 ? 'tam chất' : total <= 10 ? 'xỉu' : 'tài';
    } else {
      result = total % 2 === 0 ? 'chẵn' : 'lẻ';
    }

    const win = result === choiceRaw || (isTaixiu && result === 'tam chất' && false);
    const delta = win ? bet : -bet;
    const newBal = await userRepo.updateBalance(ctx.userId, delta);

    const diceFace = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    await ctx.reply(
      [
        `🎲 ${diceFace[d1 - 1]} ${diceFace[d2 - 1]} ${diceFace[d3 - 1]}  = ${total} điểm`,
        `👉 Kết quả: ${result.toUpperCase()}`,
        '',
        win ? `🎉 Thắng +${fmt(bet)} coins!` : `💸 Thua -${fmt(bet)} coins!`,
        `💰 Số dư mới: ${fmt(newBal)} coins`,
      ].join('\n')
    );
  },
};

function pickOne(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}
