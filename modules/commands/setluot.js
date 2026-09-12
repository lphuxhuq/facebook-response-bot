module.exports.config = {
  name: "setluot",
  version: "1.0.0",
  hasPermssion: 3,
  credits: "Ỏ",
  description: "set lượt dùng bot",
  usages: "[me/tag] [số lượt]",
  commandCategory: "admin",
  cooldowns: 5
};

const stores = require("../../includes/stores.js");
const usagesStore = stores.use("usages", __dirname + '/../../includes/handle/usages.json');

module.exports.onLoad = () => {}

module.exports.run = async ({ event, api, args }) => {
  const { threadID, messageID, senderID } = event;
  if (args.length < 2) return api.sendMessage("Thiếu input!", threadID, messageID);
  var targetID = 0, num = 0;
  const userID = Object.keys(event.mentions)[0];
  if (args[0] == "me") {
    targetID = senderID;
    num = parseInt(args[1]);
  } else if (userID) {
    targetID = userID;
    let nameL = event.mentions[userID].split(" ").length;
    num = parseInt(args[nameL]);
  } else return api.sendMessage("Lựa chọn của bạn không hợp lệ", threadID, messageID);

  if (isNaN(num)) return api.sendMessage("Không phải là 1 con số", threadID, messageID);
  let dataM = usagesStore.data;
  if (!(targetID in dataM)) {
    dataM[targetID] = {
      usages: num,
      diemdanh: 0
    }
  } else dataM[targetID].usages = num;
  usagesStore.touch();
  return api.sendMessage(`Đã set cho ${((userID) ? event.mentions[userID].replace(/@/g, "") : "bản thân") + " " + num} lượt dùng bot`, threadID, messageID);
}