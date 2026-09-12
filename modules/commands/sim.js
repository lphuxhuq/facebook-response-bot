module.exports.config = {
    name: "sim",
    version: "4.3.7",
    hasPermssion: 0,
    credits: "ProcodeMew", //change api sim Hoang Giap
    description: "Chat c\xF9ng con sim m\u1EA5t d\u1EA1y nh\u1EA5t",
    commandCategory: "Chat cùng sim",
    usages: "[args]",
    cooldowns: 5,
    dependencies: {
        axios: ""
    }
}


const fs = require('fs-extra');
const path = require('path');

const simReplies = {
    "chào": ["Chào bạn nha!", "Hế lô! Hôm nay vui không?", "Chào bạn dễ thương!"],
    "hi": ["Hi bạn nè!", "Chào người đẹp!", "Hi, có gì vui hông?"],
    "hello": ["Hello!", "Chào bạn nha!", "Hế lô bạn!"],
    "ngu": ["Bạn nói ai ngu cơ? Giận á!", "Hông dám ngu bằng ai kia đâu lêu lêu!"],
    "chó": ["Gâu gâu! Ai gọi sim đấy?", "Đừng chửi bậy nha bạn iu!"],
    "yêu": ["Sim yêu bạn nhiều lắm á!", "Moazzzz <3"],
    "bạn là ai": ["Mình là Simsimi - bot trò chuyện vui nhộn nè!", "Sim đẹp trai cute nhất quả đất!"],
    "đang làm gì": ["Đang ngồi chơi xơi nước đợi bạn nhắn nè!", "Đang nghĩ về bạn đó <3"]
};

function getSimLocalResponse(msg) {
    const raw = (msg || "").trim().toLowerCase();
    for (const [k, v] of Object.entries(simReplies)) {
        if (raw.includes(k)) {
            return v[Math.floor(Math.random() * v.length)];
        }
    }
    const randomFallbacks = [
        "Sim nghe nè, nói chuyện tiếp đi bạn!",
        "Ủa rồi sao nữa, kể tiếp nghe coi?",
        "Hôm nay bạn có gì vui không kể Sim nghe với!",
        "Nghe nè người đẹp!",
        "Thật á? Kể nghe thêm đi!"
    ];
    return randomFallbacks[Math.floor(Math.random() * randomFallbacks.length)];
}

async function simsimi(a) {
    const axios = global.nodemodule.axios;
    try {
        const res = await axios.get(`https://api.simsimi.net/v2/?text=${encodeURIComponent(a)}&lc=vn`, { timeout: 3000 });
        if (res.data && res.data.success) {
            return { error: false, text: res.data.success };
        }
    } catch (p) {
        // Fallback to local responder
    }
    return { error: false, text: getSimLocalResponse(a) };
}

module.exports.onLoad = async function () {
    if (typeof global.simsimi === "undefined") global.simsimi = new Map();
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body } = event;
    if (!global.simsimi.has(threadID)) return;
    if (senderID === api.getCurrentUserID() || !body || messageID === global.simsimi.get(threadID)) return;

    const res = await simsimi(body);
    if (res.text) return api.sendMessage(res.text, threadID, messageID);
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    if (args.length === 0) return api.sendMessage("Bạn chưa nhập tin nhắn! (Dùng 'sim on/off' hoặc 'sim [tin nhắn]')", threadID, messageID);

    switch (args[0].toLowerCase()) {
        case "on":
            if (global.simsimi.has(threadID)) return api.sendMessage("Bạn chưa tắt sim.", threadID, messageID);
            global.simsimi.set(threadID, messageID);
            return api.sendMessage("Đã bật sim thành công.", threadID, messageID);
        case "off":
            if (!global.simsimi.has(threadID)) return api.sendMessage("Bạn chưa bật sim.", threadID, messageID);
            global.simsimi.delete(threadID);
            return api.sendMessage("Đã tắt sim thành công.", threadID, messageID);
        default: {
            const res = await simsimi(args.join(" "));
            if (res.text) return api.sendMessage(res.text, threadID, messageID);
        }
    }
};