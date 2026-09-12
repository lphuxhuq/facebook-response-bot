module.exports.config = {
  name: "poem",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "TuanDz / Ponytail fix",
  description: "Những câu thơ thính ngọt ngào",
  commandCategory: "Kiến Thức Thả Thính",
  cooldowns: 3
};

const fs = require('fs');
const path = require('path');
const request = require('request');
const moment = require("moment-timezone");

const thinhList = [
  "Nắng mưa là chuyện của trời\nTương tư là chuyện của tôi yêu nàng.",
  "Trăng kia ai vẽ mà tròn\nLòng anh ai trộm mà hoài nhớ em.",
  "Gió đưa cành trúc la đà\nAnh đây chỉ muốn về nhà với em.",
  "Em ơi gió lạnh gần kề\nBao nhiêu lớp áo không bằng yêu anh.",
  "Trời xanh ôm lấy mây hồng\nCòn anh chỉ muốn ôm trọn em thôi.",
  "Mặt trời thì ở hướng đông\nCòn anh chỉ muốn ở trong tim nàng.",
  "Cá không ăn muối cá ươn\nAnh mà không thương em thì thương ai giờ."
];

module.exports.run = async ({ api, event }) => {
  const poem = thinhList[Math.floor(Math.random() * thinhList.length)];
  const gio = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || D/MM/YYYY");
  const days = {
    Sunday: 'Chủ Nhật', Monday: 'Thứ Hai', Tuesday: 'Thứ Ba',
    Wednesday: 'Thứ Tư', Thursday: 'Thứ Năm', Friday: 'Thứ Sáu', Saturday: 'Thứ Bảy'
  };
  const thu = days[moment.tz('Asia/Ho_Chi_Minh').format('dddd')] || 'Hôm Nay';

  const mediaPath = path.join(__dirname, 'cache', 'media_links.json');
  let links = [];
  if (fs.existsSync(mediaPath)) {
    try { links = JSON.parse(fs.readFileSync(mediaPath, 'utf8')); } catch (e) {}
  }
  const imgUrl = links.length ? links[Math.floor(Math.random() * links.length)] : "https://i.imgur.com/g6X1W3x.jpg";
  const ext = imgUrl.split('.').pop().split('?')[0] || 'jpg';
  const outPath = path.join(__dirname, 'cache', `poem_${Date.now()}.${ext}`);

  const callback = () => {
    api.sendMessage({
      body: `💞 === CÂU THƠ THẢ THÍNH === 💞\n\n${poem}\n\n🏮 ${thu} | ⏳ ${gio}`,
      attachment: fs.createReadStream(outPath)
    }, event.threadID, () => {
      try { fs.unlinkSync(outPath); } catch (e) {}
    }, event.messageID);
  };

  request(imgUrl).pipe(fs.createWriteStream(outPath)).on("close", callback);
};
