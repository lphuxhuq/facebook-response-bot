import { DatabaseSync } from 'node:sqlite';
import { Conversation } from '../core/context.js';

export class ConversationRepository {
  constructor(private db: DatabaseSync) {}

  async findById(id: string): Promise<Conversation | null> {
    const query = this.db.prepare('SELECT * FROM conversations WHERE id = ?');
    const row = query.get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      platform: row.platform,
      isGroup: row.is_group === 1,
      name: row.name || undefined,
      createdAt: new Date(row.created_at),
    };
  }

  async getOrCreate(id: string, isGroup: boolean = false, name?: string): Promise<Conversation> {
    const existing = await this.findById(id);
    if (existing) return existing;

    const now = Date.now();
    const insert = this.db.prepare(`
      INSERT INTO conversations (id, platform, is_group, name, created_at)
      VALUES (?, 'facebook', ?, ?, ?)
    `);
    insert.run(id, isGroup ? 1 : 0, name || null, now);

    return {
      id,
      platform: 'facebook',
      isGroup,
      name,
      createdAt: new Date(now),
    };
  }
}
