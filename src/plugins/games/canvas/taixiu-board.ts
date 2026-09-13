import { createCanvas, ensureFonts, renderToPng, roundRectPath, SKRSContext2D } from '../../../services/canvas/canvas.service.js';

const DICE_BG_COLORS = [
  ['#1a1a2e', '#16213e'],
  ['#0f3460', '#3a0ca3'],
  ['#3c096c', '#5a189a'],
  ['#004b23', '#0077b6'],
  ['#5f0f40', '#9a031e'],
  ['#212529', '#495057'],
];

function drawDie(ctx: SKRSContext2D, x: number, y: number, size: number, value: number): void {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRectPath(ctx, x + 4, y + 6, size, size, size * 0.18);
  ctx.fill();

  // Body
  const grad = ctx.createLinearGradient(x, y, x, y + size);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(1, '#e6e6e6');
  ctx.fillStyle = grad;
  roundRectPath(ctx, x, y, size, size, size * 0.18);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Pips
  const pad = size * 0.22;
  const r = size * 0.09;
  const c = size / 2;
  const positions: Record<number, Array<[number, number]>> = {
    1: [[c, c]],
    2: [
      [pad, pad],
      [size - pad, size - pad],
    ],
    3: [
      [pad, pad],
      [c, c],
      [size - pad, size - pad],
    ],
    4: [
      [pad, pad],
      [size - pad, pad],
      [pad, size - pad],
      [size - pad, size - pad],
    ],
    5: [
      [pad, pad],
      [size - pad, pad],
      [c, c],
      [pad, size - pad],
      [size - pad, size - pad],
    ],
    6: [
      [pad, pad],
      [size - pad, pad],
      [pad, c],
      [size - pad, c],
      [pad, size - pad],
      [size - pad, size - pad],
    ],
  };

  ctx.fillStyle = '#c0392b';
  for (const [px, py] of positions[value]) {
    ctx.beginPath();
    ctx.arc(x + px, y + py, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export interface TaixiuRenderInput {
  dice: [number, number, number];
  total: number;
  result: string; // 'tài' | 'xỉu' | 'chẵn' | 'lẻ' | 'tam chất'
  betType: string;
  win: boolean;
  bet: number;
  balance: number;
  playerName?: string;
}

export async function renderTaixiuBoard(input: TaixiuRenderInput): Promise<ReturnType<typeof renderToPng>> {
  ensureFonts();

  const W = 600;
  const H = 400;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const bg = DICE_BG_COLORS[Math.floor(Math.random() * DICE_BG_COLORS.length)];
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, bg[0]);
  grad.addColorStop(1, bg[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Title bar
  ctx.fillStyle = 'rgba(255,215,0,0.15)';
  ctx.fillRect(0, 0, W, 70);
  ctx.strokeStyle = 'rgba(255,215,0,0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 70);
  ctx.lineTo(W, 70);
  ctx.stroke();

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 36px "PlayBold", "BotBold", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TÀI XỈU', W / 2, 48);

  // Dice
  const dieSize = 110;
  const gap = 40;
  const totalW = dieSize * 3 + gap * 2;
  const startX = (W - totalW) / 2;
  const diceY = 110;

  for (let i = 0; i < 3; i++) {
    drawDie(ctx, startX + i * (dieSize + gap), diceY, dieSize, input.dice[i]);
  }

  // Total badge
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  roundRectPath(ctx, W / 2 - 70, diceY + dieSize + 20, 140, 44, 22);
  ctx.fill();
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 26px "PlayBold", "BotBold", sans-serif';
  ctx.fillText(`Tổng: ${input.total}`, W / 2, diceY + dieSize + 50);

  // Result banner
  const bannerColor = input.win ? '#27ae60' : '#c0392b';
  ctx.fillStyle = bannerColor;
  roundRectPath(ctx, 40, 300, W - 80, 60, 16);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "PlayBold", "BotBold", sans-serif';
  const resultText = `${input.result.toUpperCase()} — ${input.win ? 'THẮNG' : 'THUA'}`;
  ctx.fillText(resultText, W / 2, 338);

  // Footer info
  ctx.font = '20px "SplineSans", "BotRegular", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(
    `Cược: ${input.bet.toLocaleString('vi-VN')} coins ${input.betType ? `(${input.betType})` : ''}`,
    W / 2,
    380
  );

  return renderToPng(canvas);
}
