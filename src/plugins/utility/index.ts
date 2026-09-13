import { BotPlugin } from '../plugin.interface.js';
import { translateCommand } from './commands/translate.js';
import { weatherCommand } from './commands/weather.js';
import { calcCommand } from './commands/calc.js';
import { quoteCommand } from './commands/quote.js';

export const utilityPlugin: BotPlugin = {
  name: 'utility',
  version: '2.0.0',
  description: 'Utility tools (translate, weather, calculator, quote)',
  author: 'V2 Team',
  commands: [translateCommand, weatherCommand, calcCommand, quoteCommand],
};
