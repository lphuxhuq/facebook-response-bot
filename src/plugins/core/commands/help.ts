import { Command, CommandContext, Role } from '../../../core/context.js';

export const helpCommand: Command = {
  name: 'help',
  aliases: ['menu', 'trogiup'],
  description: 'Hiển thị danh sách lệnh hoặc hướng dẫn chi tiết của một lệnh',
  usage: '!help [tên lệnh]',
  category: 'core',
  cooldown: 2,
  async execute(ctx: CommandContext): Promise<void> {
    const target = ctx.args[0]?.toLowerCase();
    const allCommands: Command[] = ctx.services?.commandRouter?.getAllCommands?.() || [];

    if (target) {
      const found = allCommands.find(
        (c) => c.name.toLowerCase() === target || c.aliases?.map((a) => a.toLowerCase()).includes(target)
      );

      if (!found) {
        await ctx.reply(`❌ Không tìm thấy lệnh: '${target}'. Gõ '!help' để xem danh sách lệnh.`);
        return;
      }

      const roleName = found.requiredRole !== undefined ? Role[found.requiredRole] : 'USER';
      const aliasStr = found.aliases && found.aliases.length > 0 ? found.aliases.join(', ') : 'Không có';

      const info = [
        `📖 Chi tiết lệnh: ${found.name.toUpperCase()}`,
        `────────────────`,
        `📝 Mô tả: ${found.description}`,
        `🏷️ Nhóm: ${found.category}`,
        `💡 Cú pháp: ${found.usage || `!${found.name}`}`,
        `🔀 Viết tắt: ${aliasStr}`,
        `🔐 Cấp bậc: ${roleName}`,
        `⏳ Cooldown: ${found.cooldown || 0}s`,
      ].join('\n');

      await ctx.reply(info);
      return;
    }

    // List all commands grouped by category
    const categories = new Map<string, string[]>();
    for (const cmd of allCommands) {
      const cat = cmd.category || 'other';
      if (!categories.has(cat)) {
        categories.set(cat, []);
      }
      categories.get(cat)!.push(cmd.name);
    }

    const lines = [
      `🤖 FACEBOOK RESPONSE BOT V2`,
      `─────────────────────────`,
      `Danh sách lệnh hiện có:`,
      '',
    ];

    for (const [category, cmdList] of categories.entries()) {
      lines.push(`📁 [${category.toUpperCase()}]: ${cmdList.map((c) => `!${c}`).join(', ')}`);
    }

    lines.push('');
    lines.push(`💡 Gõ '!help <tên lệnh>' để xem hướng dẫn chi tiết.`);
    await ctx.reply(lines.join('\n'));
  },
};
