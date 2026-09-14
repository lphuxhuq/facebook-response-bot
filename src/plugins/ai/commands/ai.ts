import { Command, CommandContext } from '../../../core/context.js';
import { AIProvider } from '../../../services/ai/ai.interface.js';

const MAX_CONTEXT_MESSAGES = 8;
const MAX_CONTEXT_CHARS = 4000;

export const aiCommand: Command = {
  name: 'ai',
  aliases: ['bot', 'sim', 'nino', 'ask'],
  description: 'Trò chuyện thông minh với trợ lý AI (ngữ cảnh từ lịch sử tin nhắn cục bộ)',
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

    // Group setting can disable AI per-thread
    const settings = ctx.repositories?.threadSettings?.getSettings?.(ctx.conversationId);
    if (settings && settings.aiEnabled === false) {
      await ctx.reply('🤖 Trợ lý AI đã bị tắt trong nhóm này (bật lại: !groupsettings ai on).');
      return;
    }

    await ctx.reply('💭 Đang suy nghĩ...');

    try {
      // Phase 21: build context from the LOCAL message store, never by
      // re-querying Facebook. Trim to a conservative character budget.
      const historyRows = ctx.repositories?.messageHistory?.getRecentMessages?.(ctx.conversationId, MAX_CONTEXT_MESSAGES) || [];
      const historyMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
      let budget = MAX_CONTEXT_CHARS;
      for (const row of historyRows) {
        if (!row.text) continue;
        const role = row.sender_id === ctx.userId ? 'user' : 'assistant';
        budget -= row.text.length;
        if (budget <= 0) break;
        historyMessages.push({ role, content: row.text.slice(0, 800) });
      }

      const response = await aiProvider.chat({
        messages: [
          {
            role: 'system',
            content:
              'Bạn là trợ lý AI thông minh, thân thiện, trả lời bằng tiếng Việt ngắn gọn, hữu ích và lịch sự. ' +
              'Khi được cung cấp, hãy dùng lịch sử hội thoại gần đây làm ngữ cảnh.',
          },
          ...historyMessages,
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
