import { BotPlugin } from '../plugin.interface.js';
import { dhbcCommand } from './commands/dhbc.js';
import { taixiuCommand } from './commands/taixiu.js';
import { bocthamCommand } from './commands/boctham.js';
import { mineCommand } from './commands/mine.js';
import { taixiuCanvasCommand } from './commands/taixiuc.js';
import { rankCommand } from './commands/rank.js';

export const gamesPlugin: BotPlugin = {
  name: 'games',
  version: '1.0.0',
  description: 'Minigames ported from legacy (dhbc, taixiu, boctham, mine, taixiu canvas, rank card)',
  author: 'V2 Team',
  commands: [dhbcCommand, taixiuCommand, bocthamCommand, mineCommand, taixiuCanvasCommand, rankCommand],
};
