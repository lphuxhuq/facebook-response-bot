import { Command, CommandContext } from '../../../core/context.js';
import { fmt, pickRandom } from '../../shared/data-store.js';

export interface AltpQuestion {
  question: string;
  a: string;
  b: string;
  c: string;
  d: string;
  correct: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
}

export const ALTP_REWARDS: number[] = [
  0, 200, 400, 600, 1000, 2000, 3000, 6000, 10000, 14000, 22000, 30000, 40000, 80000, 150000, 250000
];

export function getSafeReward(level: number): number {
  if (level >= 15) return ALTP_REWARDS[15];
  if (level >= 10) return ALTP_REWARDS[10];
  if (level >= 5) return ALTP_REWARDS[5];
  return 0;
}

export const ALTP_QUESTION_BANK: AltpQuestion[] = [
  {
    question: 'Thủ đô của Việt Nam là gì?',
    a: 'Đà Nẵng', b: 'Hà Nội', c: 'TP. Hồ Chí Minh', d: 'Hải Phòng',
    correct: 'B', explanation: 'Hà Nội là thủ đô của nước CHXHCN Việt Nam.'
  },
  {
    question: 'Hành tinh nào gần Mặt Trời nhất trong Hệ Mặt Trời?',
    a: 'Sao Kim', b: 'Sao Hỏa', c: 'Sao Thủy', d: 'Sao Mộc',
    correct: 'C', explanation: 'Sao Thủy (Mercury) gần Mặt Trời nhất.'
  },
  {
    question: 'Kim tự tháp Giza nằm ở quốc gia nào?',
    a: 'Ai Cập', b: 'Hy Lạp', c: 'Ý', d: 'Mexico',
    correct: 'A', explanation: 'Quần thể kim tự tháp Giza nằm ở Cairo, Ai Cập.'
  },
  {
    question: 'Tác phẩm "Truyện Kiều" do ai sáng tác?',
    a: 'Hồ Xuân Hương', b: 'Nguyễn Du', c: 'Nguyễn Trãi', d: 'Đoàn Thị Điểm',
    correct: 'B', explanation: 'Đại thi hào Nguyễn Du sáng tác Đoạn Trường Tân Thanh.'
  },
  {
    question: 'Ký hiệu hóa học của Vàng là gì?',
    a: 'Ag', b: 'Fe', c: 'Au', d: 'Cu',
    correct: 'C', explanation: 'Au xuất phát từ Aurum có nghĩa là Vàng.'
  },
  {
    question: 'Đỉnh núi Fansipan cao bao nhiêu mét?',
    a: '3.143m', b: '3.043m', c: '2.943m', d: '3.243m',
    correct: 'A', explanation: 'Fansipan cao 3.143m so với mực nước biển.'
  },
  {
    question: 'Nước nào có diện tích lãnh thổ lớn nhất thế giới?',
    a: 'Canada', b: 'Mỹ', c: 'Trung Quốc', d: 'Nga',
    correct: 'D', explanation: 'Nga rộng nhất thế giới với diện tích hơn 17 triệu km².'
  }
];

export interface AltpState {
  level: number;
  question: AltpQuestion;
  startedAt: number;
}

