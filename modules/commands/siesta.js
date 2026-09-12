module.exports.config = {
  name: "siesta",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Mirai / Ponytail fix",
  description: "Xem ảnh Siesta cute",
  commandCategory: "Random-IMG",
  usages: "siesta",
  cooldowns: 3
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
    links = [
      "https://i.imgur.com/g6X1W3x.jpg",
      "https://i.imgur.com/kQoK0oP.png",
      "https://i.imgur.com/8QzXnQp.png"
    ];
  }
  const imgUrl = links[Math.floor(Math.random() * links.length)];
  const ext = imgUrl.split('.').pop().split('?')[0] || 'jpg';
  const outPath = path.join(__dirname, 'cache', `siesta_${Date.now()}.${ext}`);

  const callback = () => {
    api.sendMessage({
      body: "Siesta xinh đẹp đây nè! 🤍",
      attachment: fs.createReadStream(outPath)
    }, event.threadID, () => {
      try { fs.unlinkSync(outPath); } catch (e) {}
    }, event.messageID);
  };

  request(imgUrl).pipe(fs.createWriteStream(outPath)).on('close', callback);
};
