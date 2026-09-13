import { Command, CommandContext } from '../../../core/context.js';
import { readPluginData, writePluginData, fmt } from '../../shared/data-store.js';

interface Pickaxe {
  id: number;
  name: string;
  price: number;
  durability: number;
  multiplier: number;
}

interface UserPickaxe {
  id: number;
  name: string;
  durability: number;
  maxDurability: number;
  multiplier: number;
}

interface MineUser {
  name: string;
  pickaxe: UserPickaxe | null;
  level: number;
  lastMine: number;
  totalMined: number;
}

interface MineData {
  users: Record<string, MineUser>;
}

const PICKAXES: Pickaxe[] = [
  { id: 1, name: 'Cúp Gỗ', price: 500, durability: 20, multiplier: 1 },
  { id: 2, name: 'Cúp Đá', price: 1000, durability: 40, multiplier: 1.3 },
  { id: 3, name: 'Cúp Sắt', price: 2500, durability: 80, multiplier: 1.8 },
  { id: 4, name: 'Cúp Vàng', price: 5000, durability: 150, multiplier: 2.5 },
  { id: 5, name: 'Cúp Kim Cương', price: 15000, durability: 400, multiplier: 4 },
];

const ORES = [
  { name: 'Đá Thường', rarity: 'Phổ Biến (40%)', min: 50, max: 150, weight: 40 },
  { name: 'Than Đá', rarity: 'Bình Thường (25%)', min: 150, max: 350, weight: 25 },
  { name: 'Quặng Sắt', rarity: 'Hiếm (18%)', min: 400, max: 800, weight: 18 },
  { name: 'Quặng Vàng', rarity: 'Cực Hiếm (12%)', min: 1000, max: 2500, weight: 12 },
  { name: 'Kim Cương', rarity: 'Huyền Thoại (5%)', min: 5000, max: 12000, weight: 5 },
];

const MINE_COOLDOWN_MS = 15 * 1000;
const REPAIR_COST = 300;

function pickOre() {
  const rand = Math.random() * 100;
  let cum = 0;
  for (const ore of ORES) {
    cum += ore.weight;
    if (rand <= cum) return ore;
  }
  return ORES[0];
}

