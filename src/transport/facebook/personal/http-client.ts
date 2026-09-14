import { AuthenticationError, PermissionDeniedError, RateLimitError, ValidationError, PlatformError } from '../../../utils/errors.js';
import { FacebookCookie } from '../session.js';
import { PersonalApiConfig } from './api-config.js';

/** Minimal cookie container for the two auth cookies + extras we persist. */
export class CookieJar {
  private map = new Map<string, FacebookCookie>();

  static fromCookies(cookies: FacebookCookie[]): CookieJar {
    const jar = new CookieJar();
    for (const c of cookies) jar.map.set(c.key, c);
    return jar;
  }

  get(key: string): string | undefined {
    return this.map.get(key)?.value;
  }

  has(key: string): boolean {
    return this.map.has(key);
  }

  header(): string {
    return Array.from(this.map.values())
      .map((c) => `${c.key}=${c.value}`)
      .join('; ');
  }

  /** Merge Set-Cookie headers returned by the server. */
  ingest(setCookieHeaders: string[]): void {
    for (const raw of setCookieHeaders) {
      const [pair] = raw.split(';');
      const eq = pair.indexOf('=');
      if (eq === -1) continue;
      const key = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (!key) continue;
      const prev = this.map.get(key);
      this.map.set(key, {
        key,
        value,
        domain: prev?.domain ?? '.facebook.com',
        path: prev?.path ?? '/',
      });
    }
  }

  toCookies(): FacebookCookie[] {
    return Array.from(this.map.values());
  }
}

export class CheckpointError extends AuthenticationError {
  readonly kind = 'CHECKPOINT' as const;
  constructor(reason: string) {
    super(`Facebook checkpoint required: ${reason}. Manual login is needed — the bot will NOT attempt to bypass it.`);
    this.name = 'CheckpointError';
  }
}

/** Anti-CSRF tokens scraped from a logged-in page. */
export interface LsdTokens {
  lsd?: string;
  fbDtsg?: string;
}

export interface HttpOptions {
  method?: 'GET' | 'POST';
  /** url-encoded form body (the format these ajax endpoints expect). */
  form?: Record<string, string | number | boolean>;
  query?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
}

export type TransportErrorKind =
  | 'AUTH_ERROR'
  | 'CHECKPOINT'
  | 'RATE_LIMIT'
  | 'PERMISSION'
  | 'VALIDATION'
  | 'NETWORK'
  | 'TEMPORARY';

export function errorToKind(err: unknown): TransportErrorKind {
  if (err instanceof CheckpointError) return 'CHECKPOINT';
  if (err instanceof AuthenticationError) return 'AUTH_ERROR';
  if (err instanceof RateLimitError) return 'RATE_LIMIT';
  if (err instanceof PermissionDeniedError) return 'PERMISSION';
  if (err instanceof ValidationError) return 'VALIDATION';
  const code = (err as any)?.code || '';
  if (['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'].includes(code)) return 'NETWORK';
  return 'TEMPORARY';
}

/**
 * Cookie-authenticated HTTP client for the unofficial personal endpoints.
 * - Always sends the persisted auth cookies and an honest bot User-Agent.
 * - Scrapes `lsd` / `fb_dtsg` once and attaches them to POSTs.
 * - Classifies every failure into the Phase 13 taxonomy. It NEVER retries
 *   auth and NEVER attempts to evade checkpoints/anti-abuse.
 */
export class PersonalHttpClient {
  private tokens: LsdTokens | null = null;

  constructor(
    private readonly jar: CookieJar,
    private readonly config: PersonalApiConfig,
    private readonly fetchImpl: typeof fetch = globalThis.fetch
  ) {
    if (!jar.has('c_user') || !jar.has('xs')) {
      throw new AuthenticationError('Personal session is missing c_user/xs cookies');
    }
  }

  private url(path: string, query?: HttpOptions['query']): string {
    const u = new URL(this.config.baseUrl + path);
    if (query) {
      for (const [k, v] of Object.entries(query)) u.searchParams.set(k, String(v));
    }
    return u.toString();
  }

