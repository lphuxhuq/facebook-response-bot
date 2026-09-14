import { describe, it, expect, vi } from 'vitest';
import { FacebookParser } from '../../../src/platform/facebook/parser.js';
import { FacebookSender } from '../../../src/platform/facebook/sender.js';
import { WebhookPayload } from '../../../src/platform/facebook/types.js';

describe('FacebookParser', () => {
  const mockSender = {
    send: vi.fn().mockResolvedValue({ messageId: 'm1', recipientId: 'r1', timestamp: Date.now() }),
    sendSenderAction: vi.fn().mockResolvedValue(undefined),
  } as unknown as FacebookSender;

  it('should parse text messages into MessageContext', () => {
    const parser = new FacebookParser(mockSender);

    const payload: WebhookPayload = {
      object: 'page',
      entry: [
        {
          id: 'page_123',
          time: Date.now(),
          messaging: [
            {
              sender: { id: 'user_456' },
              recipient: { id: 'page_123' },
              timestamp: Date.now(),
              message: {
                mid: 'mid_001',
                text: '!ping',
              },
            },
          ],
        },
      ],
    };

    const contexts = parser.parseWebhookPayload(payload);
    expect(contexts.length).toBe(1);
    expect(contexts[0].userId).toBe('user_456');
    expect(contexts[0].text).toBe('!ping');
    expect(contexts[0].platform).toBe('facebook');
  });

  it('should parse postback payload as text message', () => {
    const parser = new FacebookParser(mockSender);

    const payload: WebhookPayload = {
      object: 'page',
      entry: [
        {
          id: 'page_123',
          time: Date.now(),
          messaging: [
            {
              sender: { id: 'user_789' },
              recipient: { id: 'page_123' },
              timestamp: Date.now(),
              postback: {
                title: 'Get Started',
                payload: '!help',
              },
            },
          ],
        },
      ],
    };

    const contexts = parser.parseWebhookPayload(payload);
    expect(contexts.length).toBe(1);
    expect(contexts[0].text).toBe('!help');
  });

  it('emits one context per delivery; deduplication is owned by the inbound pipeline (DB-backed)', () => {
    const parser = new FacebookParser(mockSender);

    const payload: WebhookPayload = {
      object: 'page',
      entry: [
        {
          id: 'page_123',
          time: Date.now(),
          messaging: [
            {
              sender: { id: 'user_456' },
              recipient: { id: 'page_123' },
              timestamp: Date.now(),
              message: {
                mid: 'duplicate_mid_123',
                text: '!help',
              },
            },
          ],
        },
      ],
    };

    // Parser is a pure normalizer now: repeated deliveries each produce a context.
    // The actual "execute once" guarantee is enforced downstream by
    // InboundPipeline via the processed_events unique table (restart-safe).
    const first = parser.parseWebhookPayload(payload);
    const second = parser.parseWebhookPayload(payload);
    expect(first.length).toBe(1);
    expect(second.length).toBe(1);
    expect(first[0].messageId).toBe(second[0].messageId);
  });

  it('captures reply_to mid onto the context', () => {
    const parser = new FacebookParser(mockSender);

    const payload: WebhookPayload = {
      object: 'page',
      entry: [
        {
          id: 'page_123',
          time: Date.now(),
          messaging: [
            {
              sender: { id: 'user_456' },
              recipient: { id: 'page_123' },
              timestamp: Date.now(),
              message: {
                mid: 'mid_reply_1',
                text: 'ok',
                reply_to: { mid: 'mid_original_9' },
              },
            },
          ],
        },
      ],
    };

    const contexts = parser.parseWebhookPayload(payload);
    expect(contexts[0].replyToMessageId).toBe('mid_original_9');
  });
});
