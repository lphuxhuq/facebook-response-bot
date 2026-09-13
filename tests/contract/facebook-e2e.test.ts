import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import crypto from 'crypto';
import { FastifyInstance } from 'fastify';
import { createServer } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { closeDatabase } from '../../src/database/index.js';

describe('End-to-End Meta Webhook Contract & Resilience Test', () => {
  let app: FastifyInstance;
  const appSecret = env.FACEBOOK_APP_SECRET;
  const verifyToken = env.FACEBOOK_VERIFY_TOKEN;

  function signPayload(body: string): string {
    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(body);
    return `sha256=${hmac.digest('hex')}`;
  }

  beforeAll(async () => {
    const server = await createServer();
    app = server.app;
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    closeDatabase();
  });

  it('1. Meta Webhook Handshake: GET /webhook should verify challenge', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/webhook?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(verifyToken)}&hub.challenge=test_challenge_12345`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toBe('test_challenge_12345');
  });

  it('2. Meta Webhook Handshake: Invalid token should be rejected with 403', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=12345`,
    });

    expect(res.statusCode).toBe(403);
  });

  it('3. Security: POST /webhook without valid HMAC signature should return 401', async () => {
    const body = JSON.stringify({ object: 'page', entry: [] });

    const res = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': 'sha256=invalid_tampered_hash',
      },
      payload: body,
    });

    expect(res.statusCode).toBe(401);
  });

  it('4. E2E Execution: Valid webhook with !ping command processes cleanly', async () => {
    const payload = JSON.stringify({
      object: 'page',
      entry: [
        {
          id: 'page_123',
          time: Date.now(),
          messaging: [
            {
              sender: { id: 'test_contract_user_1' },
              recipient: { id: 'page_123' },
              timestamp: Date.now(),
              message: {
                mid: `mid_contract_${Date.now()}`,
                text: '!ping',
              },
            },
          ],
        },
      ],
    });

    const sig = signPayload(payload);

    const res = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': sig,
      },
      payload,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toBe('EVENT_RECEIVED');
  });

  it('5. E2E Multi-step Flow: !quiz session triggers and handles sequential answer', async () => {
    const userId = `quiz_contract_user_${Date.now()}`;

    // Step 1: User sends !quiz
    const payload1 = JSON.stringify({
      object: 'page',
      entry: [
        {
          id: 'page_123',
          time: Date.now(),
          messaging: [
            {
              sender: { id: userId },
              recipient: { id: 'page_123' },
              timestamp: Date.now(),
              message: {
                mid: `mid_quiz_1_${Date.now()}`,
                text: '!quiz',
              },
            },
          ],
        },
      ],
    });

    const res1 = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': signPayload(payload1),
      },
      payload: payload1,
    });
    expect(res1.statusCode).toBe(200);

    // Step 2: User sends answer 'C'
    const payload2 = JSON.stringify({
      object: 'page',
      entry: [
        {
          id: 'page_123',
          time: Date.now(),
          messaging: [
            {
              sender: { id: userId },
              recipient: { id: 'page_123' },
              timestamp: Date.now(),
              message: {
                mid: `mid_quiz_2_${Date.now()}`,
                text: 'C',
              },
            },
          ],
        },
      ],
    });

    const res2 = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': signPayload(payload2),
      },
      payload: payload2,
    });
    expect(res2.statusCode).toBe(200);
  });
});
