import { describe, it, expect } from 'vitest';
import { importAppState, AppstateImportError } from '../../src/transport/facebook/session/appstate-importer.js';

describe('Appstate Importer (legacy cookie-jar -> StoredSession)', () => {
  it('imports a valid FCA/Playwright cookie array', () => {
    const raw = JSON.stringify([
      { key: 'datr', value: 'D', domain: '.facebook.com', path: '/' },
      { key: 'c_user', value: '100000000000042', domain: '.facebook.com', path: '/' },
      { key: 'xs', value: 'X:abcdef', domain: '.facebook.com', path: '/' },
      { key: 'fr', value: 'F', domain: '.facebook.com', path: '/' },
    ]);

    const session = importAppState(raw);

    expect(session.sessionVersion).toBe(2);
    expect(session.userId).toBe('100000000000042');
    expect(session.cookies).toHaveLength(4);
    expect(session.cookies.map((c) => c.key)).toEqual(expect.arrayContaining(['c_user', 'xs']));
    expect(session.metadata.source).toBe('appstate-import');
    expect(session.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('also accepts Playwright-style cookies with name field', () => {
    const raw = JSON.stringify([
      { name: 'c_user', value: '42' },
      { name: 'xs', value: 'x' },
    ]);
    const session = importAppState(raw);
    expect(session.userId).toBe('42');
    expect(session.cookies.every((c) => c.domain === '.facebook.com')).toBe(true);
  });

  it('accepts { cookies: [...] } envelope', () => {
    const raw = JSON.stringify({ cookies: [{ key: 'c_user', value: '1' }, { key: 'xs', value: '2' }] });
    expect(importAppState(raw).cookies).toHaveLength(2);
  });

  it('keeps the LAST value for duplicate cookie keys', () => {
    const raw = JSON.stringify([
      { key: 'c_user', value: 'old' },
      { key: 'xs', value: 'a' },
      { key: 'c_user', value: 'new' },
    ]);
    const session = importAppState(raw);
    const cUser = session.cookies.filter((c) => c.key === 'c_user');
    expect(cUser).toHaveLength(1);
    expect(cUser[0].value).toBe('new');
    expect(session.userId).toBe('new');
  });

  it('supports optional userIdHint override', () => {
    const raw = JSON.stringify([{ key: 'c_user', value: '1' }, { key: 'xs', value: 'x' }]);
    expect(importAppState(raw, 'hinted').userId).toBe('hinted');
  });

  it('rejects input missing required auth cookies', () => {
    const raw = JSON.stringify([{ key: 'datr', value: 'D' }]);
    expect(() => importAppState(raw)).toThrow(AppstateImportError);
    expect(() => importAppState(raw)).toThrow(/c_user, xs/);
  });

  it('rejects invalid JSON and empty arrays', () => {
    expect(() => importAppState('{oops')).toThrow(AppstateImportError);
    expect(() => importAppState('[]')).toThrow(/cookie array/);
  });
});
