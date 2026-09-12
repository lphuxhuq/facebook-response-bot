module.exports.config = {
	name: "tiktok",
	version: "2.0.0",
	hasPermssion: 0,
	credits: "Hankune / Ponytail fix",
	description: "Tải video tiktok không watermark",
	commandCategory: "Mạng xã hội",
	usages: "tiktok <link video tiktok>",
	cooldowns: 5
};

module.exports.run = async function({ args, event, api }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const request = require("request");

  const url = args[0];
  if (!url || !url.startsWith("http")) {
    return api.sendMessage(`Vui lòng nhập link video TikTok! (Ví dụ: !tiktok https://vt.tiktok.com/...)`, event.threadID, event.messageID);
  }

  try {
    const res = (await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, { timeout: 10000 })).data;
    if (!res || res.code !== 0 || !res.data) {
      return api.sendMessage("Không thể lấy dữ liệu từ link TikTok này! Vui lòng kiểm tra lại link.", event.threadID, event.messageID);
    }
    const data = res.data;
    const outPath = __dirname + `/cache/tiktok_${Date.now()}.mp4`;
    const callback = () => api.sendMessage({
      body: `🎬 Tiêu đề: ${data.title}\n👤 Kênh: ${data.author ? data.author.nickname : 'TikTok'}\n❤️ Tim: ${data.digg_count || 0}`,
      attachment: fs.createReadStream(outPath)
    }, event.threadID, () => fs.unlinkSync(outPath), event.messageID);

    return request(encodeURI(data.play)).pipe(fs.createWriteStream(outPath)).on('close', () => callback());
  } catch (e) {
    return api.sendMessage("Lỗi khi tải video TikTok: " + (e.message || "Lỗi mạng"), event.threadID, event.messageID);
  }
};