export const altpCommand: Command = {
  name: 'altp',
  aliases: ['ailatrieuphu', 'trieuphu'],
  description: 'Gameshow Ai Là Triệu Phú với 15 câu hỏi và các mốc thưởng',
  usage: '!altp [start|A/B/C/D|stop|info]',
  category: 'games',
  cooldown: 2,
  async execute(ctx: CommandContext): Promise<void> {
    const sessionManager = ctx.sessionManager;
    const sub = (ctx.args[0] || '').toUpperCase();

    if (sub === 'INFO' || sub === 'LUAT') {
      await ctx.reply(
        [
          '🎙️ AI LÀ TRIỆU PHÚ - LUẬT CHƠI:',
          '• Trả lời 15 câu hỏi trắc nghiệm (A, B, C, D)',
          '• Mốc an toàn 1: Câu 5 ($2.000)',
          '• Mốc an toàn 2: Câu 10 ($22.000)',
          '• Mốc về đích: Câu 15 ($250.000)',
          '• Dừng cuộc chơi: !altp stop bảo toàn tiền',
          '• Trả lời sai: Rơi về mốc an toàn gần nhất',
          '',
          '👉 Bắt đầu: !altp start'
        ].join('\n')
      );
      return;
    }

    const session = await sessionManager?.get(ctx.conversationId, ctx.userId);

    if (session && session.command === 'altp') {
      const state = session.state as AltpState;

      if (sub === 'STOP' || sub === 'DUNG') {
        const reward = ALTP_REWARDS[state.level - 1] || 0;
        await sessionManager.delete(ctx.conversationId, ctx.userId);
        if (reward > 0 && ctx.repositories?.user) {
          await ctx.repositories.user.updateBalance(ctx.userId, reward);
        }
        await ctx.reply(
          `🛑 Bạn dừng cuộc chơi tại câu số ${state.level}!\n💰 Nhận thưởng: ${fmt(reward)}$`
        );
        return;
      }

      if (!['A', 'B', 'C', 'D'].includes(sub)) {
        await ctx.reply('⚠️ Chọn đáp án: A, B, C hoặc D. (Hoặc `!altp stop` để dừng)');
        return;
      }

      const q = state.question;
      if (sub === q.correct) {
        const currentReward = ALTP_REWARDS[state.level];
        if (state.level === 15) {
          await sessionManager.delete(ctx.conversationId, ctx.userId);
          if (ctx.repositories?.user) {
            await ctx.repositories.user.updateBalance(ctx.userId, currentReward);
          }
          await ctx.reply(
            `🎉 CHÍNH XÁC!\n🏆 BẠN ĐÃ CHIẾN THẮNG 15 CÂU HỎI!\n💰 Thưởng lớn: ${fmt(currentReward)}$`
          );
          return;
        }

        const nextLevel = state.level + 1;
        const nextQ = pickRandom(ALTP_QUESTION_BANK);
        await sessionManager.update(ctx.conversationId, ctx.userId, {
          level: nextLevel,
          question: nextQ,
          startedAt: state.startedAt
        });

        await ctx.reply(
          [
            `✅ ${sub} đúng! Vượt qua câu ${state.level} (+${fmt(currentReward)}$)`,
            '',
            `❓ CÂU ${nextLevel} (${fmt(ALTP_REWARDS[nextLevel])}$):`,
            nextQ.question,
            `A. ${nextQ.a}`,
            `B. ${nextQ.b}`,
            `C. ${nextQ.c}`,
            `D. ${nextQ.d}`
          ].join('\n')
        );
        return;
      } else {
        const safe = getSafeReward(state.level - 1);
        await sessionManager.delete(ctx.conversationId, ctx.userId);
        if (safe > 0 && ctx.repositories?.user) {
          await ctx.repositories.user.updateBalance(ctx.userId, safe);
        }
        await ctx.reply(
          `❌ Rất tiếc, ${sub} sai! Đáp án đúng: ${q.correct}.\n🏁 Tiền thưởng an toàn: ${fmt(safe)}$`
        );
        return;
      }
    }

    if (sub === 'START' || sub === 'CHOI' || !sub) {
      const firstQ = pickRandom(ALTP_QUESTION_BANK);
      const initialState: AltpState = {
        level: 1,
        question: firstQ,
        startedAt: Date.now()
      };

      await sessionManager?.create(ctx.conversationId, ctx.userId, 'altp', initialState, 'playing', 300);

      await ctx.reply(
        [
          '🎙️ AI LÀ TRIỆU PHÚ!',
          `❓ CÂU 1 (${fmt(ALTP_REWARDS[1])}$):`,
          firstQ.question,
          `A. ${firstQ.a}`,
          `B. ${firstQ.b}`,
          `C. ${firstQ.c}`,
          `D. ${firstQ.d}`
        ].join('\n')
      );
      return;
    }

    await ctx.reply('ℹ️ Dùng `!altp start` để chơi hoặc `!altp info` xem thể lệ.');
  }
};

