const request = require('request');

module.exports.config = {
  name: "iss",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "BerVer",
  description: "Xem toạ độ mà tàu vũ trụ đang lưu lạc",
  commandCategory: "Công Cụ",
  usages: "iss",
  cooldowns: 5,
  dependencies: {
    "request": ""
  }
};

module.exports.run = function({ api, event }) {
  return request(`http://api.open-notify.org/iss-now.json`, (err, response, body) => {
    if (err || !body) return api.sendMessage("Không thể lấy toạ độ ISS lúc này.", event.threadID, event.messageID);
    try {
      const jsonData = JSON.parse(body);
      api.sendMessage(`Vị trí hiện tại của International Space Station 🌌🌠🌃\n- Vĩ độ: ${jsonData.iss_position.latitude}\n- Kinh độ: ${jsonData.iss_position.longitude}`, event.threadID, event.messageID);
    } catch {
      api.sendMessage("Lỗi phân tích dữ liệu ISS.", event.threadID, event.messageID);
    }
  });
};