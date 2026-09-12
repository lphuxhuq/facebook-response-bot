const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "mine",
  version: "2.0.0",
  credits: "Thiệu Trung Kiên / Ponytail fix",
  description: "Trò chơi đào đá và khoáng sản kiếm tiền",
  usages: "mine [dangky/shop/dao/sua/nangcap]",
  commandCategory: "Trò Chơi",
  cooldowns: 2
};

const pickaxes = [
  { id: 1, name: "Cúp Gỗ", price: 500, durability: 20, multiplier: 1 },
  { id: 2, name: "Cúp Đá", price: 1000, durability: 40, multiplier: 1.3 },
  { id: 3, name: "Cúp Sắt", price: 2500, durability: 80, multiplier: 1.8 },
  { id: 4, name: "Cúp Vàng", price: 5000, durability: 150, multiplier: 2.5 },
  { id: 5, name: "Cúp Kim Cương", price: 15000, durability: 400, multiplier: 4 }
];

const ores = [
  { name: "Đá Thường", rarity: "Phổ Biến (40%)", min: 50, max: 150, weight: 40 },
  { name: "Than Đá", rarity: "Bình Thường (25%)", min: 150, max: 350, weight: 25 },
  { name: "Quặng Sắt", rarity: "Hiếm (18%)", min: 400, max: 800, weight: 18 },
  { name: "Quặng Vàng", rarity: "Cực Hiếm (12%)", min: 1000, max: 2500, weight: 12 },
  { name: "Kim Cương", rarity: "Huyền Thoại (5%)", min: 5000, max: 12000, weight: 5 }
];

function getMineData() {
  const dir = path.join(__dirname, 'cache');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const dataPath = path.join(dir, 'mine_data.json');
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify({ users: {} }, null, 2), 'utf-8');
    return { dataPath, data: { users: {} } };
  }
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    if (!data.users) data.users = {};
    return { dataPath, data };
  } catch (e) {
    return { dataPath, data: { users: {} } };
  }
}

function saveMineData(dataPath, data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
}

function pickRandomOre() {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const ore of ores) {
    cumulative += ore.weight;
    if (rand <= cumulative) return ore;
  }
  return ores[0];
}

