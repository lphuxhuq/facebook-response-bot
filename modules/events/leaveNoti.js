const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
	name: "leaveNoti",
	eventType: ["log:unsubscribe"],
	version: "1.0.1",
	credits: "Mirai Team",
	description: "Thông báo thành viên rời khỏi nhóm kèm gif/ảnh",
	dependencies: {
		"fs-extra": "",
		"path": ""
	}
};

module.exports.onLoad = function () {
	const p1 = path.join(__dirname, "cache", "leaveGif");
	if (!fs.existsSync(p1)) fs.mkdirSync(p1, { recursive: true });	

	const p2 = path.join(__dirname, "cache", "leaveGif", "randomgif");
    if (!fs.existsSync(p2)) fs.mkdirSync(p2, { recursive: true });

    return;
};

module.exports.run = async function({ api, event, Users, Threads }) {
	if (!event.logMessageData || !event.logMessageData.leftParticipantFbId) return;
	if (event.logMessageData.leftParticipantFbId == api.getCurrentUserID()) return;

	const { threadID } = event;
	const threadData = global.data.threadData.get(parseInt(threadID)) || (await Threads.getData(threadID)) || {};
	const data = threadData.data || threadData;
	const name = global.data.userName.get(event.logMessageData.leftParticipantFbId) || await Users.getNameUser(event.logMessageData.leftParticipantFbId) || "Thành viên";
	const type = (event.author == event.logMessageData.leftParticipantFbId) ? "tự rời" : "bị quản trị viên mời ra";
	
	const leaveDir = path.join(__dirname, "cache", "leaveGif");
	const gifPath = path.join(leaveDir, `${threadID}.gif`);
	if (!fs.existsSync(leaveDir)) fs.mkdirSync(leaveDir, { recursive: true });

	let msg = (typeof data.customLeave == "undefined") ? "💞 {name} đã {type} khỏi nhóm." : data.customLeave;
	msg = msg.replace(/\{name}/g, name).replace(/\{type}/g, type);

	const randomGifDir = path.join(leaveDir, "randomgif");
	if (!fs.existsSync(randomGifDir)) fs.mkdirSync(randomGifDir, { recursive: true });
	const randomFiles = fs.readdirSync(randomGifDir);

	let formPush = { body: msg };

	if (fs.existsSync(gifPath)) {
		try { formPush.attachment = fs.createReadStream(gifPath); } catch (e) {}
	} else if (randomFiles.length > 0) {
		const chosen = path.join(randomGifDir, `${randomFiles[Math.floor(Math.random() * randomFiles.length)]}`);
		if (fs.existsSync(chosen)) {
			try { formPush.attachment = fs.createReadStream(chosen); } catch (e) {}
		}
	}

	return api.sendMessage(formPush, threadID);
};