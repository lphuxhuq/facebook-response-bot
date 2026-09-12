module.exports.config = {
	name: "anh",
	version: "2.0.0",
	hasPermssion: 0,
	credits: "Thiệu Trung Kiên / Ponytail fix",
	description: "Xem ảnh theo menu reply",
	commandCategory: "Tiện ích",
	cooldowns: 3
};

const fs = require('fs');
const path = require('path');
const request = require('request');

module.exports.run = async function({ event, api }) {
	return api.sendMessage(
		"🎭 Danh sách các ảnh hiện có:\n\n" +
		"1. Gái xinh\n2. Trai đẹp\n3. Anime / Wibu\n4. Cosplay\n" +
		"5. Mèo cute\n6. Meme hài hước\n7. Cảnh đẹp thiên nhiên\n\n" +
		"👉 Reply tin nhắn này số thứ tự (1-7) để xem ảnh nhé!",
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
			body: "Ảnh của bạn đây! Chúc bạn xem ảnh vui vẻ ✨",
			attachment: fs.createReadStream(outPath)
		}, event.threadID, () => {
			try { fs.unlinkSync(outPath); } catch (e) {}
		}, event.messageID);
	};

	request(imgUrl).pipe(fs.createWriteStream(outPath)).on('close', callback);
};