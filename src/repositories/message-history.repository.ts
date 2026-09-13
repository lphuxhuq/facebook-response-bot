import { DatabaseSync } from 'node:sqlite';
import { NormalizedMessage } from '../transport/interfaces/message.js';

export class MessageHistoryRepository {
  constructor(private db: DatabaseSync) {}

  saveMessage(msg: NormalizedMessage): void {
    const insert = this.db.prepare(`
      INSERT OR IGNORE INTO messages (id, thread_id, sender_id, text, attachments, reply_to_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      msg.id,
      msg.threadId,
      msg.senderId,
      msg.text || null,
      msg.attachments ? JSON.stringify(msg.attachments) : null,
      msg.replyToMessageId || null,
      msg.createdAt.getTime()
    );
  }

  getRecentMessages(threadId: string, limit: number = 20): any[] {
    const query = this.db.prepare(`
      SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at DESC LIMIT ?
    `);
    const rows = query.all(threadId, limit) as any[];
    return rows.reverse(); // Chronological order
  }
}
