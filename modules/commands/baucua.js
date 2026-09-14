const { createCanvas, canvasToStream, roundRect, drawRedStamp } = require('../../utils/canvasHelper');

module.exports.config = {
    name: "baucua",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Remake with Canvas by Kilo",
    description: "Lắc bầu cua tôm cá mở bát 3D xuất hình ảnh kết quả sống động",
    commandCategory: "Trò Chơi",
    usages: "!baucua [bầu/cua/tôm/cá/gà/nai] [tiền/all]",
    cooldowns: 5
};

const ITEMS = [
    { key: 'bau', name: 'BẦU', emoji: '🍐', color: '#16a34a' },
    { key: 'cua', name: 'CUA', emoji: '🦀', color: '#dc2626' },
    { key: 'tom', name: 'TÔM', emoji: '🦞', color: '#ea580c' },
    { key: 'ca',  name: 'CÁ',  emoji: '🐟', color: '#0284c7' },
    { key: 'ga',  name: 'GÀ',  emoji: '🐓', color: '#ca8a04' },
    { key: 'nai', name: 'NAI', emoji: '🦌', color: '#9333ea' }
];

function normalizeChoice(input) {
    const s = (input || '').toLowerCase().trim();
    if (['bầu', 'bau', '🍐'].includes(s)) return 'bau';
    if (['cua', '🦀'].includes(s)) return 'cua';
    if (['tôm', 'tom', '🦞'].includes(s)) return 'tom';
    if (['cá', 'ca', '🐟'].includes(s)) return 'ca';
    if (['gà', 'ga', '🐓'].includes(s)) return 'ga';
    if (['nai', '🦌'].includes(s)) return 'nai';
    return null;
}

function drawBaucuaDice(ctx, x, y, size, item) {
    ctx.save();
    roundRect(ctx, x, y, size, size, size * 0.2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Emoji ở giữa
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.emoji, x + size / 2, y + size / 2 - 10);

    // Tên con vật
    ctx.fillStyle = item.color;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(item.name, x + size / 2, y + size - 16);
    ctx.restore();
}

