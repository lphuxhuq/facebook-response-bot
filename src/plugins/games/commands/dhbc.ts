import { Command, CommandContext } from '../../../core/context.js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DHBC_PATH = join(__dirname, '..', '..', 'shared', 'assets', 'dhbc.json');

interface DhbcQuestion {
  question: string;
  wordcomplete: string;
}

const FALLBACK_QUESTIONS: DhbcQuestion[] = [
  { question: 'Con gì đập thì sống, không đập thì chết?', wordcomplete: 'con tim' },
  { question: 'Cái gì đen khi mua, đỏ khi dùng và xám xịt khi vứt đi?', wordcomplete: 'than' },
];

function loadQuestions(): DhbcQuestion[] {
  try {
    if (!existsSync(DHBC_PATH)) return FALLBACK_QUESTIONS;
    const raw = JSON.parse(readFileSync(DHBC_PATH, 'utf8'));
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return FALLBACK_QUESTIONS;
  } catch {
    return FALLBACK_QUESTIONS;
  }
}

function normalizeAnswer(text: string): string {
  return (text || '')
    .normalize('NFD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

function maskWord(word: string): string {
  return word.replace(/\S/g, '█').split('').join(' ');
}

interface DhbcState {
  wordcomplete: string;
}

export const dhbcCommand: Command = {
  name: 'dhbc',
  aliases: ['dovui', 'docachu'],
  description: 'Đuổi hình bắt chữ — trả lời bằng cách reply lại câu hỏi (dùng SessionManager)',
  usage: '!dhbc',
  category: 'games',
  cooldown: 5,
  async execute(ctx: CommandContext): Promise<void> {
    const sessionManager = ctx.sessionManager;
    const existing = await sessionManager?.get(ctx.conversationId, ctx.userId);

    if (existing && existing.command === 'dhbc') {
      const answer = normalizeAnswer(ctx.rawArgs);
      const correct = normalizeAnswer(existing.state.wordcomplete);

      if (answer === 'exit') {
        await sessionManager.delete(ctx.conversationId, ctx.userId);
        await ctx.reply(`👋 Đã thoát trò chơi. Đáp án là: "${existing.state.wordcomplete}"`);
        return;
      }

      if (answer === correct) {
        await sessionManager.delete(ctx.conversationId, ctx.userId);
        const reward = 2000;
        if (ctx.repositories?.user) {
          await ctx.repositories.user.updateBalance(ctx.userId, reward);
        }
        await ctx.reply(
          `🎉 Xin chúc mừng! Bạn đã trả lời hoàn toàn chính xác: "${existing.state.wordcomplete}" ❤️\n💰 Thưởng: +${reward.toLocaleString('vi-VN')} coins!`
        );
      } else {
        await ctx.reply(`❌ Tiếc quá, "${ctx.rawArgs}" chưa đúng! Gợi ý: ${maskWord(existing.state.wordcomplete)}\n(thoát: gõ "exit")`);
      }
      return;
    }

    const questions = loadQuestions();
    const item = questions[Math.floor(Math.random() * questions.length)];

    await sessionManager?.create(
      ctx.conversationId,
      ctx.userId,
      'dhbc',
      { wordcomplete: item.wordcomplete },
      'await-answer',
      300
    );

    const msg = [
      '🎯 [ ĐỐ VUI BẮT CHỮ ] 🎯',
      '━━━━━━━━━━━━━━━━━',
      `❓ Câu hỏi: ${item.question}`,
      `👉 Gợi ý: ${maskWord(item.wordcomplete)}`,
      '',
      '💡 Gửi tin nhắn tiếp theo để trả lời (hoặc gõ "exit" để thoát, TTL 5 phút)',
    ].join('\n');

    await ctx.reply(msg);
  },
};