export const mineCommand: Command = {
  name: 'mine',
  aliases: ['daomo', 'thomo'],
  description: 'Trò chơi đào khoáng sản: đăng ký, mua cúp, đào mỏ kiếm tiền',
  usage: '!mine [dangky|shop|buy <id>|dao|sua|info]',
  category: 'games',
  cooldown: 2,
  async execute(ctx: CommandContext): Promise<void> {
    const userRepo = ctx.repositories?.user;
    const sub = (ctx.args[0] || '').toLowerCase();

    const data = readPluginData<MineData>('mine.json', { users: {} });
    const save = () => writePluginData('mine.json', data);

    if (sub === 'dangky' || sub === 'register' || sub === 'r') {
      if (data.users[ctx.userId]) {
        await ctx.reply('[ MINE ] Bạn đã đăng ký làm thợ mỏ rồi!');
        return;
      }
      const name = (await ctx.getUser?.())?.name || 'Thợ Mỏ';
      data.users[ctx.userId] = { name, pickaxe: null, level: 1, lastMine: 0, totalMined: 0 };
      save();
      await ctx.reply(`[ MINE ] Chúc mừng ${name} gia nhập hội thợ mỏ! Dùng !mine shop để mua cúp đầu tiên.`);
      return;
    }

    const user = data.users[ctx.userId];
    if (!user && sub) {
      await ctx.reply('[ MINE ] Bạn chưa đăng ký! Dùng: !mine dangky');
      return;
    }

    if (sub === 'shop' || sub === 'cup') {
      const lines = ['===== CỬA HÀNG CÚP ĐÀO =====', ''];
      for (const p of PICKAXES) {
        lines.push(`[ ${p.id} ] ${p.name} — ${fmt(p.price)} coins`);
        lines.push(`      Độ bền: ${p.durability} lượt | Thưởng: x${p.multiplier}`);
      }
      lines.push('', '👉 Dùng: !mine buy <1-5>');
      await ctx.reply(lines.join('\n'));
      return;
    }

    if (sub === 'buy' || sub === 'mua') {
      if (!userRepo) {
        await ctx.reply('⚠️ Cơ sở dữ liệu kinh tế chưa sẵn sàng.');
        return;
      }
      const pickId = parseInt(ctx.args[1] || '', 10);
      const pick = PICKAXES.find((p) => p.id === pickId);
      if (!pick) {
        await ctx.reply('[ MINE ] Không tìm thấy cúp này! Dùng !mine shop để xem danh sách.');
        return;
      }
      const balance = await userRepo.getBalance(ctx.userId);
      if (balance < pick.price) {
        await ctx.reply(`[ MINE ] Không đủ tiền! Cần ${fmt(pick.price)}, bạn có ${fmt(balance)}.`);
        return;
      }
      await userRepo.updateBalance(ctx.userId, -pick.price);
      user.pickaxe = {
        id: pick.id,
        name: pick.name,
        durability: pick.durability,
        maxDurability: pick.durability,
        multiplier: pick.multiplier,
      };
      save();
      await ctx.reply(`[ MINE ] Mua thành công ${pick.name}! Dùng !mine dao để bắt đầu khai thác.`);
      return;
    }

    if (sub === 'dao' || sub === 'mine') {
      if (!userRepo) {
        await ctx.reply('⚠️ Cơ sở dữ liệu kinh tế chưa sẵn sàng.');
        return;
      }
      if (!user.pickaxe) {
        await ctx.reply('[ MINE ] Bạn chưa có cúp! Dùng !mine shop để mua.');
        return;
      }
      if (user.pickaxe.durability <= 0) {
        await ctx.reply(`[ MINE ] Cúp đã gãy! Dùng !mine sua để phục hồi (${REPAIR_COST} coins).`);
        return;
      }
      const now = Date.now();
      if (now - user.lastMine < MINE_COOLDOWN_MS) {
        const wait = Math.ceil((MINE_COOLDOWN_MS - (now - user.lastMine)) / 1000);
        await ctx.reply(`[ MINE ] Nghỉ tay chút thợ mỏ! Chờ thêm ${wait} giây.`);
        return;
      }

      user.lastMine = now;
      user.pickaxe.durability -= 1;
      user.totalMined += 1;

      const ore = pickOre();
      const raw = Math.floor(Math.random() * (ore.max - ore.min + 1)) + ore.min;
      const value = Math.floor(raw * user.pickaxe.multiplier);
      await userRepo.updateBalance(ctx.userId, value);
      save();

      await ctx.reply(
        [
          `⛏️ KHAI THÁC MỎ THÀNH CÔNG`,
          '━━━━━━━━━━━━━━━━━',
          `💎 Quặng: ${ore.name}`,
          `🌟 Độ hiếm: ${ore.rarity}`,
          `💵 Bán được: +${fmt(value)} coins (Cúp x${user.pickaxe.multiplier})`,
          `🛠️ Độ bền cúp: ${user.pickaxe.durability}/${user.pickaxe.maxDurability}`,
          `📊 Tổng lượt đào: ${user.totalMined}`,
        ].join('\n')
      );
      return;
    }

    if (sub === 'sua' || sub === 'repair') {
      if (!userRepo) {
        await ctx.reply('⚠️ Cơ sở dữ liệu kinh tế chưa sẵn sàng.');
        return;
      }
      if (!user?.pickaxe) {
        await ctx.reply('[ MINE ] Bạn chưa có cúp để sửa!');
        return;
      }
      const balance = await userRepo.getBalance(ctx.userId);
      if (balance < REPAIR_COST) {
        await ctx.reply(`[ MINE ] Cần ${REPAIR_COST} coins để sửa cúp!`);
        return;
      }
      await userRepo.updateBalance(ctx.userId, -REPAIR_COST);
      user.pickaxe.durability = user.pickaxe.maxDurability;
      save();
      await ctx.reply(`[ MINE ] Đã sửa ${user.pickaxe.name} về độ bền ${user.pickaxe.durability}/${user.pickaxe.maxDurability}!`);
      return;
    }

    if (sub === 'info') {
      if (!user) {
        await ctx.reply('[ MINE ] Bạn chưa đăng ký! Dùng: !mine dangky');
        return;
      }
      const lines = [
        '===== THÔNG TIN THỢ MỎ =====',
        `👤 Tên: ${user.name}`,
        `⭐ Cấp: ${user.level}`,
        user.pickaxe
          ? `🛠️ Cúp: ${user.pickaxe.name} (${user.pickaxe.durability}/${user.pickaxe.maxDurability}, x${user.pickaxe.multiplier})`
          : '🛠️ Cúp: (chưa có)',
        `📊 Tổng lượt đào: ${user.totalMined}`,
      ];
      await ctx.reply(lines.join('\n'));
      return;
    }

    await ctx.reply(
      [
        '===== HỆ THỐNG ĐÀO KHOÁNG SẢN =====',
        '',
        '!mine dangky — Đăng ký thợ mỏ',
        '!mine shop — Cửa hàng cúp',
        '!mine buy <1-5> — Mua cúp',
        '!mine dao — Đào khoáng sản',
        '!mine sua — Sửa cúp (300 coins)',
        '!mine info — Xem thông tin',
      ].join('\n')
    );
  },
};
