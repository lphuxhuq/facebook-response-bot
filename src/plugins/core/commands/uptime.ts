import os from 'os';
import { Command, CommandContext } from '../../../core/context.js';

export const uptimeCommand: Command = {
  name: 'uptime',
  aliases: ['botinfo', 'info', 'system'],
  description: 'Hiển thị thời gian hoạt động và thông số hệ thống của bot',
  usage: '!uptime',
  category: 'core',
  cooldown: 5,
  async execute(ctx: CommandContext): Promise<void> {
    const uptimeSec = Math.floor(process.uptime());
    const days = Math.floor(uptimeSec / 86400);
    const hours = Math.floor((uptimeSec % 86400) / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    const seconds = uptimeSec % 60;

    const mem = process.memoryUsage();
    const rssMb = (mem.rss / 1024 / 1024).toFixed(1);
    const heapUsedMb = (mem.heapUsed / 1024 / 1024).toFixed(1);

    const message = [
      `📊 HỆ THỐNG BOT V2`,
      `─────────────────`,
      `⏱️ Uptime: ${days}d ${hours}h ${minutes}m ${seconds}s`,
      `🧠 RAM (Heap): ${heapUsedMb} MB / RSS: ${rssMb} MB`,
      `💻 Nền tảng: ${os.type()} ${os.release()} (${os.arch()})`,
      `🟢 Node.js: ${process.version}`,
      `⚡ Status: Sẵn sàng & Ổn định`,
    ].join('\n');

    await ctx.reply(message);
  },
};
