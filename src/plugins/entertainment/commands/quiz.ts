import { Command, CommandContext } from '../../../core/context.js';

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

const quizQuestions: Question[] = [
  {
    question: 'Thủ đô của Việt Nam là gì?',
    options: ['A. TP. Hồ Chí Minh', 'B. Đà Nẵng', 'C. Hà Nội', 'D. Hải Phòng'],
    correctIndex: 2, // C
  },
  {
    question: 'Ngôn ngữ lập trình chính được sử dụng để xây dựng bot V2 này là gì?',
    options: ['A. Python', 'B. TypeScript', 'C. C++', 'D. Java'],
    correctIndex: 1, // B
  },
  {
    question: 'Giao thức chính thức mà Meta Messenger Platform dùng để gửi sự kiện đến bot là gì?',
    options: ['A. Webhook qua HTTPS', 'B. MQTT WebScraping', 'C. FTP', 'D. Bluetooth'],
    correctIndex: 0, // A
  },
];

export const quizCommand: Command = {
  name: 'quiz',
  aliases: ['cauhoi', 'dhbc'],
  description: 'Trò chơi trắc nghiệm đố vui tương tác nhiều bước (dùng SessionManager)',
  usage: '!quiz',
  category: 'entertainment',
  cooldown: 5,
  async execute(ctx: CommandContext): Promise<void> {
    const sessionManager = ctx.sessionManager;
    const existingSession = await sessionManager?.get(ctx.conversationId, ctx.userId);

    // If an active session exists, process the user's answer
    if (existingSession && existingSession.command === 'quiz') {
      const qIndex = existingSession.state.qIndex as number;
      const score = existingSession.state.score as number;
      const q = quizQuestions[qIndex];

      const input = ctx.rawArgs.trim().toUpperCase();
      const answerChar = input[0]; // e.g. 'A', 'B', 'C', 'D'
      const optionMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

      if (optionMap[answerChar] === undefined) {
        await ctx.reply('⚠️ Vui lòng trả lời bằng một trong các chữ cái: A, B, C hoặc D (hoặc gõ "exit" để thoát).');
        return;
      }

      const isCorrect = optionMap[answerChar] === q.correctIndex;
      const newScore = isCorrect ? score + 1 : score;

      if (isCorrect) {
        await ctx.reply(`🎉 Chính xác! Bạn được cộng 1 điểm.`);
      } else {
        const correctLetter = ['A', 'B', 'C', 'D'][q.correctIndex];
        await ctx.reply(`❌ Rất tiếc, câu trả lời đúng là: ${correctLetter}.`);
      }

      // Check next question
      const nextIndex = qIndex + 1;
      if (nextIndex < quizQuestions.length) {
        await sessionManager.update(ctx.conversationId, ctx.userId, {
          qIndex: nextIndex,
          score: newScore,
        });

        const nextQ = quizQuestions[nextIndex];
        const nextMsg = [
          `❓ CÂU HỎI ${nextIndex + 1}/${quizQuestions.length}:`,
          nextQ.question,
          '',
          ...nextQ.options,
          '',
          `👉 Hãy phản hồi A, B, C hoặc D!`,
        ].join('\n');

        await ctx.reply(nextMsg);
      } else {
        // Quiz completed! Award reward in economy
        await sessionManager.delete(ctx.conversationId, ctx.userId);
        const reward = newScore * 1000;
        if (reward > 0 && ctx.repositories?.user) {
          await ctx.repositories.user.updateBalance(ctx.userId, reward);
        }

        await ctx.reply(
          `🏆 KẾT THÚC TRÒ CHƠI!\nĐiểm số của bạn: ${newScore}/${quizQuestions.length}\n💰 Phần thưởng: +${reward} coins!`
        );
      }
      return;
    }

    // Start a new quiz session
    await sessionManager?.create(
      ctx.conversationId,
      ctx.userId,
      'quiz',
      { qIndex: 0, score: 0 },
      'question',
      120 // 2 minutes TTL
    );

    const firstQ = quizQuestions[0];
    const msg = [
      `🎮 TRÒ CHƠI ĐỐ VUI (QUIZ)`,
      `───────────────────────`,
      `❓ CÂU HỎI 1/${quizQuestions.length}:`,
      firstQ.question,
      '',
      ...firstQ.options,
      '',
      `👉 Trả lời bằng cách gửi tin nhắn: A, B, C hoặc D (Thời gian: 120s)`,
    ].join('\n');

    await ctx.reply(msg);
  },
};
