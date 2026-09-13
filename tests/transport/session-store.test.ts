import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { SessionStore, StoredSession } from '../../src/transport/facebook/session.ts';

describe('SessionStore (AES-256-GCM Encrypted)', () => {
  const testFilePath = path.join(process.cwd(), 'data', 'test-session.enc');
  const secretKey = 'my_super_secret_encryption_key_32b!';

  afterEach(() => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  it('should encrypt and decrypt a valid session cleanly', () => {
    const store = new SessionStore(testFilePath, secretKey);

    const session: StoredSession = {
      sessionVersion: 2,
      userId: 'fb_user_1000123',
      cookies: [
        { key: 'c_user', value: '1000123', domain: '.facebook.com', path: '/' },
        { key: 'xs', value: 'secret_token', domain: '.facebook.com', path: '/' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { browser: 'chrome' },
    };

    store.save(session);
    expect(fs.existsSync(testFilePath)).toBe(true);

    const loaded = store.load();
    expect(loaded).not.toBeNull();
    expect(loaded?.userId).toBe('fb_user_1000123');
    expect(loaded?.cookies.length).toBe(2);
  });

  it('should reject corrupted or tampered session file', () => {
    const store = new SessionStore(testFilePath, secretKey);

    const session: StoredSession = {
      sessionVersion: 2,
      userId: 'fb_user_1000123',
      cookies: [
        { key: 'c_user', value: '1000123', domain: '.facebook.com', path: '/' },
        { key: 'xs', value: 'secret_token', domain: '.facebook.com', path: '/' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {},
    };

    store.save(session);

    // Tamper with file
    fs.writeFileSync(testFilePath, 'tampered_data_string_not_valid_iv_tag_cipher');
    const loaded = store.load();
    expect(loaded).toBeNull();
  });
});
