module.exports.config = {
    name: "tik",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Shiron / Ponytail fix",
    description: "Tải video + audio TikTok không logo",
    commandCategory: "download",
    usages: "tik video <link> | tik audio <link>",
    cooldowns: 5
};

module.exports.run = async ({ event, api, args }) => {
    const type = (args[0] || "").toLowerCase();
    const url = args[1] || (args[0] && args[0].startsWith("http") ? args[0] : null);
    if (!url) return api.sendMessage('Vui lòng nhập link video TikTok! (Ví dụ: !tik video https://vt.tiktok.com/...)', event.threadID, event.messageID);

    const axios = require('axios');
    const request = require('request');
    const fs = require('fs-extra');

    try {
        const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, { timeout: 10000 });
        if (!res.data || res.data.code !== 0 || !res.data.data) {
            return api.sendMessage("Không thể lấy dữ liệu từ link TikTok này! Vui lòng kiểm tra lại link.", event.threadID, event.messageID);
        }

        const data = res.data.data;
        if (type === "audio" || type === "music") {
            const musicUrl = data.music;
            const musicTitle = (data.music_info && data.music_info.title) || data.title || "TikTok Audio";
            const filePath = __dirname + "/cache/toptop.mp3";
            const callback = () => api.sendMessage({
                body: `🎵 Tên nhạc: ${musicTitle}\n👤 Tác giả: ${data.author ? data.author.nickname : 'Ẩn danh'}`,
                attachment: fs.createReadStream(filePath)
            }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);

            return request(encodeURI(musicUrl)).pipe(fs.createWriteStream(filePath)).on('close', () => callback());
        } else {
            // Default: video
            const videoUrl = data.play;
            const filePath = __dirname + "/cache/toptop.mp4";
            const callback = () => api.sendMessage({
                body: `🎬 Tiêu đề: ${data.title}\n👤 Tác giả: ${data.author ? data.author.nickname : 'TikTok'}\n❤️ Tim: ${data.digg_count || 0} | 💬 Comment: ${data.comment_count || 0}`,
                attachment: fs.createReadStream(filePath)
            }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);

            return request(encodeURI(videoUrl)).pipe(fs.createWriteStream(filePath)).on('close', () => callback());
        }
    } catch (err) {
        console.log(err);
        return api.sendMessage("Đã xảy ra lỗi khi tải TikTok: " + (err.message || "Lỗi mạng"), event.threadID, event.messageID);
    }
};