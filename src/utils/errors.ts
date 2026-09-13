export class BotError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthenticationError extends BotError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

export class PermissionDeniedError extends BotError {
  constructor(message: string = 'Permission denied') {
    super(message, 'PERMISSION_DENIED', 403);
  }
}

export class RateLimitError extends BotError {
  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfterMs: number = 1000
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
  }
}

export class ValidationError extends BotError {
  constructor(message: string = 'Validation error') {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class PlatformError extends BotError {
  constructor(
    message: string,
    public readonly platform: string = 'facebook',
    public readonly isRetryable: boolean = false
  ) {
    super(message, 'PLATFORM_ERROR', 502);
  }
}
