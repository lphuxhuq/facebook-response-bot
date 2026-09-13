import { Command, CommandContext, Role } from '../../../core/context.js';

export const groupSettingsCommand: Command = {
  name: 'groupsettings',
  aliases: ['gset', 'cauhinh'],
  description: 'Thay đổi cài đặt riêng cho nhóm (Chỉ dành cho QTV nhóm hoặc Admin)',
  usage: '!groupsettings <prefix|ai|welcome|antispam> [giá trị]',
  category: 'group',
  scope: 'GROUP',
  cooldown: 3,
  async execute(ctx: CommandContext): Promise<void> {
    const threadSettingsRepo = ctx.repositories?.threadSettings;
    if (!threadSettingsRepo) {
      await ctx.reply('⚠️ Cấu hình nhóm chưa được khởi tạo.');
      return;
    }

    // Permission check: Must be Thread Admin (QTV nhóm) or Bot Admin/Owner
    const isQtv = ctx.isThreadAdmin || (ctx.userRole && ctx.userRole >= Role.ADMIN);
    if (!isQtv) {
      await ctx.reply('⛔ Chỉ Quản trị viên nhóm (QTV) hoặc Admin bot mới có quyền thay đổi cài đặt nhóm.');
      return;
    }

    const sub = ctx.args[0]?.toLowerCase();
    const val = ctx.args[1]?.toLowerCase();

    if (!sub) {
      await ctx.reply(
        [
          `⚙️ HƯỚNG DẪN CÀI ĐẶT NHÓM:`,
          `• !groupsettings prefix <kí_tự> : Đổi tiền tố lệnh cho nhóm`,
          `• !groupsettings ai <on|off>     : Bật/tắt phản hồi AI trong nhóm`,
          `• !groupsettings welcome <on|off>: Bật/tắt lời chào thành viên mới`,
          `• !groupsettings antispam <on|off>: Bật/tắt giới hạn gửi tin nhanh`,
        ].join('\n')
      );
      return;
    }

    if (sub === 'prefix') {
      const newPrefix = ctx.args[1]?.trim();
      if (!newPrefix || newPrefix.length > 3) {
        await ctx.reply('⚠️ Tiền tố lệnh phải từ 1 đến 3 ký tự (Ví dụ: !groupsettings prefix #)');
        return;
      }
      threadSettingsRepo.saveSettings({ threadId: ctx.conversationId, prefix: newPrefix });
      await ctx.reply(`✅ Đã đổi tiền tố lệnh của nhóm thành: '${newPrefix}'`);
      return;
    }

    if (sub === 'ai') {
      const enabled = val === 'on' || val === 'true' || val === '1';
      threadSettingsRepo.saveSettings({ threadId: ctx.conversationId, aiEnabled: enabled });
      await ctx.reply(`✅ Đã ${enabled ? 'BẬT' : 'TẮT'} tính năng AI trong nhóm.`);
      return;
    }

    if (sub === 'welcome') {
      const enabled = val === 'on' || val === 'true' || val === '1';
      threadSettingsRepo.saveSettings({ threadId: ctx.conversationId, welcomeEnabled: enabled });
      await ctx.reply(`✅ Đã ${enabled ? 'BẬT' : 'TẮT'} thông báo chào mừng thành viên.`);
      return;
    }

    if (sub === 'antispam') {
      const enabled = val === 'on' || val === 'true' || val === '1';
      threadSettingsRepo.saveSettings({ threadId: ctx.conversationId, antiSpam: enabled });
      await ctx.reply(`✅ Đã ${enabled ? 'BẬT' : 'TẮT'} chế độ chống spam nhóm.`);
      return;
    }

    await ctx.reply(`⚠️ Tùy chọn không hợp lệ: '${sub}'. Gõ '!groupsettings' để xem hướng dẫn.`);
  },
};
