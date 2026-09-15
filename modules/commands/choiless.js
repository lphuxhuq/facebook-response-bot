const request = require("request");
const fs = require("fs")
const axios = require("axios")
module.exports.config = {
  name: "choiless",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "Kaneki",
  description: "Chơi less người bạn tag",
  commandCategory: "Lệnh 18+",
  usages: "[tag]",
  cooldowns: 5,
};

module.exports.run = async({ api, event, Threads, global }) => {
  var link = [    
"https://i.postimg.cc/50XmX1Tz/0516-riding-hard.gif",
"https://i.postimg.cc/TYMc3z9y/3597-hentai-lesbians.gif",
"https://i.postimg.cc/rpP1X3sw/Busty-Mercy-and-D-Va-Lesbian.gif",
"https://i.postimg.cc/Kz3nZf3r/detail.gif",
"https://i.postimg.cc/QCp17MbF/detail-2.gif",
"https://i.postimg.cc/W19rgCMw/lesbian-001.gif",
   ];
   var mention = Object.keys(event.mentions);
     let tag = event.mentions[mention].replace("@", "");
    if (!mention) return api.sendMessage("Vui lòng tag 1 người", threadID, messageID);
   var callback = () => api.sendMessage({body:`${tag}` + ` 𝗦𝘂̛𝗼̛́𝗻𝗴 𝗾𝘂𝗮́ 𝗬𝗮𝗺𝗮𝘁𝗲, 𝗶 𝗰𝘂̛ 𝗶 𝗰𝘂̛ 😖`,mentions: [{tag: tag,id: Object.keys(event.mentions)[0]}],attachment: fs.createReadStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_choiless.gif")}, event.threadID, () => fs.unlinkSync(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_choiless.gif"));  
      return request(encodeURI(link[Math.floor(Math.random() * link.length)])).pipe(fs.createWriteStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_choiless.gif")).on("close",() => callback());
   }