import { describe, it, expect, vi } from 'vitest';
import { mapGraphApiError, withExponentialBackoff } from '../../../src/platform/facebook/errors.js';
import { AuthenticationError, PlatformError, RateLimitError } from '../../../src/utils/errors.js';

describe('Facebook Error Handling & Backoff', () => {
  it('should map rate limit errors properly', () => {
    const err = mapGraphApiError(429, { error: { message: 'Rate limit hit', code: 4 } });
    expect(err).toBeInstanceOf(RateLimitError);
  });

  it('should map invalid token error code 190 to AuthenticationError', () => {
    const err = mapGraphApiError(401, { error: { message: 'Error validating access token', code: 190 } });
    expect(err).toBeInstanceOf(AuthenticationError);
  });

  it('should retry retryable errors with backoff and succeed', async () => {
    let callCount = 0;
    const flakyOperation = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 3) {
        throw new PlatformError('Transient connection error', 'facebook', true);
      }
      return 'success';
    });

    const result = await withExponentialBackoff(flakyOperation, 3, 10);
    expect(result).toBe('success');
    expect(callCount).toBe(3);
  });

  it('should not retry permanent non-retryable errors', async () => {
    const permanentFailure = vi.fn().mockRejectedValue(new AuthenticationError('Invalid credentials'));

    await expect(withExponentialBackoff(permanentFailure, 3, 10)).rejects.toThrow(AuthenticationError);
    expect(permanentFailure).toHaveBeenCalledTimes(1);
  });
});
