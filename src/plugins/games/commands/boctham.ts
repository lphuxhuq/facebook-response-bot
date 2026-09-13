import { Command, CommandContext } from '../../../core/context.js';

const CHALLENGES = [
  'Nhắn vs Ny là I love you 3000 :3',
  'Thách đú trend vs 1 người bạn quen qua face',
  'Để Avt đôi với 1 người lạ',
  'Nhắn Tin Yêu Với 1 người bất kỳ',
  'Tỏ tình cr hoặc 1 ng bất kỳ',
  'Nói 1 sự thật',
  'Show ảnh của 1 người bạn đẹp nhất',
  'Cà khịa 1 đứa trong group',
  'Bốc phốt 1 đứa trong group',
  'Hãy nói ra 1 câu nói khiến bạn buồn nhất',
  'Điều bây giờ bạn muốn nhất là gì',
  'Hãy kể 1 lần chơi ngu của em 😏',
  'Bạn thấy trong group này ai xinh nhất',
  'Bạn giỏi môn gì nhất',
  'Hãy tạo 1 câu thơ tỏ tình cả group 💁‍♂️',
  'Kể 1 việc bạn từng làm khiến mọi người kinh ngạc :c',
  'Thứ khiến bạn vui nhất là gì',
  'Hãy nói xấu 1 đứa bạn (nhẹ nhàng thôi nha)',
];

export const bocthamCommand: Command = {
  name: 'boctham',
  aliases: ['thuthach', 'challenge'],
  description: 'Bốc thăm thử thách ngẫu nhiên vui nhộn cho nhóm chat',
  usage: '!boctham',
  category: 'games',
  cooldown: 3,
  async execute(ctx: CommandContext): Promise<void> {
    const challenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
    const userName = (await ctx.getUser?.())?.name || ctx.userId;

    await ctx.reply(
      [
        `🎯 THỬ THÁCH CỦA: ${userName}`,
        '',
        `👉 ${challenge}`,
        '',
        '[ ! ] Hãy làm theo trước khi bốc lại nhé!',
      ].join('\n')
    );
  },
};
