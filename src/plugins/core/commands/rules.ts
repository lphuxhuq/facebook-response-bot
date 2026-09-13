import { Command, CommandContext } from '../../../core/context.js';

export const rulesCommand: Command = {
  name: 'rules',
  aliases: ['luat', 'quydinh'],
  description: 'Hiển thị quy định sử dụng bot',
  usage: '!rules',
  category: 'core',
  cooldown: 5,
  async execute(ctx: CommandContext): Promise<void> {
    const rules = [
      `📜 QUY ĐỊNH SỬ DỤNG BOT`,
      `──────────────────────`,
      `1. Không spam lệnh liên tục gây quá tải hệ thống.`,
      `2. Nghiêm cấm sử dụng các từ ngữ vi phạm tiêu chuẩn cộng đồng hoặc đe dọa.`,
      `3. Không khai thác lỗi bot; vui lòng báo lỗi cho Admin để khắc phục.`,
      `4. Tài khoản vi phạm có thể bị cấm (BANNED) vĩnh viễn khỏi toàn bộ chức năng.`,
      `──────────────────────`,
      `Chúc bạn có trải nghiệm vui vẻ! ✨`,
    ].join('\n');

    await ctx.reply(rules);
  },
};
