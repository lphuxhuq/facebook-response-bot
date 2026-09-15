import { BotPlugin } from '../plugin.interface.js';
import { dhbcCommand } from './commands/dhbc.js';
import { taixiuCommand } from './commands/taixiu.js';
import { bocthamCommand } from './commands/boctham.js';
import { mineCommand } from './commands/mine.js';
import { taixiuCanvasCommand } from './commands/taixiuc.js';
import { rankCommand } from './commands/rank.js';
import { baucuaCommand } from './commands/baucua.js';
import { altpCommand } from './commands/altp.js';
import { baicaoCommand } from './commands/baicao.js';

export const gamesPlugin: BotPlugin = {
  name: 'games',
  version: '1.1.0',
  description: 'Minigames ported from legacy (dhbc, taixiu, baucua, boctham, mine, taixiu canvas, rank card, altp, baicao)',
  author: 'V2 Team',
  commands: [
    dhbcCommand,
    taixiuCommand,
    baucuaCommand,
    bocthamCommand,
    mineCommand,
    taixiuCanvasCommand,
    rankCommand,
    altpCommand,
    baicaoCommand
  ],
};
