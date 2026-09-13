import crypto from 'crypto';
import { AuthenticationError } from '../../utils/errors.js';

export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
  appSecret: string
): boolean {
  if (!signatureHeader) {
    return false;
  }

  // Meta format: sha256={hash}
  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    return false;
  }

  const expectedSignature = parts[1];
  const hmac = crypto.createHmac('sha256', appSecret);
  hmac.update(rawBody);
  const calculatedSignature = hmac.digest('hex');

  // Use timingSafeEqual to prevent timing side-channel attacks
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const calculatedBuffer = Buffer.from(calculatedSignature, 'utf8');

  if (expectedBuffer.length !== calculatedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, calculatedBuffer);
}

export function assertValidSignature(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
  appSecret: string
): void {
  const isValid = verifyWebhookSignature(rawBody, signatureHeader, appSecret);
  if (!isValid) {
    throw new AuthenticationError('Invalid or missing Meta webhook HMAC-SHA256 signature');
  }
}
