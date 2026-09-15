module.exports.config = {
  name: "box",
  version: "1.0.3",
  hasPermssion: 0,
  credits: "HungCho (Khánh Milo Fix)",
  description: "Các cài đặt của nhóm chat.",
  commandCategory: "Box Chat",
  usages: "[id/name/setname/emoji/qtv/image/info]",
  cooldowns: 1,
  dependencies: {
    "request": "",
    "fs-extra": "path"
  }
};

const totalPath = __dirname + '/cache/totalChat.json';
const _24hours = 86400000;
const fs = require("fs-extra");

module.exports.handleEvent = async ({
  api,
  event,
  args
}) => {
  if (!fs.existsSync(totalPath)) fs.writeFileSync(totalPath, JSON.stringify({}));
  let totalChat = JSON.parse(fs.readFileSync(totalPath));
  if (!totalChat[event.threadID]) return;
  if (Date.now() - totalChat[event.threadID].time > (_24hours * 2)) {
    let sl = (await api.getThreadInfo(event.threadID)).messageCount;
    totalChat[event.threadID] = {
      time: Date.now() - _24hours,
      count: sl,
      ytd: sl - totalChat[event.threadID].count
    }
    fs.writeFileSync(totalPath, JSON.stringify(totalChat, null, 2));
  }
}

