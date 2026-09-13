import { BotPlugin } from '../plugin.interface.js';
import { mediaCommand } from './commands/media.js';

export const mediaPlugin: BotPlugin = {
  name: 'media',
  version: '1.0.0',
  description: 'Random media library from permanent Imgur/Catbox links (ported from legacy)',
  author: 'V2 Team',
  commands: [mediaCommand],
};
