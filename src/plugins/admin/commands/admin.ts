import { Command, CommandContext, Role } from '../../../core/context.js';

export const adminCommand: Command = {
  name: 'admin',
  aliases: ['qtv'],
  description: 'Quản lý phân quyền và quản trị hệ thống bot',
  usage: '!admin <setrole|getrole|ban|unban|logs> [userId] [role]',
  category: 'admin',
  requiredRole: Role.ADMIN,
  cooldown: 2,
  async execute(ctx: CommandContext): Promise<void> {
    const sub = ctx.args[0]?.toLowerCase();
    const targetUserId = ctx.args[1];
    const userRepo = ctx.repositories?.user;
    const auditRepo = ctx.repositories?.audit;

    if (!sub) {
      await ctx.reply(
        [
          `🛡️ BẢNG ĐIỀU KHIỂN QUẢN TRỊ VIÊN`,
          `───────────────────────────────`,
          `!admin getrole <userId> : Xem quyền của user`,
          `!admin setrole <userId> <USER|MODERATOR|ADMIN|OWNER>`,
          `!admin ban <userId>     : Cấm user sử dụng bot`,
          `!admin unban <userId>   : Hủy cấm user`,
          `!admin logs             : Xem 5 nhật ký gần nhất`,
        ].join('\n')
      );
      return;
    }

    if (sub === 'getrole') {
      if (!targetUserId) {
        await ctx.reply('⚠️ Vui lòng cung cấp ID người dùng.');
        return;
      }
      const role = await userRepo?.getUserRole(targetUserId);
      await ctx.reply(`👤 Người dùng ${targetUserId} có cấp bậc: ${Role[role ?? Role.USER]}`);
      return;
    }

    if (sub === 'setrole') {
      if (ctx.userRole < Role.OWNER) {
        await ctx.reply('⛔ Chỉ OWNER mới có quyền thay đổi vai trò quản trị.');
        return;
      }
      const roleName = ctx.args[2]?.toUpperCase();
      if (!targetUserId || !roleName || Role[roleName as keyof typeof Role] === undefined) {
        await ctx.reply('⚠️ Cú pháp: !admin setrole <userId> <USER|MODERATOR|ADMIN|OWNER>');
        return;
      }
      const role = Role[roleName as keyof typeof Role] as unknown as Role;
      await userRepo?.setUserRole(targetUserId, role);
      auditRepo?.log({
        userId: ctx.userId,
        action: 'SET_ROLE',
        details: { target: targetUserId, role: roleName },
      });
      await ctx.reply(`✅ Đã cập nhật quyền của ${targetUserId} thành: ${roleName}`);
      return;
    }

    if (sub === 'ban') {
      if (!targetUserId) {
        await ctx.reply('⚠️ Vui lòng cung cấp ID người dùng cần cấm.');
        return;
      }
      await userRepo?.setUserRole(targetUserId, Role.BANNED);
      auditRepo?.log({
        userId: ctx.userId,
        action: 'BAN_USER',
        details: { target: targetUserId, reason: ctx.args.slice(2).join(' ') },
      });
      await ctx.reply(`🚫 Đã cấm người dùng ${targetUserId} khỏi hệ thống.`);
      return;
    }

    if (sub === 'unban') {
      if (!targetUserId) {
        await ctx.reply('⚠️ Vui lòng cung cấp ID người dùng cần hủy cấm.');
        return;
      }
      await userRepo?.setUserRole(targetUserId, Role.USER);
      auditRepo?.log({
        userId: ctx.userId,
        action: 'UNBAN_USER',
        details: { target: targetUserId },
      });
      await ctx.reply(`✅ Đã mở cấm cho người dùng ${targetUserId}.`);
      return;
    }

    if (sub === 'logs') {
      const logs = auditRepo?.getRecent(5) || [];
      if (logs.length === 0) {
        await ctx.reply('📭 Chưa có nhật ký quản trị nào.');
        return;
      }
      const logLines = logs.map(
        (l: any) => `• [${new Date(l.created_at).toLocaleTimeString()}] ${l.action} bởi ${l.user_id || 'system'}`
      );
      await ctx.reply(`📋 NHẬT KÝ QUẢN TRỊ:\n${logLines.join('\n')}`);
      return;
    }

    await ctx.reply(`⚠️ Lệnh phụ không hợp lệ: '${sub}'. Gõ '!admin' để xem hướng dẫn.`);
  },
};
