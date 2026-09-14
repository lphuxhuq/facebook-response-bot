const { createCanvas, canvasToStream, roundRect, drawRedStamp } = require('../../utils/canvasHelper');

module.exports.config = {
    name: "work",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Remake with Canvas by Kilo",
    description: "Cày cuốc kiếm tiền xuất Bảng Lương Lao Động cực bựa",
    commandCategory: "Kiếm Tiền",
    cooldowns: 5,
    envConfig: {
        cooldownTime: 45000
    }
};

module.exports.run = async ({ event, api, Currencies, Users }) => {
    const { threadID, messageID, senderID } = event;
    const cooldown = (global.configModule && global.configModule["work"] && global.configModule["work"].cooldownTime) || 45000;

    let userCur = await Currencies.getData(senderID);
    let data = userCur.data || {};
    const lastTime = data.workTime || 0;

    if (Date.now() - lastTime < cooldown) {
        const leftSec = Math.ceil((cooldown - (Date.now() - lastTime)) / 1000);
        return api.sendMessage(`⏳ [LAO ĐỘNG HĂNG SAY]\n\nBạn vừa làm việc quần quật xong, mồ hôi ướt sũng cả nách!\nHãy nghỉ ngơi uống ngụm trà đá, quay lại cày cuốc sau ${leftSec} giây nữa.`, threadID, messageID);
    }

    const jobs = [
        { title: "Xách vữa phụ hồ cho thầy Lộc Fuho", note: "Làm dưới nắng 40 độ, được thầy khen chịu khó", gain: Math.floor(Math.random() * 20000) + 10000 },
        { title: "Bán trà sữa vỉa hè chạy trật tự đô thị", note: "Chạy té khói nhưng kịp ôm thùng tiền doanh thu", gain: Math.floor(Math.random() * 25000) + 8000 },
        { title: "Làm Content Creator nhảy nhót TikTok", note: "Biến hình được lên xu hướng nhận donate khủng", gain: Math.floor(Math.random() * 35000) + 15000 },
        { title: "Code đồ án tốt nghiệp thuê cho sinh viên", note: "Fix 100 bug xuyên đêm, khách bo thêm tiền cà phê", gain: Math.floor(Math.random() * 45000) + 20000 },
        { title: "Livestream bán kem trộn hét khản cả cổ", note: "Chốt được 500 hũ kem, hoa hồng ngập mặt", gain: Math.floor(Math.random() * 40000) + 12000 },
        { title: "Lái xe ôm công nghệ đón trúng em gái mưa", note: "Em khen thơm tho bo thêm tiền nước giải khát", gain: Math.floor(Math.random() * 22000) + 7000 },
        { title: "Nhân viên văn phòng 8 tiếng xem Youtube 7 tiếng", note: "Sếp đi công tác, ngồi chill vẫn nhận lương đủ", gain: Math.floor(Math.random() * 30000) + 10000 },
        { title: "Nhặt ve chai sau đêm đại nhạc hội", note: "Nhặt được cái điện thoại rơi đem bán xác có tiền", gain: Math.floor(Math.random() * 28000) + 9000 }
    ];

    const pick = jobs[Math.floor(Math.random() * jobs.length)];
    data.workTime = Date.now();

    await Currencies.increaseMoney(senderID, pick.gain);
    await Currencies.setData(senderID, { data });

    const totalMoney = (userCur.money || 0) + pick.gain;
    const userName = (await Users.getData(senderID)).name || "Cần Lao Xuất Sắc";

    // Vẽ Canvas Phiếu Lương
    const width = 760;
    const height = 440;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Nền Dark Blue Công Nhân
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, width, height, 20);
    ctx.fill();

    // Viền xanh sáng
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    roundRect(ctx, 6, 6, width - 12, height - 12, 16);
    ctx.stroke();

    // Tiêu đề
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🛠️ TỔNG LIÊN ĐOÀN LAO ĐỘNG - PHIẾU LÃNH LƯƠNG 🛠️', width / 2, 45);

    ctx.fillStyle = '#bae6fd';
    ctx.font = 'italic 13px sans-serif';
    ctx.fillText('LAO ĐỘNG LÀ VINH QUANG - BÀN TAY TA LÀM NÊN TẤT CẢ', width / 2, 70);

    // Box Thông tin việc làm
    ctx.textAlign = 'left';
    roundRect(ctx, 35, 95, 480, 240, 14);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`👷 Cần lao: ${userName.slice(0, 24)}`, 55, 130);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`💼 Công việc: ${pick.title}`, 55, 165);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '13px sans-serif';
    ctx.fillText(`📝 Nhật ký: ${pick.note.slice(0, 48)}`, 55, 195);

    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`💵 Thực nhận: +${pick.gain.toLocaleString()}$`, 55, 245);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.fillText(`💳 Tổng tài sản tích lũy: ${totalMoney.toLocaleString()}$`, 55, 280);

    // Box Khẩu hiệu
    roundRect(ctx, 35, 350, width - 70, 65, 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'italic 13px sans-serif';
    ctx.fillText('Lời dặn: Có làm thì mới có ăn, không làm mà đòi có ăn thì chỉ có ăn bánh mì không nhân!', 55, 388);

    // Con dấu đỏ mộc phát lương
    drawRedStamp(ctx, 630, 210, 'CÔNG ĐOÀN CẦN LAO', 'ĐÃ PHÁT LƯƠNG', -0.15);

    const { stream, cleanup } = await canvasToStream(canvas);

    const msg = `🛠️ ───『 𝐋𝐀𝐎 Đ𝐎̣̂𝐍𝐆 𝐋𝐀̀ 𝐕𝐈𝐍𝐇 𝐐𝐔𝐀𝐍𝐆 』─── 🛠️\n\n` +
        `👷 Bạn đã đi làm: ${pick.title}\n` +
        `📝 ${pick.note}\n\n` +
        `💵 Tiền lương thực nhận: +${pick.gain.toLocaleString()}$\n` +
        `💳 Tổng tài sản hiện có: ${totalMoney.toLocaleString()}$`;

    return api.sendMessage({ body: msg, attachment: stream }, threadID, cleanup, messageID);
};
