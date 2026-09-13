import { DatabaseSync } from 'node:sqlite';

export interface ThreadSettings {
  threadId: string;
  prefix?: string;
  aiEnabled: boolean;
  welcomeEnabled: boolean;
  leaveEnabled: boolean;
  antiSpam: boolean;
  updatedAt: Date;
}

export class ThreadSettingsRepository {
  constructor(private db: DatabaseSync) {}

  getSettings(threadId: string): ThreadSettings {
    const query = this.db.prepare('SELECT * FROM thread_settings WHERE thread_id = ?');
    const row = query.get(threadId) as any;

    if (!row) {
      return {
        threadId,
        aiEnabled: true,
        welcomeEnabled: true,
        leaveEnabled: true,
        antiSpam: false,
        updatedAt: new Date(),
      };
    }

    return {
      threadId: row.thread_id,
      prefix: row.prefix || undefined,
      aiEnabled: row.ai_enabled === 1,
      welcomeEnabled: row.welcome_enabled === 1,
      leaveEnabled: row.leave_enabled === 1,
      antiSpam: row.anti_spam === 1,
      updatedAt: new Date(row.updated_at),
    };
  }

  saveSettings(settings: Partial<ThreadSettings> & { threadId: string }): ThreadSettings {
    const current = this.getSettings(settings.threadId);
    const updated: ThreadSettings = {
      ...current,
      ...settings,
      updatedAt: new Date(),
    };

    const upsert = this.db.prepare(`
      INSERT INTO thread_settings (thread_id, prefix, ai_enabled, welcome_enabled, leave_enabled, anti_spam, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(thread_id) DO UPDATE SET
        prefix = excluded.prefix,
        ai_enabled = excluded.ai_enabled,
        welcome_enabled = excluded.welcome_enabled,
        leave_enabled = excluded.leave_enabled,
        anti_spam = excluded.anti_spam,
        updated_at = excluded.updated_at
    `);

    upsert.run(
      updated.threadId,
      updated.prefix || null,
      updated.aiEnabled ? 1 : 0,
      updated.welcomeEnabled ? 1 : 0,
      updated.leaveEnabled ? 1 : 0,
      updated.antiSpam ? 1 : 0,
      updated.updatedAt.getTime()
    );

    return updated;
  }
}
