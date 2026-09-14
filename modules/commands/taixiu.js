const { createCanvas, canvasToStream, roundRect, drawRedStamp, triggerTyping } = require('../../utils/canvasHelper');

module.exports.config = {
    name: "taixiu",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Remake with Native Canvas by Kilo",
    description: "Chơi tài xỉu mở bát 3D siêu chân thực giật thưởng cực đã",
    commandCategory: "Trò Chơi",
    usages: "!taixiu [tài/xỉu] [số tiền/all]",
    cooldowns: 5
};

function drawDice(ctx, x, y, size, value) {
    ctx.save();
    roundRect(ctx, x, y, size, size, size * 0.22);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.stroke();

    const dotColor = (value === 1) ? '#ef4444' : '#0f172a';
    const dotR = (value === 1) ? size * 0.14 : size * 0.09;

    const dot = (dx, dy) => {
        ctx.beginPath();
        ctx.arc(x + size * dx, y + size * dy, dotR, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
    };

    if (value === 1) {
        dot(0.5, 0.5);
    } else if (value === 2) {
        dot(0.28, 0.28);
        dot(0.72, 0.72);
    } else if (value === 3) {
        dot(0.25, 0.25);
        dot(0.5, 0.5);
        dot(0.75, 0.75);
    } else if (value === 4) {
        dot(0.28, 0.28);
        dot(0.72, 0.28);
        dot(0.28, 0.72);
        dot(0.72, 0.72);
    } else if (value === 5) {
        dot(0.25, 0.25);
        dot(0.75, 0.25);
        dot(0.5, 0.5);
        dot(0.25, 0.75);
        dot(0.75, 0.75);
    } else if (value === 6) {
        dot(0.28, 0.22);
        dot(0.72, 0.22);
        dot(0.28, 0.5);
        dot(0.72, 0.5);
        dot(0.28, 0.78);
        dot(0.72, 0.78);
    }
    ctx.restore();
}

module.exports.run = async function ({ api, event, args, Currencies, Users }) {
    const { threadID, senderID, messageID } = event;
    triggerTyping(api, threadID);

    const choose = (args[0] || '').toLowerCase().trim();
    if (!['tài', 'tai', 't', 'xỉu', 'xiu', 'x'].includes(choose)) {
        return api.sendMessage("🎲 Cách chơi: !taixiu [tài/xỉu] [số tiền cược hoặc all]\n(Ví dụ: !taixiu tài 10000 hoặc !taixiu xỉu all)", threadID, messageID);
    }

    const isTai = ['tài', 'tai', 't'].includes(choose);
    const userBetChoice = isTai ? 'TÀI' : 'XỈU';

    const userData = await Currencies.getData(senderID);
    const userMoney = userData.money || 0;

    let betAmount = 0;
    if ((args[1] || '').toLowerCase() === 'all') {
        betAmount = userMoney;
    } else {
        betAmount = parseInt(args[1]);
    }

    if (isNaN(betAmount) || betAmount < 50) {
        return api.sendMessage("⚠️ Tiền cược tối thiểu là 50$ nha con bạc ơi!", threadID, messageID);
    }

    if (userMoney < betAmount) {
        return api.sendMessage(`💸 Bạn không đủ tiền cược! Số dư hiện tại chỉ còn: ${userMoney.toLocaleString()}$`, threadID, messageID);
    }

    // Tung 3 xúc xắc
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const d3 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2 + d3;

    // Tam bảo (3 mặt giống nhau) -> Nhà cái ăn hết
    const isTamBao = (d1 === d2 && d2 === d3);
    const resultTai = total >= 11 && total <= 17;
    const resultXiu = total >= 4 && total <= 10;

    let isWin = false;
    let resultText = '';

    if (isTamBao) {
        isWin = false;
        resultText = `TAM BẢO (${d1}-${d2}-${d3}) - NHÀ CÁI ĂN HẾT`;
    } else if (resultTai) {
        resultText = 'TÀI';
        isWin = isTai;
    } else {
        resultText = 'XỈU';
        isWin = !isTai;
    }

    if (isWin) {
        await Currencies.increaseMoney(senderID, betAmount);
    } else {
        await Currencies.decreaseMoney(senderID, betAmount);
    }

    const newBalance = isWin ? (userMoney + betAmount) : (userMoney - betAmount);
    const userName = (await Users.getData(senderID)).name || "Con bạc";

    // Vẽ Canvas Bàn Tài Xỉu
    const width = 780;
    const height = 450;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Nền Sòng Casino Xanh Lục - Đen Đẳng Cấp
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#064e3b');
    grad.addColorStop(0.5, '#022c22');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, width, height, 22);
    ctx.fill();

    // Viền vàng kim sòng bạc
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    roundRect(ctx, 6, 6, width - 12, height - 12, 18);
    ctx.stroke();

    // Tiêu đề
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎲 SÒNG BẠC HOÀNG GIA - TÀI XỈU 3D 🎲', width / 2, 45);

    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'italic 13px sans-serif';
    ctx.fillText('CỜ BẠC NGƯỜI KHÔNG CHƠI LÀ NGƯỜI THẮNG - ĐÃ CHƠI LÀ PHẢI TẤT TAY', width / 2, 70);

    // Vẽ Đĩa Đựng Xúc Xắc ở giữa
    ctx.beginPath();
    ctx.ellipse(width / 2, 175, 230, 80, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vẽ 3 viên xúc xắc
    const diceSize = 85;
    drawDice(ctx, 230, 130, diceSize, d1);
    drawDice(ctx, 345, 125, diceSize, d2);
    drawDice(ctx, 465, 135, diceSize, d3);

    // Box Kết Quả
    ctx.textAlign = 'center';
    roundRect(ctx, 160, 275, 460, 60, 14);
    ctx.fillStyle = isTamBao ? '#ef4444' : (resultTai ? '#dc2626' : '#2563eb');
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`${d1} + ${d2} + ${d3} = ${total} ➔ [ ${resultText} ]`, width / 2, 312);

    // Box Thắng / Thua bên dưới
    ctx.textAlign = 'left';
    roundRect(ctx, 40, 355, width - 80, 75, 12);
    ctx.fillStyle = isWin ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.18)';
    ctx.fill();
    ctx.strokeStyle = isWin ? '#22c55e' : '#ef4444';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`👤 Người chơi: ${userName.slice(0, 22)} | Bạn chọn: [ ${userBetChoice} ] - Cược: ${betAmount.toLocaleString()}$`, 55, 382);

    if (isWin) {
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`🎉 THẮNG CƯỢC: +${betAmount.toLocaleString()}$ | Số dư ví: ${newBalance.toLocaleString()}$`, 55, 412);
    } else {
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`💀 THUA KÈO: -${betAmount.toLocaleString()}$ (Còn lại: ${newBalance.toLocaleString()}$) - Bán xe thôi!`, 55, 412);
    }

    if (isWin) {
        drawRedStamp(ctx, 670, 320, 'SÒNG BẠC VIP', 'THẮNG LỚN', 0.15);
    } else {
        drawRedStamp(ctx, 670, 320, 'SÒNG BẠC VIP', 'CHÁY TÚI', -0.15);
    }

    const { stream, cleanup } = await canvasToStream(canvas);

    const msg = `🎲 ───『 TÀI XỈU HOÀNG GIA 』─── 🎲\n\n` +
        `🎲 Kết quả: ${d1} - ${d2} - ${d3} ➔ ${total} nút [ ${resultText} ]\n` +
        `👤 ${userName} chọn [ ${userBetChoice} ] cược ${betAmount.toLocaleString()}$\n` +
        (isWin ? `🎉 CHÚC MỪNG: Thắng +${betAmount.toLocaleString()}$!` : `💀 TOI ĐỜI: Trừ -${betAmount.toLocaleString()}$!`) + `\n` +
        `💳 Số dư ví: ${newBalance.toLocaleString()}$`;

    return api.sendMessage({ body: msg, attachment: stream }, threadID, cleanup, messageID);
};