module.exports.run = async ({
  api,
  event,
  args,
  Threads,
  Users,
  utils
}) => {
  const request = require("request");
  const {
    resolve
  } = require("path");
  const moment = require("moment-timezone");
  var timeNow = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss")
  if (args.length == 0) return api.sendMessage(`[𝐁𝐎𝐗 🎀] - /𝗯𝗼𝘅 𝗲𝗺𝗼𝗷𝗶 [𝗶𝗰𝗼𝗻]\n𝗧𝗵𝗮𝘆 𝗶𝗰𝗼𝗻 𝗯𝗼𝘅\n[𝐁𝐎𝐗 🎀] - /𝗯𝗼𝘅 𝘀𝗲𝘁𝗻𝗮𝗺𝗲 [𝘁𝗲𝘅𝘁]\n 𝗧𝗵𝗮𝘆 𝘁𝗲̂𝗻 𝗯𝗼𝘅\n[𝐁𝐎𝐗 🎀] - /𝗯𝗼𝘅 𝗶𝗺𝗮𝗴𝗲 [𝗿𝗲𝗽 𝗮̉𝗻𝗵]\n 𝗧𝗵𝗮𝘆 𝗮𝘃𝗮𝘁𝗮𝗿 𝗯𝗼𝘅\n[𝐁𝐎𝐗 🎀] - /𝗯𝗼𝘅 𝗾𝘁𝘃 [𝘁𝗮𝗴]\n 𝗡𝗼́ 𝘀𝗲̃ 𝘁𝗿𝗮𝗼 𝗾𝘁𝘃 𝗰𝗵𝗼 𝗻𝗴𝘂̛𝗼̛̀𝗶 𝗯𝗮̣𝗻 𝘁𝗮𝗴\n[𝐁𝐎𝐗 🎀] - /𝗯𝗼𝘅 𝗶𝗻𝗳𝗼\n 𝗧𝗼𝗮̀𝗻 𝗯𝗼̣̂ 𝘁𝗵𝗼̂𝗻𝗴 𝘁𝗶𝗻 𝗰𝘂̉𝗮 𝗻𝗵𝗼́𝗺 !\n[𝐁𝐎𝐗 🎀] /𝗯𝗼𝘅 𝗻𝗮𝗺𝗲\n 𝗫𝗲𝗺 𝘁𝗲̂𝗻 𝗯𝗼𝘅`, event.threadID, event.messageID);

  if (args[0] == "id") {
    return api.sendMessage(`${event.threadID}`, event.threadID, event.messageID);
  }

  if (args[0] == "name") {
    var nameThread = global.data.threadInfo.get(event.threadID).threadName || ((await Threads.getData(event.threadID)).threadInfo).threadName;
    return api.sendMessage(nameThread, event.threadID, event.messageID);
  }

  if (args[0] == "setname") {
    var content = args.join(" ");
    var c = content.slice(7, 99) || event.messageReply.body;
    api.setTitle(`${c} `, event.threadID);
  }

  if (args[0] == "emoji") {
    const name = args[1] || event.messageReply.body;
    api.changeThreadEmoji(name, event.threadID)

  }

  if (args[0] == "me") {
    if (args[1] == "qtv") {
      const threadInfo = await api.getThreadInfo(event.threadID)
      const find = threadInfo.adminIDs.find(el => el.id == api.getCurrentUserID());
      if (!find) api.sendMessage("[𝐁𝐎𝐗 🎀] BOT cần ném quản trị viên để dùng ?", event.threadID, event.messageID)
      else if (!global.config.ADMINBOT.includes(event.senderID)) api.sendMessage("[𝐁𝐎𝐗 🎀] Quyền lồn biên giới ?", event.threadID, event.messageID)
      else api.changeAdminStatus(event.threadID, event.senderID, true);
    }
  }

  if (args[0] == "qtv") {
    if (args.join().indexOf('@') !== -1) {
      namee = Object.keys(event.mentions)
    } else namee = args[1]
    if (event.messageReply) {
      namee = event.messageReply.senderID
    }

    const threadInfo = await api.getThreadInfo(event.threadID)
    const findd = threadInfo.adminIDs.find(el => el.id == namee);
    const find = threadInfo.adminIDs.find(el => el.id == api.getCurrentUserID());
    const finddd = threadInfo.adminIDs.find(el => el.id == event.senderID);

    if (!finddd) return api.sendMessage("[𝐁𝐎𝐗 🎀] Mày đéo phải quản trị viên box ?", event.threadID, event.messageID);
    if (!find) {
      api.sendMessage("[𝐁𝐎𝐗 🎀] Không ném quản trị viên dùng con cặc ?", event.threadID, event.messageID)
    }
    if (!findd) {
      api.changeAdminStatus(event.threadID, namee, true);
    } else api.changeAdminStatus(event.threadID, namee, false)
  }

  if (args[0] == "image") {
    if (event.type !== "message_reply") return api.sendMessage("[𝐕𝐒🐥] Bạn phải reply một audio, video, ảnh nào đó", event.threadID, event.messageID);
    if (!event.messageReply.attachments || event.messageReply.attachments.length == 0) return api.sendMessage("[𝐁𝐎𝐗 🎀] Bạn phải reply một audio, video, ảnh nào đó", event.threadID, event.messageID);
    if (event.messageReply.attachments.length > 1) return api.sendMessage(`[𝐕𝐒🐥] Vui lòng reply chỉ một audio, video, ảnh!`, event.threadID, event.messageID);
    var callback = () => api.changeGroupImage(fs.createReadStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png"), event.threadID, () => fs.unlinkSync(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png"));
    return request(encodeURI(event.messageReply.attachments[0].url)).pipe(fs.createWriteStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png")).on('close', () => callback());
  };

  if (args[0] == "info") {
    const moment = require("moment-timezone");
    var timeNow = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss");
    if (!fs.existsSync(totalPath)) fs.writeFileSync(totalPath, JSON.stringify({}));
    let totalChat = JSON.parse(fs.readFileSync(totalPath));
    let threadInfo = await api.getThreadInfo(event.threadID);
    let timeByMS = Date.now();

    var memLength = threadInfo.participantIDs.length;
    let threadMem = threadInfo.participantIDs.length;
    var nameMen = [];
    var gendernam = [];
    var gendernu = [];
    var nope = [];
    for (let z in threadInfo.userInfo) {
      var gioitinhone = threadInfo.userInfo[z].gender;
      var nName = threadInfo.userInfo[z].name;
      if (gioitinhone == "MALE") {
        gendernam.push(z + gioitinhone)
      } else if (gioitinhone == "FEMALE") {
        gendernu.push(gioitinhone)
      } else {
        nope.push(nName)
      }
    };
    var nam = gendernam.length;
    var nu = gendernu.length;
    let qtv = threadInfo.adminIDs.length;
    let sl = threadInfo.messageCount;
    let u = threadInfo.nicknames;
    let icon = threadInfo.emoji;

    let threadName = threadInfo.threadName;
    let id = threadInfo.threadID;
    let sex = threadInfo.approvalMode;
    var pd = sex == false ? 'tắt' : sex == true ? 'bật' : 'Kh';


    if (!totalChat[event.threadID]) {
      totalChat[event.threadID] = {
        time: timeByMS,
        count: sl,
        ytd: 0
      }
      fs.writeFileSync(totalPath, JSON.stringify(totalChat, null, 2));
    }

    let mdtt = "Chưa có thống kê";
    let preCount = totalChat[event.threadID].count || 0;
    let ytd = totalChat[event.threadID].ytd || 0;
    let hnay = (ytd != 0) ? (sl - preCount) : "Chưa có thống kê";
    let hqua = (ytd != 0) ? ytd : "Chưa có thống kê";
    if (timeByMS - totalChat[event.threadID].time > _24hours) {
      if (timeByMS - totalChat[event.threadID].time > (_24hours * 2)) {
        totalChat[event.threadID].count = sl;
        totalChat[event.threadID].time = timeByMS - _24hours;
        totalChat[event.threadID].ytd = sl - preCount;
        fs.writeFileSync(totalPath, JSON.stringify(totalChat, null, 2));
      }
      getHour = Math.ceil((timeByMS - totalChat[event.threadID].time - _24hours) / 3600000);
      if (ytd == 0) mdtt = 100;
      else mdtt = ((((hnay) / ((hqua / 24) * getHour))) * 100).toFixed(0);
      mdtt += "%";
    }

    var callback = () =>
      api.sendMessage({
        body: `⭐️ 𝐁𝐨𝐱: ${threadName}\n🎮 𝐈𝐃 𝐁𝐨𝐱: ${id}\n📱 𝐏𝐡𝐞̂ 𝐝𝐮𝐲𝐞̣̂𝐭: ${pd}\n🐰 𝐄𝐦𝐨𝐣𝐢: ${icon}\n📌 𝐓𝐡𝐨̂𝐧𝐠 𝐭𝐢𝐧: ${threadMem} 𝐭𝐡𝐚̀𝐧𝐡 𝐯𝐢𝐞̂𝐧\n𝐒𝐨̂́ 𝐭𝐯 𝐧𝐚𝐦 🧑‍🦰: ${nam} 𝐭𝐡𝐚̀𝐧𝐡 𝐯𝐢𝐞̂𝐧\n𝐒𝐨̂́ 𝐭𝐯 𝐧𝐮̛̃ 👩‍🦰: ${nu} 𝐭𝐡𝐚̀𝐧𝐡 𝐯𝐢𝐞̂𝐧\n🕵️‍♂️ 𝐆𝐨̂̀𝐦 ${qtv} 𝐪𝐮𝐚̉𝐧 𝐭𝐫𝐢̣ 𝐯𝐢𝐞̂𝐧\n💬 𝐓𝐨̂̉𝐧𝐠: ${sl} 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧\n📈 𝐌𝐮̛́𝐜 𝐭𝐮̛𝐨̛𝐧𝐠 𝐭𝐚́𝐜: ${mdtt}\n🌟 𝐓𝐨̂̉𝐧𝐠 𝐬𝐨̂́ 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐡𝐨̂𝐦 𝐪𝐮𝐚: ${hqua}\n🌟 𝐓𝐨̂̉𝐧𝐠 𝐬𝐨̂́ 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐡𝐨̂𝐦 𝐧𝐚𝐲: ${hnay}\n      === 「${timeNow}」 ===`,
        attachment: fs.createReadStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png")
      },
        event.threadID,
        () => fs.unlinkSync(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png"),
        event.messageID
      );
    return request(encodeURI(`${threadInfo.imageSrc}`))
      .pipe(fs.createWriteStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png"))
      .on('close', () => callback());
  }
}
