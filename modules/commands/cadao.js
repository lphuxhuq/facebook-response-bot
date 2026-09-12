module.exports.config = {
  name: "cadao",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "TuanDz / Ponytail fix",
  description: "Những câu ca dao, tục ngữ Việt Nam",
  commandCategory: "Kiến Thức Học Hỏi",
  cooldowns: 3
};

const fs = require('fs');
const path = require('path');
const request = require('request');
const moment = require("moment-timezone");

const cadaoList = [
  "Bầu ơi thương lấy bí cùng\nTuy rằng khác giống nhưng chung một giàn.",
  "Nhiễu điều phủ lấy giá gương\nNgười trong một nước phải thương nhau cùng.",
  "Công cha như núi Thái Sơn\nNghĩa mẹ như nước trong nguồn chảy ra.",
  "Một cây làm chẳng nên non\nBa cây chụm lại nên hòn núi cao.",
  "Ăn quả nhớ kẻ trồng cây\nĂn khoai nhớ kẻ cho dây mà trồng.",
  "Chim khôn kêu tiếng rảnh rang\nNgười khôn nói tiếng dịu dàng dễ nghe.",
  "Lời nói chẳng mất tiền mua\nLựa lời mà nói cho vừa lòng nhau.",
  "Uống nước nhớ nguồn\nĂn quả nhớ kẻ trồng cây.",
  "Gần mực thì đen, gần đèn thì rạng.",
  "Có công mài sắt, có ngày nên kim."
];

module.exports.run = async ({ api, event }) => {
  const poem = cadaoList[Math.floor(Math.random() * cadaoList.length)];
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
  const outPath = path.join(__dirname, 'cache', `cadao_${Date.now()}.${ext}`);

  const callback = () => {
    api.sendMessage({
      body: `💌 === CA DAO VIỆT NAM === 💌\n\n${poem}\n\n🏮 ${thu} | ⏳ ${gio}`,
      attachment: fs.createReadStream(outPath)
    }, event.threadID, () => {
      try { fs.unlinkSync(outPath); } catch (e) {}
    }, event.messageID);
  };

  request(imgUrl).pipe(fs.createWriteStream(outPath)).on("close", callback);
};
