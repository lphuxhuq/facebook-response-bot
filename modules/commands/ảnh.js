module.exports.config = {
	name: "ảnh",
	version: "2.0.0",
	hasPermssion: 0,
	credits: "BLACK / Ponytail fix",
	description: "Xem ảnh theo menu reply",
	commandCategory: "Tiện ích",
	cooldowns: 3
};

const fs = require('fs');
const path = require('path');
const request = require('request');

module.exports.run = async function({ event, api }) {
	return api.sendMessage(
		"💌 Danh Sách Ảnh 💌\n\n" +
		"1. Ảnh Gái xinh 🌸\n2. Ảnh Trai đẹp ✨\n3. Ảnh Cosplay 😻\n" +
		"4. Ảnh Anime / Wibu 🦄\n5. Ảnh Thú cưng cute 🐾\n6. Ảnh Meme vui nhộn 🤣\n\n" +
		"👉 Reply tin nhắn này và chọn theo STT ảnh cần xem nhé!",
		event.threadID,
		(err, info) => {
			global.client.handleReply.push({
				name: module.exports.config.name,
				messageID: info.messageID,
				author: event.senderID,
				type: "create"
			});
		},
		event.messageID
	);
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
	if (handleReply.type !== "create") return;
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
	const outPath = path.join(__dirname, 'cache', `anh_${Date.now()}.${ext}`);

	const callback = () => {
		api.sendMessage({
			body: "[ Thành Công ] - Ảnh theo yêu cầu của bạn nè! 💖",
			attachment: fs.createReadStream(outPath)
		}, event.threadID, () => {
			try { fs.unlinkSync(outPath); } catch (e) {}
		}, event.messageID);
	};

	request(imgUrl).pipe(fs.createWriteStream(outPath)).on('close', callback);
};