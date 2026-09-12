module.exports.config = {
    name: "nino",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "DungUwU / Ponytail fix",
    description: "Nói chuyện với bot Nino cute",
    commandCategory: "Chat cùng sim, nino",
    usages: "[câu hỏi]/[on,off]",
    cooldowns: 2
};

const fs = require('fs-extra');
const path = require('path');

const defaultReplies = {
    "chào": ["Chào bạn nha! Chúc bạn một ngày tốt lành!", "Hế lô bạn yêu!", "Chào cậu, Nino ở đây nè!"],
    "hi": ["Hi bạn!", "Hello! Có chuyện gì vui không bạn?", "Chào bạn dễ thương!"],
    "hello": ["Hello! Rất vui được gặp bạn!", "Chào bạn nha!", "Hế lô, hôm nay bạn thế nào?"],
    "bạn là ai": ["Mình là Nino cute hột me!", "Nino - trợ lý kiêm bạn tâm sự siêu đáng yêu của bạn đây!"],
    "bot tên gì": ["Mình tên là Nino nha!", "Tên mình là Nino nè!"],
    "ai tạo ra bạn": ["Mình được tạo ra bởi các lập trình viên tài năng!", "Do admin đẹp trai tạo ra đó hihi!"],
    "yêu bot": ["Nino cũng yêu bạn nhiều lắmmm!", "Ngoan Nino thương nha <3", "Yêu bạn 3000 luôn!"],
    "đang làm gì": ["Nino đang ngồi hóng chuyện trong nhóm nè!", "Đang đợi bạn nhắn tin đó hihi!"],
    "buồn quá": ["Đừng buồn nha, có Nino ở bên bạn nè!", "Uống cốc trà sữa cho vui vẻ lại đi nè!", "Ai làm bạn buồn, Nino đi mắng người đó cho!"]
};

function getNinoResponse(query, ninoPath) {
    const raw = query.trim().toLowerCase();
    let data = {};
    if (fs.existsSync(ninoPath)) {
        try { data = JSON.parse(fs.readFileSync(ninoPath, 'utf8')); } catch (e) { data = {}; }
    }
    const teaches = data.teaches || {};

    // 1. Exact match in learned answers
    if (teaches[raw] && teaches[raw].length > 0) {
        const answers = teaches[raw];
        return answers[Math.floor(Math.random() * answers.length)];
    }

    // 2. Partial match in learned answers
    for (const [k, v] of Object.entries(teaches)) {
        if (raw.includes(k) || k.includes(raw)) {
            if (Array.isArray(v) && v.length > 0) {
                return v[Math.floor(Math.random() * v.length)];
            }
        }
    }

    // 3. Match default dictionary
    for (const [k, v] of Object.entries(defaultReplies)) {
        if (raw.includes(k)) {
            return v[Math.floor(Math.random() * v.length)];
        }
    }

    // 4. Fallback prompt to teach
    return `Nino chưa hiểu câu này :<\nHãy dùng: !ninoteach ${query} => [câu trả lời]\nđể dạy Nino nhé!`;
}

module.exports.onLoad = function() {
    const ninoPath = path.join(__dirname, 'cache', 'nino.json');
    if (!fs.existsSync(ninoPath)) {
        fs.writeFileSync(ninoPath, JSON.stringify({ nino: {}, teaches: {} }, null, 4));
    }
};

module.exports.handleEvent = async ({ api, event }) => {
    const { threadID, messageID, senderID, body } = event;
    if (!body || senderID === api.getCurrentUserID()) return;

    const ninoPath = path.join(__dirname, 'cache', 'nino.json');
    let data = {};
    if (fs.existsSync(ninoPath)) {
        try { data = JSON.parse(fs.readFileSync(ninoPath, 'utf8')); } catch (e) { data = {}; }
    }
    const nino = data.nino || {};

    if (nino[threadID] === true) {
        const reply = getNinoResponse(body, ninoPath);
        return api.sendMessage(reply, threadID, messageID);
    }
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const ninoPath = path.join(__dirname, 'cache', 'nino.json');

    let data = {};
    if (fs.existsSync(ninoPath)) {
        try { data = JSON.parse(fs.readFileSync(ninoPath, 'utf8')); } catch (e) { data = {}; }
    }
    if (!data.nino) data.nino = {};

    if (!args[0]) {
        return api.sendMessage("Ủa hỏi gì hỏi đi! Hoặc dùng: !nino on/off để bật tắt tự động trò chuyện.", threadID, messageID);
    }

    switch (args[0].toLowerCase()) {
        case "on": {
            data.nino[threadID] = true;
            fs.writeFileSync(ninoPath, JSON.stringify(data, null, 4), 'utf8');
            return api.sendMessage("Bật Nino reply thành công trong nhóm!", threadID, messageID);
        }
        case "off": {
            data.nino[threadID] = false;
            fs.writeFileSync(ninoPath, JSON.stringify(data, null, 4), 'utf8');
            return api.sendMessage("Tắt Nino reply thành công trong nhóm!", threadID, messageID);
        }
        default: {
            const query = args.join(" ");
            const reply = getNinoResponse(query, ninoPath);
            return api.sendMessage(reply, threadID, messageID);
        }
    }
};