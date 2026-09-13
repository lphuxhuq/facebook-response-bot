import { Command, CommandContext } from '../../../core/context.js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MEDIA_CACHE_PATH = join(__dirname, '..', '..', 'shared', 'assets', 'media_links.json');

const FALLBACK_LINKS = [
  'https://i.imgur.com/FNRRTy7.jpg',
  'https://i.imgur.com/GDEBTl2.jpg',
  'https://i.imgur.com/dOZwgSd.jpg',
];

function loadMediaLinks(): string[] {
  try {
    if (!existsSync(MEDIA_CACHE_PATH)) return FALLBACK_LINKS;
    const raw = JSON.parse(readFileSync(MEDIA_CACHE_PATH, 'utf8'));
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return FALLBACK_LINKS;
  } catch {
    return FALLBACK_LINKS;
  }
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const CATEGORIES = [
  { key: '1', label: 'Gái xinh', query: 'girl' },
  { key: '2', label: 'Trai đẹp', query: 'boy' },
  { key: '3', label: 'Anime / Wibu', query: 'anime' },
  { key: '4', label: 'Cosplay', query: 'cosplay' },
];

export const mediaCommand: Command = {
  name: 'media',
  aliases: ['anh', 'girl', 'boy', 'cosplay', 'anime', 'wibu', 'gaixinh', 'traidep'],
  description: 'Xem ảnh ngẫu nhiên từ thư viện media offline (4.119 ảnh Imgur/Catbox vĩnh viễn)',
  usage: '!media [1-4]',
  category: 'media',
  cooldown: 3,
  async execute(ctx: CommandContext): Promise<void> {
    const links = loadMediaLinks();

    const selection = ctx.args[0];
    if (!selection) {
      const menu = [
        '🎭 DANH SÁCH ẢNH HIỆN CÓ:',
        '',
        ...CATEGORIES.map((c) => `${c.key}. ${c.label}`),
        '',
        `📸 Thư viện: ${links.length.toLocaleString('vi-VN')} ảnh`,
        '👉 Dùng: !media <số> (hoặc !girl, !boy, !cosplay, !anime)',
      ].join('\n');
      await ctx.reply(menu);
      return;
    }

    const category = CATEGORIES.find((c) => c.key === selection || c.query === selection.toLowerCase());
    if (!category) {
      await ctx.reply(`⚠️ Không có danh mục '${selection}'. Dùng !media để xem menu.`);
      return;
    }

    const imgUrl = pickRandom(links);
    const ext = imgUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const type = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext) ? 'image' : 'image';

    await ctx.reply({
      text: `📸 Ảnh ${category.label} của bạn đây! Chúc bạn xem ảnh vui vẻ ✨\n(nguồn: ${imgUrl})`,
      attachments: [{ type: type as 'image', url: imgUrl }],
    });
  },
};
