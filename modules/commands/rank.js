const { createCanvas, canvasToStream, roundRect, drawProgressBar, drawRedStamp, fetchAvatarImage, drawAvatar, triggerTyping, FONT_REGULAR, FONT_BOLD } = require('../../utils/canvasHelper');

module.exports.config = {
    name: "rank",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Remake with Native Canvas by Kilo",
    description: "Xem cấp độ, thứ hạng và xuất thẻ căn cước hội viên VIP kèm Avatar thật",
    commandCategory: "Box Chat",
    usages: "!rank hoặc !rank @tag",
    cooldowns: 5
};

function expToLevel(point) {
    if (!point || point < 0) return 1;
    return Math.max(1, Math.floor((Math.sqrt(1 + (4 * point) / 3) + 1) / 2));
}

function levelToExp(level) {
    if (level <= 1) return 0;
    return 3 * level * (level - 1);
}

function getRankTitle(level) {
    if (level >= 60) return "👑 THẦN THOẠI TƯƠNG TÁC";
    if (level >= 45) return "🔥 MA VƯƠNG CÀO PHÍM";
    if (level >= 30) return "⚡ CHIẾN THẦN BÀN PHÍM";
    if (level >= 15) return "💬 THỢ HÓNG HỚT CHUYÊN NGHIỆP";
    if (level >= 5) return "🌱 TẬP SỰ NĂNG NỔ";
    return "👻 TÀN HỒN NÚP LÙM";
}

async function renderRankCard({ id, name, rank, level, expCurrent, expNextLevel, money, avatarImg }) {
    const width = 880;
    const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Nền Dark Cyberpunk Gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#09090b');
    grad.addColorStop(0.5, '#18181b');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, width, height, 20);
    ctx.fill();

    // Viền Neon Cyan - Violet
    const borderGrad = ctx.createLinearGradient(0, 0, width, height);
    borderGrad.addColorStop(0, '#06b6d4');
    borderGrad.addColorStop(1, '#8b5cf6');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 3;
    roundRect(ctx, 4, 4, width - 8, height - 8, 18);
    ctx.stroke();

    // Vẽ Avatar hình tròn
    const avtSize = 140;
    drawAvatar(ctx, avatarImg, 45, 55, avtSize, name[0] || '👤', '#06b6d4');

    // Tên người dùng & Danh hiệu
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 26px ${FONT_BOLD}`;
    ctx.fillText(name.slice(0, 22), 220, 85);

    const title = getRankTitle(level);
    ctx.fillStyle = '#38bdf8';
    ctx.font = `bold 14px ${FONT_BOLD}`;
    ctx.fillText(title, 220, 115);

    // Thứ hạng Top & Level bên phải
    ctx.textAlign = 'right';
    ctx.fillStyle = '#facc15';
    ctx.font = `bold 36px ${FONT_BOLD}`;
    ctx.fillText(`#${rank}`, width - 40, 85);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `bold 14px ${FONT_BOLD}`;
    ctx.fillText('HẠNG', width - 40, 50);

    ctx.fillStyle = '#a855f7';
    ctx.font = `bold 22px ${FONT_BOLD}`;
    ctx.fillText(`Cấp ${level}`, width - 40, 120);

    // Thanh EXP
    ctx.textAlign = 'left';
    const percent = Math.min(100, Math.max(0, Math.floor((expCurrent / expNextLevel) * 100))) || 0;

    ctx.fillStyle = '#cbd5e1';
    ctx.font = `13px ${FONT_REGULAR}`;
    ctx.fillText(`Kinh nghiệm: ${expCurrent.toLocaleString()} / ${expNextLevel.toLocaleString()} EXP (${percent}%)`, 220, 160);

    ctx.fillStyle = '#f59e0b';
    ctx.font = `bold 14px ${FONT_BOLD}`;
    ctx.fillText(`💰 Tài sản: ${money.toLocaleString()}$`, 220, 185);

    drawProgressBar(ctx, 220, 205, width - 260, 18, percent, '#06b6d4', 'rgba(255, 255, 255, 0.1)');

    // Footer info
    ctx.fillStyle = '#64748b';
    ctx.font = `italic 12px ${FONT_REGULAR}`;
    ctx.fillText(`UID: ${id} | HỆ THỐNG PHONG THẦN BOT MSG V2`, 220, 260);

    // Dấu mộc thẩm định VIP
    drawRedStamp(ctx, width - 110, 220, 'HỘI VIÊN VIP', 'ĐÃ DUYỆT', -0.1);

    return canvasToStream(canvas);
}

module.exports.run = async function ({ event, api, args, Currencies, Users }) {
    const { threadID, senderID, messageID, mentions } = event;
    triggerTyping(api, threadID);

    const mentionIDs = Object.keys(mentions || {});
    const targetID = mentionIDs.length > 0 ? mentionIDs[0] : senderID;

    let allUsers = await Currencies.getAll(["userID", "exp"]);
    allUsers.sort((a, b) => (b.exp || 0) - (a.exp || 0));

    const rank = allUsers.findIndex(u => String(u.userID) === String(targetID)) + 1 || allUsers.length + 1;
    const targetName = (await Users.getData(targetID)).name || "Người dùng";
    const userData = await Currencies.getData(targetID);

    const expTotal = userData.exp || 0;
    const money = userData.money || 0;

    const level = expToLevel(expTotal);
    const baseExp = levelToExp(level);
    const nextExp = levelToExp(level + 1);

    const expCurrent = Math.max(0, expTotal - baseExp);
    const expNextLevel = Math.max(1, nextExp - baseExp);

    // Tải avatar thật của người dùng
    const avatarImg = await fetchAvatarImage(targetID, api);

    const { stream, cleanup } = await renderRankCard({
        id: targetID,
        name: targetName,
        rank,
        level,
        expCurrent,
        expNextLevel,
        money,
        avatarImg
    });

    const msg = `👑 ───『 BẢNG PHONG THẦN 』─── 👑\n\n` +
        `👤 Nhân vật: ${targetName}\n` +
        `🏆 Thứ hạng: #${rank} toàn hệ thống\n` +
        `⭐ Cấp độ: Level ${level} - [ ${getRankTitle(level)} ]\n` +
        `✨ Điểm EXP: ${expCurrent.toLocaleString()} / ${expNextLevel.toLocaleString()}\n` +
        `💵 Số dư: ${money.toLocaleString()}$\n\n` +
        `👉 Thẻ hội viên VIP đã được xuất và gửi đính kèm bên dưới!`;

    const tagMentions = [{ id: targetID, tag: targetName }];
    return api.sendMessage({ body: msg, mentions: tagMentions, attachment: stream }, threadID, cleanup, messageID);
};
