module.exports.config = {
  name: "videosex",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "Trung Kiên mod by Kaneki / Ponytail fix",
  description: "Random Video NSFW",
  commandCategory: "nsfw",
  usages: "",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  return api.sendMessage("⚠️ Tính năng này đang được bảo trì để nâng cấp bảo mật và chất lượng!", event.threadID, event.messageID);
};