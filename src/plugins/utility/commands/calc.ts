import { Command, CommandContext } from '../../../core/context.js';

export const calcCommand: Command = {
  name: 'calc',
  aliases: ['math', 'maytinh'],
  description: 'Tính toán biểu thức số học an toàn (không dùng eval)',
  usage: '!calc <biểu thức> (Ví dụ: !calc 2 + 3 * 4)',
  category: 'utility',
  cooldown: 2,
  async execute(ctx: CommandContext): Promise<void> {
    const expr = ctx.rawArgs.trim();
    if (!expr) {
      await ctx.reply('⚠️ Vui lòng nhập phép tính. Ví dụ: !calc (10 + 5) * 2 / 3');
      return;
    }

    // Security check: Only allow numbers, whitespace, and math operators + - * / % ( ) . ^
    if (!/^[0-9\s+\-*/%().^]+$/.test(expr)) {
      await ctx.reply('⛔ Biểu thức chứa ký tự không hợp lệ. Chỉ chấp nhận chữ số và phép tính số học (+, -, *, /, %, ^, ()).');
      return;
    }

    try {
      // Safe evaluation using Function with strict mode and zero scope access
      const sanitized = expr.replace(/\^/g, '**');
      const result = new Function(`"use strict"; return (${sanitized});`)();

      if (typeof result !== 'number' || !isFinite(result)) {
        await ctx.reply('⚠️ Kết quả phép tính không hợp lệ hoặc chia cho 0.');
        return;
      }

      await ctx.reply(`🔢 KẾT QUẢ:\n${expr} = ${result}`);
    } catch {
      await ctx.reply('⚠️ Cú pháp biểu thức toán học không hợp lệ.');
    }
  },
};
