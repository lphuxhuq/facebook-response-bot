import { logger } from '../utils/logger.js';

export interface ConversationSession<T = any> {
  id: string;
  userId: string;
  conversationId: string;
  command: string;
  step?: string;
  state: T;
  createdAt: Date;
  expiresAt: Date;
}

export interface SessionStore {
  get(conversationId: string, userId: string): Promise<ConversationSession | null>;
  set(session: ConversationSession): Promise<void>;
  delete(conversationId: string, userId: string): Promise<void>;
  cleanupExpired(): Promise<number>;
}

export class InMemorySessionStore implements SessionStore {
  private sessions = new Map<string, ConversationSession>();

  private makeKey(conversationId: string, userId: string): string {
    return `${conversationId}:${userId}`;
  }

  async get(conversationId: string, userId: string): Promise<ConversationSession | null> {
    const key = this.makeKey(conversationId, userId);
    const session = this.sessions.get(key);
    if (!session) return null;

    if (session.expiresAt.getTime() < Date.now()) {
      this.sessions.delete(key);
      return null;
    }
    return session;
  }

  async set(session: ConversationSession): Promise<void> {
    const key = this.makeKey(session.conversationId, session.userId);
    this.sessions.set(key, session);
  }

  async delete(conversationId: string, userId: string): Promise<void> {
    const key = this.makeKey(conversationId, userId);
    this.sessions.delete(key);
  }

  async cleanupExpired(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, session] of this.sessions.entries()) {
      if (session.expiresAt.getTime() < now) {
        this.sessions.delete(key);
        cleaned++;
      }
    }
    return cleaned;
  }
}

export class SessionManager {
  private cleanupTimer?: NodeJS.Timeout;

  constructor(
    private store: SessionStore = new InMemorySessionStore(),
    private defaultTtlSec: number = 180
  ) {
    // Run background cleanup every 60 seconds
    this.cleanupTimer = setInterval(() => {
      this.store.cleanupExpired().catch((err) => {
        logger.error({ err }, 'Error cleaning up expired sessions');
      });
    }, 60000);
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  async get<T = any>(conversationId: string, userId: string): Promise<ConversationSession<T> | null> {
    return this.store.get(conversationId, userId);
  }

  async create<T = any>(
    conversationId: string,
    userId: string,
    command: string,
    state: T,
    step?: string,
    ttlSec?: number
  ): Promise<ConversationSession<T>> {
    const ttl = ttlSec ?? this.defaultTtlSec;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);

    const session: ConversationSession<T> = {
      id: `${conversationId}-${userId}-${Date.now()}`,
      userId,
      conversationId,
      command,
      step,
      state,
      createdAt: now,
      expiresAt,
    };

    await this.store.set(session);
    return session;
  }

  async update<T = any>(
    conversationId: string,
    userId: string,
    state: Partial<T>,
    step?: string
  ): Promise<ConversationSession<T> | null> {
    const existing = await this.get<T>(conversationId, userId);
    if (!existing) return null;

    const updated: ConversationSession<T> = {
      ...existing,
      step: step ?? existing.step,
      state: { ...existing.state, ...state },
    };

    await this.store.set(updated);
    return updated;
  }

  async delete(conversationId: string, userId: string): Promise<void> {
    await this.store.delete(conversationId, userId);
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}
