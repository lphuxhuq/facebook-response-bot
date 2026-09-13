import { Command } from '../core/context.js';
import { EventHandler } from '../core/event-router.js';
import { BotCore } from '../core/bot.js';

export interface PluginContext {
  botCore: BotCore;
  services: any;
  repositories: any;
}

export interface BotPlugin {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly author?: string;

  enabled?: boolean;
  commands?: Command[];
  events?: Array<{ name: string; handler: EventHandler }>;

  initialize?(ctx: PluginContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}
