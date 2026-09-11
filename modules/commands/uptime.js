module.exports.config = {
	name: "uptime",
	version: "1.0.1",
	hasPermssion: 0,
	credits: "Mirai Team",
	description: "Kiểm tra thời gian bot đã online",
	commandCategory: "system",
	cooldowns: 5,
	dependencies: {
		"pidusage": ""
	}
};

function byte2mb(bytes) {
	const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	let l = 0, n = parseInt(bytes, 10) || 0;
	while (n >= 1024 && ++l) n = n / 1024;
	return `${n.toFixed(n < 10 && l > 0 ? 1 : 0)} ${units[l]}`;
}

module.exports.run = async ({ api, event }) => {
	var time = process.uptime(),
		hours = Math.floor(time / (60 * 60)),
		minutes = Math.floor((time % (60 * 60)) / 60),
		seconds = Math.floor(time % 60);
		hours = hours < 10 ? "0" + hours : hours
		minutes = minutes < 10 ? "0" + minutes : minutes
		seconds = seconds < 10 ? "0" + seconds : seconds

	const pidusage = await global.nodemodule["pidusage"](process.pid);
	const fs = require("fs")

	const timeStart = Date.now();
	return api.sendMessage(`🤖 [BOT UPTIME]\n⏱ Thời gian hoạt động: ${hours}:${minutes}:${seconds}\n» Người dùng: ${global.data.allUserID.length}\n» Nhóm: ${global.data.allThreadID.length}\n» CPU: ${pidusage.cpu.toFixed(1)}%\n» RAM: ${byte2mb(pidusage.memory)}\n» Ping: ${Date.now() - timeStart}ms`, event.threadID, event.messageID);
}