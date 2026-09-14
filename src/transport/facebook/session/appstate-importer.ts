import { StoredSession, FacebookCookie } from '../session.js';
import { readFileSync, existsSync } from 'fs';

/**
 * Legacy `appstate.json` (Turing/FCA cookie-jar format) is ONLY an import
 * format — it never enters Core. Pipeline:
 *
 *   appstate.json -> importAppState() -> StoredSession -> SessionStore(AES)
 *                 -> FacebookPersonalTransport
 */
interface RawAppStateCookie {
  name?: string;
  key?: string;
  value: string;
  domain?: string;
  path?: string;
  hostOnly?: boolean;
  session?: boolean;
  expires?: number | string;
  lastAccessed?: string;
  creation?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string;
}

export class AppstateImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppstateImportError';
  }
}

/**
 * Normalize a legacy appstate cookie jar into the versioned StoredSession
 * format consumed by SessionStore. Throws unless the minimum auth cookies
 * (c_user + xs) are present. Duplicate cookie keys keep the LAST occurrence
 * (Playwright re-sets values on update).
 */
export function importAppState(rawJson: string, userIdHint?: string): StoredSession {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new AppstateImportError('appstate.json is not valid JSON');
  }

  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as any)?.cookies)
      ? (parsed as any).cookies
      : null;

  if (!list || list.length === 0) {
    throw new AppstateImportError('appstate.json must be a cookie array (or { cookies: [] })');
  }

  const byKey = new Map<string, FacebookCookie>();
  for (const entry of list as RawAppStateCookie[]) {
    const key = entry?.key ?? entry?.name;
    if (!key || typeof entry?.value !== 'string') continue;
    byKey.set(key, {
      key,
      value: entry.value,
      domain: entry.domain || '.facebook.com',
      path: entry.path || '/',
      expires: entry.expires,
    });
  }

  if (!byKey.has('c_user') || !byKey.has('xs')) {
    throw new AppstateImportError('appstate.json missing required auth cookies (c_user, xs)');
  }

  const userId = userIdHint || byKey.get('c_user')!.value;
  const now = new Date().toISOString();

  return {
    sessionVersion: 2,
    userId,
    cookies: Array.from(byKey.values()),
    createdAt: now,
    updatedAt: now,
    metadata: { source: 'appstate-import' },
  };
}

export function importAppStateFile(filePath: string, userIdHint?: string): StoredSession {
  if (!existsSync(filePath)) {
    throw new AppstateImportError(`appstate file not found: ${filePath}`);
  }
  return importAppState(readFileSync(filePath, 'utf8'), userIdHint);
}
