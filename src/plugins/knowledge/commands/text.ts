import { Command, CommandContext } from '../../../core/context.js';
import { pickRandom, fmt } from '../../shared/data-store.js';

const CADAO_LIST = [
  'Bầu ơi thương lấy bí cùng\nTuy rằng khác giống nhưng chung một giàn.',
  'Nhiễu điều phủ lấy giá gương\nNgười trong một nước phải thương nhau cùng.',
  'Công cha như núi Thái Sơn\nNghĩa mẹ như nước trong nguồn chảy ra.',
  'Một cây làm chẳng nên non\nBa cây chụm lại nên hòn núi cao.',
  'Ăn quả nhớ kẻ trồng cây\nĂn khoai nhớ kẻ cho dây mà trồng.',
  'Chim khôn kêu tiếng rảnh rang\nNgười khôn nói tiếng dịu dàng dễ nghe.',
  'Lời nói chẳng mất tiền mua\nLựa lời mà nói cho vừa lòng nhau.',
  'Uống nước nhớ nguồn\nĂn quả nhớ kẻ trồng cây.',
  'Gần mực thì đen, gần đèn thì rạng.',
  'Có công mài sắt, có ngày nên kim.',
];

const DANHNGON_LIST = [
  'Thuốc đắng dã tật, sự thật mất lòng.',
  'Một lời nói dối, sám hối bảy ngày.',
  'Nói ngọt lọt đến xương.',
  'Miếng ngon nhớ lâu, lời đau nhớ đời.',
  'Lưỡi sắc hơn gươm.',
  'Lưỡi không xương, nhiều đường lắt léo.',
  'Sẩy chân còn hơn sẩy miệng.',
  'Tiếng lành đồn xa, tiếng dữ đồn xa.',
  'Một người thì kín, hai người thì hở.',
  'Nói thì dễ, làm thì khó.',
  'Tre non dễ uốn.',
  'Bé chẳng vin, cả gãy cành.',
  'Yêu cho vọt, ghét cho chơi.',
  'Học ăn học nói, học gói học mở.',
  'Dốt đến đâu, học lâu cũng biết.',
  'Không thầy đố mày làm nên.',
  'Ở sao cho vừa lòng người\nỞ rộng người cười, ở hẹp người chê.',
  'Ai ơi chớ vội cười nhau\nCây nào mà chẳng có sâu chạm cành.',
];

const JOKES = [
  'Thầy giáo hỏi Tèo:\n- Nếu có 5 cái kẹo, em chia cho bạn 2 cái, em còn mấy cái?\nTèo đáp:\n- Dạ còn nguyên 5 cái ạ vì em không thích chia!',
  'Bác sĩ nói với bệnh nhân:\n- Bệnh của anh cần phải đi biển nghỉ dưỡng ngắm sóng thì mới khỏi.\nBệnh nhân ngập ngừng:\n- Nhưng thưa bác sĩ, tôi làm nghề gác hải đăng 20 năm nay rồi ạ!',
  'Một anh chàng đi thi lái xe:\n- Giám thị hỏi: Nếu đằng trước có một người già và một đứa trẻ, anh đâm vào ai?\n- Anh chàng: Dạ đâm vào đứa trẻ ạ.\n- Giám thị: Sai! Anh phải đạp phanh chứ đâm vào ai!',
  'Vợ hỏi chồng:\n- Anh thấy em hôm nay có gì khác không?\nChồng toát mồ hôi suy nghĩ rồi đáp:\n- Em... em vừa thở ra đúng không?',
  'Sếp: Em giải thích xem tại sao lại đi làm trễ 3 tiếng?\nNhân viên: Dạ vì mưa to quá ạ.\nSếp: Thế trước đây không mưa sao em cũng trễ?\nNhân viên: Dạ vì em không có cớ ạ!',
];

export const cadaoCommand: Command = {
  name: 'cadao',
  aliases: ['tucngu'],
  description: 'Những câu ca dao, tục ngữ Việt Nam ngẫu nhiên',
  usage: '!cadao',
  category: 'knowledge',
  cooldown: 3,
  async execute(ctx: CommandContext): Promise<void> {
    const poem = pickRandom(CADAO_LIST);
    const now = new Date();
    const time = now.toLocaleTimeString('vi-VN') + ' || ' + now.toLocaleDateString('vi-VN');
    await ctx.reply(`💌 === CA DAO VIỆT NAM === 💌\n\n${poem}\n\n🏮 ${time}`);
  },
};

export const danhngonCommand: Command = {
  name: 'danhngon',
  aliases: ['sayings'],
  description: 'Trích dẫn danh ngôn ngẫu nhiên',
  usage: '!danhngon',
  category: 'knowledge',
  cooldown: 3,
  async execute(ctx: CommandContext): Promise<void> {
    const quote = pickRandom(DANHNGON_LIST);
    await ctx.reply(`💬 === DANH NGÔN === 💬\n\n"${quote}"`);
  },
};

export const truyencuoiCommand: Command = {
  name: 'truyencuoi',
  aliases: ['joke', 'cuoi'],
  description: 'Kể chuyện cười giải trí ngẫu nhiên',
  usage: '!truyencuoi',
  category: 'knowledge',
  cooldown: 3,
  async execute(ctx: CommandContext): Promise<void> {
    const joke = pickRandom(JOKES);
    await ctx.reply(`🤣 [ CHUYỆN CƯỜI HÔM NAY ] 🤣\n━━━━━━━━━━━━━━━━━\n${joke}`);
  },
};

const TET_WISHES = [
  '🌸🌸🌸 năm mới tết đến\n💸💸💸 tiền đầy túi\n❤❤❤ tim đầy tình\n⛽⛽⛽ xăng đầy bình\n🍚🍚🍚 gạo đầy lu\n💰💰💰 vàng bạc đầy tử\n👮🏻👮🏻👮🏻 sức khỏe đầy đủ\n🎉🎉🎉 chúc mừng năm mới!',
  '💖 Chúc bạn một Năm Mới…💖\n💖 Ấm áp bên cạnh nửa trái tim…💖\n💖 Vui vẻ bên cạnh nửa còn lại trọn vẹn…💖\n💖 Hạnh phúc bên cạnh một bờ vai ai đó…💖\n💖 An Khang – Thịnh Vượng!',
];

const TET_IMAGES = [
  'https://i.imgur.com/ScNfipI.jpg',
  'https://i.imgur.com/gqsPMnJ.jpg',
  'https://i.imgur.com/30ll2w8.jpg',
  'https://i.imgur.com/fn24mug.jpg',
];

export const chuctetCommand: Command = {
  name: 'chuctet',
  aliases: ['happynewyear', 'tet'],
  description: 'Gửi lời chúc năm mới kèm ảnh thiệp',
  usage: '!chuctet',
  category: 'knowledge',
  cooldown: 5,
  async execute(ctx: CommandContext): Promise<void> {
    const wish = pickRandom(TET_WISHES);
    const img = pickRandom(TET_IMAGES);
    await ctx.reply({
      text: wish + `\n\n🎉 ${fmt(Date.now() % 2026)} 🎉`,
      attachments: [{ type: 'image', url: img }],
    });
  },
};
