module.exports.config = {
  name: "fixspam",
  version: "1.0.0",
  hasPermssion: 2,
  credit: "ManhG",
  description: "Người chửi bot sẽ tự động bị ban khỏi hệ thống <3 bản ko reply",
  commandCategory: "Hệ Thống",
  usages: "",
  cooldowns: 0,
  denpendencies: {}
};

module.exports.handleEvent = async ({ event, api, Users, Threads }) => {
  var { threadID, messageID, body, senderID, reason } = event;
  const moment = require("moment-timezone");
  const time = moment.tz("Asia/Ho_Chi_minh").format("HH:MM:ss L");

    var { threadID, messageID, body, senderID } = event; const thread = global.data.threadData.get(threadID) || {};
    if (typeof thread["fixspam"] !== "undefined" && thread["fixspam"] == false) return;


  if (senderID == global.data.botID) return;
  let name = await Users.getNameUser(event.senderID);
  var idbox = event.threadID;
  var threadInfo = (await Threads.getData(threadID)).threadInfo;
  //trả lời
  var msg = {
    body: `» 𝐓𝐡𝐨̂𝐧𝐠 𝐛𝐚́𝐨 𝐭𝐮̛̀ 𝐀𝐝𝐦𝐢𝐧 «\n\n${name}, 𝐁𝐚̣𝐧 𝐭𝐡𝐚̣̂𝐭 𝐧𝐠𝐮 𝐥𝐨̂̀𝐧 𝐤𝐡𝐢 𝐜𝐡𝐮̛̉𝐢 𝐛𝐨𝐭 𝐯𝐢̀ 𝐯𝐚̣̂𝐲 𝐛𝐨𝐭 𝐯𝐮̛̀𝐚 𝐚𝐮𝐭𝐨 𝐛𝐚𝐧 𝐛𝐚̣𝐧 𝐤𝐡𝐨̉𝐢 𝐡𝐞̣̂ 𝐭𝐡𝐨̂́𝐧𝐠\n\n💌 𝐋𝐢𝐞̂𝐧 𝐡𝐞̣̂ 𝐀𝐝𝐦𝐢𝐧:🌸https://www.facebook.com/hoannopro🌸\n𝐒𝐡𝐨𝐰 𝐚̉𝐧𝐡 𝐝𝐮́, 𝐦𝐨̂𝐧𝐠 𝐧𝐞̂́𝐮 𝐦𝐮𝐨̂́𝐧 𝐠𝐨̛̃ 𝐛𝐚𝐧 𝐧𝐡𝐞́ >< \n\n⚠️ 𝐓𝐡𝐚̉ 𝐭𝐲𝐦 𝐜𝐡𝐨 𝐛𝐚̣𝐧 𝐧𝐞̀ <3`
  }
  // Gọi bot
  const arr = ["bot óc chó", "bot lồn", "bot ngu", "bot gà", "bot lol", "bot tuấn óc", "bot như cặc", "bot chó", "bot ngu lồn", "bot chó", "dm bot", "dmm bot", "Clm bot", "bot ghẻ", "đmm bot", "đb bot", "bot điên", "bot dở", "bot khùng", "đĩ bot", "bot paylac rồi", "con bot lòn", "cmm bot", "clap bot", "bot ncc", "bot oc", "bot óc", "bot óc chó", "cc bot", "bot tiki", "lozz bottt", "lol bot", "loz bot", "lồn bot", "bot hãm", "bot lon", "bot cac", "bot nhu lon", "bot như cc", "bot như bìu", "bot sida", "bot xàm", "bot fake", "bot súc vật", "bot shoppee", "bot đểu", "bot như lồn", "bot dởm"];

  arr.forEach(i => {
    let str = i[0].toUpperCase() + i.slice(1);
    if (body === i.toUpperCase() | body === i | str === body) {
      const uidUser = event.senderID;
      modules = "chui bot:"
      console.log(name, modules, i);
      const data = Users.getData(uidUser).data || {};
      Users.setData(uidUser, { data });
      data.banned = 1;
      data.reason = i || null;
      data.dateAdded = time;
      global.data.userBanned.set(uidUser, { reason: data.reason, dateAdded: data.dateAdded });

      api.sendMessage(msg, threadID, () => {
        var listAdmin = global.config.ADMINBOT;
        for (var idad of listAdmin) {
          let namethread = threadInfo.threadName;
          api.sendMessage(`🌸== 𝐁𝐨𝐭 𝐍𝐨𝐭𝐢𝐟𝐢𝐜𝐚𝐭𝐢𝐨𝐧 ==🌸\n\n🆘 𝐓𝐨̣̂𝐢 𝐧𝐡𝐚̂𝐧: ${name}\n🔰 𝐔𝐢𝐝: ${uidUser}\n🤷‍♂️ 𝐁𝐨𝐱: ${namethread}\n⚠️ 𝐂𝐡𝐮̛̉𝐢 𝐛𝐨𝐭: ${i}\n\n𝐕𝐨̛̣ 𝐕𝐮̛̀𝐚 𝐁𝐚𝐧 𝐍𝐨́ 𝐊𝐡𝐨̉𝐢 𝐒𝐲𝐬𝐭𝐞𝐦 💞`, idad);
        }
      });
    }
  });

};
module.exports.languages = {
  "vi": {
    "on": "𝐁𝐚̣̂𝐭",
    "off": "𝐓𝐚̆́𝐭",
    "successText": "𝐅𝐢𝐱𝐬𝐩𝐚𝐦 𝐧𝐡𝐨́𝐦 𝐧𝐚̀𝐲 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠",
  },
  "en": {
    "on": "on",
    "off": "off",
    "successText": "fixspam success!",
  }
}

module.exports.run = async function ({ api, event, Threads, getText }) {
  const { threadID, messageID } = event;
  let data = (await Threads.getData(threadID)).data;

  if (typeof data["fixspam"] == "undefined" || data["fixspam"] == true) data["fixspam"] = false;
  else data["fixspam"] = true;

  await Threads.setData(threadID, { data });
  global.data.threadData.set(threadID, data);
  return api.sendMessage(`${(data["fixspam"] == false) ? getText("off") : getText("on")} ${getText("successText")}`, threadID, messageID);
}

