import { Command, CommandContext } from '../../../core/context.js';

const quotes = [
  'Hôm nay trời nắng đẹp, liệu lòng người có nở hoa?',
  'Con tằm đến thác vẫn còn vương tơ, người còn sống vẫn còn yêu đời.',
  'Trăm năm trong cõi người ta, chữ tài chữ mệnh khéo là ghét nhau.',
  'Có công mài sắt, có ngày nên kim.',
  'Code không bug như trà sữa không trân châu: thiếu đi hương vị cuộc đời!',
  'Đừng đi tìm hạnh phúc ở nơi xa xôi, nó nằm ngay trong từng dòng commit sạch sẽ.',
  'Thành công không phải là chìa khóa mở cửa hạnh phúc. Hạnh phúc mới là chìa khóa dẫn đến thành công.',
];

export const quoteCommand: Command = {
  name: 'quote',
  aliases: ['cadao', 'thathinh', 'chamsang'],
  description: 'Nhận một câu trích dẫn hoặc ca dao ngẫu nhiên',
  usage: '!quote',
  category: 'utility',
  cooldown: 2,
  async execute(ctx: CommandContext): Promise<void> {
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    await ctx.reply(`📜 DANH NGÔN / CA DAO:\n"${q}"`);
  },
};
