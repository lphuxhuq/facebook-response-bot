import { Command, CommandContext } from '../../../core/context.js';

const WIKI_API = 'https://{lang}.wikipedia.org/api/rest_v1/page/summary/{title}';

async function fetchWikiSummary(lang: string, title: string): Promise<string | null> {
  const url = WIKI_API.replace('{lang}', lang).replace('{title}', encodeURIComponent(title.replace(/\s+/g, '_')));
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FacebookResponseBotV2/2.0 (educational bot)' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    if (!data || data.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') return null;
    const parts = [data.title ? `📖 ${data.title}:` : '', data.extract].filter(Boolean);
    if (data.content_urls?.desktop?.page) {
      parts.push('', `🔗 ${data.content_urls.desktop.page}`);
    }
    return parts.join('\n');
  } catch {
    return null;
  }
}

export const wikiCommand: Command = {
  name: 'wiki',
  aliases: ['wikipedia'],
  description: 'Tra cứu thông tin trên Wikipedia (vi/en)',
  usage: '!wiki [en] <từ khóa>',
  category: 'knowledge',
  cooldown: 5,
  async execute(ctx: CommandContext): Promise<void> {
    let lang = 'vi';
    let content = ctx.rawArgs.trim();

    if (ctx.args[0]?.toLowerCase() === 'en') {
      lang = 'en';
      content = ctx.args.slice(1).join(' ');
    }

    if (!content) {
      await ctx.reply('⚠️ Vui lòng nhập nội dung cần tìm kiếm. VD: !wiki Hà Nội hoặc !wiki en Hanoi');
      return;
    }

    const result = await fetchWikiSummary(lang, content);
    if (!result) {
      await ctx.reply(`⚠️ Không tìm thấy nội dung "${content}" trên Wikipedia ${lang.toUpperCase()}.`);
      return;
    }
    await ctx.reply(result);
  },
};

const LYRICS_APIS = [
  'https://api.lyrics.ovh/v1/{artist}/{title}',
];

export const lyricsCommand: Command = {
  name: 'loibaihat',
  aliases: ['lyrics', 'lyric'],
  description: 'Tìm lời bài hát theo tên ca sĩ và bài hát',
  usage: '!loibaihat <ca sĩ>;<tên bài>',
  category: 'knowledge',
  cooldown: 5,
  async execute(ctx: CommandContext): Promise<void> {
    const raw = ctx.rawArgs.trim();
    if (!raw) {
      await ctx.reply('⚠️ Cú pháp: !loibaihat <ca sĩ>;<tên bài hát>\nVD: !loibaihat Sơn Tùng M-TP;Nơi này có anh');
      return;
    }

    const [artistPart, ...titleParts] = raw.split(';');
    const artist = (artistPart || '').trim();
    const title = titleParts.join(';').trim();

    if (!artist || !title) {
      await ctx.reply('⚠️ Cần cả ca sĩ và tên bài, phân cách bằng dấu ";".');
      return;
    }

    const url = LYRICS_APIS[0]
      .replace('{artist}', encodeURIComponent(artist))
      .replace('{title}', encodeURIComponent(title));

    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'FacebookResponseBotV2/2.0' } });
      if (!res.ok) {
        await ctx.reply(`⚠️ Không tìm thấy lời bài hát "${title}" của ${artist}.`);
        return;
      }
      const data = (await res.json()) as any;
      const lyrics = data?.lyrics;
      if (!lyrics) {
        await ctx.reply('⚠️ Không có dữ liệu lời bài hát.');
        return;
      }
      const trimmed = lyrics.length > 1800 ? lyrics.slice(0, 1800) + '\n...' : lyrics;
      await ctx.reply(`🎵 ${title} — ${artist}\n━━━━━━━━━━━━━━━━━\n${trimmed}`);
    } catch {
      await ctx.reply('⚠️ Lỗi khi truy vấn lời bài hát. Vui lòng thử lại sau.');
    }
  },
};
