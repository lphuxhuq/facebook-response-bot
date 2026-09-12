module.exports.config = {
    name: "dhbc",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "DVB / Ponytail fix",
    description: "Đuổi hình bắt chữ & câu đố dân gian vui nhộn",
    commandCategory: "Trò Chơi",
    usages: "",
    cooldowns: 5
};

const fs = require('fs-extra');
const path = require('path');

module.exports.run = async function ({ api, event }) {
    const qPath = path.join(__dirname, 'cache', 'dhbc.json');
    let questions = [];
    if (fs.existsSync(qPath)) {
        try { questions = JSON.parse(fs.readFileSync(qPath, 'utf8')); } catch (e) { questions = []; }
    }
    if (!questions.length) {
        questions = [
            { question: "Con gì đập thì sống, không đập thì chết?", wordcomplete: "con tim" },
            { question: "Cái gì đen khi mua, đỏ khi dùng và xám xịt khi vứt đi?", wordcomplete: "than" }
        ];
    }
    const item = questions[Math.floor(Math.random() * questions.length)];

    const msg = {
        body: `🎯 [ ĐỐ VUI BẮT CHỮ ] 🎯\n━━━━━━━━━━━━━━━━━\n❓ Câu hỏi: ${item.question}\n👉 Gợi ý: ${item.wordcomplete.replace(/\S/g, "█ ")}\n\n💡 Hãy reply (phản hồi) tin nhắn này với câu trả lời!`
    };

    return api.sendMessage(msg, event.threadID, (error, info) => {
        global.client.handleReply.push({
            type: "reply",
            name: module.exports.config.name,
            author: event.senderID,
            messageID: info.messageID,
            wordcomplete: item.wordcomplete
        });
    }, event.messageID);
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
