module.exports.config = {
  name: "girl",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Mirai Team",
  description: "Random ảnh girl xinh",
  commandCategory: "random-img",
  usages: "girl",
  cooldowns: 5
};

const fs = require('fs');
const path = require('path');
const request = require('request');

module.exports.run = async ({ api, event }) => {
  const mediaPath = path.join(__dirname, 'cache', 'media_links.json');
  let links = [];
  if (fs.existsSync(mediaPath)) {
    try { links = JSON.parse(fs.readFileSync(mediaPath, 'utf8')); } catch (e) { links = []; }
  }
  if (!links.length) {
    links = ["https://i.imgur.com/g6X1W3x.jpg"];
  }
  const imgUrl = links[Math.floor(Math.random() * links.length)];
  const ext = imgUrl.split('.').pop().split('?')[0] || 'jpg';
  const outPath = (global.getTempCachePath ? global.getTempCachePath(ext, 'girl') : path.join(__dirname, 'cache', `girl_${Date.now()}.${ext}`));

  const callback = () => {
    api.sendMessage({
      body: "Girl xinh cho bạn nè! 💖",
      attachment: fs.createReadStream(outPath)
    }, event.threadID, () => {
      try { fs.unlinkSync(outPath); } catch (e) {}
    }, event.messageID);
  };
  return request(encodeURI(imgUrl)).pipe(fs.createWriteStream(outPath)).on("close", callback);
};
