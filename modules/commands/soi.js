module.exports.config = {
    name: "soi",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Kilo",
    description: "Soi độ dâm ngầm, độ xạo lìn và nhân phẩm của bạn bè",
    commandCategory: "Giải Trí",
    usages: "!soi hoặc !soi @tag",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, Users }) {
    const { threadID, senderID, messageID, mentions } = event;

    const mentionIDs = Object.keys(mentions || {});
    const targetID = mentionIDs.length > 0 ? mentionIDs[0] : senderID;
    const targetName = (await Users.getData(targetID)).name || "Đối tượng bị soi";

    // Hash theo UID và ngày hôm nay để trong cùng một ngày kết quả không bị nhảy loạn xạ
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
        "Đối tượng này mặt ngoài thì giả vờ ngoan hiền trong sáng, nhưng đêm về là lướt web đen tới sáng.",
        "Nói 10 câu thì có đến 9 câu rưỡi là bốc phét, sống ảo là lẽ sống của cuộc đời.",
        "Simp chúa không lối thoát, người ta chỉ rep 'ừ' một cái là tưởng tượng ra cả cảnh đám cưới.",
        "Nhân phẩm tuyệt vời, xứng đáng làm cháu ngoan Bác Hồ... nhưng khoản nhậu nhẹt thì không ai cứu nổi.",
        "Tiềm năng trở thành trap boy / trap girl thượng thừa, chuyên gia thả thính dạo rồi sủi tăm.",
        "Tâm hồn thánh thiện như một tờ giấy trắng... nhưng giấy này đem đi gói xôi cháy mất rồi."
    ];

    const comment = judgments[seed % judgments.length];

    const msg = `🔬 ───『 𝐌𝐀́𝐘 𝐒𝐎𝐈 𝐍𝐇𝐀̂𝐍 𝐏𝐇𝐀̂̉𝐌 𝟒.𝟎 』─── 🔬\n\n` +
        `👤 Hồ sơ giám định: ${targetName}\n` +
        `📅 Ngày quét: ${new Date().toLocaleDateString("vi-VN")}\n\n` +
        `🔥 Chỉ số thực tế:\n` +
        `🔞 Độ dâm ngầm: ${dam}%\n` +
        `🐍 Độ lươn lẹo / xạo lìn: ${luon}%\n` +
        `💔 Khả năng ế cả đời: ${e}%\n` +
        `🥺 Chỉ số Simp lụy tình: ${simp}%\n\n` +
        `⚖️ ĐÁNH GIÁ TỪ HỘI ĐỒNG:\n` +
        `👉 "${comment}"`;

    const tagMentions = [{ id: targetID, tag: targetName }];
    return api.sendMessage({ body: msg, mentions: tagMentions }, threadID, messageID);
};
