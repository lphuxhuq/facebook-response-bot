module.exports.config = {
	name: "joinNoti",
	eventType: ["log:subscribe"],
	version: "1.0.1",
	credits: "CatalizCS",
	description: "Thông báo bot hoặc người vào nhóm có random gif/ảnh/video",
	dependencies: {
		"fs-extra": "",
		"path": "",
		"pidusage": ""
	}
};

module.exports.onLoad = function () {
    const fs = require("fs-extra");
    const path = require("path");

	const p1 = path.join(__dirname, "cache", "joinGif");
	if (!fs.existsSync(p1)) fs.mkdirSync(p1, { recursive: true });	

	const p2 = path.join(__dirname, "cache", "joinGif", "randomgif");
    if (!fs.existsSync(p2)) fs.mkdirSync(p2, { recursive: true });

    return;
}


module.exports.run = async function({ api, event }) {
	const fs = require("fs-extra");
	const path = require("path");
	const { threadID } = event;
	if (!event.logMessageData || !Array.isArray(event.logMessageData.addedParticipants)) return;
	if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
		api.changeNickname(`[ ${global.config.PREFIX} ] • ${(!global.config.BOTNAME) ? "Bot" : global.config.BOTNAME}`, threadID, api.getCurrentUserID());
		const msgBody = `► 𝐊𝐞̂́𝐭 𝐍𝐨̂́𝐢 𝐁𝐨𝐭 𝐓𝐡𝐚̀𝐧𝐡 𝐂𝐨̂𝐧𝐠 ◄\n🌸 𝙈ì𝙣𝙝 𝙇à 𝘽𝙤𝙩 𝘾ủ𝙖 NGUYÊN HOÀNG 🌸\n- 𝘿ù𝙣𝙜 !menu hoặc !help 𝙣ế𝙪 𝙢𝙪ố𝙣 𝙭𝙚𝙢 danh sách 𝙡ệ𝙣𝙝 ❤️\n🌸 𝘾𝙝ú𝙘 𝘼𝙣𝙝 𝙀𝙢 𝙎à𝙞 𝘽𝙤𝙩 𝙑𝙪𝙞 𝙑ẻ 🌸`;
		const mp4Path = path.join(__dirname, "cache", "joinMp4", "hello.mp4");
		const msgObj = { body: msgBody };
		if (fs.existsSync(mp4Path)) {
			try { msgObj.attachment = fs.createReadStream(mp4Path); } catch (e) {}
		}
		return api.sendMessage(msgObj, threadID);
	}
	else {
		try {
			let { threadName, participantIDs } = (await api.getThreadInfo(threadID)) || {};
			threadName = threadName || "Nhóm";
			participantIDs = participantIDs || [];

			const threadData = global.data.threadData.get(parseInt(threadID)) || {};
			const gifDir = path.join(__dirname, "cache", "joinGif");
			const pathGif = path.join(gifDir, `${threadID}.gif`);

			var mentions = [], nameArray = [], memLength = [], i = 0;
			
			for (const part of event.logMessageData.addedParticipants) {
				const userName = part.fullName || "Bạn mới";
				nameArray.push(userName);
				mentions.push({ tag: userName, id: part.userFbId });
				memLength.push(participantIDs.length - i++);
			}
			memLength.sort((a, b) => a - b);
			
			let msg = (typeof threadData.customJoin == "undefined") ? "💗 𝑯𝒆𝒍𝒍𝒐 𝒄𝒐𝒏 𝒗𝒐̛̣ {name} .\n🐳 𝐂𝐡𝐚̀𝐨 𝐌𝐮̛̀𝐧𝐠 𝐄𝐦 𝐘𝐞̂𝐮 {name}.\n𝐓𝐨̛́𝐢 𝐕𝐨̛́𝐢 𝐍𝐡𝐨́𝐦 𝐂𝐮̉𝐚 {threadName}.\n{type} 𝐋𝐚̀ 𝐂𝐮̣𝐜 𝐂𝐮̛𝐧𝐠 𝐓𝐡𝐮̛́ {soThanhVien} 𝐂𝐮̉𝐚 𝐁𝐎𝐓 🥲 𝑻𝒖̛𝒐̛𝒏𝒈 𝒕𝒂́𝒄 𝒏𝒉𝒊𝒆̂̀𝒖 𝒗𝒂̀𝒐 𝒏𝒉𝒆́ 𝒉𝒐𝒏𝒈 𝒍𝒂̀ 𝒂̆𝒏 𝒌𝒊𝒄𝒌 𝒏𝒉𝒆́ 🍀" : threadData.customJoin;
			msg = msg
			.replace(/\{name}/g, nameArray.join(', '))
			.replace(/\{type}/g, (memLength.length > 1) ?  '𝐂𝐚́𝐜 𝐁𝐚̣𝐧' : '𝐁𝐚̣𝐧')
			.replace(/\{soThanhVien}/g, memLength.join(', '))
			.replace(/\{threadName}/g, threadName);

			if (!fs.existsSync(gifDir)) fs.mkdirSync(gifDir, { recursive: true });
			const randomGifDir = path.join(gifDir, "randomgif");
			if (!fs.existsSync(randomGifDir)) fs.mkdirSync(randomGifDir, { recursive: true });

			const randomPath = fs.readdirSync(randomGifDir);
			let formPush = { body: msg, mentions };

			if (fs.existsSync(pathGif)) {
				try { formPush.attachment = fs.createReadStream(pathGif); } catch (e) {}
			} else if (randomPath.length != 0) {
				const pathRandom = path.join(randomGifDir, `${randomPath[Math.floor(Math.random() * randomPath.length)]}`);
				if (fs.existsSync(pathRandom)) {
					try { formPush.attachment = fs.createReadStream(pathRandom); } catch (e) {}
				}
			}

			return api.sendMessage(formPush, threadID);
		} catch (e) { return console.log(e); };
	}
}