module.exports.config = {
	name: "advice",
	version: "1.0.1",
	hasPermssion: 0,
	credits: "BLACK",
	description: "Đưa ra ngẫu nhiên cho bạn 1 lời khuyên",
	commandCategory: "Tiện Ích",
	usages: "advice",
	cooldowns: 5,
	dependencies: {"srod-v2": "","request": ""}
};

module.exports.run = async ({ event, api }) => {
  const srod = global.nodemodule["srod-v2"];
  try {
    const data = (await srod.GetAdvice()).embed.description;
    const translated = await global.utils.translateText(data, 'vi');
    return api.sendMessage(`💡 Lời khuyên:\n${data}\n\n👉 Bản dịch: ${translated}`, event.threadID, event.messageID);
  } catch (e) {
    return api.sendMessage("Đã có lỗi xảy ra khi lấy lời khuyên!", event.threadID, event.messageID);
  }
};