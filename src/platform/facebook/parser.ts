import { Attachment, MessageContext, OutgoingMessage, SendResult } from '../../core/context.js';
import { WebhookMessagingEvent, WebhookPayload } from './types.js';
import { FacebookSender } from './sender.js';
import { logger } from '../../utils/logger.js';

export class MessageDeduplicator {
  private seenIds = new Map<string, number>();
  private readonly ttlMs: number;

  constructor(ttlMs: number = 300000) {
    // Default 5 minutes
    this.ttlMs = ttlMs;
  }

  isDuplicate(id: string): boolean {
    const now = Date.now();
    const seenAt = this.seenIds.get(id);

    if (seenAt && now - seenAt < this.ttlMs) {
      return true;
    }

    this.seenIds.set(id, now);

    // Periodic sweep
    if (this.seenIds.size > 2000) {
      for (const [key, time] of this.seenIds.entries()) {
        if (now - time >= this.ttlMs) {
          this.seenIds.delete(key);
        }
      }
    }

    return false;
  }
}

export class FacebookParser {
  private deduplicator = new MessageDeduplicator();

  constructor(private sender: FacebookSender) {}

  parseWebhookPayload(payload: WebhookPayload): MessageContext[] {
    if (payload.object !== 'page' || !payload.entry) {
      return [];
    }

    const contexts: MessageContext[] = [];

    for (const entry of payload.entry) {
      if (!entry.messaging) continue;

      for (const event of entry.messaging) {
        const ctx = this.parseMessagingEvent(event);
        if (ctx) {
          // Idempotency check: ignore duplicate deliveries from Facebook
          if (this.deduplicator.isDuplicate(ctx.messageId)) {
            logger.info({ messageId: ctx.messageId }, 'Duplicate Facebook webhook message ignored');
            continue;
          }
          contexts.push(ctx);
        }
      }
    }

    return contexts;
  }

  parseMessagingEvent(event: WebhookMessagingEvent): MessageContext | null {
    if (!event.message && !event.postback) {
      return null;
    }

    const userId = event.sender.id;
    const conversationId = event.sender.id; // In Meta Pages, sender ID is the Page-scoped user ID
    const messageId = event.message?.mid || event.postback?.mid || `pb-${Date.now()}-${Math.random()}`;

    let text = event.message?.text || '';
    if (!text && event.postback?.payload) {
      text = event.postback.payload;
    } else if (event.message?.quick_reply?.payload) {
      text = event.message.quick_reply.payload;
    }

    const attachments: Attachment[] = [];
    if (event.message?.attachments) {
      for (const att of event.message.attachments) {
        if (att.payload?.url) {
          attachments.push({
            type: att.type as any,
            url: att.payload.url,
          });
        }
      }
    }

    const sender = this.sender;

    const ctx: MessageContext = {
      platform: 'facebook',
      userId,
      conversationId,
      messageId,
      text,
      attachments,
      isGroup: false,
      timestamp: event.timestamp || Date.now(),

      async reply(msg: OutgoingMessage | string): Promise<SendResult> {
        return sender.send(conversationId, msg);
      },

      async send(msg: OutgoingMessage | string): Promise<SendResult> {
        return sender.send(conversationId, msg);
      },

      async react(emoji: string): Promise<void> {
        // Facebook Graph API v21 does not expose a public message reaction endpoint for Pages
        // We log it cleanly as unsupported by official API
        logger.debug({ emoji, messageId }, 'Reaction requested (unsupported by official Meta Page API)');
      },
    };

    return ctx;
  }
}
