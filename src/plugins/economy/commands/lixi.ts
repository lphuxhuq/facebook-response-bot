import { Command, CommandContext } from '../../../core/context.js';
import { readPluginData, writePluginData, fmt, pickRandom } from '../../shared/data-store.js';

interface LixiState {
  lastOpen: number;
}

const COOLDOWN_MS = 20 * 60 * 60 * 1000;
const ENVELOPES = [1, 2, 3, 4, 5, 6];

function reward(): number {
  return Math.floor(Math.random() * 100) + 80;
}

export const lixiCommand: Command = {
  name: 'lixi',
  aliases: ['baolixi', 'luckymoney'],
  description: 'Mở bao lì xì nhận coins ngẫu nhiên (20h/lần)',
  usage: '!lixi',
  category: 'economy',
  cooldown: 5,
  async execute(ctx: CommandContext): Promise<void> {
    const userRepo = ctx.repositories?.user;
    if (!userRepo) {
      await ctx.reply('⚠️ Cơ sở dữ liệu kinh tế chưa sẵn sàng.');
      return;
    }

    const sessionManager = ctx.sessionManager;
    const existing = await sessionManager?.get(ctx.conversationId, ctx.userId);

    // Reply flow: choose an envelope 1-6
    if (existing && existing.command === 'lixi') {
      if (!userRepo) {
        await ctx.reply('⚠️ Cơ sở dữ liệu kinh tế chưa sẵn sàng.');
        return;
      }
      const choice = parseInt(ctx.rawArgs.trim(), 10);
      if (isNaN(choice) || choice < 1 || choice > 6) {
        await ctx.reply('🎋 Vui lòng nhập 1 con số từ 1 đến 6!');
        return;
      }
      const amount = reward();
      const newBal = await userRepo.updateBalance(ctx.userId, amount);
      await sessionManager.delete(ctx.conversationId, ctx.userId);
      await ctx.reply(
        `🧧 Chúc mừng bạn vừa nhận ${fmt(amount)} coins khi mở phong lì xì ${choice}! 🏮\n💰 Số dư mới: ${fmt(newBal)} coins`
      );
      return;
    }

    // Check cooldown
    const allData = readPluginData<Record<string, LixiState>>('lixi.json', {});
    const state = allData[ctx.userId] || { lastOpen: 0 };

    if (COOLDOWN_MS - (Date.now() - state.lastOpen) > 0) {
      const remain = COOLDOWN_MS - (Date.now() - state.lastOpen);
      const h = Math.floor(remain / 3600000);
      const m = Math.floor((remain % 3600000) / 60000);
      await ctx.reply(`🧧 Bạn vừa mở lì xì rồi, quay lại sau ${h} giờ ${m} phút nhé! 🎋`);
      return;
    }

    state.lastOpen = Date.now();
    allData[ctx.userId] = state;
    writePluginData('lixi.json', allData);

    await sessionManager?.create(
      ctx.conversationId,
      ctx.userId,
      'lixi',
      { opened: false },
      'choose-envelope',
      120
    );

    const msg = [
      '🏮=== LÌ XÌ ===🏮',
      '',
      ...ENVELOPES.map((n) => `🏠 Bao lì xì ${n} 🧧`),
      '',
      '👉 Gửi tin nhắn tiếp theo chọn bao lì xì muốn nhận (TTL 2 phút)',
    ].join('\n');

    await ctx.reply({
      text: msg,
      attachments: [{ type: 'image', url: pickRandom(['https://imgur.com/Y03gw5v.png', 'https://i.imgur.com/g6X1W3x.jpg']) }],
    });
  },
};
