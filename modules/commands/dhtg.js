module.exports.config = {
  name: "dhtg",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "TuanDz / Ponytail fix",
  description: "Ngày và giờ hiện tại của các thành phố trên thế giới",
  commandCategory: "Tiện Ích",
  cooldowns: 3
};

module.exports.run = async ({ api, event }) => {
  const moment = require("moment-timezone");
  const fs = require("fs");
  const path = require("path");
  const request = require("request");

  const hanoi = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || DD/MM/YYYY");
  const london = moment.tz("Europe/London").format("HH:mm:ss || DD/MM/YYYY");
  const newyork = moment.tz("America/New_York").format("HH:mm:ss || DD/MM/YYYY");
  const seoul = moment.tz("Asia/Seoul").format("HH:mm:ss || DD/MM/YYYY");
  const tokyo = moment.tz("Asia/Tokyo").format("HH:mm:ss || DD/MM/YYYY");
  const paris = moment.tz("Europe/Paris").format("HH:mm:ss || DD/MM/YYYY");
  const kl = moment.tz("Asia/Kuala_Lumpur").format("HH:mm:ss || DD/MM/YYYY");

  const text = `🕒 [ THỜI GIAN CÁC THÀNH PHỐ THẾ GIỚI ] 🕒\n━━━━━━━━━━━━━━━━━\n` +
    `🇻🇳 Hà Nội: ${hanoi}\n` +
    `🇬🇧 London: ${london}\n` +
    `🇺🇸 New York: ${newyork}\n` +
    `🇯🇵 Tokyo: ${tokyo}\n` +
    `🇰🇷 Seoul: ${seoul}\n` +
    `🇫🇷 Paris: ${paris}\n` +
    `🇲🇾 Kuala Lumpur: ${kl}`;

  const mediaPath = path.join(__dirname, 'cache', 'media_links.json');
  let links = [];
  if (fs.existsSync(mediaPath)) {
    try { links = JSON.parse(fs.readFileSync(mediaPath, 'utf8')); } catch (e) {}
  }

  if (links.length) {
    const imgUrl = links[Math.floor(Math.random() * links.length)];
    const ext = imgUrl.split('.').pop().split('?')[0] || 'jpg';
    const outPath = path.join(__dirname, 'cache', `dhtg_${Date.now()}.${ext}`);
    const callback = () => {
      api.sendMessage({
        body: text,
        attachment: fs.createReadStream(outPath)
      }, event.threadID, () => {
        try { fs.unlinkSync(outPath); } catch (e) {}
      }, event.messageID);
    };
    request(imgUrl).pipe(fs.createWriteStream(outPath)).on("close", callback);
  } else {
    return api.sendMessage(text, event.threadID, event.messageID);
  }
};
