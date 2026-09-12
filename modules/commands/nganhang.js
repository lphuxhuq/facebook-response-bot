module.exports.config = {
  name: "nganhang",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "ARAXY / Ponytail fix",
  description: "Hệ thống Ngân Hàng Mirai Bank",
  commandCategory: "Kiếm Tiền",
  usages: "[-r/register] / [check/coins] / [gửi/send <tiền>] / [rút <tiền>] / [vay <tiền>]",
  cooldowns: 2
};

const fs = require('fs-extra');
const path = require('path');

function getBankData() {
  const dir = path.join(__dirname, 'banking');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const dataPath = path.join(dir, 'banking.json');
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, "[]", "utf-8");
    return { dataPath, users: [] };
  }
  try {
    const users = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    return { dataPath, users: Array.isArray(users) ? users : [] };
  } catch (e) {
    return { dataPath, users: [] };
  }
}

function saveBankData(dataPath, users) {
  fs.writeFileSync(dataPath, JSON.stringify(users, null, 2), "utf-8");
}

module.exports.run = async function ({ api, args, event, Users, Currencies }) {
  const { threadID, messageID, senderID } = event;
  const { dataPath, users } = getBankData();
  const laisuat = 2;

  const sub = (args[0] || "").toLowerCase();

  // Đăng ký
  if (sub === "-r" || sub === "register") {
    let account = users.find(u => u.senderID == senderID);
    if (account) {
      return api.sendMessage("[ MIRAI BANK ] - Bạn đã có tài khoản ngân hàng rồi!", threadID, messageID);
    }
    const name = (await Users.getData(senderID))?.name || "Khách";
    users.push({
      senderID: senderID,
      name: name,
      money: 0,
      debt: 0,
      lastInterest: Date.now()
    });
    saveBankData(dataPath, users);
    return api.sendMessage(`[ MIRAI BANK ] - Chúc mừng ${name} đã mở tài khoản ngân hàng thành công! Gửi tiền vào để nhận lãi ${laisuat}% mỗi giờ nha.`, threadID, messageID);
  }

  // Tra cứu
  if (sub === "check" || sub === "coins" || sub === "-c") {
    let account = users.find(u => u.senderID == senderID);
    if (!account) {
      return api.sendMessage("[ MIRAI BANK ] - Bạn chưa đăng ký tài khoản. Dùng: !nganhang -r để mở tài khoản.", threadID, messageID);
    }
    return api.sendMessage(`[ MIRAI BANK ]\n👤 Chủ TK: ${account.name || senderID}\n💰 Tiền gửi: ${account.money.toLocaleString()}$\n💳 Nợ vay: ${(account.debt || 0).toLocaleString()}$\n📈 Lãi suất tiết kiệm: +${laisuat}%/giờ`, threadID, messageID);
  }

  // Gửi tiền
  if (sub === "gửi" || sub === "send" || sub === "gui") {
    let account = users.find(u => u.senderID == senderID);
    if (!account) {
      return api.sendMessage("[ MIRAI BANK ] - Bạn chưa có tài khoản. Dùng: !nganhang -r để mở tài khoản.", threadID, messageID);
    }
    const amount = parseInt(args[1]);
    if (!amount || isNaN(amount) || amount < 50) {
      return api.sendMessage("[ MIRAI BANK ] - Vui lòng nhập số tiền hợp lệ (> 50$).", threadID, messageID);
    }
    const userMoney = (await Currencies.getData(senderID))?.money || 0;
    if (userMoney < amount) {
      return api.sendMessage(`[ MIRAI BANK ] - Số dư trong ví của bạn không đủ ${amount.toLocaleString()}$ để gửi!`, threadID, messageID);
    }

    await Currencies.decreaseMoney(senderID, amount);
    account.money = (parseInt(account.money) || 0) + amount;
    saveBankData(dataPath, users);
    return api.sendMessage(`[ MIRAI BANK ] - Đã gửi ${amount.toLocaleString()}$ vào ngân hàng thành công.\nSố dư ngân hàng hiện tại: ${account.money.toLocaleString()}$`, threadID, messageID);
  }

  // Rút tiền
  if (sub === "rút" || sub === "rut" || sub === "withdraw") {
    let account = users.find(u => u.senderID == senderID);
    if (!account) {
      return api.sendMessage("[ MIRAI BANK ] - Bạn chưa có tài khoản. Dùng: !nganhang -r để mở tài khoản.", threadID, messageID);
    }
    const amount = parseInt(args[1]);
    if (!amount || isNaN(amount) || amount < 50) {
      return api.sendMessage("[ MIRAI BANK ] - Vui lòng nhập số tiền hợp lệ (> 50$).", threadID, messageID);
    }
    if ((account.money || 0) < amount) {
      return api.sendMessage(`[ MIRAI BANK ] - Số dư ngân hàng của bạn chỉ có ${(account.money || 0).toLocaleString()}$, không đủ để rút!`, threadID, messageID);
    }

    account.money -= amount;
    await Currencies.increaseMoney(senderID, amount);
    saveBankData(dataPath, users);
    return api.sendMessage(`[ MIRAI BANK ] - Rút thành công ${amount.toLocaleString()}$ về ví.\nSố dư ngân hàng còn lại: ${account.money.toLocaleString()}$`, threadID, messageID);
  }

  // Vay tiền
  if (sub === "vay" || sub === "loan") {
    let account = users.find(u => u.senderID == senderID);
    if (!account) {
      return api.sendMessage("[ MIRAI BANK ] - Bạn chưa có tài khoản. Dùng: !nganhang -r để mở tài khoản.", threadID, messageID);
    }
    const amount = parseInt(args[1]);
    const maxLoan = 50000;
    if (!amount || isNaN(amount) || amount < 100 || amount > maxLoan) {
      return api.sendMessage(`[ MIRAI BANK ] - Số tiền vay tối thiểu là 100$ và tối đa là ${maxLoan.toLocaleString()}$!`, threadID, messageID);
    }
    if ((account.debt || 0) > 0) {
      return api.sendMessage(`[ MIRAI BANK ] - Bạn đang có khoản nợ ${(account.debt || 0).toLocaleString()}$ chưa trả hết, không thể vay thêm!`, threadID, messageID);
    }

    account.debt = Math.floor(amount * 1.1); // 10% phí vay
    await Currencies.increaseMoney(senderID, amount);
    saveBankData(dataPath, users);
    return api.sendMessage(`[ MIRAI BANK ] - Vay thành công ${amount.toLocaleString()}$ (Tính lãi 10%, số nợ cần trả: ${account.debt.toLocaleString()}$). Dùng !nganhang tra để hoàn trả.`, threadID, messageID);
  }

  // Trả nợ
  if (sub === "trả" || sub === "tra" || sub === "pay") {
    let account = users.find(u => u.senderID == senderID);
    if (!account || !account.debt || account.debt <= 0) {
      return api.sendMessage("[ MIRAI BANK ] - Bạn không có khoản nợ nào cần trả!", threadID, messageID);
    }
    const userMoney = (await Currencies.getData(senderID))?.money || 0;
    const debt = account.debt;
    if (userMoney < debt) {
      return api.sendMessage(`[ MIRAI BANK ] - Bạn cần ${debt.toLocaleString()}$ để trả nợ, nhưng số dư ví chỉ có ${userMoney.toLocaleString()}$!`, threadID, messageID);
    }
    await Currencies.decreaseMoney(senderID, debt);
    account.debt = 0;
    saveBankData(dataPath, users);
    return api.sendMessage(`[ MIRAI BANK ] - Đã hoàn trả toàn bộ nợ ${debt.toLocaleString()}$ thành công!`, threadID, messageID);
  }

  // Danh sách / Hướng dẫn
  return api.sendMessage(
    `======🏦 MIRAI BANK 🏦======\n\n` +
    `• !nganhang -r: Đăng ký tài khoản ngân hàng\n` +
    `• !nganhang check: Kiểm tra số dư & khoản vay\n` +
    `• !nganhang gửi <số tiền>: Gửi tiền lấy lãi\n` +
    `• !nganhang rút <số tiền>: Rút tiền về ví\n` +
    `• !nganhang vay <số tiền>: Vay tiền ngân hàng\n` +
    `• !nganhang tra: Thanh toán khoản nợ vay`,
    threadID,
    messageID
  );
};