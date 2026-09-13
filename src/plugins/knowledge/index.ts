import { BotPlugin } from '../plugin.interface.js';
import { hanhtinhCommand } from './commands/hanhtinh.js';
import { cadaoCommand, danhngonCommand, truyencuoiCommand, chuctetCommand } from './commands/text.js';
import { wikiCommand, lyricsCommand } from './commands/wiki-lyrics.js';

export const knowledgePlugin: BotPlugin = {
  name: 'knowledge',
  version: '1.0.0',
  description: 'Knowledge & fun text content (cadao, danhngon, jokes, wiki, lyrics, planets) - ported from legacy',
  author: 'V2 Team',
  commands: [hanhtinhCommand, cadaoCommand, danhngonCommand, truyencuoiCommand, chuctetCommand, wikiCommand, lyricsCommand],
};
