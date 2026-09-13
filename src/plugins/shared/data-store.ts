import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

export function writePluginData(filename: string, data: unknown): void {
  try {
    const p = join(DATA_DIR, filename);
    writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // Non-fatal — game state persistence is best-effort
  }
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function fmt(n: number): string {
  return n.toLocaleString('vi-VN');
}
