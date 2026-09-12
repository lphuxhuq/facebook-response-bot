module.exports.config = {
    name: "ninoteach",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "DungUwU / Ponytail fix",
    description: "Dạy nino cute trả lời câu hỏi",
    commandCategory: "Chat cùng sim, nino",
    usages: "[câu hỏi] => [câu trả lời]",
    cooldowns: 2
};

const fs = require('fs-extra');
const path = require('path');

module.exports.run = async ({ api, event, args }) => {
    const { messageID, threadID } = event;
    const work = args.join(" ");
    const fw = work.indexOf(" => ");
    if (fw === -1) {
        return api.sendMessage("Sai format rồi nhé! Vui lòng dùng: câu hỏi => câu trả lời", threadID, messageID);
    }
    const ask = work.slice(0, fw).trim().toLowerCase();
    const answer = work.slice(fw + 4).trim();
    if (!ask) return api.sendMessage("Bạn chưa nhập câu hỏi kìa!", threadID, messageID);
    if (!answer) return api.sendMessage("Bạn chưa nhập câu trả lời kìa!", threadID, messageID);

    try {
        const ninoPath = path.join(__dirname, 'cache', 'nino.json');
        let data = {};
        if (fs.existsSync(ninoPath)) {
            try { data = JSON.parse(fs.readFileSync(ninoPath, 'utf8')); } catch (e) { data = {}; }
        }
        if (!data.teaches) data.teaches = {};
        if (!Array.isArray(data.teaches[ask])) data.teaches[ask] = [];
        if (data.teaches[ask].includes(answer)) {
            return api.sendMessage("Câu hỏi và câu trả lời này đã tồn tại trong trí nhớ của Nino rồi nha!", threadID, messageID);
        }
        data.teaches[ask].push(answer);
        fs.writeFileSync(ninoPath, JSON.stringify(data, null, 4), 'utf8');
        return api.sendMessage(`Dạy Nino thành công!\nKhi hỏi: "${ask}" => Nino sẽ đáp: "${answer}"`, threadID, messageID);
    } catch (e) {
        return api.sendMessage("Lỗi khi lưu bài học cho Nino: " + e.message, threadID, messageID);
    }
};