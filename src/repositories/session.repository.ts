import { DatabaseSync } from 'node:sqlite';
import { ConversationSession, SessionStore } from '../core/session-manager.js';

export class SQLiteSessionStore implements SessionStore {
  constructor(private db: DatabaseSync) {}

  async get(conversationId: string, userId: string): Promise<ConversationSession | null> {
    const now = Date.now();
    const query = this.db.prepare(`
      SELECT * FROM conversation_sessions 
      WHERE conversation_id = ? AND user_id = ? AND expires_at > ?
      LIMIT 1
    `);
    const row = query.get(conversationId, userId, now) as any;
    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      conversationId: row.conversation_id,
      command: row.command,
      step: row.step || undefined,
      state: JSON.parse(row.state),
      createdAt: new Date(row.created_at),
      expiresAt: new Date(row.expires_at),
    };
  }

  async set(session: ConversationSession): Promise<void> {
    const upsert = this.db.prepare(`
      INSERT INTO conversation_sessions (id, user_id, conversation_id, command, step, state, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        step = excluded.step,
        state = excluded.state,
        expires_at = excluded.expires_at
    `);

    upsert.run(
      session.id,
      session.userId,
      session.conversationId,
      session.command,
      session.step || null,
      JSON.stringify(session.state),
      session.createdAt.getTime(),
      session.expiresAt.getTime()
    );
  }

  async delete(conversationId: string, userId: string): Promise<void> {
    const del = this.db.prepare(`
      DELETE FROM conversation_sessions 
      WHERE conversation_id = ? AND user_id = ?
    `);
    del.run(conversationId, userId);
  }

  async cleanupExpired(): Promise<number> {
    const now = Date.now();
    const del = this.db.prepare(`
      DELETE FROM conversation_sessions 
      WHERE expires_at <= ?
    `);
    const info = del.run(now);
    return Number(info.changes);
  }
}
