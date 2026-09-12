module.exports.config = {
  name: "truyencuoi",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "TuanDz / Ponytail fix",
  description: "Kể chuyện cười giải trí",
  commandCategory: "Giải Trí",
  cooldowns: 3
};

const jokes = [
  "Thầy giáo hỏi Tèo:\n- Nếu có 5 cái kẹo, em chia cho bạn 2 cái, em còn mấy cái?\nTèo đáp:\n- Dạ còn nguyên 5 cái ạ vì em không thích chia!",
  "Bác sĩ nói với bệnh nhân:\n- Bệnh của anh cần phải đi biển nghỉ dưỡng ngắm sóng thì mới khỏi.\nBệnh nhân ngập ngừng:\n- Nhưng thưa bác sĩ, tôi làm nghề gác hải đăng 20 năm nay rồi ạ!",
  "Một anh chàng đi thi lái xe:\n- Giám thị hỏi: Nếu đằng trước có một người già và một đứa trẻ, anh đâm vào ai?\n- Anh chàng: Dạ đâm vào đứa trẻ ạ.\n- Giám thị: Sai! Anh phải đạp phanh chứ đâm vào ai!",
  "Vợ hỏi chồng:\n- Anh thấy em hôm nay có gì khác không?\nChồng toát mồ hôi suy nghĩ rồi đáp:\n- Em... em vừa thở ra đúng không?"
];

module.exports.run = async ({ api, event }) => {
  const joke = jokes[Math.floor(Math.random() * jokes.length)];
  return api.sendMessage(`🤣 [ CHUYỆN CƯỜI HÔM NAY ] 🤣\n━━━━━━━━━━━━━━━━━\n${joke}`, event.threadID, event.messageID);
};
