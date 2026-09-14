const { createCanvas, canvasToStream, roundRect, drawRedStamp, triggerTyping } = require('../../utils/canvasHelper');

module.exports.config = {
    name: "cave",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Remake with Canvas by Kilo",
    description: "Khởi nghiệp bán vốn tự có xuất Hóa Đơn Dịch Vụ cực bựa",
    commandCategory: "Kiếm Tiền",
    cooldowns: 10,
    envConfig: {
        cooldownTime: 60000
    }
};

module.exports.run = async ({ event, api, Currencies, Users }) => {
    const { threadID, messageID, senderID } = event;
    triggerTyping(api, threadID);
    const cooldown = (global.configModule && global.configModule["cave"] && global.configModule["cave"].cooldownTime) || 60000;
    
    let userCur = await Currencies.getData(senderID);
    let data = userCur.data || {};
    const lastTime = data.caveTime || 0;

    if (Date.now() - lastTime < cooldown) {
        const leftSec = Math.ceil((cooldown - (Date.now() - lastTime)) / 1000);
        return api.sendMessage(`🛏️ [HÃY BIẾT GIỮ SỨC]\n\nBạn vừa đi khách xong, xương khớp đang rã rời, máy móc nóng ran!\nVui lòng dưỡng sức, tắm rửa sạch sẽ rồi quay lại sau ${leftSec} giây nữa nhé.`, threadID, messageID);
    }

    const scenarios = [
        {
            title: "Bắt khách sộp Phú Bà đi Rolls-Royce",
            desc: "Phục vụ nhiệt tình từ A đến Á, quý bà thưởng nóng cực đậm",
            gain: Math.floor(Math.random() * 50000) + 20000,
            rating: "★★★★★ (Tuyệt phẩm)"
        },
        {
            title: "Phục vụ cụ ông 75 tuổi hồi xuân",
            desc: "Vừa đấm lưng vừa nghe cụ ôn lại chuyện thời chiến, nhận tiền dưỡng lão",
            gain: Math.floor(Math.random() * 30000) + 10000,
            rating: "★★★★☆ (Ngoan ngoãn)"
        },
        {
            title: "Hướng dẫn em sinh viên mới lớn",
            desc: "Chỉ bảo tận tình các tư thế điêu luyện, em bo tiền ăn sáng",
            gain: Math.floor(Math.random() * 40000) + 15000,
            rating: "★★★★★ (Chu đáo)"
        },
        {
            title: "Bị đánh ghen nhảy cửa sổ tụt quần",
            desc: "Vợ khách ập vào, bạn nhảy tầng 2 chạy thục mạng kịp vơ ví khách",
            gain: Math.floor(Math.random() * 25000) + 5000,
            rating: "★★★☆☆ (Hú hồn)"
        },
        {
            title: "Đại gia phố cổ bao nguyên đêm",
            desc: "Bao trọn gói resort 5 sao, kiệt sức nhưng ví tiền phồng to",
            gain: Math.floor(Math.random() * 80000) + 40000,
            rating: "★★★★★ (Đẳng cấp VIP)"
        },
        {
            title: "Thánh quỵt tiền bùng nợ",
            desc: "Làm quần quật xong khách kêu quên ví, nhét cho 3 cái kẹo mút",
            gain: Math.floor(Math.random() * 500) + 200,
            rating: "★☆☆☆☆ (Cay đắng)"
        },
        {
            title: "Anh Gymer 6 múi dồi dào sinh lực",
            desc: "Hành hạ suốt 4 hiệp liền mỏi hết cả hàm, tiền công xứng đáng",
            gain: Math.floor(Math.random() * 60000) + 25000,
            rating: "★★★★★ (Mạnh mẽ)"
        }
    ];

    const pick = scenarios[Math.floor(Math.random() * scenarios.length)];
    data.caveTime = Date.now();

    await Currencies.increaseMoney(senderID, pick.gain);
    await Currencies.setData(senderID, { data });

    const totalMoney = (userCur.money || 0) + pick.gain;
    const userName = (await Users.getData(senderID)).name || "Đào VIP";

    // Vẽ Canvas Hóa Đơn Dịch Vụ
    const width = 760;
    const height = 440;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Nền Card Vàng - Đỏ sang trọng
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#2d0606');
    grad.addColorStop(0.5, '#450a0a');
    grad.addColorStop(1, '#180303');
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, width, height, 20);
    ctx.fill();

    // Viền vàng kim
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    roundRect(ctx, 6, 6, width - 12, height - 12, 16);
    ctx.stroke();

    // Header Bill
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏮 TỔNG CÔNG TY HOA KIỀU - PHIẾU THU DỊCH VỤ 🏮', width / 2, 45);

    ctx.fillStyle = '#fca5a5';
    ctx.font = 'italic 13px sans-serif';
    ctx.fillText('UY TÍN - KÍN ĐÁO - CHẤT LƯỢNG - PHỤC VỤ HẾT MÌNH', width / 2, 70);

    // Box Chi tiết hóa đơn
    ctx.textAlign = 'left';
    roundRect(ctx, 35, 95, 480, 240, 14);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`👤 Nhân viên phục vụ: ${userName.slice(0, 22)}`, 55, 130);

    ctx.fillStyle = '#fde047';
    ctx.fillText(`🏩 Kèo dịch vụ: ${pick.title}`, 55, 165);

    ctx.fillStyle = '#d1d5db';
    ctx.font = '13px sans-serif';
    ctx.fillText(`📝 Chi tiết: ${pick.desc.slice(0, 48)}`, 55, 195);

    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`⭐ Đánh giá của khách: ${pick.rating}`, 55, 230);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`💰 Thực nhận: +${pick.gain.toLocaleString()}$`, 55, 275);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '13px sans-serif';
    ctx.fillText(`💳 Tổng tích lũy sau ca: ${totalMoney.toLocaleString()}$`, 55, 305);

    // Box Cam kết
    roundRect(ctx, 35, 350, width - 70, 65, 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'italic 13px sans-serif';
    ctx.fillText('Khuyến cáo: Vui lòng bảo dưỡng máy móc, sử dụng biện pháp an toàn trước khi hành sự!', 55, 388);

    // Con dấu đỏ mộc thu tiền
    drawRedStamp(ctx, 630, 210, 'HOA KIỀU GROUP', 'ĐÃ THANH TOÁN', -0.15);

    const { stream, cleanup } = await canvasToStream(canvas);

    const msg = `🏮 ───『 𝐏𝐇𝐎̂́ 𝐇𝐎𝐀 𝐊𝐈𝐄̂̀𝐔 』─── 🏮\n\n` +
        `💃 ${pick.title}\n` +
        `📝 ${pick.desc}\n\n` +
        `💰 Tiền nhận được: +${pick.gain.toLocaleString()}$\n` +
        `💳 Số dư hiện tại: ${totalMoney.toLocaleString()}$`;

    return api.sendMessage({ body: msg, attachment: stream }, threadID, cleanup, messageID);
};
