import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyWebhookSignature, assertValidSignature } from '../../../src/platform/facebook/signature.js';
import { AuthenticationError } from '../../../src/utils/errors.js';

describe('Facebook Webhook Signature Verification', () => {
  const secret = 'super_secret_app_key_123';
  const payload = JSON.stringify({ object: 'page', entry: [] });

  function makeSignature(body: string, appSecret: string): string {
    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(body);
    return `sha256=${hmac.digest('hex')}`;
  }

  it('should accept valid signature', () => {
    const validSig = makeSignature(payload, secret);
    expect(verifyWebhookSignature(payload, validSig, secret)).toBe(true);
    expect(() => assertValidSignature(payload, validSig, secret)).not.toThrow();
  });

  it('should reject tampered payload', () => {
    const validSig = makeSignature(payload, secret);
    const tampered = payload + ' ';
    expect(verifyWebhookSignature(tampered, validSig, secret)).toBe(false);
    expect(() => assertValidSignature(tampered, validSig, secret)).toThrow(AuthenticationError);
  });

  it('should reject incorrect secret', () => {
    const validSig = makeSignature(payload, 'wrong_secret');
    expect(verifyWebhookSignature(payload, validSig, secret)).toBe(false);
  });

  it('should reject missing or malformed header', () => {
    expect(verifyWebhookSignature(payload, undefined, secret)).toBe(false);
    expect(verifyWebhookSignature(payload, 'invalid_header_format', secret)).toBe(false);
  });
});
