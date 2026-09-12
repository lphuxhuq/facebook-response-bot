module.exports.config = {
	name: "trans",
	version: "1.0.1",
	hasPermssion: 0,
	credits: "Mirai Team",
	description: "Dịch văn bản",
	commandCategory: "Công Cụ",
	usages: "[en/ko/ja/vi] [Text]",
	cooldowns: 5,
	dependencies: {
		"request":  ""
	}
};

module.exports.run = async ({ api, event, args }) => {
	const axios = global.nodemodule["axios"] || require("axios");
	var content = args.join(" ");
	if (content.length == 0 && event.type != "message_reply") return global.utils.throwError(this.config.name, event.threadID, event.messageID);
	var translateThis = content.slice(0, content.indexOf(" ->"));
	var lang = content.substring(content.indexOf(" -> ") + 4);
	if (event.type == "message_reply") {
		translateThis = event.messageReply.body;
		if (content.indexOf("-> ") !== -1) lang = content.substring(content.indexOf("-> ") + 3);
		else lang = global.config.language || "vi";
	}
	else if (content.indexOf(" -> ") == -1) {
		translateThis = content.slice(0, content.length);
		lang = global.config.language || "vi";
	}

	try {
		const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(lang)}&dt=t&q=${encodeURIComponent(translateThis)}`, { timeout: 4000 });
		const retrieve = res.data;
		let text = '';
		retrieve[0].forEach(item => (item[0]) ? text += item[0] : '');
		const fromLang = (retrieve[2] === retrieve[8][0][0]) ? retrieve[2] : retrieve[8][0][0];
		return api.sendMessage(`Bản dịch: ${text}\n- Được dịch từ ${fromLang} sang ${lang}`, event.threadID, event.messageID);
	} catch (e) {
		// Fallback to MyMemory translation API
		try {
			const res = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(translateThis)}&langpair=auto|${encodeURIComponent(lang)}`, { timeout: 6000 });
			if (res.data && res.data.responseData && res.data.responseData.translatedText) {
				return api.sendMessage(`Bản dịch: ${res.data.responseData.translatedText}\n- Dịch sang ${lang} (Nguồn: MyMemory)`, event.threadID, event.messageID);
			}
		} catch (err2) {}
		return api.sendMessage("Không thể dịch văn bản vào lúc này! Vui lòng thử lại sau.", event.threadID, event.messageID);
	}
};