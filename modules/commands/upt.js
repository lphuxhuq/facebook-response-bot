module.exports.config = {
  name: "upt",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Mirai / Ponytail fix",
  description: "Kiểm tra thời gian bot hoạt động",
  commandCategory: "Hệ thống",
  cooldowns: 5
};

function byte2mb(bytes) {
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  let l = 0, n = parseInt(bytes, 10) || 0;
  while (n >= 1024 && ++l) n = n / 1024;
  return `${n.toFixed(1)} ${units[l] || 'MB'}`;
}

module.exports.run = async function({ api, event }) {
  const fs = require("fs");
  const path = require("path");
  const request = require("request");
  const pidusage = await global.nodemodule["pidusage"](process.pid);

  const uptimeSec = process.uptime();
  const hours = Math.floor(uptimeSec / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  const seconds = Math.floor(uptimeSec % 60);
  const pad = n => n < 10 ? "0" + n : n;

  const timeStart = Date.now();
  const ping = Date.now() - timeStart;

  const text = `🤖 [ THÔNG TIN HỆ THỐNG BOT ] 🤖\n━━━━━━━━━━━━━━━━━\n` +
    `⏱️ Hoạt động: ${pad(hours)}:${pad(minutes)}:${pad(seconds)}\n` +
    `👥 Người dùng: ${global.data.allUserID ? global.data.allUserID.length : 0}\n` +
    `💬 Nhóm hoạt động: ${global.data.allThreadID ? global.data.allThreadID.length : 0}\n` +
    `⚡ Tốc độ xử lý (Ping): ${ping}ms\n` +
    `💻 CPU sử dụng: ${pidusage.cpu.toFixed(1)}%\n` +
    `📊 RAM sử dụng: ${byte2mb(pidusage.memory)}\n` +
    `🛡️ Trạng thái: Ổn định (Online)`;

  const mediaPath = path.join(__dirname, 'cache', 'media_links.json');
  let links = [];
  if (fs.existsSync(mediaPath)) {
    try { links = JSON.parse(fs.readFileSync(mediaPath, 'utf8')); } catch (e) {}
  }

  if (links.length) {
    const imgUrl = links[Math.floor(Math.random() * links.length)];
    const ext = imgUrl.split('.').pop().split('?')[0] || 'jpg';
    const outPath = path.join(__dirname, 'cache', `upt_${Date.now()}.${ext}`);
    const callback = () => {
      api.sendMessage({
        body: text,
        attachment: fs.createReadStream(outPath)
      }, event.threadID, () => {
        try { fs.unlinkSync(outPath); } catch (e) {}
      }, event.messageID);
    };
    return request(imgUrl).pipe(fs.createWriteStream(outPath)).on("close", callback);
  }

  return api.sendMessage(text, event.threadID, event.messageID);
};