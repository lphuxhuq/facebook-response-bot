const { createCanvas, canvasToStream, roundRect, drawProgressBar, drawRedStamp, fetchAvatarImage, drawAvatar, triggerTyping, FONT_REGULAR, FONT_BOLD } = require('../../utils/canvasHelper');

module.exports.config = {
    name: "soi",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Remake with Canvas by Kilo",
    description: "Soi độ dâm ngầm, độ xạo lìn và xuất giấy chứng nhận tâm thần kèm avatar thật",
    commandCategory: "Giải Trí",
    usages: "!soi hoặc !soi @tag",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, Users }) {
    const { threadID, senderID, messageID, mentions } = event;
    triggerTyping(api, threadID);

    const mentionIDs = Object.keys(mentions || {});
    const targetID = mentionIDs.length > 0 ? mentionIDs[0] : senderID;
    const targetName = (await Users.getData(targetID)).name || "Đối tượng bị soi";

    const today = new Date().toDateString();
    let seed = 0;
    const seedStr = targetID + today;
    for (let i = 0; i < seedStr.length; i++) {
        seed = (seed * 31 + seedStr.charCodeAt(i)) % 100000;
    }

    const dam = (seed % 101);
    const luon = ((seed * 7) % 101);
    const e = ((seed * 13) % 101);
    const simp = ((seed * 17) % 101);

    const judgments = [
        "Mặt ngoài thì ngây thơ ngoan hiền, đêm về lướt web đen tới sáng.",
        "Nói 10 câu thì có đến 9 câu rưỡi là bốc phét, sống ảo là lẽ sống.",
        "Simp chúa không lối thoát, người ta vừa rep 'ừ' đã tính đặt tên con.",
        "Nhân phẩm tuyệt vời... nhưng khoản nhậu nhẹt thì không ai cứu nổi.",
        "Tiềm năng trở thành trap boy / trap girl, thả thính dạo rồi sủi tăm.",
        "Tâm hồn thánh thiện như giấy trắng... nhưng đem đi gói xôi cháy rồi."
    ];

    const comment = judgments[seed % judgments.length];

    // Tải avatar thật của đối tượng
    const avatarImg = await fetchAvatarImage(targetID, api);

    // Vẽ Canvas Giấy Khám Bệnh Tâm Thần
    const width = 800;
    const height = 490;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Nền Dark Tech
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#111827');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, width, height, 20);
    ctx.fill();

    // Viền phát sáng
    ctx.strokeStyle = '#4338ca';
    ctx.lineWidth = 3;
    roundRect(ctx, 4, 4, width - 8, height - 8, 18);
    ctx.stroke();

    // Header bệnh viện
    ctx.fillStyle = '#ef4444';
    ctx.font = `bold 22px ${FONT_BOLD}`;
    ctx.fillText('🏥 BỆNH VIỆN TÂM THẦN TRUNG ƯƠNG', 40, 48);

    ctx.fillStyle = '#9ca3af';
    ctx.font = `13px ${FONT_REGULAR}`;
    ctx.fillText(`MÃ HỒ SƠ: #TT-${seed} | NGÀY KHÁM: ${new Date().toLocaleDateString('vi-VN')}`, 40, 72);

    // Vẽ Avatar bệnh nhân
    const avtSize = 90;
    drawAvatar(ctx, avatarImg, 40, 95, avtSize, targetName[0] || '👤', '#ef4444');

    // Tên bệnh nhân bên cạnh avatar
    ctx.fillStyle = '#f9fafb';
    ctx.font = `bold 22px ${FONT_BOLD}`;
    ctx.fillText(`BỆNH NHÂN: ${targetName.toUpperCase().slice(0, 26)}`, 145, 135);

    ctx.fillStyle = '#a5b4fc';
    ctx.font = `italic 13px ${FONT_REGULAR}`;
    ctx.fillText(`Chẩn đoán ban đầu: Rối loạn đa nhân cách & Ảo tưởng sức mạnh`, 145, 162);

    // 4 Thanh tiến trình đo chỉ số
    const startY = 205;
    const barW = 430;
    const barH = 14;

    // 1. Độ dâm ngầm
    ctx.fillStyle = '#f43f5e';
    ctx.font = `bold 14px ${FONT_BOLD}`;
    ctx.fillText('🔞 Độ Dâm Ngầm:', 40, startY);
    drawProgressBar(ctx, 40, startY + 10, barW, barH, dam, '#f43f5e', 'rgba(255,255,255,0.08)', `${dam}%`);

    // 2. Độ xạo lìn
    ctx.fillStyle = '#eab308';
    ctx.font = `bold 14px ${FONT_BOLD}`;
    ctx.fillText('🐍 Độ Xạo Lìn / Bốc Phét:', 40, startY + 48);
    drawProgressBar(ctx, 40, startY + 58, barW, barH, luon, '#eab308', 'rgba(255,255,255,0.08)', `${luon}%`);

    // 3. Khả năng ế
    ctx.fillStyle = '#06b6d4';
    ctx.font = `bold 14px ${FONT_BOLD}`;
    ctx.fillText('💔 Khả Năng Ế Cả Đời:', 40, startY + 96);
    drawProgressBar(ctx, 40, startY + 106, barW, barH, e, '#06b6d4', 'rgba(255,255,255,0.08)', `${e}%`);

    // 4. Chỉ số Simp
    ctx.fillStyle = '#a855f7';
    ctx.font = `bold 14px ${FONT_BOLD}`;
    ctx.fillText('🥺 Chỉ Số Simp Lụy Tình:', 40, startY + 144);
    drawProgressBar(ctx, 40, startY + 154, barW, barH, simp, '#a855f7', 'rgba(255,255,255,0.08)', `${simp}%`);

    // Hộp kết luận của bác sĩ
    roundRect(ctx, 40, 395, width - 80, 68, 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = `bold 14px ${FONT_BOLD}`;
    ctx.fillText('📋 KẾT LUẬN BÁC SĨ ĐIỀU TRỊ:', 55, 420);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = `italic 14px ${FONT_REGULAR}`;
    ctx.fillText(`"${comment.slice(0, 75)}"`, 55, 445);

    // Con dấu mộc đỏ
    drawRedStamp(ctx, 630, 260, 'HỘI ĐỒNG GIÁM ĐỊNH', 'TỪ CHỐI CỨU', -0.18);

    const { stream, cleanup } = await canvasToStream(canvas);

    const msg = `🔬 ───『 𝐌𝐀́𝐘 𝐒𝐎𝐈 𝐍𝐇𝐀̂𝐍 𝐏𝐇𝐀̂̉𝐌 𝟒.𝟎 』─── 🔬\n\n` +
        `👤 Hồ sơ: ${targetName}\n` +
        `🔞 Độ dâm ngầm: ${dam}% | 🐍 Độ xạo: ${luon}%\n` +
        `💔 Khả năng ế: ${e}% | 🥺 Chỉ số Simp: ${simp}%\n` +
        `👉 Bác sĩ phán: "${comment}"`;

    const tagMentions = [{ id: targetID, tag: targetName }];
    return api.sendMessage({ body: msg, mentions: tagMentions, attachment: stream }, threadID, cleanup, messageID);
};
