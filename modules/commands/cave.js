module.exports.config = {
    name: "cave",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Remake by Kilo",
    description: "Khởi nghiệp bán vốn tự có cực bựa và kịch tính",
    commandCategory: "Kiếm Tiền",
    cooldowns: 10,
    envConfig: {
        cooldownTime: 60000
    }
};

module.exports.run = async ({ event, api, Currencies }) => {
    const { threadID, messageID, senderID } = event;
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
            text: "💋 Bạn bắt được khách sộp là một Phú Bà đi Rolls-Royce. Phục vụ nhiệt tình từ A đến Á, được bo ngập mồm:",
            gain: Math.floor(Math.random() * 50000) + 20000
        },
        {
            text: "👴 Phục vụ cụ ông 75 tuổi hồi xuân tại khách sạn ngàn sao. Vừa đấm lưng vừa nghe cụ kể chuyện thời kháng chiến, nhận tiền công:",
            gain: Math.floor(Math.random() * 30000) + 10000
        },
        {
            text: "🔥 Gặp một em sinh viên mới lớn bỡ ngỡ. Bạn hướng dẫn tận tình các tư thế 69, 360 độ điêu luyện, em bo nóng:",
            gain: Math.floor(Math.random() * 40000) + 15000
        },
        {
            text: "😱 Đang hành sự cao trào trên giường thì vợ khách đạp cửa xông vào đánh ghen! Bạn phải nhảy cửa sổ tầng 2 tụt cả quần chạy thục mạng. May mắn nhặt vội được ví của khách:",
            gain: Math.floor(Math.random() * 25000) + 5000
        },
        {
            text: "💃 Khách là đại gia phố cổ bao nguyên đêm tại resort 5 sao, phục vụ kiệt cả tinh lực nhưng được nhận thù lao cực khủng:",
            gain: Math.floor(Math.random() * 80000) + 40000
        },
        {
            text: "🤡 Gặp đúng thánh quỵt tiền! Làm quần quật 2 tiếng xong nó bảo quên mang ví, nhét cho bạn 3 cái kẹo mút và tờ tiền lẻ:",
            gain: Math.floor(Math.random() * 500) + 200
        },
        {
            text: "🚓 Đang hành nghề tại Trần Duy Hưng thì công an phường ập vào kiểm tra hành chính! Bạn nhanh trí chui gầm giường giả làm chuột, nhặt được tiền rơi:",
            gain: Math.floor(Math.random() * 15000) + 3000
        },
        {
            text: "🕺 Gặp một anh Gymer 6 múi dồi dào sinh lực, bạn bị hành hạ suốt 4 hiệp liền mỏi hết cả hàm nhưng bù lại tiền nhiều:",
            gain: Math.floor(Math.random() * 60000) + 25000
        }
    ];

    const pick = scenarios[Math.floor(Math.random() * scenarios.length)];
    data.caveTime = Date.now();

    await Currencies.increaseMoney(senderID, pick.gain);
    await Currencies.setData(senderID, { data });

    const totalMoney = (userCur.money || 0) + pick.gain;
    const msg = `🏮 ───『 𝐏𝐇𝐎̂́ 𝐇𝐎𝐀 𝐊𝐈𝐄̂̀𝐔 』─── 🏮\n\n${pick.text}\n\n💰 Tiền kiếm được: +${pick.gain.toLocaleString()}$\n💳 Số dư hiện tại: ${totalMoney.toLocaleString()}$`;

    return api.sendMessage(msg, threadID, messageID);
};
