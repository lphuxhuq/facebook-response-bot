module.exports.config = {
    name: "dhbcv2",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "DVB / Ponytail fix",
    description: "Game đuổi hình bắt chữ emoji vui nhộn",
    commandCategory: "Trò Chơi",
    usages: "",
    cooldowns: 5
};

const path = require('path');
const fs = require('fs-extra');

module.exports.run = async function ({ api, event }) {
    const qPath = path.join(__dirname, 'cache', 'dhbc_emoji.json');
    let questions = [];
    if (fs.existsSync(qPath)) {
        try { questions = JSON.parse(fs.readFileSync(qPath, 'utf8')); } catch (e) { questions = []; }
    }
    if (!questions.length) {
        questions = [
            { emoji1: "🌸", emoji2: "🌸", wordcomplete: "hoa mắt" },
            { emoji1: "☕", emoji2: "🍵", wordcomplete: "cà phê sữa" },
            { emoji1: "🐟", emoji2: "🔥", wordcomplete: "cá nướng" },
            { emoji1: "🌧️", emoji2: "🌈", wordcomplete: "cầu vồng" }
        ];
    }
    const random = questions[Math.floor(Math.random() * questions.length)];
    const msg = {
        body: `🎮 [ ĐUỔI HÌNH BẮT CHỮ EMOJI ] 🎮\n━━━━━━━━━━━━━━━━━\n👉 Hình gợi ý: ${random.emoji1} ${random.emoji2}\n👉 Gợi ý chữ: ${random.wordcomplete.replace(/\S/g, "█ ")}\n\n💡 Hãy reply (phản hồi) tin nhắn này kèm câu trả lời của bạn!`
    };

    api.sendMessage(msg, event.threadID, (error, info) => {
        global.client.handleReply.push({
            type: "reply",
            name: module.exports.config.name,
            author: event.senderID,
            messageID: info.messageID,
            wordcomplete: random.wordcomplete
        });
    });
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
    if (handleReply.type !== "reply") return;
    const { author, wordcomplete } = handleReply;
    if (event.senderID !== author) {
        return api.sendMessage("Bạn không phải là người chơi của câu hỏi này!", event.threadID, event.messageID);
    }

    function formatText(text) {
        return (text || "")
            .normalize("NFD")
            .toLowerCase()
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .trim();
    }

    if (formatText(event.body) === formatText(wordcomplete)) {
        api.sendMessage(`🎉 Xin chúc mừng! Bạn đã trả lời hoàn toàn chính xác: "${wordcomplete}" ❤️`, event.threadID, event.messageID);
    } else {
        api.sendMessage(`Tiếc quá, sai rồi! Đáp án chính xác là: "${wordcomplete}" 🎀`, event.threadID, event.messageID);
    }
    api.unsendMessage(handleReply.messageID);
};
