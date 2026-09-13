import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { logger } from '../../utils/logger.js';
import { AuthenticationError } from '../../utils/errors.js';

export interface FacebookCookie {
  key: string;
  value: string;
  domain: string;
  path: string;
  expires?: string | number;
}

export interface StoredSession {
  sessionVersion: number;
  userId: string;
  cookies: FacebookCookie[];
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export class SessionStore {
  private readonly algorithm = 'aes-256-gcm';

  constructor(
    private readonly filePath: string,
    private readonly encryptionKey?: string
  ) {}

  private getKeyBuffer(): Buffer {
    if (!this.encryptionKey) {
      if (process.env.NODE_ENV === 'production') {
        // Fail-fast: never silently use a fixed key in production (audit S4)
        throw new AuthenticationError(
          'ENCRYPTION_KEY is required in production to protect the Facebook session store'
        );
      }
      logger.warn('ENCRYPTION_KEY not set — using insecure dev fallback key. NEVER do this in production.');
      return crypto.createHash('sha256').update('default_dev_session_secret_key_32_bytes!').digest();
    }
    return crypto.createHash('sha256').update(this.encryptionKey).digest();
  }

  encrypt(data: StoredSession): string {
    const key = this.getKeyBuffer();
    const iv = crypto.randomBytes(12); // 96 bits for GCM
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    const json = JSON.stringify(data);
    const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Format: iv:tag:ciphertext (hex)
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(payload: string): StoredSession {
    const parts = payload.split(':');
    if (parts.length !== 3) {
      throw new AuthenticationError('Malformed encrypted session file');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const ciphertext = Buffer.from(parts[2], 'hex');

    const key = this.getKeyBuffer();
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8')) as StoredSession;
  }

  save(session: StoredSession): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const encrypted = this.encrypt(session);
    fs.writeFileSync(this.filePath, encrypted, { encoding: 'utf8', mode: 0o600 });
    logger.info({ path: this.filePath, userId: session.userId }, 'Session saved and encrypted safely');
  }

  load(): StoredSession | null {
    if (!fs.existsSync(this.filePath)) {
      return null;
    }

    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const session = this.decrypt(raw);

      if (!this.validate(session)) {
        logger.warn('Session found on disk is invalid or missing required cookies');
        return null;
      }

      return session;
    } catch (err) {
      logger.error({ err }, 'Failed to decrypt or load session from disk');
      return null;
    }
  }

  validate(session: StoredSession): boolean {
    if (!session || session.sessionVersion !== 2 || !Array.isArray(session.cookies)) {
      return false;
    }

    // Must contain minimum required Facebook session cookies: c_user, xs
    const cookieKeys = session.cookies.map((c) => c.key);
    return cookieKeys.includes('c_user') && cookieKeys.includes('xs');
  }

  invalidate(): void {
    if (fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath);
      logger.info({ path: this.filePath }, 'Session invalidated and removed from disk');
    }
  }
}
