import { createCanvas, ensureFonts, renderToPng, roundRectPath, loadRemoteImage, SKRSContext2D } from '../../../services/canvas/canvas.service.js';

const FB_TOKEN = '6628568379%7Cc1e620fa708a1d5696fb991c1bde5662';

export interface RankCardInput {
  userId: string;
  name: string;
  rank?: number;
  exp?: number;
  balance?: number;
  messageCount?: number;
  avatarUrl?: string;
}

const RANK_COLORS: Array<[string, string]> = [
  ['#ff6a00', '#ee0979'],
  ['#00c6ff', '#0072ff'],
  ['#f7971e', '#ffd200'],
  ['#56ab2f', '#a8e063'],
  ['#6a11cb', '#2575fc'],
];

function clipCircle(ctx: SKRSContext2D, cx: number, cy: number, r: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
}

export async function renderRankCard(input: RankCardInput) {
  ensureFonts();

  const W = 900;
  const H = 280;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background
  const [c1, c2] = RANK_COLORS[Math.floor(Math.random() * RANK_COLORS.length)];
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Semi-transparent card
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRectPath(ctx, 20, 20, W - 40, H - 40, 24);
  ctx.fill();

  // Avatar (from Facebook graph or provided URL)
  const avatarUrl = input.avatarUrl || `https://graph.facebook.com/${input.userId}/picture?height=512&width=512&access_token=${FB_TOKEN}`;
  const avatar = await loadRemoteImage(avatarUrl);

  const cx = 120;
  const cy = H / 2;
  const r = 90;

  if (avatar) {
    clipCircle(ctx, cx, cy, r);
    ctx.drawImage(avatar, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px "PlayBold", "BotBold", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((input.name || '?')[0].toUpperCase(), cx, cy + 18);
  }

  // Avatar ring
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  ctx.stroke();

  // Text info
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px "PlayBold", "BotBold", sans-serif';
  const name = (input.name || 'Người dùng').slice(0, 18);
  ctx.fillText(name, 250, 90);

  ctx.font = '22px "SplineSans", "BotRegular", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText(`🆔 ID: ${input.userId}`, 250, 130);

  const exp = input.exp ?? 0;
  const balance = input.balance ?? 0;
  const rank = input.rank ?? 1;
  ctx.fillText(`⭐ EXP: ${exp.toLocaleString('vi-VN')}`, 250, 165);
  ctx.fillText(`💰 Coins: ${balance.toLocaleString('vi-VN')}`, 470, 165);
  ctx.fillText(`🏆 Hạng: #${rank}`, 250, 200);

  // Progress bar (exp toward next level — simple modulo visualization)
  const progress = Math.min(100, (exp % 1000) / 10);
  const barX = 250;
  const barY = 225;
  const barW = 400;
  const barH = 16;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRectPath(ctx, barX, barY, barW, barH, 8);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  roundRectPath(ctx, barX, barY, Math.max(barH, (barW * progress) / 100), barH, 8);
  ctx.fill();

  return renderToPng(canvas);
}
