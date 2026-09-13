import { describe, it, expect, vi } from 'vitest';
import { PluginLoader } from '../../src/plugins/plugin-loader.js';
import { BotCore } from '../../src/core/bot.js';
import { BotPlugin } from '../../src/plugins/plugin.interface.js';

describe('PluginLoader', () => {
  it('should register plugin commands and initialize hooks safely', async () => {
    const botCore = new BotCore({ prefix: '!', ownerId: 'owner1' });
    const loader = new PluginLoader(botCore, {}, {});

    const initMock = vi.fn();
    const testPlugin: BotPlugin = {
      name: 'test-plugin',
      version: '1.0.0',
      description: 'Test plugin',
      initialize: initMock,
      commands: [
        {
          name: 'plugincmd',
          description: 'A plugin command',
          category: 'test',
          execute: vi.fn(),
        },
      ],
    };

    const ok = await loader.registerPlugin(testPlugin);
    expect(ok).toBe(true);
    expect(initMock).toHaveBeenCalledTimes(1);
    expect(botCore.commandRouter.getCommand('plugincmd')).toBeDefined();

    botCore.shutdown();
  });

  it('should not crash bot when a plugin initialization fails', async () => {
    const botCore = new BotCore({ prefix: '!', ownerId: 'owner1' });
    const loader = new PluginLoader(botCore, {}, {});

    const buggyPlugin: BotPlugin = {
      name: 'buggy-plugin',
      version: '1.0.0',
      description: 'Throws error on init',
      initialize: () => {
        throw new Error('Explosive initialization');
      },
    };

    const ok = await loader.registerPlugin(buggyPlugin);
    expect(ok).toBe(false);
    expect(loader.getLoadedPlugins().length).toBe(0);

    botCore.shutdown();
  });

  it('should unload plugin and unregister its commands', async () => {
    const botCore = new BotCore({ prefix: '!', ownerId: 'owner1' });
    const loader = new PluginLoader(botCore, {}, {});

    const destroyMock = vi.fn();
    const testPlugin: BotPlugin = {
      name: 'removable-plugin',
      version: '1.0.0',
      description: 'Removable',
      destroy: destroyMock,
      commands: [
        {
          name: 'remcmd',
          description: 'test',
          category: 'test',
          execute: vi.fn(),
        },
      ],
    };

    await loader.registerPlugin(testPlugin);
    expect(botCore.commandRouter.getCommand('remcmd')).toBeDefined();

    const unloaded = await loader.unloadPlugin('removable-plugin');
    expect(unloaded).toBe(true);
    expect(destroyMock).toHaveBeenCalledTimes(1);
    expect(botCore.commandRouter.getCommand('remcmd')).toBeUndefined();

    botCore.shutdown();
  });
});
