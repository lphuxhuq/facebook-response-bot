module.exports.config = {
  name: "vsbg",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Mirai Team",
  description: "Random ảnh hot girl VSBG",
  commandCategory: "random-img",
  usages: "vsbg",
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
  const outPath = (global.getTempCachePath ? global.getTempCachePath(ext, 'vsbg') : path.join(__dirname, 'cache', `vsbg_${Date.now()}.${ext}`));

  const callback = () => {
    api.sendMessage({
      body: "Ảnh hot girl nè! 🔥",
      attachment: fs.createReadStream(outPath)
    }, event.threadID, () => {
      try { fs.unlinkSync(outPath); } catch (e) {}
    }, event.messageID);
  };
  return request(encodeURI(imgUrl)).pipe(fs.createWriteStream(outPath)).on("close", callback);
};
