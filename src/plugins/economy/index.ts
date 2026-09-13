import { BotPlugin } from '../plugin.interface.js';
import { bankCommand } from './commands/bank.js';
import { dailyCommand } from './commands/daily.js';
import { lixiCommand } from './commands/lixi.js';
import { casinoCommand } from './commands/casino.js';

export const economyPlugin: BotPlugin = {
  name: 'economy',
  version: '2.0.0',
  description: 'Economy: banking, daily streak, lixi, casino games (taixiu, slot, kbb)',
  author: 'V2 Team',
  commands: [bankCommand, dailyCommand, lixiCommand, casinoCommand],
};
