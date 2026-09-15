const request = require("request");
const fs = require("fs")
const axios = require("axios")
module.exports.config = {
  name: "đấm",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Kaneki",
  description: "Đấm người bạn tag",
  commandCategory: "Hành Động",
  usages: "[tag]",
  cooldowns: 5,
};

module.exports.run = async({ api, event, Threads, global }) => {
  var link = [    
"https://i.postimg.cc/SNX8pD8Z/13126.gif",
"https://i.postimg.cc/TYZb2gJT/1467506881-1016b5fd386cf30488508cf6f0a2bee5.gif",
"https://i.postimg.cc/fyV3DR33/anime-punch.gif",
"https://i.postimg.cc/P5sLnhdx/onehit-30-5-2016-3.gif",
   ];
   var mention = Object.keys(event.mentions);
     let tag = event.mentions[mention].replace("@", "");
    if (!mention) return api.sendMessage("Vui lòng tag 1 người", threadID, messageID);
   var callback = () => api.sendMessage({body:`${tag}` + ` 𝗕𝗲𝗺 𝘃𝗼̂ 𝗺𝗮̣̆𝘁 𝗰𝗵𝗼́ 𝗺𝗮̀𝘆 𝗻𝗲̀ 𝗰𝗵𝘂̛̀𝗮 𝘁𝗮̣̂𝘁 𝘀𝗮̂𝗻 𝘀𝗶 𝗻𝗵𝗲𝗲 👿`,mentions: [{tag: tag,id: Object.keys(event.mentions)[0]}],attachment: fs.createReadStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_puch.gif")}, event.threadID, () => fs.unlinkSync(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_puch.gif"));  
      return request(encodeURI(link[Math.floor(Math.random() * link.length)])).pipe(fs.createWriteStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_puch.gif")).on("close",() => callback());
   }