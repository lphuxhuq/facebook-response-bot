import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-hub-signature-256"]',
      'token',
      'accessToken',
      'secret',
      'appSecret',
      'password',
      'cookie',
      'appstate',
      '*.token',
      '*.secret',
    ],
    censor: '[REDACTED_SECRET]',
  },
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});
