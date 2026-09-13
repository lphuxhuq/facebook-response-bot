import { BotPlugin } from '../plugin.interface.js';
import { quizCommand } from './commands/quiz.js';
import { diceCommand } from './commands/dice.js';

export const entertainmentPlugin: BotPlugin = {
  name: 'entertainment',
  version: '2.0.0',
  description: 'Games and interactive entertainment (quiz, dice, coinflip)',
  author: 'V2 Team',
  commands: [quizCommand, diceCommand],
};
