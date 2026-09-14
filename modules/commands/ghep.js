const { createCanvas, canvasToStream, roundRect, drawProgressBar, drawRedStamp, fetchAvatarImage, drawAvatar, triggerTyping, FONT_REGULAR, FONT_BOLD } = require('../../utils/canvasHelper');

module.exports.config = {
    name: "ghep",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Remake with Canvas by Kilo",
    description: "Ghép đôi ngẫu nhiên xuất Giấy Chứng Nhận Kết Hôn kèm Avatar 2 người",
    commandCategory: "Trò Chơi",
    usages: "ghep",
    cooldowns: 15
};

module.exports.run = async function ({ api, event, Users, Threads }) {
    const { threadID, senderID, messageID } = event;
    triggerTyping(api, threadID);

    if (!event.isGroup) {
        return api.sendMessage("💔 Lệnh này chỉ dùng được trong nhóm chat đông vui thôi bạn ơi!", threadID, messageID);
    }

    const threadInfo = (await Threads.getData(threadID)).threadInfo || await api.getThreadInfo(threadID) || {};
    const botID = api.getCurrentUserID();
    const participants = (threadInfo.participantIDs || []).filter(id => id != botID && id != senderID);

    if (participants.length === 0) {
        return api.sendMessage("🥺 Nhóm này có mỗi bạn và bot, không có ai để ghép đôi đâu!", threadID, messageID);
    }

    const targetID = participants[Math.floor(Math.random() * participants.length)];
    const senderName = (await Users.getData(senderID)).name || "Người bí ẩn";
    const targetName = (await Users.getData(targetID)).name || "Người được chọn";

    const percent = Math.floor(Math.random() * 101);

    const greenFlags = [
        "Cả hai đều lười tắm như nhau",
        "Có cùng đam mê hóng drama lúc 2 giờ sáng",
        "Đều thích ăn trực và ngại rửa bát",
        "Có sở thích ngắm trai/gái đẹp chung",
        "Cùng nghèo rớt mồng tơi nhưng thích sang chảnh"
    ];

    const redFlags = [
        "Một người chuyên cắm sừng, một người thích nuôi sừng",
        "Hở tí là đòi chia tay để được dỗ dành",
        "Hay quên ví khi đi ăn với người yêu",
        "Dở hơi biết bơi, khó chiều hơn thời tiết Hà Nội"
    ];

    const gf = greenFlags[Math.floor(Math.random() * greenFlags.length)];
    const rf = redFlags[Math.floor(Math.random() * redFlags.length)];

    // Tải avatar của cả 2 bạn
    const [senderAvt, targetAvt] = await Promise.all([
        fetchAvatarImage(senderID, api),
        fetchAvatarImage(targetID, api)
    ]);

    // Vẽ Canvas Giấy Kết Hôn
    const width = 800;
    const height = 480;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Nền thiệp cưới hồng - tím sang trọng
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#3b0764');
    grad.addColorStop(0.5, '#4a044e');
    grad.addColorStop(1, '#831843');
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, width, height, 24);
    ctx.fill();

    // Khung viền chỉ vàng hoàng gia
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    roundRect(ctx, 10, 10, width - 20, height - 20, 20);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, 16, 16, width - 32, height - 32, 16);
    ctx.stroke();

    // Tiêu đề
    ctx.fillStyle = '#fde047';
    ctx.font = `bold 24px ${FONT_BOLD}`;
    ctx.textAlign = 'center';
    ctx.fillText('💍 GIẤY CHỨNG NHẬN KẾT HÔN TẠM THỜI 💍', width / 2, 52);

    ctx.fillStyle = '#fbcfe8';
    ctx.font = `italic 13px ${FONT_REGULAR}`;
    ctx.fillText('ỦY BAN NHÂN DÂN TỔ DÂN PHỐ MẠNG XÃ HỘI', width / 2, 75);

    // Box Nhà Trai & Nhà Gái
    ctx.textAlign = 'left';
    const boxY = 100;
    const boxH = 125;

    // Bên trái: Sender
    roundRect(ctx, 40, boxY, 320, boxH, 14);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = '#ec4899';
    ctx.stroke();

    drawAvatar(ctx, senderAvt, 55, boxY + 20, 85, senderName[0] || 'A', '#ec4899');
    ctx.fillStyle = '#f472b6';
    ctx.font = `bold 13px ${FONT_BOLD}`;
    ctx.fillText('BÊN A (CHỦ HỘ):', 155, boxY + 45);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 18px ${FONT_BOLD}`;
    ctx.fillText(senderName.slice(0, 16), 155, boxY + 75);
    ctx.fillStyle = '#94a3b8';
    ctx.font = `12px ${FONT_REGULAR}`;
    ctx.fillText(`ID: ${senderID.slice(0, 11)}...`, 155, boxY + 100);

    // Trái tim ở giữa
    ctx.save();
    ctx.fillStyle = '#ef4444';
    ctx.font = `bold 36px ${FONT_BOLD}`;
    ctx.textAlign = 'center';
    ctx.fillText('❤️', width / 2, boxY + 68);
    ctx.restore();

    // Bên phải: Target
    roundRect(ctx, 440, boxY, 320, boxH, 14);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = '#a855f7';
    ctx.stroke();

    drawAvatar(ctx, targetAvt, 455, boxY + 20, 85, targetName[0] || 'B', '#a855f7');
    ctx.fillStyle = '#c084fc';
    ctx.font = `bold 13px ${FONT_BOLD}`;
    ctx.fillText('BÊN B (PHỐI NGẪU):', 555, boxY + 45);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 18px ${FONT_BOLD}`;
    ctx.fillText(targetName.slice(0, 16), 555, boxY + 75);
    ctx.fillStyle = '#94a3b8';
    ctx.font = `12px ${FONT_REGULAR}`;
    ctx.fillText(`ID: ${targetID.slice(0, 11)}...`, 555, boxY + 100);

    // Thanh phần trăm hợp nhau
    ctx.fillStyle = '#fde047';
    ctx.font = `bold 15px ${FONT_BOLD}`;
    ctx.fillText(`📊 TỈ LỆ TÂM ĐẦU Ý HỢP: ${percent}%`, 40, 260);
    drawProgressBar(ctx, 40, 275, 460, 16, percent, percent > 50 ? '#ec4899' : '#eab308');

    // Box Đánh giá
    roundRect(ctx, 40, 315, 460, 130, 14);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fill();

    ctx.fillStyle = '#4ade80';
    ctx.font = `bold 14px ${FONT_BOLD}`;
    ctx.fillText(`🟢 Green Flag: ${gf.slice(0, 42)}`, 55, 348);

    ctx.fillStyle = '#f87171';
    ctx.fillText(`🔴 Red Flag: ${rf.slice(0, 42)}`, 55, 382);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = `italic 13px ${FONT_REGULAR}`;
    ctx.fillText('Lời chúc: Mong 2 bạn hạnh phúc... đến khi cãi nhau!', 55, 418);

    // Con dấu đỏ ông tơ bà nguyệt
    drawRedStamp(ctx, 650, 350, 'ÔNG TƠ BÀ NGUYỆT', 'ĐÃ DUYỆT', -0.15);

    const { stream, cleanup } = await canvasToStream(canvas);

    const msg = `💘 ───『 𝐓𝐎̛ 𝐇𝐎̂̀𝐍𝐆 𝐂𝐇𝐈̉ Đ𝐈̣𝐍𝐇 』─── 💘\n\n` +
        `👰🤵 Cặp đôi định mệnh: ${senderName} ❤️ ${targetName}\n` +
        `📊 Tỉ lệ hợp nhau: ${percent}%\n` +
        `👉 Giấy chứng nhận kết hôn đã được xuất gửi kèm bên dưới!`;

    const mentions = [
        { id: senderID, tag: senderName },
        { id: targetID, tag: targetName }
    ];

    return api.sendMessage({ body: msg, mentions, attachment: stream }, threadID, cleanup, messageID);
};
