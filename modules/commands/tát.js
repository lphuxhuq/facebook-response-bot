const request = require("request");
const fs = require("fs")
const axios = require("axios")
module.exports.config = {
  name: "tát",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Kaneki",
  description: "Tát người bạn tag",
  commandCategory: "Hành Động",
  usages: "[tag]",
  cooldowns: 5,
};

module.exports.run = async({ api, event, Threads, global }) => {
  var link = [    
"https://i.postimg.cc/9QLrR9G4/12334wrwd534wrdf-3.gif",
"https://i.postimg.cc/pTFT6138/12334wrwd534wrdf-8.gif",
"https://i.postimg.cc/L5VHddDq/slap-anime.gif",
"https://i.postimg.cc/K8jmWHMz/VW0cOyL.gif",
   ];
   var mention = Object.keys(event.mentions);
     let tag = event.mentions[mention].replace("@", "");
    if (!mention) return api.sendMessage("Vui lòng tag 1 người", threadID, messageID);
   var callback = () => api.sendMessage({body:`${tag}` + ` 𝗧𝗮́𝘁 𝗖𝗵𝗲̂́𝘁 𝗖𝗼𝗻 𝗠𝗲̣ 𝗠𝗮̀𝘆 𝗡𝗲̀ 𝗖𝗼𝗻 𝗡𝘂̛́𝗻𝗴 𝗟𝗼̂̀𝗻 𝗠𝗼𝗻𝗴 𝗠𝗮𝗻𝗵 😏`,mentions: [{tag: tag,id: Object.keys(event.mentions)[0]}],attachment: fs.createReadStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_tatslap.gif")}, event.threadID, () => fs.unlinkSync(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_tatslap.gif"));  
      return request(encodeURI(link[Math.floor(Math.random() * link.length)])).pipe(fs.createWriteStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_tatslap.gif")).on("close",() => callback());
   }