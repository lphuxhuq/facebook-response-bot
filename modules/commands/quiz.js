module.exports.config = {
	name: "quiz",
	version: "2.0.0",
	credits: "Mirai Team mod by Jukie",
	hasPermssion: 0,
	description: "Trả lời câu hỏi",
	commandCategory: "Trò Chơi",
	cooldowns: 5,
	dependencies: {
		"axios": ""
	}
};

module.exports.handleReaction = ({ api, event, handleReaction }) => {
	if (!event.userID == handleReaction.author) return;
	let response = "";
	if (event.reaction != "👍" && event.reaction != "😢") return;
	if (event.reaction == "👍") response = "True"
	else if (event.reaction == "😢") response = "False";
	if (response == handleReaction.answer) api.sendMessage("⚡️Bạn trả lời đúng rồi đấy!!!", event.threadID, () => {
					
					setTimeout(function(){ api.unsendMessage(handleReaction.messageID); }, 5000);
				});

	else api.sendMessage("⚡️Bạn trả lời sai rồi!!!", event.threadID);
	const indexOfHandle = client.handleReaction.findIndex(e => e.messageID == handleReaction.messageID);
	global.client.handleReaction.splice(indexOfHandle, 1);
	handleReaction.answerYet = 1;
	return global.client.handleReaction.push(handleReaction);
}

module.exports.run = async ({  api, event, args }) => {
	const axios = global.nodemodule["axios"];
	const request = global.nodemodule["request"];	
	let difficulties = ["easy", "medium", "hard"];
	let difficulty = args[0];
	(difficulties.some(item => difficulty == item)) ? "" : difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
	let fetch = await axios(`https://opentdb.com/api.php?amount=1&encode=url3986&type=boolean&difficulty=${difficulty}`);
	if (!fetch.data) return api.sendMessage("⚡️Không thể tìm thấy câu hỏi do server bận", event.threadID, event.messageID);
	let decode = decodeURIComponent(fetch.data.results[0].question);
	let text = decode;
	try {
		text = await global.utils.translateText(decode, 'vi');
	} catch (e) {}

	return api.sendMessage(`⚡️Đây là câu hỏi dành cho bạn:\n- ${text}\n\n   👍: True       😢: False`, event.threadID, async (err, info) => {
		global.client.handleReaction.push({
			name: "quiz",
			messageID: info.messageID,
			author: event.senderID,
			answer: fetch.data.results[0].correct_answer,
			answerYet: 0
		});
		await new Promise(resolve => setTimeout(resolve, 20 * 1000));
		const indexOfHandle = global.client.handleReaction.findIndex(e => e.messageID == info.messageID);
		let data = global.client.handleReaction[indexOfHandle];
		if (data.answerYet !== 1) {
			api.sendMessage(`⚡️Time out!! đáp án chính xác là ${fetch.data.results[0].correct_answer}`, event.threadID, info.messageID);
			return global.client.handleReaction.splice(indexOfHandle, 1);
		}
		else return;
	});
};
