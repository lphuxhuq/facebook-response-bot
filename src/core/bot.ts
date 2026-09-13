import { CommandRouter } from './command-router.js';
import { EventRouter } from './event-router.js';
import { PermissionManager, InMemoryPermissionProvider } from './permission-manager.js';
import { CooldownManager } from './cooldown-manager.js';
import { SessionManager } from './session-manager.js';
import { Scheduler } from './scheduler.js';
import { MessageContext } from './context.js';
import { logger } from '../utils/logger.js';

export interface BotCoreConfig {
  prefix: string;
  ownerId: string;
  services?: any;
  repositories?: any;
}

export class BotCore {
  public readonly commandRouter: CommandRouter;
  public readonly eventRouter: EventRouter;
  public readonly permissionManager: PermissionManager;
  public readonly cooldownManager: CooldownManager;
  public readonly sessionManager: SessionManager;
  public readonly scheduler: Scheduler;

  constructor(config: BotCoreConfig) {
    this.permissionManager = new PermissionManager(new InMemoryPermissionProvider(config.ownerId));
    this.cooldownManager = new CooldownManager();
    this.sessionManager = new SessionManager();
    this.eventRouter = new EventRouter();
    this.scheduler = new Scheduler();

    this.commandRouter = new CommandRouter({
      prefix: config.prefix,
      permissionManager: this.permissionManager,
      cooldownManager: this.cooldownManager,
      sessionManager: this.sessionManager,
      services: config.services,
      repositories: config.repositories,
    });
  }

  async processMessage(ctx: MessageContext): Promise<boolean> {
    logger.debug(
      {
        platform: ctx.platform,
        userId: ctx.userId,
        conversationId: ctx.conversationId,
        text: ctx.text,
      },
      'Processing incoming normalized message'
    );

    // 1. Try command router (including active multi-step session)
    const commandHandled = await this.commandRouter.handleMessage(ctx);
    if (commandHandled) {
      return true;
    }

    // 2. Try event router
    return this.eventRouter.handleEvent(ctx);
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down BotCore components...');
    this.scheduler.stopAll();
    this.sessionManager.destroy();
  }
}
