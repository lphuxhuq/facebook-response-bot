import { createCanvas, loadImage, GlobalFonts, SKRSContext2D } from '@napi-rs/canvas';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FONTS_DIR = join(__dirname, 'fonts');

let fontsRegistered = false;

export function ensureFonts(): void {
  if (fontsRegistered) return;
  const fontFiles = [
    { file: 'bold-font.ttf', family: 'BotBold' },
    { file: 'regular-font.ttf', family: 'BotRegular' },
    { file: 'Play-Bold.ttf', family: 'PlayBold' },
    { file: 'SplineSans.ttf', family: 'SplineSans' },
    { file: 'SplineSans-Medium.ttf', family: 'SplineSansMedium' },
  ];
  for (const f of fontFiles) {
    const p = join(FONTS_DIR, f.file);
    if (existsSync(p)) {
      try {
        GlobalFonts.registerFromPath(p, f.family);
      } catch {
        // Font may already be registered or unsupported — ignore
      }
    }
  }
  fontsRegistered = true;
}

export interface CanvasRenderResult {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

export async function renderToPng(canvas: import('@napi-rs/canvas').Canvas): Promise<CanvasRenderResult> {
  const buffer = await canvas.encode('png');
  return {
    buffer,
    contentType: 'image/png',
    filename: `canvas_${Date.now()}_${Math.floor(Math.random() * 10000)}.png`,
  };
}

export async function loadRemoteImage(url: string): Promise<import('@napi-rs/canvas').Image | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FacebookResponseBotV2/2.0' },
      timeout: 10000,
    } as RequestInit);
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    return await loadImage(bytes);
  } catch {
    return null;
  }
}

export { createCanvas, loadImage, GlobalFonts };
export type { SKRSContext2D };

/**
 * Draw rounded rectangle path helper (mirrors canvas roundRect where unavailable).
 */
export function roundRectPath(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Wrap text into lines that fit maxWidth, returns line array.
 */
export function wrapText(ctx: SKRSContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const ch of text) {
    if (ch === '\n') {
      lines.push(current);
      current = '';
      continue;
    }
    const test = current + ch;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = ch;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
