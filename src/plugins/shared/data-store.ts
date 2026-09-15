import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDatabase } from '../../database/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ASSETS_DIR = join(__dirname, 'assets');
const DATA_DIR = join(__dirname, '..', '..', 'data', 'plugins');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

export function readPluginAsset<T>(filename: string, fallback: T): T {
  try {
    const p = join(ASSETS_DIR, filename);
    if (!existsSync(p)) return fallback;
    const raw = JSON.parse(readFileSync(p, 'utf8'));
    if (raw === null || raw === undefined) return fallback;
    return raw as T;
  } catch {
    return fallback;
  }
}

export function readPluginData<T>(filename: string, fallback: T): T {
  try {
    const p = join(DATA_DIR, filename);
    if (!existsSync(p)) return fallback;
    const raw = JSON.parse(readFileSync(p, 'utf8'));
    if (raw === null || raw === undefined) return fallback;
    return raw as T;
  } catch {
    return fallback;
  }
}

/**
 * Atomic write: write to unique .tmp file, then renameSync over target.
 * Prevents file truncation (0 bytes) during abrupt crash/restart.
 */
export function writePluginData(filename: string, data: unknown): void {
  const p = join(DATA_DIR, filename);
  const tmp = `${p}.${process.pid}.${Date.now()}-${Math.random().toString(36).slice(2, 6)}.tmp`;
  try {
    writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    renameSync(tmp, p);
  } catch {
    try {
      if (existsSync(tmp)) unlinkSync(tmp);
    } catch {}
  }
}

/**
 * SQLite Key-Value storage for plugins with fallback to JSON
 */
export function getPluginKv<T>(key: string, fallback: T): T {
  try {
    const db = getDatabase();
    const row = db.prepare('SELECT value FROM plugin_kv WHERE key = ?').get(key) as { value: string } | undefined;
    if (row && row.value) {
      return JSON.parse(row.value) as T;
    }
  } catch {
    // Database not initialized or table not found, fallback to JSON
  }
  return readPluginData<T>(`${key}.json`, fallback);
}

export function setPluginKv<T>(key: string, value: T): void {
  let dbSaved = false;
  try {
    const db = getDatabase();
    const serialized = JSON.stringify(value);
    db.prepare(`
      INSERT INTO plugin_kv (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, serialized, Date.now());
    dbSaved = true;
  } catch {
    // Fallback to JSON file
  }
  // Also persist to JSON file for snapshot/backup compatibility
  writePluginData(`${key}.json`, value);
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function fmt(n: number): string {
  return n.toLocaleString('vi-VN');
}

