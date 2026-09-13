import { Command, CommandContext } from '../../../core/context.js';
import { AIProvider } from '../../../services/ai/ai.interface.js';

export const aiCommand: Command = {
  name: 'ai',
  aliases: ['bot', 'sim', 'nino', 'ask'],
  description: 'Trò chuyện thông minh với trợ lý AI',
  usage: '!ai <câu hỏi/nội dung trò chuyện>',
  category: 'ai',
  cooldown: 3,
  async execute(ctx: CommandContext): Promise<void> {
    const prompt = ctx.rawArgs.trim();
    if (!prompt) {
      await ctx.reply('🤖 Bạn muốn trò chuyện gì với tôi? Cú pháp: !ai <nội dung>');
      return;
    }

    const aiProvider: AIProvider = ctx.services?.aiProvider;
    if (!aiProvider) {
      await ctx.reply('⚠️ Dịch vụ AI hiện chưa được cấu hình.');
      return;
    }

    await ctx.reply('💭 Đang suy nghĩ...');

    try {
      const response = await aiProvider.chat({
        messages: [
          {
            role: 'system',
            content: 'Bạn là trợ lý AI thông minh, thân thiện, trả lời bằng tiếng Việt ngắn gọn, hữu ích và lịch sự.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      await ctx.reply(`🤖 ${response.content}`);
    } catch (err: any) {
      await ctx.reply(`⚠️ Lỗi AI: ${err.message || 'Không thể kết nối đến mô hình trí tuệ nhân tạo'}`);
    }
  },
};
