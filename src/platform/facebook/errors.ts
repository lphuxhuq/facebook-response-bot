import { PlatformError, RateLimitError, AuthenticationError } from '../../utils/errors.js';
import { GraphApiErrorResponse } from './types.js';

export function mapGraphApiError(status: number, data: GraphApiErrorResponse | any): Error {
  const err = data?.error || {};
  const message = err.message || `Graph API error (HTTP ${status})`;
  const code = err.code;
  const subcode = err.error_subcode;

  // 1. Rate limits (OAuthException code 4, 17, 32, 613)
  if (status === 429 || code === 4 || code === 17 || code === 32 || code === 613) {
    return new RateLimitError(`Meta Graph API rate limit reached: ${message}`, 2000);
  }

  // 2. Authentication / Invalid Token (code 190)
  if (status === 401 || code === 190) {
    return new AuthenticationError(`Meta Page Access Token invalid or expired: ${message}`);
  }

  // 3. Temporary Server / Network Errors (code 1, 2, 500, 502, 503)
  const isRetryable = status >= 500 || code === 1 || code === 2;
  return new PlatformError(message, 'facebook', isRetryable);
}

export async function withExponentialBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    try {
      return await operation();
    } catch (err: any) {
      attempt++;
      const isRetryable = err instanceof RateLimitError || err.isRetryable === true;

      if (attempt > maxRetries || !isRetryable) {
        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff: 1s -> 2s -> 4s
    }
  }
}
