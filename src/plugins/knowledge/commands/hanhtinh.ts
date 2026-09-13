import { Command, CommandContext } from '../../../core/context.js';

interface PlanetInfo {
  key: string;
  viName: string;
  emoji: string;
  summary: string;
  image: string;
}

const PLANETS: PlanetInfo[] = [
  {
    key: '1',
    viName: 'Mặt Trời',
    emoji: '☀️',
    summary:
      'Ngôi sao ở trung tâm Hệ Mặt Trời, chiếm 99,86% khối lượng toàn hệ. Khoảng cách TB tới Trái Đất 149,6 triệu km (1 AU), ánh sáng mất 8 phút 19 giây để đến Trái Đất. Thành phần: hydro ~74%, heli ~24%. Nhiệt độ bề mặt ~5.500°C, hạng quang phổ G2V.',
    image: 'https://i.imgur.com/g6X1W3x.jpg',
  },
  {
    key: '2',
    viName: 'Trái Đất',
    emoji: '🌎',
    summary:
      'Hành tinh thứ 3 từ Mặt Trời, lớn nhất trong nhóm hành tinh đất đá. 71% bề mặt là đại dương. Hình thành 4,55 tỷ năm trước, sự sống xuất hiện ~1 tỷ năm sau. Là nơi duy nhất được biết có sự sống trong vũ trụ.',
    image: 'https://i.imgur.com/kQoK0oP.png',
  },
  {
    key: '3',
    viName: 'Sao Hỏa',
    emoji: '🔴',
    summary:
      'Hành tinh thứ 4, còn gọi là Hành tinh Đỏ do sắt ôxít trên bề mặt. Có Olympus Mons — núi cao nhất Hệ Mặt Trời, và hẻm núi Valles Marineris. Hai vệ tinh: Phobos và Deimos. Bằng chứng cho thấy từng có nước lỏng rộng lớn.',
    image: 'https://i.imgur.com/8QzXnQp.png',
  },
  {
    key: '4',
    viName: 'Sao Kim',
    emoji: '🌟',
    summary:
      'Hành tinh thứ 2, sáng nhất bầu trời đêm sau Mặt Trăng. Nhiệt độ bề mặt 462°C — nóng nhất Hệ Mặt Trời do hiệu ứng nhà kính mất kiểm soát với khí quyển CO₂ dày, áp suất gấp 92 lần Trái Đất.',
    image: 'https://i.imgur.com/GDEBTl2.jpg',
  },
  {
    key: '5',
    viName: 'Sao Mộc',
    emoji: '🪐',
    summary:
      'Hành tinh thứ 5 và LỚN NHẤT Hệ Mặt Trời — khối lượng gấp 2,5 lần tất cả hành tinh khác cộng lại. Khí khổng lồ với Vết Đỏ Lớn — cơn bão khổng lồ tồn tại từ thế kỷ 17. 95 vệ tinh đã biết.',
    image: 'https://i.imgur.com/dOZwgSd.jpg',
  },
  {
    key: '6',
    viName: 'Sao Thiên Vương',
    emoji: '💠',
    summary:
      'Hành tinh thứ 7, trục quay nghiêng gần 98° — "lăn" trên quỹ đạo. Bầu khí quyển lạnh nhất Hệ Mặt Trời (−224°C). Hành tinh băng khổng lồ với 27 vệ tinh đã biết.',
    image: 'https://i.imgur.com/FNRRTy7.jpg',
  },
  {
    key: '7',
    viName: 'Sao Thổ',
    emoji: '🪐',
    summary:
      'Hành tinh thứ 6, lớn thứ 2. Nổi tiếng với hệ thống vành đai băng ngoạn mục. Khối lượng riêng thấp nhất — nhẹ hơn nước. 82 vệ tinh, lớn nhất là Titan — vệ tinh duy nhất có khí quyển dày.',
    image: 'https://i.imgur.com/kQoK0oP.png',
  },
  {
    key: '8',
    viName: 'Sao Thủy',
    emoji: ' Mercury',
    summary:
      'Hành tinh nhỏ nhất và gần Mặt Trời nhất. Chu kỳ quỹ đạo 88 ngày. Biên độ nhiệt lớn nhất: −173°C ban đêm tới 427°C ban ngày do không có khí quyển đáng kể.',
    image: 'https://i.imgur.com/GDEBTl2.jpg',
  },
  {
    key: '9',
    viName: 'Sao Hải Vương',
    emoji: '🔵',
    summary:
      'Hành tinh thứ 8, xa nhất. Được phát hiện bằng tính toán toán học (1846) trước khi quan sát. Gió mạnh nhất Hệ Mặt Trời: tới 2.100 km/h. 14 vệ tinh, lớn nhất là Triton.',
    image: 'https://i.imgur.com/8QzXnQp.png',
  },
  {
    key: '10',
    viName: 'Mặt Trăng',
    emoji: '🌕',
    summary:
      'Vệ tinh tự nhiên duy nhất của Trái Đất. Đường kính 3.474 km (27% Trái Đất). Khoảng cách TB 384.403 km. Chu kỳ quỹ đạo 27,32 ngày. Trọng lực bề mặt chỉ 17% Trái Đất.',
    image: 'https://i.imgur.com/FNRRTy7.jpg',
  },
];

export const hanhtinhCommand: Command = {
  name: 'hanhtinh',
  aliases: ['planets', 'hetrong'],
  description: 'Tra cứu thông tin các hành tinh trong Hệ Mặt Trời',
  usage: '!hanhtinh [1-10]',
  category: 'knowledge',
  cooldown: 5,
  async execute(ctx: CommandContext): Promise<void> {
    const sel = ctx.args[0];

    if (!sel) {
      const lines = ['== 🪐 CÁC HÀNH TINH 🌌 ==', ''];
      for (const p of PLANETS) {
        lines.push(`${p.key}. ${p.viName}`);
      }
      lines.push('', '👉 Dùng: !hanhtinh <số> để xem chi tiết');
      await ctx.reply(lines.join('\n'));
      return;
    }

    const planet = PLANETS.find((p) => p.key === sel);
    if (!planet) {
      await ctx.reply('⚠️ Lựa chọn không nằm trong danh sách (1-10).');
      return;
    }

    await ctx.reply({
      text: [`${planet.emoji} ${planet.viName.toUpperCase()}`, '', planet.summary].join('\n'),
      attachments: [{ type: 'image', url: planet.image }],
    });
  },
};
