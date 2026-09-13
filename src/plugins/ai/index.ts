import { BotPlugin } from '../plugin.interface.js';
import { aiCommand } from './commands/ai.js';

export const aiPlugin: BotPlugin = {
  name: 'ai',
  version: '2.0.0',
  description: 'AI conversational assistant plugin',
  author: 'V2 Team',
  commands: [aiCommand],
};
