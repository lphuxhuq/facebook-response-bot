import { BotPlugin } from '../plugin.interface.js';
import { pingCommand } from './commands/ping.js';
import { helpCommand } from './commands/help.js';
import { uptimeCommand } from './commands/uptime.js';
import { rulesCommand } from './commands/rules.js';

export const corePlugin: BotPlugin = {
  name: 'core',
  version: '2.0.0',
  description: 'Core system commands (ping, help, uptime, rules)',
  author: 'V2 Team',
  commands: [pingCommand, helpCommand, uptimeCommand, rulesCommand],
};
