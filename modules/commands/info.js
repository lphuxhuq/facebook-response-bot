module.exports.config = {
    name: "info",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "D-Jukie",
    description: "Xem thông tin của người dùng facebook",
    commandCategory: "Nhóm",
    usages: "[reply/tag/id]",
    cooldowns: 3

};
module.exports.run = async function ({ api, event, args, Users }) {
    const axios = require('axios')
    const { threadID, messageID, senderID, type, mentions } = event;
    if (type == "message_reply") {
        var uid = event.messageReply.senderID;
    } else if (args.join(" ").indexOf(".com/") !== -1) {
        const url = args.join(" ");
        const matchId = url.match(/[?&]id=(\d+)/) || url.match(/facebook\.com\/(\d+)/);
        if (matchId) {
            var uid = matchId[1];
        } else {
            try {
                if (typeof api.getUID === "function") {
                    var uid = await api.getUID(url);
                }
            } catch (e) {}
            if (!uid) {
                return api.sendMessage("Không thể tìm UID từ liên kết này! Vui lòng tag người dùng hoặc reply tin nhắn của họ.", threadID, messageID);
            }
        }
    } else if (args.join(" ").indexOf('@') !== -1 && Object.keys(mentions).length > 0) {
        var uid = Object.keys(mentions)[0];
    } else if (args[0] && !isNaN(args[0])) {
        var uid = args[0];
    } else {
        var uid = senderID;
    }
    var data = (await Users.getUserFull(uid)).data;
    try {
        var location = data.location.name || null;
    }
    catch {
         var location = null
    }
    try {
        var love = data.love.name || null;
    }
    catch {
         var love = null
    }
    try {
        var hometown = data.hometown.name || null;
    }
    catch {
         var hometown = null
    }
    var gender = data.gender.replace('female', 'Nữ')
                            .replace('male', 'Nam')
    var img = (await axios.get(data.imgavt, { responseType: "stream" })).data;
    var msg = {
          body: `Tên: ${data.name}\nNgười theo dõi: ${data.follow}\nSinh nhật: ${data.birthday}\nGiới tính: ${gender}\nNơi sống: ${location}\nQuê quán: ${hometown}\nMối quan hệ: ${data.relationship_status}${(love != null) ? ' với ' + love : ''}\n`
    }
    return api.sendMessage(msg, threadID, messageID);
}