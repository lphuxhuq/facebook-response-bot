module.exports.config = {
	name: "toctoc",
	version: "2.0.0",
	hasPermssion: 0,
	credits: "Binee / Ponytail fix",
	description: "Gợi ý video ngắn hoặc hướng dẫn tải TikTok",
	commandCategory: "Tiện Ích",
	cooldowns: 3
};

module.exports.run = async ({ api, event }) => {
	return api.sendMessage(
		"🎬 Bạn muốn tải video TikTok không watermark?\n" +
		"👉 Hãy dùng lệnh: !tik <link video> hoặc !tikvd <link video>\n" +
		"Ví dụ: !tik https://vt.tiktok.com/ZSxxxx/",
		event.threadID,
		event.messageID
	);
};