module.exports.run = async function ({ api, event, args, Currencies, Users }) {
    const { threadID, senderID, messageID } = event;

    const chosenKey = normalizeChoice(args[0]);
    if (!chosenKey) {
        return api.sendMessage("🎲 Cách chơi: !baucua [bầu/cua/tôm/cá/gà/nai] [tiền cược hoặc all]\n(Ví dụ: !baucua cua 10000 hoặc !baucua tôm all)", threadID, messageID);
    }

    const chosenItem = ITEMS.find(i => i.key === chosenKey);
    const userData = await Currencies.getData(senderID);
    const userMoney = userData.money || 0;

    let betAmount = 0;
    if ((args[1] || '').toLowerCase() === 'all') {
        betAmount = userMoney;
    } else {
        betAmount = parseInt(args[1]);
    }

    if (isNaN(betAmount) || betAmount < 50) {
        return api.sendMessage("⚠️ Tiền cược tối thiểu là 50$ nha bạn ơi!", threadID, messageID);
    }

    if (userMoney < betAmount) {
        return api.sendMessage(`💸 Bạn không đủ tiền cược! Số dư của bạn: ${userMoney.toLocaleString()}$`, threadID, messageID);
    }

    // Lắc 3 con ngẫu nhiên
    const d1 = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    const d2 = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    const d3 = ITEMS[Math.floor(Math.random() * ITEMS.length)];

    const rolled = [d1, d2, d3];
    const matchCount = rolled.filter(i => i.key === chosenKey).length;

    let winAmount = 0;
    if (matchCount > 0) {
        winAmount = betAmount * matchCount;
        await Currencies.increaseMoney(senderID, winAmount);
    } else {
        await Currencies.decreaseMoney(senderID, betAmount);
    }

    const isWin = matchCount > 0;
    const newBalance = isWin ? (userMoney + winAmount) : (userMoney - betAmount);
    const userName = (await Users.getData(senderID)).name || "Con bạc";

    // Vẽ Canvas Sới Bầu Cua
    const width = 780;
    const height = 450;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Nền Chiếu Bầu Cua Đỏ Vàng Lễ Hội
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#7f1d1d');
    grad.addColorStop(0.5, '#450a0a');
    grad.addColorStop(1, '#1c1917');
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, width, height, 22);
    ctx.fill();

    // Viền vàng
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    roundRect(ctx, 6, 6, width - 12, height - 12, 18);
    ctx.stroke();

    // Tiêu đề
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏮 SỚI BẦU CUA TÔM CÁ DÂN GIAN 🏮', width / 2, 45);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'italic 13px sans-serif';
    ctx.fillText('TẾT ĐẾN XUÂN VỀ - ĐỎ ĂN ĐEN CHỊU - ĐẶT 1 ĂN 3', width / 2, 70);

    // Vẽ Đĩa Đựng ở giữa
    ctx.beginPath();
    ctx.ellipse(width / 2, 175, 230, 80, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vẽ 3 viên xúc xắc Bầu Cua
    const diceSize = 90;
    drawBaucuaDice(ctx, 220, 130, diceSize, d1);
    drawBaucuaDice(ctx, 345, 125, diceSize, d2);
    drawBaucuaDice(ctx, 470, 130, diceSize, d3);

    // Box Kết Quả
    ctx.textAlign = 'center';
    roundRect(ctx, 160, 280, 460, 55, 14);
    ctx.fillStyle = isWin ? '#15803d' : '#991b1b';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`KẾT QUẢ: ${d1.name} • ${d2.name} • ${d3.name}`, width / 2, 315);

    // Box Người Chơi bên dưới
    ctx.textAlign = 'left';
    roundRect(ctx, 40, 355, width - 80, 75, 12);
    ctx.fillStyle = isWin ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.18)';
    ctx.fill();
    ctx.strokeStyle = isWin ? '#22c55e' : '#ef4444';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`👤 Người chơi: ${userName.slice(0, 22)} | Cửa đặt: [ ${chosenItem.name} ${chosenItem.emoji} ] - Cược: ${betAmount.toLocaleString()}$`, 55, 382);

    if (isWin) {
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`🎉 TRÚNG ${matchCount} CON: +${winAmount.toLocaleString()}$ | Số dư ví: ${newBalance.toLocaleString()}$`, 55, 412);
        drawRedStamp(ctx, 670, 320, 'SỚI BẦU CUA', `TRÚNG X${matchCount}`, 0.15);
    } else {
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`💀 KHÔNG TRÚNG CON NÀO: -${betAmount.toLocaleString()}$ (Còn lại: ${newBalance.toLocaleString()}$)`, 55, 412);
        drawRedStamp(ctx, 670, 320, 'SỚI BẦU CUA', 'XỊT KÈO', -0.15);
    }

    const { stream, cleanup } = await canvasToStream(canvas);

    const msg = `🏮 ───『 BẦU CUA TÔM CÁ 』─── 🏮\n\n` +
        `🎲 Kết quả mở bát: ${d1.name} ${d1.emoji} • ${d2.name} ${d2.emoji} • ${d3.name} ${d3.emoji}\n` +
        `👤 ${userName} đặt cửa: [ ${chosenItem.name} ${chosenItem.emoji} ] cược ${betAmount.toLocaleString()}$\n` +
        (isWin ? `🎉 THẮNG LỚN (trúng ${matchCount} nháy): +${winAmount.toLocaleString()}$!` : `💀 TOI ĐỜI: Trừ -${betAmount.toLocaleString()}$!`) + `\n` +
        `💳 Số dư ví: ${newBalance.toLocaleString()}$`;

    return api.sendMessage({ body: msg, attachment: stream }, threadID, cleanup, messageID);
};
