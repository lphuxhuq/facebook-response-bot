import { MessageContext } from './context.js';
import { logger } from '../utils/logger.js';

export type EventHandler = (ctx: MessageContext) => Promise<boolean | void>;

export class EventRouter {
  private handlers: Array<{ name: string; handler: EventHandler }> = [];

  register(name: string, handler: EventHandler): void {
    this.handlers.push({ name, handler });
  }

  async handleEvent(ctx: MessageContext): Promise<boolean> {
    for (const { name, handler } of this.handlers) {
      try {
        const handled = await handler(ctx);
        if (handled === true) {
          return true;
        }
      } catch (err) {
        logger.error({ err, handlerName: name }, 'Error in event handler');
      }
    }
    return false;
  }
}
