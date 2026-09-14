import { Attachment, MessageContext, OutgoingMessage, SendResult } from '../../core/context.js';
import { WebhookMessagingEvent, WebhookPayload } from './types.js';
import { MessageSender } from './sender.js';
import { logger } from '../../utils/logger.js';

export class FacebookParser {
  constructor(private sender: MessageSender) {}

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

    const replyToMessageId = event.message?.reply_to?.mid;

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
      ...(replyToMessageId ? { replyToMessageId } : {}),

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
