import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let dbInstance: DatabaseSync | null = null;

export function getDatabase(dbPath?: string): DatabaseSync {
  if (dbInstance && !dbPath) {
    return dbInstance;
  }

  const targetPath = dbPath || env.DATABASE_PATH;
  const isMemory = targetPath === ':memory:';

  if (!isMemory) {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  logger.info({ path: targetPath }, 'Initializing SQLite database');
  const db = new DatabaseSync(targetPath);

  // Enable WAL (Write-Ahead Logging) mode and foreign keys for high performance
  if (!isMemory) {
    db.exec('PRAGMA journal_mode = WAL;');
  }
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA synchronous = NORMAL;');

  initializeSchema(db);

  if (!dbPath) {
    dbInstance = db;
  }
  return db;
}

export function closeDatabase(): void {
  if (dbInstance) {
    logger.info('Closing SQLite database connection');
    dbInstance.close();
    dbInstance = null;
  }
}

export function initializeSchema(db: DatabaseSync): void {
  // Schema versioning for future migrations (audit gap: no versioned migrations)
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  const metaRow = db.prepare('SELECT value FROM schema_meta WHERE key = ?').get('version') as any;
  if (!metaRow) {
    db.prepare('INSERT INTO schema_meta (key, value) VALUES (?, ?)').run('version', '2');
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL DEFAULT 'facebook',
      name TEXT,
      role INTEGER NOT NULL DEFAULT 0,
      balance INTEGER NOT NULL DEFAULT 0,
      exp INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL DEFAULT 'facebook',
      is_group INTEGER NOT NULL DEFAULT 0,
      name TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversation_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      conversation_id TEXT NOT NULL,
      command TEXT NOT NULL,
      step TEXT,
      state TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_lookup ON conversation_sessions(conversation_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON conversation_sessions(expires_at);

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      conversation_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS thread_settings (
      thread_id TEXT PRIMARY KEY,
      prefix TEXT,
      ai_enabled INTEGER NOT NULL DEFAULT 1,
      welcome_enabled INTEGER NOT NULL DEFAULT 1,
      leave_enabled INTEGER NOT NULL DEFAULT 1,
      anti_spam INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      text TEXT,
      attachments TEXT,
      reply_to_id TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

    CREATE TABLE IF NOT EXISTS processed_events (
      platform TEXT NOT NULL,
      message_id TEXT NOT NULL,
      received_at INTEGER NOT NULL,
      PRIMARY KEY (platform, message_id)
    );

    CREATE TABLE IF NOT EXISTS threads (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL DEFAULT 'facebook',
      type TEXT NOT NULL DEFAULT 'UNKNOWN',
      name TEXT,
      metadata TEXT,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS thread_participants (
      thread_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'MEMBER',
      joined_at INTEGER,
      PRIMARY KEY (thread_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS scheduled_jobs (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      creator_id TEXT NOT NULL,
      type TEXT NOT NULL,
      payload TEXT,
      run_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      attempt INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS plugin_kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
}
