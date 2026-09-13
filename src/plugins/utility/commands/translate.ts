import { Command, CommandContext } from '../../../core/context.js';

export const translateCommand: Command = {
  name: 'translate',
  aliases: ['trans', 'dich'],
  description: 'Dịch văn bản sang tiếng Việt hoặc ngôn ngữ khác',
  usage: '!translate [mã_ngôn_ngữ] <văn bản> (Ví dụ: !trans en Xin chào)',
  category: 'utility',
  cooldown: 3,
  async execute(ctx: CommandContext): Promise<void> {
    if (ctx.args.length === 0) {
      await ctx.reply('⚠️ Vui lòng nhập văn bản cần dịch. Ví dụ: !trans Xin chào hoặc !trans en Xin chào');
      return;
    }

    let targetLang = 'vi';
    let textToTranslate = ctx.rawArgs;

    // Check if first arg is language code (2 chars)
    if (ctx.args[0].length === 2 && ctx.args.length > 1) {
      targetLang = ctx.args[0].toLowerCase();
      textToTranslate = ctx.args.slice(1).join(' ');
    }

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Google Translate HTTP ${res.status}`);
      }
      const data = (await res.json()) as any;
      const translated = data[0]?.map((item: any) => item[0]).join('') || '';

      await ctx.reply(`🌐 BẢN DỊCH [${targetLang.toUpperCase()}]:\n"${translated}"`);
    } catch (err: any) {
      await ctx.reply(`⚠️ Không thể dịch văn bản: ${err.message || 'Lỗi mạng'}`);
    }
  },
};
