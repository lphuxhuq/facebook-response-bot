module.exports.config = {
	name: "hi",
	version: "1.0.2",
	hasPermssion: 0,
	credits: "ManhG",
	description: "Tự động chào khi có người chào",
	commandCategory: "Other",
	usages: "",
	cooldowns: 0,
	denpendencies: {}
};

module.exports.handleEvent = async ({
	event,
	api,
	Users
}) => {
	var {
		threadID,
		messageID,
		body,
		senderID
	} = event;
	if (!body) return;
	const thread = global.data.threadData.get(threadID) || {};
	if (typeof thread["hi"] !== "undefined" && thread["hi"] == false) return;
	if (senderID == api.getCurrentUserID()) return;

	var arr = ["hi", "hello", "lô", "hí lô", "chào", "hăi", "hí", "hai", "2"];
	const lowerBody = body.trim().toLowerCase();
	if (arr.some(i => lowerBody === i)) {
		let name = "";
		try {
			name = await Users.getNameUser(event.senderID);
		} catch (e) {
			name = "bạn";
		}
		return api.sendMessage(`💘 Hiii chào ${name || "bạn"}! Chúc bạn một ngày tốt lành nhé ❤️`, threadID, messageID);
	}
};

module.exports.languages = {
	"vi": {
		"on": "Bật",
		"off": "Tắt",
		"successText": "tự động chào thành công"
	},
	"en": {
		"on": "on",
		"off": "off",
		"successText": "auto-greeting success!"
	}
};

module.exports.run = async function({
	api,
	event,
	Threads,
	getText
}) {
	const {
		threadID,
		messageID
	} = event;
	let data = (await Threads.getData(threadID)).data || {};

	if (typeof data["hi"] == "undefined" || data["hi"] == true) data["hi"] = false;
	else data["hi"] = true;

	await Threads.setData(threadID, {
		data
	});
	global.data.threadData.set(threadID, data);
	return api.sendMessage(`${(data["hi"] == false) ? getText("off") : getText("on")} ${getText("successText")}`, threadID, messageID);
};