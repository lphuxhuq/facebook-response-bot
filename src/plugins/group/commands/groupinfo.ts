import { Command, CommandContext } from '../../../core/context.js';

export const groupInfoCommand: Command = {
  name: 'groupinfo',
  aliases: ['boxinfo', 'nhom'],
  description: 'Hiển thị thông tin nhóm chat, danh sách quản trị viên và cấu hình nhóm',
  usage: '!groupinfo',
  category: 'group',
  scope: 'GROUP',
  cooldown: 5,
  async execute(ctx: CommandContext): Promise<void> {
    const thread = ctx.thread || {
      id: ctx.conversationId,
      name: 'Nhóm Chat',
      participants: [],
      adminIds: [],
    };

    const threadSettingsRepo = ctx.repositories?.threadSettings;
    const settings = threadSettingsRepo ? threadSettingsRepo.getSettings(ctx.conversationId) : null;

    const msg = [
      `👥 THÔNG TIN NHÓM CHAT`,
      `──────────────────────`,
      `🏷️ Tên nhóm: ${thread.name || 'Chưa đặt tên'}`,
      `🆔 Thread ID: ${ctx.conversationId}`,
      `👤 Tổng thành viên: ${thread.participants?.length || 'N/A'}`,
      `👑 Quản trị viên nhóm: ${thread.adminIds?.length || 0} người`,
      `──────────────────────`,
      `⚙️ CẤU HÌNH NHÓM:`,
      `• Tiền tố lệnh (Prefix): ${settings?.prefix || 'Mặc định (!)'}`,
      `• Trợ lý AI: ${settings?.aiEnabled ? 'Bật (ON)' : 'Tắt (OFF)'}`,
      `• Chào mừng thành viên mới: ${settings?.welcomeEnabled ? 'Bật (ON)' : 'Tắt (OFF)'}`,
      `• Chống spam nhóm: ${settings?.antiSpam ? 'Bật (ON)' : 'Tắt (OFF)'}`,
    ].join('\n');

    await ctx.reply(msg);
  },
};
