import { OutgoingMessage, Attachment, SendResult, isDataAttachment } from '../../core/context.js';
import { OutgoingMessageQueue } from './queue.js';
import { mapGraphApiError, withExponentialBackoff } from './errors.js';
import { GraphApiSendResponse } from './types.js';
import { logger } from '../../utils/logger.js';

export interface FacebookSenderConfig {
  pageAccessToken: string;
  pageId?: string;
  apiVersion?: string;
  baseUrl?: string;
  /**
   * When false, send() executes immediately without the internal queue.
   * Used when the OutboundDispatcher (priority queue + rate limit + circuit
   * breaker) sits in front of this sender, to avoid double-queueing.
   */
  useInternalQueue?: boolean;
  /**
   * When false, transport-level exponential-backoff retry is disabled —
   * the OutboundDispatcher becomes the single retry owner (bounded by
   * RequestQueue maxAttempts), preventing compounding retry storms.
   */
  transportRetry?: boolean;
}

/** Minimal callable send contract shared by FacebookSender and OutboundDispatcher. */
export interface MessageSender {
  send(recipientId: string, message: OutgoingMessage | string): Promise<SendResult>;
}

export class FacebookSender implements MessageSender {
  private pageAccessToken: string;
  private pageId?: string;
  private apiVersion: string;
  private baseUrl: string;
  private queue: OutgoingMessageQueue;
  private useInternalQueue: boolean;
  private transportRetry: boolean;

  constructor(config: FacebookSenderConfig) {
    this.pageAccessToken = config.pageAccessToken;
    this.pageId = config.pageId;
    this.apiVersion = config.apiVersion || 'v21.0';
    this.baseUrl = config.baseUrl || 'https://graph.facebook.com';
    this.useInternalQueue = config.useInternalQueue ?? true;
    this.transportRetry = config.transportRetry ?? true;
    this.queue = new OutgoingMessageQueue(5, 50);
  }

  async send(recipientId: string, message: OutgoingMessage | string): Promise<SendResult> {
    const outgoing = typeof message === 'string' ? { text: message } : message;

    const dispatch = async (): Promise<SendResult> => {
      // If message contains binary data attachments, use multipart send
      const hasDataAttachment =
        outgoing.attachments?.some((att) => isDataAttachment(att)) ?? false;

      return hasDataAttachment
        ? this.sendMultipart(recipientId, outgoing)
        : this.sendJson(recipientId, outgoing);
    };

    if (!this.useInternalQueue) {
      return this.transportRetry ? withExponentialBackoff(dispatch) : dispatch();
    }

    return this.queue.enqueue(() => withExponentialBackoff(dispatch));
  }

  /**
   * Send with URL-based attachments via standard JSON Send API.
   */
  private async sendJson(recipientId: string, outgoing: OutgoingMessage): Promise<SendResult> {
    const payload: any = {
      recipient: { id: recipientId },
      message: {},
      messaging_type: 'RESPONSE',
    };

    if (outgoing.text) {
      payload.message.text = outgoing.text;
    }

    const urlAttachment = outgoing.attachments?.find((att) => !isDataAttachment(att));
    if (urlAttachment) {
      payload.message.attachment = {
        type: urlAttachment.type,
        payload: { url: (urlAttachment as any).url, is_reusable: true },
      };
    }

    if (outgoing.quickReplies && outgoing.quickReplies.length > 0) {
      payload.message.quick_replies = outgoing.quickReplies.map((qr) => ({
        content_type: 'text',
        title: qr.title,
        payload: qr.payload,
      }));
    }

    const url = `${this.baseUrl}/${this.apiVersion}/me/messages?access_token=${encodeURIComponent(this.pageAccessToken)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  }

  /**
   * Send message with binary attachments (e.g. Canvas-rendered images)
   * via Messenger Platform multipart/form-data Send API (filedata).
   */
  private async sendMultipart(recipientId: string, outgoing: OutgoingMessage): Promise<SendResult> {
    const form = new FormData();

    form.append('recipient', JSON.stringify({ id: recipientId }));
    form.append('messaging_type', 'RESPONSE');

    const messageObj: any = {};
    if (outgoing.text) {
      messageObj.text = outgoing.text;
    }

    const dataAtt = outgoing.attachments?.find((att) => isDataAttachment(att)) as
      | Extract<Attachment, { data: Buffer | Uint8Array }>
      | undefined;

    if (dataAtt) {
      const bytes = dataAtt.data instanceof Buffer ? dataAtt.data : Buffer.from(dataAtt.data);
      const contentType = dataAtt.contentType || 'image/png';
      form.append(
        'filedata',
        new Blob([new Uint8Array(bytes)], { type: contentType }),
        dataAtt.filename
      );
      // type is derived from filedata MIME by Messenger platform
      messageObj.attachment = { type: dataAtt.type, payload: { is_reusable: true } };
    }

    form.append('message', JSON.stringify(messageObj));

    const url = `${this.baseUrl}/${this.apiVersion}/me/messages?access_token=${encodeURIComponent(this.pageAccessToken)}`;
    const res = await fetch(url, { method: 'POST', body: form });

    const data = (await res.json()) as GraphApiSendResponse | any;
    if (!res.ok) {
      throw mapGraphApiError(res.status, data);
    }

    return {
      messageId: data.message_id,
      recipientId: data.recipient_id,
      timestamp: Date.now(),
    };
  }

  getQueueStats(): { queued: number; active: number } {
    return { queued: this.queue.size, active: this.queue.active };
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
