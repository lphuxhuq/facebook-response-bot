import { DatabaseSync } from 'node:sqlite';

export interface AuditLogEntry {
  userId?: string;
  conversationId?: string;
  action: string;
  details?: Record<string, any>;
}

export class AuditLogRepository {
  constructor(private db: DatabaseSync) {}

  log(entry: AuditLogEntry): void {
    const insert = this.db.prepare(`
      INSERT INTO audit_logs (user_id, conversation_id, action, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    insert.run(
      entry.userId || null,
      entry.conversationId || null,
      entry.action,
      entry.details ? JSON.stringify(entry.details) : null,
      Date.now()
    );
  }

  getRecent(limit: number = 50): any[] {
    const query = this.db.prepare(`
      SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?
    `);
    return query.all(limit);
  }
}
