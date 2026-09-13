import { OutgoingMessage, SendResult } from '../../core/context.js';
import { OutgoingMessageQueue } from './queue.js';
import { mapGraphApiError, withExponentialBackoff } from './errors.js';
import { GraphApiSendMessagePayload, GraphApiSendResponse } from './types.js';
import { logger } from '../../utils/logger.js';

export interface FacebookSenderConfig {
  pageAccessToken: string;
  apiVersion?: string;
  baseUrl?: string;
}

export class FacebookSender {
  private pageAccessToken: string;
  private apiVersion: string;
  private baseUrl: string;
  private queue: OutgoingMessageQueue;

  constructor(config: FacebookSenderConfig) {
    this.pageAccessToken = config.pageAccessToken;
    this.apiVersion = config.apiVersion || 'v21.0';
    this.baseUrl = config.baseUrl || 'https://graph.facebook.com';
    this.queue = new OutgoingMessageQueue(5, 50);
  }

  async send(recipientId: string, message: OutgoingMessage | string): Promise<SendResult> {
    const outgoing = typeof message === 'string' ? { text: message } : message;

    const payload: GraphApiSendMessagePayload = {
      recipient: { id: recipientId },
      message: {},
      messaging_type: 'RESPONSE',
    };

    if (outgoing.text) {
      payload.message.text = outgoing.text;
    }

    if (outgoing.attachments && outgoing.attachments.length > 0) {
      const att = outgoing.attachments[0];
      payload.message.attachment = {
        type: att.type,
        payload: { url: att.url, is_reusable: true },
      };
    }

    if (outgoing.quickReplies && outgoing.quickReplies.length > 0) {
      payload.message.quick_replies = outgoing.quickReplies.map((qr) => ({
        content_type: 'text',
        title: qr.title,
        payload: qr.payload,
      }));
    }

    return this.queue.enqueue(() =>
      withExponentialBackoff(async () => {
        const url = `${this.baseUrl}/${this.apiVersion}/me/messages?access_token=${encodeURIComponent(this.pageAccessToken)}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = (await res.json()) as GraphApiSendResponse | any;

        if (!res.ok) {
          throw mapGraphApiError(res.status, data);
        }

        return {
          messageId: data.message_id,
          recipientId: data.recipient_id,
          timestamp: Date.now(),
        };
      })
    );
  }

  async sendSenderAction(recipientId: string, action: 'typing_on' | 'typing_off' | 'mark_seen'): Promise<void> {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}/me/messages?access_token=${encodeURIComponent(this.pageAccessToken)}`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          sender_action: action,
        }),
      });
    } catch (err) {
      // Non-critical, ignore error
      logger.debug({ err, recipientId, action }, 'Failed to send sender action');
    }
  }
}
