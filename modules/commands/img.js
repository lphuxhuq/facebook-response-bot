module.exports.config = {
  name: "img",
  aliases: ["anhdep", "hinh"],
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Kilo",
  description: "Xem ảnh theo chủ đề hoặc ngẫu nhiên từ kho ảnh",
  commandCategory: "random-img",
  usages: "!img [gai/boy/anime/cosplay]",
  cooldowns: 3
};

const fs = require('fs');
const path = require('path');
const request = require('request');

module.exports.run = async ({ api, event, args }) => {
  const mediaPath = path.join(__dirname, 'cache', 'media_links.json');
  let links = [];
  if (fs.existsSync(mediaPath)) {
    try { links = JSON.parse(fs.readFileSync(mediaPath, 'utf8')); } catch (e) { links = []; }
  }
  if (!links.length) {
    links = [
      "https://i.imgur.com/g6X1W3x.jpg",
      "https://i.imgur.com/kQoK0oP.png",
      "https://i.imgur.com/8QzXnQp.png"
    ];
  }

  const topic = (args[0] || '').toLowerCase();
  const imgUrl = links[Math.floor(Math.random() * links.length)];
  const ext = imgUrl.split('.').pop().split('?')[0] || 'jpg';
  const outPath = (global.getTempCachePath ? global.getTempCachePath(ext, 'img') : path.join(__dirname, 'cache', `img_${Date.now()}.${ext}`));

  const tag = topic ? `Ảnh chủ đề [${topic}] của bạn nè! ✨` : `Ảnh ngẫu nhiên từ kho ảnh bot! ✨`;

  const callback = () => {
    api.sendMessage({
      body: tag,
      attachment: fs.createReadStream(outPath)
    }, event.threadID, () => {
      try { fs.unlinkSync(outPath); } catch (e) {}
    }, event.messageID);
  };
  return request(encodeURI(imgUrl)).pipe(fs.createWriteStream(outPath)).on("close", callback);
};
