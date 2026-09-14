module.exports.config = {
    name: "work",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Remake by Kilo",
    description: "Cày cuốc kiếm tiền với đủ nghề meme cực bựa",
    commandCategory: "Kiếm Tiền",
    cooldowns: 5,
    envConfig: {
        cooldownTime: 45000
    }
};

module.exports.run = async ({ event, api, Currencies }) => {
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
        { title: "Xách vữa phụ hồ cho thầy Lộc Fuho dưới cái nắng 40 độ", gain: Math.floor(Math.random() * 20000) + 10000 },
        { title: "Bán trà sữa vỉa hè, bị trật tự đô thị rượt chạy té khói nhưng kịp vơ thùng tiền", gain: Math.floor(Math.random() * 25000) + 8000 },
        { title: "Làm Content Creator nhảy nhót biến hình trên TikTok được donate", gain: Math.floor(Math.random() * 35000) + 15000 },
        { title: "Code dạo đồ án tốt nghiệp thuê cho sinh viên, may mắn không bị bùng tiền", gain: Math.floor(Math.random() * 45000) + 20000 },
        { title: "Đi bắt cua đồng ban đêm, vớ được củ khoai tây khổng lồ đem ra chợ bán", gain: Math.floor(Math.random() * 15000) + 5000 },
        { title: "Livestream bán kem trộn hét khản cả cổ họng, chốt được 100 đơn", gain: Math.floor(Math.random() * 40000) + 12000 },
        { title: "Lái xe ôm công nghệ đón trúng em gái mưa dễ thương bo thêm tiền nước", gain: Math.floor(Math.random() * 22000) + 7000 },
        { title: "Làm nhân viên văn phòng 8 tiếng xem Youtube 7 tiếng, cuối tháng sếp vẫn phát lương", gain: Math.floor(Math.random() * 30000) + 10000 },
        { title: "Đi nhặt ve chai sau đêm nhạc hội, nhặt được cái iPhone vỡ màn hình đem bán xác", gain: Math.floor(Math.random() * 28000) + 9000 },
        { title: "Làm trọng tài bắt trận bóng đá phủi bị khán đài ném dép, nhận tiền bảo hiểm chấn thương", gain: Math.floor(Math.random() * 18000) + 6000 }
    ];

    const pick = jobs[Math.floor(Math.random() * jobs.length)];
    data.workTime = Date.now();

    await Currencies.increaseMoney(senderID, pick.gain);
    await Currencies.setData(senderID, { data });

    const totalMoney = (userCur.money || 0) + pick.gain;
    const msg = `🛠️ ───『 𝐋𝐀𝐎 Đ𝐎̣̂𝐍𝐆 𝐋𝐀̀ 𝐕𝐈𝐍𝐇 𝐐𝐔𝐀𝐍𝐆 』─── 🛠️\n\n👷 Bạn đã đi làm: ${pick.title}.\n\n💵 Tiền lương thực nhận: +${pick.gain.toLocaleString()}$\n💳 Tổng tài sản hiện có: ${totalMoney.toLocaleString()}$`;

    return api.sendMessage(msg, threadID, messageID);
};
