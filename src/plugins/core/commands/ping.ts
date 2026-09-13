import { Command, CommandContext } from '../../../core/context.js';

export const pingCommand: Command = {
  name: 'ping',
  aliases: ['p', 'pong'],
  description: 'Kiểm tra độ trễ phản hồi của bot',
  usage: '!ping',
  category: 'core',
  cooldown: 3,
  async execute(ctx: CommandContext): Promise<void> {
    const start = Date.now();
    await ctx.reply('🏓 Pong! Đang đo độ trễ...');
    const latency = Date.now() - start;
    await ctx.reply(`⚡ Độ trễ phản hồi: ${latency}ms\n⏱️ Server time: ${new Date().toISOString()}`);
  },
};
