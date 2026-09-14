import { describe, it, expect, vi } from 'vitest';
import { CookieJar, CheckpointError, errorToKind, PersonalHttpClient } from '../../src/transport/facebook/personal/http-client.js';
import { DEFAULT_PERSONAL_API } from '../../src/transport/facebook/personal/api-config.js';
import { AuthenticationError, RateLimitError, PermissionDeniedError } from '../../src/utils/errors.js';

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('CookieJar', () => {
  it('round-trips cookies into a header and ingests Set-Cookie updates', () => {
    const jar = CookieJar.fromCookies([
      { key: 'c_user', value: '1', domain: '.facebook.com', path: '/' },
      { key: 'xs', value: 'a', domain: '.facebook.com', path: '/' },
    ]);
    expect(jar.header()).toBe('c_user=1; xs=a');

    jar.ingest(['xs=b; domain=.facebook.com; path=/', 'newc=z']);
    expect(jar.get('xs')).toBe('b');
    expect(jar.get('newc')).toBe('z');
    expect(jar.toCookies()).toHaveLength(3);
  });
});

describe('PersonalHttpClient — request pipeline', () => {
  const jar = CookieJar.fromCookies([
    { key: 'c_user', value: '42', domain: '.facebook.com', path: '/' },
    { key: 'xs', value: 'xsv', domain: '.facebook.com', path: '/' },
  ]);

  it('rejects construction without auth cookies', () => {
    expect(() => new PersonalHttpClient(new CookieJar(), DEFAULT_PERSONAL_API)).toThrow(AuthenticationError);
  });

  it('GET sends UA + cookie header and parses for(;;)-prefixed JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse('for(;;);{"threads":[{"threadID":"t1"}]}'));
    const client = new PersonalHttpClient(jar, DEFAULT_PERSONAL_API, fetchMock as any);

    const data = await client.request<{ threads: any[] }>('/ajax/mercury/threadlist_info.php', {
      query: { bolero: 'sync' },
    });

    expect(data.threads[0].threadID).toBe('t1');
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('threadlist_info.php');
    expect(String(url)).toContain('bolero=sync');
    const headers = init.headers as Record<string, string>;
    expect(headers.Cookie).toContain('c_user=42');
    expect(headers['User-Agent']).toContain('bot'); // honest UA, no spoofing
    expect(init.method).toBe('GET');
  });

  it('POST attaches lsd + fb_dtsg scraped from the lsd page', async () => {
    const page = new Response('<script>{"LSD":[],{"token":"TOK123"},"fb_dtsg","x","value":"DTSG456"}</script>', {
      status: 200,
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(page) // token page
      .mockResolvedValueOnce(jsonResponse({ payload: 'ok' })); // actual post
    const client = new PersonalHttpClient(jar, DEFAULT_PERSONAL_API, fetchMock as any);

    await client.request('/ajax/mercury/send_messages.php', {
      method: 'POST',
      form: { actor: '42', message: { text: 'hi' } },
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, init] = fetchMock.mock.calls[1];
    const body = new URLSearchParams(String(init.body));
    expect(body.get('lsd')).toBe('TOK123');
    expect(body.get('fb_dtsg')).toBe('DTSG456');
    expect((init.headers as any)['Content-Type']).toBe('application/x-www-form-urlencoded');
  });

  it('caches lsd tokens across requests', async () => {
    const page = new Response('{"LSD":[],{"token":"T1"}', { status: 200 });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(page)
      .mockImplementation(() => Promise.resolve(jsonResponse({ ok: 1 })));
    const client = new PersonalHttpClient(jar, DEFAULT_PERSONAL_API, fetchMock as any);

    await client.request('/x', { method: 'POST', form: { a: 1 } });
    await client.request('/y', { method: 'POST', form: { b: 2 } });

    // 1 token fetch + 2 posts
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('ingests Set-Cookie rotation from responses', async () => {
    const res = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    // Node's undici Headers supports multiple set-cookie via getSetCookie
    (res.headers as any).getSetCookie = () => ['xs=newrotated; domain=.facebook.com'];
    const fetchMock = vi.fn().mockResolvedValue(res);
    const localJar = CookieJar.fromCookies([
      { key: 'c_user', value: '42', domain: '.facebook.com', path: '/' },
      { key: 'xs', value: 'old', domain: '.facebook.com', path: '/' },
    ]);
    const client = new PersonalHttpClient(localJar, DEFAULT_PERSONAL_API, fetchMock as any);

    await client.request('/anything');
    expect(localJar.get('xs')).toBe('newrotated');
  });
});

describe('PersonalHttpClient — error taxonomy (Phase 13)', () => {
  const jar = CookieJar.fromCookies([
    { key: 'c_user', value: '42', domain: '.facebook.com', path: '/' },
    { key: 'xs', value: 'xsv', domain: '.facebook.com', path: '/' },
  ]);

  it('HTTP 401 -> AuthenticationError (AUTH_ERROR)', async () => {
    const client = new PersonalHttpClient(jar, DEFAULT_PERSONAL_API, vi.fn().mockResolvedValue(jsonResponse({}, 401)));
    await expect(client.request('/x')).rejects.toThrow(AuthenticationError);
  });

  it('HTTP 429 -> RateLimitError (BACKOFF)', async () => {
    const client = new PersonalHttpClient(jar, DEFAULT_PERSONAL_API, vi.fn().mockResolvedValue(jsonResponse({}, 429)));
    await expect(client.request('/x')).rejects.toThrow(RateLimitError);
  });

  it('200 + error payload mentioning checkpoint -> CheckpointError (PAUSE, never bypass)', async () => {
    const client = new PersonalHttpClient(
      jar,
      DEFAULT_PERSONAL_API,
      vi.fn().mockResolvedValue(jsonResponse({ error: { message: 'You must confirm your identity (checkpoint)' } }))
    );
    await expect(client.request('/x')).rejects.toThrow(CheckpointError);
  });

  it('permission error -> PermissionDeniedError (FAIL)', async () => {
    const client = new PersonalHttpClient(
      jar,
      DEFAULT_PERSONAL_API,
      vi.fn().mockResolvedValue(jsonResponse({ error: { message: 'You cannot message this person' } }))
    );
    await expect(client.request('/x')).rejects.toThrow(PermissionDeniedError);
  });

  it('network rejection -> retryable PlatformError (NETWORK)', async () => {
    const client = new PersonalHttpClient(
      jar,
      DEFAULT_PERSONAL_API,
      vi.fn().mockRejectedValue(Object.assign(new Error('connect timeout'), { code: 'ETIMEDOUT' }))
    );
    const err: any = await client.request('/x').catch((e) => e);
    expect(err.isRetryable).toBe(true);
    expect(errorToKind(err)).toBe('NETWORK');
  });

  it('errorToKind maps checkpoint/auth correctly for the dispatcher', () => {
    expect(errorToKind(new CheckpointError('x'))).toBe('CHECKPOINT');
    expect(errorToKind(new AuthenticationError('x'))).toBe('AUTH_ERROR');
    expect(errorToKind(new RateLimitError('x'))).toBe('RATE_LIMIT');
  });
});