module.exports.run = async function ({ api, event, args, Currencies, Users }) {
  const { threadID, messageID, senderID } = event;
  const { dataPath, data } = getMineData();
  const sub = (args[0] || "").toLowerCase();

  // Đăng ký
  if (sub === "dangky" || sub === "register") {
    if (data.users[senderID]) {
      return api.sendMessage("[ HỆ THỐNG MINE ] - Bạn đã đăng ký làm thợ mỏ rồi!", threadID, messageID);
    }
    const name = (await Users.getData(senderID))?.name || "Thợ Mỏ";
    data.users[senderID] = {
      name: name,
      pickaxe: null,
      level: 1,
      lastMine: 0,
      totalMined: 0
    };
    saveMineData(dataPath, data);
    return api.sendMessage(`[ HỆ THỐNG MINE ] - Chúc mừng ${name} đã gia nhập hội thợ mỏ! Dùng: '!mine shop' để mua chiếc cúp đầu tiên.`, threadID, messageID);
  }

  // Shop Cúp
  if (sub === "shop" || sub === "cup") {
    let msg = "=====[ CỬA HÀNG CÚP ĐÀO ]=====\n\n";
    pickaxes.forEach(p => {
      msg += `[ ${p.id} ] ${p.name} - Giá: ${p.price.toLocaleString()}$\n  + Độ bền: ${p.durability} lượt | Hệ số thưởng: x${p.multiplier}\n\n`;
    });
    msg += "👉 Dùng: !mine buy <1-5> để mua cúp tương ứng.";
    return api.sendMessage(msg, threadID, messageID);
  }

  // Mua cúp
  if (sub === "buy" || sub === "mua") {
    const user = data.users[senderID];
    if (!user) return api.sendMessage("[ HỆ THỐNG MINE ] - Bạn chưa đăng ký! Dùng: !mine dangky", threadID, messageID);
    const pickId = parseInt(args[1]);
    const pick = pickaxes.find(p => p.id === pickId);
    if (!pick) return api.sendMessage("[ HỆ THỐNG MINE ] - Không tìm thấy loại cúp này! Dùng !mine shop để xem danh sách.", threadID, messageID);

    const userMoney = (await Currencies.getData(senderID))?.money || 0;
    if (userMoney < pick.price) {
      return api.sendMessage(`[ HỆ THỐNG MINE ] - Bạn không đủ tiền! Cần ${pick.price.toLocaleString()}$, bạn chỉ có ${userMoney.toLocaleString()}$.`, threadID, messageID);
    }

    await Currencies.decreaseMoney(senderID, pick.price);
    user.pickaxe = {
      id: pick.id,
      name: pick.name,
      durability: pick.durability,
      maxDurability: pick.durability,
      multiplier: pick.multiplier
    };
    saveMineData(dataPath, data);
    return api.sendMessage(`[ HỆ THỐNG MINE ] - Bạn đã mua thành công ${pick.name}! Hãy dùng: !mine dao để bắt đầu khai thác mỏ.`, threadID, messageID);
  }

  // Đào mỏ
  if (sub === "dao" || sub === "mine") {
    const user = data.users[senderID];
    if (!user) return api.sendMessage("[ HỆ THỐNG MINE ] - Bạn chưa đăng ký! Dùng: !mine dangky", threadID, messageID);
    if (!user.pickaxe) return api.sendMessage("[ HỆ THỐNG MINE ] - Bạn chưa có cúp! Dùng: !mine shop để mua cúp.", threadID, messageID);
    if (user.pickaxe.durability <= 0) {
      return api.sendMessage("[ HỆ THỐNG MINE ] - Cúp của bạn đã gãy hỏng! Dùng: !mine sua để phục hồi độ bền (Phí: 300$).", threadID, messageID);
    }

    const now = Date.now();
    const cooldown = 15 * 1000;
    if (user.lastMine && now - user.lastMine < cooldown) {
      const waitSec = Math.ceil((cooldown - (now - user.lastMine)) / 1000);
      return api.sendMessage(`[ HỆ THỐNG MINE ] - Nghỉ tay chút nào thợ mỏ! Vui lòng chờ thêm ${waitSec} giây.`, threadID, messageID);
    }

    user.lastMine = now;
    user.pickaxe.durability -= 1;
    user.totalMined = (user.totalMined || 0) + 1;

    const ore = pickRandomOre();
    const rawVal = Math.floor(Math.random() * (ore.max - ore.min + 1)) + ore.min;
    const finalVal = Math.floor(rawVal * (user.pickaxe.multiplier || 1));

    await Currencies.increaseMoney(senderID, finalVal);
    saveMineData(dataPath, data);

    return api.sendMessage(
      `⛏️ [ KHAI THÁC MỎ THÀNH CÔNG ]\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `💎 Quặng đào được: ${ore.name}\n` +
      `🌟 Độ hiếm: ${ore.rarity}\n` +
      `💵 Bán được: +${finalVal.toLocaleString()}$ (Cúp x${user.pickaxe.multiplier})\n` +
      `🛠️ Độ bền cúp còn: ${user.pickaxe.durability}/${user.pickaxe.maxDurability}`,
      threadID,
      messageID
    );
  }

  // Sửa cúp
  if (sub === "sua" || sub === "repair") {
    const user = data.users[senderID];
    if (!user || !user.pickaxe) return api.sendMessage("[ HỆ THỐNG MINE ] - Bạn chưa có cúp để sửa!", threadID, messageID);
    const repairCost = 300;
    const userMoney = (await Currencies.getData(senderID))?.money || 0;
    if (userMoney < repairCost) return api.sendMessage(`[ HỆ THỐNG MINE ] - Bạn cần ${repairCost}$ để sửa chữa cúp!`, threadID, messageID);

    await Currencies.decreaseMoney(senderID, repairCost);
    user.pickaxe.durability = user.pickaxe.maxDurability;
    saveMineData(dataPath, data);
    return api.sendMessage(`[ HỆ THỐNG MINE ] - Đã sửa cúp ${user.pickaxe.name} hoàn chỉnh về độ bền ${user.pickaxe.durability}/${user.pickaxe.maxDurability}!`, threadID, messageID);
  }

  // Default menu with handleReply
  return api.sendMessage(
    `=====[ HỆ THỐNG ĐÀO KHOÁNG SẢN ]=====\n\n` +
    `[ 1 ] Đăng Ký Thợ Mỏ\n` +
    `[ 2 ] Cửa Hàng Mua Cúp\n` +
    `[ 3 ] Đi Đào Khoáng Sản\n` +
    `[ 4 ] Sửa Chữa Cúp Gãy\n\n` +
    `👉 Reply (phản hồi) tin nhắn này số 1, 2, 3 hoặc 4 để chọn nhanh!`,
    threadID,
    (err, info) => {
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: senderID,
        type: "menu"
      });
    },
    messageID
  );
};

module.exports.handleReply = async function ({ api, event, handleReply, Currencies, Users }) {
  if (event.senderID !== handleReply.author) return;
  const choice = (event.body || "").trim();

  switch (choice) {
    case "1":
      return module.exports.run({ api, event, args: ["dangky"], Currencies, Users });
    case "2":
      return module.exports.run({ api, event, args: ["shop"], Currencies, Users });
    case "3":
      return module.exports.run({ api, event, args: ["dao"], Currencies, Users });
    case "4":
      return module.exports.run({ api, event, args: ["sua"], Currencies, Users });
    default:
      return api.sendMessage("Lựa chọn không hợp lệ! Vui lòng reply 1, 2, 3 hoặc 4.", event.threadID, event.messageID);
  }
};