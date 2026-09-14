module.exports.config = {
    name: "ghep",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Remake by Kilo",
    description: "Ghép đôi ngẫu nhiên siêu bựa và phán xét nhân phẩm",
    commandCategory: "Trò Chơi",
    usages: "ghep",
    cooldowns: 15
};

module.exports.run = async function ({ api, event, Users, Threads }) {
    const { threadID, senderID, messageID } = event;

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
        "Có sở thích ngắm gái/trai đẹp chung",
        "Cùng nghèo rớt mồng tơi nhưng thích sang chảnh",
        "Rất hợp nhau khoản nói đạo lý nhưng sống như cặc",
        "Chuyên gia nhắn tin chậm nhưng hay dỗi"
    ];

    const redFlags = [
        "Một người chuyên cắm sừng, một người thích nuôi sừng",
        "Hở tí là đòi chia tay để được dỗ",
        "Hay quên ví khi đi ăn với người yêu",
        "Có tính lăng nhăng bẩm sinh khó chữa",
        "Hay xem story người yêu cũ rồi khóc thầm",
        "Dở hơi biết bơi, khó chiều hơn thời tiết Hà Nội"
    ];

    const predictions = [
        "Dự đoán: Yêu nhau được 3 ngày thì chia tay vì tranh nhau miếng thịt gà.",
        "Dự đoán: Cưới nhau về đẻ được 5 đứa con rồi cùng nhau đi bán vé số.",
        "Dự đoán: Tình yêu bền chặt đến khi một trong hai đứa có người giàu hơn tán.",
        "Dự đoán: Sáng cãi nhau, trưa chặn nhau, tối rủ nhau vào nhà nghỉ làm hòa.",
        "Dự đoán: Mối tình bùng cháy dữ dội nhưng kết thúc trong đồn công an.",
        "Dự đoán: Đôi bạn cùng tiến... tiến thẳng vào hố đen tình ái."
    ];

    const gf = greenFlags[Math.floor(Math.random() * greenFlags.length)];
    const rf = redFlags[Math.floor(Math.random() * redFlags.length)];
    const pred = predictions[Math.floor(Math.random() * predictions.length)];

    const mentions = [
        { id: senderID, tag: senderName },
        { id: targetID, tag: targetName }
    ];

    const msg = `💘 ───『 𝐓𝐎̛ 𝐇𝐎̂̀𝐍𝐆 𝐂𝐇𝐈̉ Đ𝐈̣𝐍𝐇 』─── 💘\n\n` +
        `👩‍❤️‍👨 Cặp đôi duyên trời định hôm nay:\n` +
        `👉 ${senderName} 💖 ${targetName}\n\n` +
        `📊 Tỉ lệ tâm đầu ý hợp: ${percent}%\n` +
        `🟢 Green Flag: ${gf}\n` +
        `🔴 Red Flag: ${rf}\n` +
        `🔮 ${pred}\n\n` +
        `👉 Hai bạn hãy nhanh chóng inbox hẹn hò hoặc dắt nhau ra gốc cây tâm sự ngay đi nhé!`;

    return api.sendMessage({ body: msg, mentions }, threadID, messageID);
};
