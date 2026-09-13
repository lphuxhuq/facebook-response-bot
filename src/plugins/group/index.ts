import { BotPlugin } from '../plugin.interface.js';
import { groupInfoCommand } from './commands/groupinfo.js';
import { groupSettingsCommand } from './commands/settings.js';

export const groupPlugin: BotPlugin = {
  name: 'group',
  version: '2.0.0',
  description: 'Group chat engine with thread settings, info and moderation',
  author: 'V2 Team',
  commands: [groupInfoCommand, groupSettingsCommand],
};
