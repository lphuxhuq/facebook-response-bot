import { Command, CommandContext } from '../../../core/context.js';
import { readPluginData, writePluginData, fmt, pickRandom } from '../../shared/data-store.js';

interface DailyState {
  lastClaim: number;
  streak: number;
  lastClaimDay: string;
}

const BASE_REWARD = 5000;
const STREAK_BONUS_RATE = 0.07;
const DAY_MS = 24 * 60 * 60 * 1000;

const GIF_LINKS = [
  'https://i.imgur.com/7ltbAS1.gif',
  'https://i.imgur.com/g6X1W3x.jpg',
  'https://i.imgur.com/kQoK0oP.png',
];

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayDiff(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z').getTime();
  const db = new Date(b + 'T00:00:00Z').getTime();
  return Math.round((db - da) / DAY_MS);
}

function weekdayVN(): string {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return days[new Date().getDay()];
}

function rewardForStreak(streak: number): number {
  const dayOfWeek = streak === 0 ? 7 : ((new Date().getDay() + 6) % 7) + 1;
  return Math.floor(BASE_REWARD * Math.pow(1 + STREAK_BONUS_RATE, dayOfWeek - 1));
}

export const dailyCommand: Command = {
  name: 'daily',
  aliases: ['diemdanh', 'danhnhat'],
  description: 'Điểm danh nhận quà hằng ngày — streak 7 ngày nhận thưởng lớn',
  usage: '!daily [info|7day]',
  category: 'economy',
  cooldown: 5,
  async execute(ctx: CommandContext): Promise<void> {
    const userRepo = ctx.repositories?.user;
    if (!userRepo) {
      await ctx.reply('⚠️ Cơ sở dữ liệu kinh tế chưa sẵn sàng.');
      return;
    }

    const sub = ctx.args[0]?.toLowerCase();
    const allData = readPluginData<Record<string, DailyState>>('daily.json', {});
    const state = allData[ctx.userId] || { lastClaim: 0, streak: 0, lastClaimDay: '' };

    if (sub === 'info') {
      const lines: string[] = ['====== THÔNG TIN PHẦN QUÀ ======', ''];
      for (let i = 1; i <= 7; i++) {
        const reward = Math.floor(BASE_REWARD * Math.pow(1 + STREAK_BONUS_RATE, i - 1));
        const label = i === 7 ? 'Chủ Nhật' : 'Thứ ' + (i + 1);
        lines.push(`${label}: 💸 ${fmt(reward)} coins`);
      }
      lines.push('', ` streak hiện tại: ${state.streak}/7`);
      lines.push(` Hôm nay là: ${weekdayVN()}`);
      await ctx.reply(lines.join('\n'));
      return;
    }

    const today = todayKey();

    if (state.lastClaimDay === today) {
      const elapsed = Date.now() - state.lastClaim;
      const remain = DAY_MS - elapsed;
      const h = Math.floor(remain / 3600000);
      const m = Math.floor((remain % 3600000) / 60000);
      const s = Math.floor((remain % 60000) / 1000);
      await ctx.reply(`⏳ Hôm nay bạn đã nhận quà rồi. Quay lại sau ${h} giờ ${m} phút ${s} giây.`);
      return;
    }

    if (sub === '7day') {
      if (state.streak < 7) {
        await ctx.reply(`⚠️ Bạn mới điểm danh được ${state.streak}/7 ngày. Đủ 7 ngày liên tục mới nhận quà bí mật!`);
        return;
      }
      const bonus = 1000000;
      state.streak = 0;
      allData[ctx.userId] = state;
      writePluginData('daily.json', allData);
      const newBal = await userRepo.updateBalance(ctx.userId, bonus);
      await ctx.reply(
        [
          '🎉 NHẬN QUÀ ĐĂNG NHẬP 7 NGÀY THÀNH CÔNG!',
          '◆━━━━━•💜•━━━━━◆',
          `     💸 ${fmt(bonus)} Tiền mặt`,
          '',
          `💰 Số dư mới: ${fmt(newBal)} coins`,
          'Tích đủ 7 điểm để nhận quà tiếp!',
        ].join('\n')
      );
      return;
    }

    // Consecutive day?
    const diff = state.lastClaimDay ? dayDiff(state.lastClaimDay, today) : 99;
    state.streak = diff === 1 ? state.streak + 1 : 1;
    state.lastClaim = Date.now();
    state.lastClaimDay = today;

    const reward = rewardForStreak(state.streak);
    allData[ctx.userId] = state;
    writePluginData('daily.json', allData);

    const newBal = await userRepo.updateBalance(ctx.userId, reward);

    await ctx.reply({
      text: [
        `✅ Điểm danh ${weekdayVN()} thành công!`,
        '◆━━━━━•💜•━━━━━◆',
        `     🎊 Phần quà bao gồm: 🎊`,
        `     💸 ${fmt(reward)} coins`,
        '',
        `📅 Streak: ${state.streak}/7 điểm đăng nhập`,
        state.streak >= 7
          ? '🎁 Đã đủ 7 điểm! Dùng !daily 7day để nhận quà bí mật!'
          : '(tích đủ 7 điểm thì dùng !daily 7day để nhận quà lớn)',
        `💰 Số dư mới: ${fmt(newBal)} coins`,
      ].join('\n'),
      attachments: [{ type: 'image', url: pickRandom(GIF_LINKS) }],
    });
  },
};
