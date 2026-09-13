import { BotPlugin } from '../plugin.interface.js';
import { bankCommand } from './commands/bank.js';

export const economyPlugin: BotPlugin = {
  name: 'economy',
  version: '2.0.0',
  description: 'Economy, banking and work reward system',
  author: 'V2 Team',
  commands: [bankCommand],
};
