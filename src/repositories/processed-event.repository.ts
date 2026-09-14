import { DatabaseSync } from 'node:sqlite';

/**
 * DB-backed event deduplication (Phase 10). Survives restarts so a
 * webhook delivered twice after a crash still executes the command once.
 */
export class ProcessedEventRepository {
  constructor(private db: DatabaseSync) {}

  /** Returns true if this is the first time we see (platform, messageId). */
  markIfNew(platform: string, messageId: string): boolean {
    try {
      const insert = this.db.prepare(`
        INSERT INTO processed_events (platform, message_id, received_at)
        VALUES (?, ?, ?)
      `);
      insert.run(platform, messageId, Date.now());
      return true;
    } catch (err: any) {
      // UNIQUE constraint violation -> duplicate event
      if (String(err?.message || '').includes('UNIQUE')) {
        return false;
      }
      throw err;
    }
  }

  cleanupOlderThan(cutoffMs: number): number {
    const del = this.db.prepare('DELETE FROM processed_events WHERE received_at < ?');
    const info = del.run(cutoffMs);
    return Number(info.changes);
  }
}
