import { Command, CommandContext } from '../../../core/context.js';

export const bankCommand: Command = {
  name: 'bank',
  aliases: ['money', 'coins', 'work', 'daily'],
  description: 'Hệ thống tài chính, ngân hàng và làm việc kiếm tiền',
  usage: '!bank [bal|work|daily|pay <userId> <amount>]',
  category: 'economy',
  cooldown: 2,
  async execute(ctx: CommandContext): Promise<void> {
    const userRepo = ctx.repositories?.user;
    if (!userRepo) {
      await ctx.reply('⚠️ Cơ sở dữ liệu kinh tế chưa sẵn sàng.');
      return;
    }

    const sub = ctx.args[0]?.toLowerCase();

    if (!sub || sub === 'bal' || sub === 'balance') {
      const user = await userRepo.getOrCreate(ctx.userId);
      await ctx.reply(`💳 TÀI KHOẢN NGÂN HÀNG:\n👤 Chủ tài khoản: ${ctx.userId}\n💰 Số dư hiện tại: ${user.balance.toLocaleString('vi-VN')} coins`);
      return;
    }

    if (sub === 'daily') {
      const reward = 5000;
      const newBal = await userRepo.updateBalance(ctx.userId, reward);
      await ctx.reply(`🎁 Điểm danh hằng ngày thành công!\nBạn nhận được: +${reward.toLocaleString('vi-VN')} coins.\n💰 Số dư mới: ${newBal.toLocaleString('vi-VN')} coins.`);
      return;
    }

    if (sub === 'work') {
      const jobs = [
        'lập trình viên bot Facebook',
        'shipper công nghệ',
        'pha chế cà phê Highlands',
        'kỹ sư DevOps',
        'người kiểm thử phần mềm',
      ];
      const job = jobs[Math.floor(Math.random() * jobs.length)];
      const reward = Math.floor(Math.random() * 3000) + 1000;

      const newBal = await userRepo.updateBalance(ctx.userId, reward);
      await ctx.reply(`💼 Bạn đã làm công việc: ${job} và kiếm được +${reward.toLocaleString('vi-VN')} coins!\n💰 Số dư mới: ${newBal.toLocaleString('vi-VN')} coins.`);
      return;
    }

    if (sub === 'pay') {
      const targetUserId = ctx.args[1];
      const amountStr = ctx.args[2];
      const amount = parseInt(amountStr, 10);

      if (!targetUserId || isNaN(amount) || amount <= 0) {
        await ctx.reply('⚠️ Cú pháp: !bank pay <ID_người_nhận> <số_tiền>');
        return;
      }

      if (targetUserId === ctx.userId) {
        await ctx.reply('⚠️ Bạn không thể tự chuyển tiền cho chính mình.');
        return;
      }

      const senderBal = await userRepo.getBalance(ctx.userId);
      if (senderBal < amount) {
        await ctx.reply(`⚠️ Số dư của bạn không đủ (${senderBal.toLocaleString('vi-VN')} coins) để chuyển ${amount.toLocaleString('vi-VN')} coins.`);
        return;
      }

      await userRepo.updateBalance(ctx.userId, -amount);
      const receiverBal = await userRepo.updateBalance(targetUserId, amount);

      await ctx.reply(`💸 Chuyển khoản thành công ${amount.toLocaleString('vi-VN')} coins đến người dùng ${targetUserId}!\n💰 Số dư còn lại của bạn: ${(senderBal - amount).toLocaleString('vi-VN')} coins.`);
      return;
    }

    await ctx.reply(`⚠️ Lệnh ngân hàng không hợp lệ: '${sub}'. Cú pháp: !bank [bal|work|daily|pay]`);
  },
};