  private baseHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      'User-Agent': this.config.userAgent,
      Cookie: this.jar.header(),
      Origin: this.config.origin,
      Referer: this.config.referer,
      Accept: 'application/json, text/plain, */*',
      ...(extra || {}),
    };
  }

  /** Fetch lsd page and scrape anti-CSRF tokens once, cached thereafter. */
  async ensureTokens(): Promise<LsdTokens> {
    if (this.tokens) return this.tokens;
    try {
      const res = await this.fetchImpl(this.url(this.config.lsdPage), {
        method: 'GET',
        headers: { 'User-Agent': this.config.userAgent, Cookie: this.jar.header() },
      });
      this.assertNotBlocked(res.status);
      const html = await res.text();
      // Formats observed in the wild (all tolerated, live shape UNVERIFIED):
      //   "LSD",[],{"token":"..."}
      //   {"LSD":[],{"token":"..."}
      const lsd = html.match(/"LSD"[^"]*"token":"([^"]+)"/)?.[1];
      const fbDtsg =
        html.match(/"fb_dtsg","[^"]*","value":"([^"]+)"/)?.[1] ||
        html.match(/name="fb_dtsg"\s+value="([^"]+)"/)?.[1];
      this.tokens = { lsd, fbDtsg };
    } catch {
      // Token scraping failure is non-fatal: some endpoints work without lsd.
      this.tokens = {};
    }
    return this.tokens;
  }

  private assertNotBlocked(status: number): void {
    if (status === 401 || status === 403) {
      throw new AuthenticationError(`Facebook rejected session credentials (HTTP ${status})`);
    }
    if (status === 429) {
      throw new RateLimitError('Facebook rate limit hit', 2000);
    }
  }

  private static parseJsonish(body: string): any {
    // Facebook ajax responses are frequently prefixed: for(;;);<json>
    const cleaned = body.replace(/^\s*for\s*\(\s*;;\s*\)\s*;?\s*/, '').trim();
    return JSON.parse(cleaned);
  }

  async request<T = any>(path: string, options: HttpOptions = {}): Promise<T> {
    const method = options.method || 'GET';
    const url = this.url(path, options.query);

    const headers: Record<string, string> = { ...this.baseHeaders(options.headers) };
    let body: string | undefined;

    if (method === 'POST') {
      const tokens = await this.ensureTokens();
      const payload: Record<string, string> = {};
      if (options.form) {
        for (const [k, v] of Object.entries(options.form)) payload[k] = String(v);
      }
      if (tokens.lsd) payload.lsd = tokens.lsd;
      if (tokens.fbDtsg) payload.fb_dtsg = tokens.fbDtsg;
      body = new URLSearchParams(payload).toString();
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    let res: Response;
    try {
      res = await this.fetchImpl(url, { method, headers, body });
    } catch (err: any) {
      // fetch rejects on network-level failure: keep the original error shape
      // (code/name) so the dispatcher's classifyError() can identify it.
      const wrapped: any = new PlatformError(
        `Network error calling ${path}: ${err?.message}`,
        'facebook',
        true
      );
      wrapped.cause = err;
      if (err?.code) wrapped.code = err.code;
      throw wrapped;
    }

    this.assertNotBlocked(res.status);

    const gsc = (res.headers as any)?.getSetCookie;
    const setCookies: string[] = typeof gsc === 'function' ? gsc.call(res.headers) : [];
    if (setCookies.length) this.jar.ingest(setCookies);

    const text = await res.text();

    if (!res.ok) {
      // Try to surface a structured Facebook error for classification.
      let msg = `Facebook returned HTTP ${res.status}`;
      try {
        const j = PersonalHttpClient.parseJsonish(text);
        msg = j?.error?.message || j?.errorDescription || msg;
      } catch {
        /* keep generic message */
      }
      if (/checkpoint|confirm|login/i.test(msg)) throw new CheckpointError(msg);
      if (/permission|cannot|not allowed/i.test(msg)) throw new PermissionDeniedError(msg);
      if (/rate|too many/i.test(msg)) throw new RateLimitError(msg, 2000);
      throw new PlatformError(msg, 'facebook', res.status >= 500);
    }

    let data: any;
    try {
      data = PersonalHttpClient.parseJsonish(text);
    } catch {
      throw new PlatformError(`Unparseable response from ${path}`, 'facebook', false);
    }

    // Facebook often returns 200 with an error payload.
    if (data?.error) {
      const em: string = data.error.message || data.error || 'unknown error';
      if (/checkpoint|session|password|login|user has logged out/i.test(em)) throw new CheckpointError(em);
      if (/permission|cannot/i.test(em)) throw new PermissionDeniedError(em);
      if (/rate|too many/i.test(em)) throw new RateLimitError(em, 2000);
      throw new PlatformError(em, 'facebook', Boolean(data.error.is_transient));
    }
    if (data === undefined || data === null || data === false) {
      throw new PlatformError(`Empty response payload from ${path}`, 'facebook', false);
    }

    return data as T;
  }
}
