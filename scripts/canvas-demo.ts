import { renderTaixiuBoard } from '../src/plugins/games/canvas/taixiu-board.js';
import { renderRankCard } from '../src/plugins/games/canvas/rank-card.js';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'data', 'plugins');

(async () => {
  const png = await renderTaixiuBoard({
    dice: [4, 5, 6],
    total: 15,
    result: 'tài',
    betType: 'tài',
    win: true,
    bet: 500,
    balance: 1500,
  });
  writeFileSync(join(outDir, 'demo_taixiu.png'), png.buffer);

  const card = await renderRankCard({
    userId: '100000123',
    name: 'Demo User',
    rank: 3,
    exp: 4200,
    balance: 15000,
  });
  writeFileSync(join(outDir, 'demo_rank.png'), card.buffer);

  console.log('taixiu:', png.buffer.length, 'bytes | rank:', card.buffer.length, 'bytes');
})();
