const { createCanvas, canvasToStream, roundRect, drawProgressBar, drawRedStamp, fetchAvatarImage, drawAvatar, FONT_REGULAR, FONT_BOLD } = require('../../utils/canvasHelper');

module.exports.config = {
    name: "solo",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Remake with Canvas by Kilo",
    description: "Thách đấu 1v1 so trình đấm nhau giật tiền xuất thẻ sàn đấu Boxing kèm Avatar",
    commandCategory: "Trò Chơi",
    usages: "!solo @tag [tiền cược]",
    cooldowns: 10
};

module.exports.run = async function ({ api, event, args, Users, Currencies }) {
    const { threadID, senderID, messageID, mentions } = event;
    const botID = api.getCurrentUserID();

    const mentionIDs = Object.keys(mentions || {});
    if (mentionIDs.length === 0) {
        return api.sendMessage("🥊 Bạn phải tag một đối thủ vào để thách đấu 1v1 chứ! (Ví dụ: !solo @tên 5000)", threadID, messageID);
    }

    const opponentID = mentionIDs[0];
    const senderData = await Currencies.getData(senderID);
    const senderMoney = senderData.money || 0;

    let bet = parseInt(args[args.length - 1]);
    if (isNaN(bet) || bet <= 0) bet = 1000;

    if (senderMoney < bet) {
        return api.sendMessage(`💸 Bạn không đủ tiền để cá cược trận này! Số dư của bạn: ${senderMoney.toLocaleString()}$`, threadID, messageID);
    }

    const senderName = (await Users.getData(senderID)).name || "Chiến thần";
    const opponentName = mentions[opponentID].replace("@", "") || "Đối thủ";

    if (opponentID == botID) {
        return api.sendMessage(`🤖 [BOT PHẢN DÒNG]:\n\nBạn dám to gan thách đấu cả Bot à?!\nBot tung tuyệt chiêu: 『 BAN NICK BẤT DIỆT CƯỚC 』 đấm bạn văng khỏi khí quyển Trái Đất!\n\n💸 Phạt nóng bạn ${bet.toLocaleString()}$ nộp vào ngân quỹ bảo trì!`, threadID, async () => {
            await Currencies.decreaseMoney(senderID, bet);
        }, messageID);
    }

    if (opponentID == senderID) {
        return api.sendMessage("🤦 Bạn bị đa nhân cách hay sao mà tự đấm chính mình thế?", threadID, messageID);
    }

    const opponentData = await Currencies.getData(opponentID);
    const opponentMoney = opponentData.money || 0;
    if (opponentMoney < bet) {
        return api.sendMessage(`⚠️ Đối thủ ${opponentName} quá nghèo (chỉ còn ${opponentMoney.toLocaleString()}$), không đủ ${bet.toLocaleString()}$ để nhận kèo đấm nhau!`, threadID, messageID);
    }

    const moves = [
        "tung cú đá xoáy vào háng làm đối phương thốn tận rốn",
        "rút dép tổ ong ném thẳng vào mồm đối thủ cực gắt",
        "dùng thế võ cắn trộm vào mông khiến đối phương la oai oái",
        "hét lớn tung chưởng làm đối thủ giật mình ngã dập mũi",
        "tung cú đấm móc hàm chuẩn chỉ phong cách Mike Tyson"
    ];

    const isSenderWin = Math.random() < 0.5;
    const winnerID = isSenderWin ? senderID : opponentID;
    const loserID = isSenderWin ? opponentID : senderID;
    const winnerName = isSenderWin ? senderName : opponentName;
    const loserName = isSenderWin ? opponentName : senderName;

    const round1 = moves[Math.floor(Math.random() * moves.length)];
    const round2 = moves[Math.floor(Math.random() * moves.length)];

    await Currencies.decreaseMoney(loserID, bet);
    await Currencies.increaseMoney(winnerID, bet);

    // Tải avatar 2 võ sĩ
    const [senderAvt, opponentAvt] = await Promise.all([
        fetchAvatarImage(senderID, api),
        fetchAvatarImage(opponentID, api)
    ]);

    // Vẽ Canvas Sàn Đấu 1v1
    const width = 800;
    const height = 460;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Nền sàn đấu máu lửa
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1c1917');
    grad.addColorStop(0.5, '#292524');
    grad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, width, height, 20);
    ctx.fill();

    // Viền đấu trường đỏ
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4;
    roundRect(ctx, 6, 6, width - 12, height - 12, 16);
    ctx.stroke();

    // Tiêu đề sàn đấu
    ctx.fillStyle = '#facc15';
    ctx.font = `bold 22px ${FONT_BOLD}`;
    ctx.textAlign = 'center';
    ctx.fillText('🥊 SÀN ĐẤU VÕ THUẬT TỔ DÂN PHỐ 1V1 🥊', width / 2, 45);

    ctx.fillStyle = '#a8a29e';
    ctx.font = `13px ${FONT_REGULAR}`;
    ctx.fillText(`KÈO CÁ CƯỢC: ${bet.toLocaleString()}$ | TRỌNG TÀI: BOT MSG`, width / 2, 70);

    // Box Đấu sĩ bên trái (Sender)
    ctx.textAlign = 'left';
    roundRect(ctx, 35, 95, 330, 155, 14);
    ctx.fillStyle = isSenderWin ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)';
    ctx.fill();
    ctx.strokeStyle = isSenderWin ? '#22c55e' : '#ef4444';
    ctx.stroke();

    drawAvatar(ctx, senderAvt, 50, 115, 80, senderName[0] || '1', isSenderWin ? '#22c55e' : '#ef4444');

    ctx.fillStyle = '#60a5fa';
    ctx.font = `bold 12px ${FONT_BOLD}`;
    ctx.fillText('GÓC XANH (FIGHTER 1):', 145, 130);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 18px ${FONT_BOLD}`;
    ctx.fillText(senderName.slice(0, 14), 145, 158);

    ctx.fillStyle = '#facc15';
    ctx.font = `bold 12px ${FONT_BOLD}`;
    ctx.fillText(`HP: ${isSenderWin ? '85 / 100 [WIN]' : '0 / 100 [K.O]'}`, 145, 185);
    drawProgressBar(ctx, 50, 215, 300, 14, isSenderWin ? 85 : 0, isSenderWin ? '#22c55e' : '#ef4444');

    // Chữ VS ở giữa
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.font = `bold 38px ${FONT_BOLD}`;
    ctx.fillText('VS', width / 2, 180);
    ctx.restore();

    // Box Đấu sĩ bên phải (Opponent)
    roundRect(ctx, 435, 95, 330, 155, 14);
    ctx.fillStyle = !isSenderWin ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.12)';
    ctx.fill();
    ctx.strokeStyle = !isSenderWin ? '#22c55e' : '#ef4444';
    ctx.stroke();

    drawAvatar(ctx, opponentAvt, 450, 115, 80, opponentName[0] || '2', !isSenderWin ? '#22c55e' : '#ef4444');

    ctx.fillStyle = '#f87171';
    ctx.font = `bold 12px ${FONT_BOLD}`;
    ctx.fillText('GÓC ĐỎ (FIGHTER 2):', 545, 130);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 18px ${FONT_BOLD}`;
    ctx.fillText(opponentName.slice(0, 14), 545, 158);

    ctx.fillStyle = '#facc15';
    ctx.font = `bold 12px ${FONT_BOLD}`;
    ctx.fillText(`HP: ${!isSenderWin ? '70 / 100 [WIN]' : '0 / 100 [K.O]'}`, 545, 185);
    drawProgressBar(ctx, 450, 215, 300, 14, !isSenderWin ? 70 : 0, !isSenderWin ? '#22c55e' : '#ef4444');

    // Hộp diễn biến trận đấu
    roundRect(ctx, 35, 275, width - 70, 155, 14);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();

    ctx.fillStyle = '#fde047';
    ctx.font = `bold 15px ${FONT_BOLD}`;
    ctx.fillText('🔥 DIỄN BIẾN TRẬN SO TRÌNH:', 55, 305);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = `13px ${FONT_REGULAR}`;
    ctx.fillText(`▪ Hiệp 1: ${senderName} ${round1.slice(0, 70)}`, 55, 335);
    ctx.fillText(`▪ Hiệp 2: ${opponentName} ${round2.slice(0, 70)}`, 55, 365);

    ctx.fillStyle = '#4ade80';
    ctx.font = `bold 15px ${FONT_BOLD}`;
    ctx.fillText(`🏆 CHIẾN THẮNG: ${winnerName} (+${bet.toLocaleString()}$) | K.O: ${loserName}`, 55, 405);

    // Dấu K.O trên đầu người thua
    const stampX = isSenderWin ? 640 : 160;
    drawRedStamp(ctx, stampX, 175, 'HẠ ĐO VÁN', 'K.O', 0.2);

    const { stream, cleanup } = await canvasToStream(canvas);

    const msg = `⚔️ ───『 ĐẤM NHAU 1V1 TỔ DÂN PHỐ 』─── ⚔️\n\n` +
        `🥊 Đấu sĩ: ${senderName} 🆚 ${opponentName}\n` +
        `💰 Tiền cược: ${bet.toLocaleString()}$\n` +
        `🏆 Người thắng: ${winnerName} (ẵm trọn +${bet.toLocaleString()}$)\n` +
        `🚑 ${loserName} đang được chuyển viện cấp cứu bằng xe bò!`;

    const tagMentions = [
        { id: senderID, tag: senderName },
        { id: opponentID, tag: opponentName }
    ];

    return api.sendMessage({ body: msg, mentions: tagMentions, attachment: stream }, threadID, cleanup, messageID);
};
