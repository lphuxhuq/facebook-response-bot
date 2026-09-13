import { BotPlugin } from '../plugin.interface.js';
import { adminCommand } from './commands/admin.js';

export const adminPlugin: BotPlugin = {
  name: 'admin',
  version: '2.0.0',
  description: 'Administration and moderation tools',
  author: 'V2 Team',
  commands: [adminCommand],
};
