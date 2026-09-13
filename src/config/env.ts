import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  // Meta Messenger Credentials
  FACEBOOK_PAGE_ID: z.string().default('mock_page_id'),
  FACEBOOK_APP_ID: z.string().default('mock_app_id'),
  FACEBOOK_APP_SECRET: z.string().default('mock_app_secret'),
  FACEBOOK_VERIFY_TOKEN: z.string().default('mock_verify_token'),
  FACEBOOK_PAGE_ACCESS_TOKEN: z.string().default('mock_page_access_token'),

  // Bot Metadata
  BOT_NAME: z.string().default('Facebook Response Bot V2'),
  BOT_PREFIX: z.string().default('!'),
  BOT_OWNER_ID: z.string().default('100000000000001'),
  BOT_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),

  // Admin control-plane auth (required in production, see app.ts startup check)
  ADMIN_API_TOKEN: z.string().default('change_me_strong_random_admin_token'),

  // Personal account session (Phase 5)
  FB_SESSION_PATH: z.string().default('./data/facebook/session/session.enc'),
  ENCRYPTION_KEY: z.string().optional().default(''),

  // Storage
  DATABASE_PATH: z.string().default('./data/bot.sqlite'),

  // Optional AI Provider
  AI_PROVIDER: z.enum(['gemini', 'openai', 'openrouter', 'mock']).default('mock'),
  AI_API_KEY: z.string().optional().default(''),
  AI_MODEL: z.string().default('gemini-1.5-flash'),

  // Optional Weather API
  OPENWEATHER_API_KEY: z.string().optional().default(''),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', JSON.stringify(result.error.format(), null, 2));
    throw new Error('Environment configuration validation failed');
  }
  return result.data;
}

export const env = loadEnv();
