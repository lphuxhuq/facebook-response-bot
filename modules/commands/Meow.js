module.exports.config = {
	name: "meow",
	version: "1.0.2",
	hasPermssion: 0,
	credits: "Thanh Dz",
	description: "Xem Neko",
	commandCategory: "Edit-IMG",
	usages: "meow",
	cooldowns: 1
};

module.exports.run = async ({ api, event }) => {
	const axios = require("axios");
	const request = require("request");
	const fs = require("fs");
	try {
		const res = await axios.get("https://api.thecatapi.com/v1/images/search");
		const imgUrl = res.data[0].url;
		const ext = imgUrl.substring(imgUrl.lastIndexOf(".") + 1).split("?")[0] || "jpg";
		const cachePath = __dirname + `/cache/meow.${ext}`;
		const callback = () => api.sendMessage({
			attachment: fs.createReadStream(cachePath)
		}, event.threadID, () => fs.unlinkSync(cachePath), event.messageID);
		request(imgUrl).pipe(fs.createWriteStream(cachePath)).on("close", callback);
	} catch {
		return api.sendMessage("Không thể tải ảnh mèo.", event.threadID, event.messageID);
	}
};