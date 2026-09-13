import { BotPlugin, PluginContext } from './plugin.interface.js';
import { BotCore } from '../core/bot.js';
import { logger } from '../utils/logger.js';

export class PluginLoader {
  private plugins = new Map<string, BotPlugin>();

  constructor(
    private botCore: BotCore,
    private services: any,
    private repositories: any
  ) {}

  async registerPlugin(plugin: BotPlugin): Promise<boolean> {
    const name = plugin.name.toLowerCase();

    if (this.plugins.has(name)) {
      logger.warn({ plugin: name }, 'Plugin already loaded, skipping registration');
      return false;
    }

    const pluginCtx: PluginContext = {
      botCore: this.botCore,
      services: this.services,
      repositories: this.repositories,
    };

    try {
      if (plugin.initialize) {
        await plugin.initialize(pluginCtx);
      }

      // Register commands
      if (plugin.commands) {
        for (const cmd of plugin.commands) {
          this.botCore.commandRouter.register(cmd);
        }
      }

      // Register events
      if (plugin.events) {
        for (const evt of plugin.events) {
          this.botCore.eventRouter.register(evt.name, evt.handler);
        }
      }

      this.plugins.set(name, plugin);
      logger.info({ plugin: plugin.name, version: plugin.version }, 'Plugin registered successfully');
      return true;
    } catch (err) {
      logger.error({ err, plugin: plugin.name }, 'Failed to initialize plugin');
      return false;
    }
  }

  async unloadPlugin(name: string): Promise<boolean> {
    const key = name.toLowerCase();
    const plugin = this.plugins.get(key);
    if (!plugin) return false;

    // Unregister commands
    if (plugin.commands) {
      for (const cmd of plugin.commands) {
        this.botCore.commandRouter.unregister(cmd.name);
      }
    }

    // Call destroy hook
    if (plugin.destroy) {
      try {
        await plugin.destroy();
      } catch (err) {
        logger.error({ err, plugin: name }, 'Error destroying plugin');
      }
    }

    this.plugins.delete(key);
    logger.info({ plugin: name }, 'Plugin unloaded');
    return true;
  }

  getLoadedPlugins(): BotPlugin[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(name: string): BotPlugin | undefined {
    return this.plugins.get(name.toLowerCase());
  }
}
