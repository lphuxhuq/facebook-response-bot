import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FacebookSender } from '../../../src/platform/facebook/sender.js';
import { DataAttachment } from '../../../src/core/context.js';

describe('FacebookSender — Multipart Attachment Upload', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should send data attachment via multipart form (filedata)', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ recipient_id: 'r1', message_id: 'mid_123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as any;

    const sender = new FacebookSender({
      pageAccessToken: 'EAAB_test_token',
      pageId: '123',
    });

    const fakePng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
    const attachment: DataAttachment = {
      type: 'image',
      data: fakePng,
      filename: 'taixiu_board.png',
      contentType: 'image/png',
    };

    const result = await sender.send('recipient1', {
      text: 'Kết quả tài xỉu',
      attachments: [attachment],
    });

    expect(result.messageId).toBe('mid_123');
    expect(result.recipientId).toBe('r1');

    expect(calls.length).toBe(1);
    const body = calls[0].init.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    // Body must NOT be a JSON string
    expect(typeof body).not.toBe('string');
    // Multipart path must not manually set Content-Type (browser auto-sets boundary)
    expect((calls[0].init.headers as any)?.['Content-Type']).toBeUndefined();
  });

  it('should still send URL attachments via JSON path', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ recipient_id: 'r2', message_id: 'mid_456' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as any;

    const sender = new FacebookSender({ pageAccessToken: 'EAAB_test_token' });

    const result = await sender.send('recipient2', {
      text: 'Ảnh từ URL',
      attachments: [{ type: 'image', url: 'https://i.imgur.com/abc.jpg' }],
    });

    expect(result.messageId).toBe('mid_456');
    expect(calls[0].init.body).toBeTypeOf('string');
    const payload = JSON.parse(calls[0].init.body as string);
    expect(payload.message.attachment.payload.url).toBe('https://i.imgur.com/abc.jpg');
  });

  it('should map Graph API errors on multipart failure', async () => {
    globalThis.fetch = vi.fn().mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            error: { message: 'Invalid token', type: 'OAuthException', code: 190, fbtrace_id: 'x' },
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
    ) as any;

    const sender = new FacebookSender({ pageAccessToken: 'bad_token' });

    const attachment: DataAttachment = {
      type: 'image',
      data: Buffer.from('fake'),
      filename: 'x.png',
      contentType: 'image/png',
    };

    await expect(sender.send('r3', { attachments: [attachment] })).rejects.toThrow(
      /Page Access Token/i
    );
  });
});
