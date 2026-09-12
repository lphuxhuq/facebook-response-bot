module.exports.config = {
	name: "tikvd",
	version: "2.0.0",
	hasPermssion: 0,
	credits: "Thiệu Trung Kiên / Ponytail fix",
	description: "Tải video hoặc audio tiktok không logo",
	commandCategory: "Tiện ích",
	usages: "tikvd <link tiktok>",
	cooldowns: 5
};

module.exports.run = async function({ args, event, api }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  if (!args[0]) {
    return api.sendMessage(`Vui lòng nhập link video TikTok! (Ví dụ: !tikvd https://vt.tiktok.com/...)`, event.threadID, event.messageID);
  }
  try {
    const res = (await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(args[0])}`, { timeout: 10000 })).data;
    if (!res || res.code !== 0 || !res.data) {
      return api.sendMessage("Không thể lấy dữ liệu từ link TikTok này! Vui lòng kiểm tra lại link.", event.threadID, event.messageID);
    }
    const data = res.data;
    const coverBuf = (await axios.get(data.cover, { responseType: "arraybuffer" })).data;
    const coverPath = __dirname + `/cache/tiktok_${event.senderID}.png`;
    fs.writeFileSync(coverPath, Buffer.from(coverBuf, "utf-8"));

    const msg = {
      body: `🎬 Tiêu đề: ${data.title}\n👤 Tác giả: ${data.author ? data.author.nickname : 'TikTok'}\n🎵 Nhạc: ${data.music_info ? data.music_info.title : 'TikTok Music'}\n\n1. Tải Video (Không Watermark)\n2. Tải Audio (MP3)\n\n👉 Reply (phản hồi) tin nhắn này số 1 hoặc 2 để tải!`,
      attachment: fs.createReadStream(coverPath)
    };

    return api.sendMessage(msg, event.threadID, (error, info) => {
      fs.unlinkSync(coverPath);
      global.client.handleReply.push({
        type: "reply",
        name: module.exports.config.name,
        author: event.senderID,
        messageID: info.messageID,
        video: data.play,
        mp3: data.music,
        title: data.title,
        authorvd: data.author ? data.author.nickname : 'TikTok',
        text: data.music_info ? data.music_info.title : 'TikTok Music'
      });
    }, event.messageID);
  } catch (e) {
    return api.sendMessage("Lỗi khi tải TikTok: " + (e.message || "Lỗi mạng"), event.threadID, event.messageID);
  }
};

module.exports.handleReply = async function ({ event, api, handleReply }) {
  const fs = require("fs-extra");
  const request = require("request");
  const { author, video, mp3, title, authorvd, text } = handleReply;
  if (event.senderID !== author) return api.sendMessage("Bạn không phải người thực hiện yêu cầu này!", event.threadID, event.messageID);

  switch (event.body.trim()) {
    case "1": {
      const outPath = __dirname + `/cache/toptop_${Date.now()}.mp4`;
      const callback = () => api.sendMessage({
        body: `🎬 Tác giả: ${authorvd}\n📝 Tiêu đề: ${title}`,
        attachment: fs.createReadStream(outPath)
      }, event.threadID, () => fs.unlinkSync(outPath), event.messageID);
      return request(encodeURI(video)).pipe(fs.createWriteStream(outPath)).on('close', () => callback());
    }
    case "2": {
      const outPath = __dirname + `/cache/toptop_${Date.now()}.mp3`;
      const callback = () => api.sendMessage({
        body: `🎵 Nhạc: ${text}`,
        attachment: fs.createReadStream(outPath)
      }, event.threadID, () => fs.unlinkSync(outPath), event.messageID);
      return request(encodeURI(mp3)).pipe(fs.createWriteStream(outPath)).on('close', () => callback());
    }
    default:
      return api.sendMessage("Lựa chọn không hợp lệ! Vui lòng reply 1 để tải Video hoặc 2 để tải Audio.", event.threadID, event.messageID);
  }
};