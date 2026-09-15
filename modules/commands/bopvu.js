const request = require("request");
const fs = require("fs")
const axios = require("axios")
module.exports.config = {
  name: "bopvu",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "Kaneki",
  description: "Bóp vú người bạn tag",
  commandCategory: "Lệnh 18+",
  usages: "[tag]",
  cooldowns: 5,
};

module.exports.run = async({ api, event, Threads, global }) => {
  var link = [    
"https://i.postimg.cc/tC2BTrmF/3.gif",
"https://i.postimg.cc/pLrqnDg4/78d07b6be53bea612b6891724c1a23660102a7c4.gif",
"https://i.postimg.cc/gJFD51nb/detail.gif",
"https://i.postimg.cc/xjPRxxQB/GiC86RK.gif",
"https://i.postimg.cc/L8J3smPM/tumblr-myzq44-Hv7-G1rat3p6o1-500.gif",
   ];
   var mention = Object.keys(event.mentions);
     let tag = event.mentions[mention].replace("@", "");
    if (!mention) return api.sendMessage("Vui lòng tag 1 người", threadID, messageID);
   var callback = () => api.sendMessage({body:`${tag}` + ` 𝗔𝗻𝗵 𝗕𝗼́𝗽 𝗩𝘂́ 𝗡𝘂̛́𝗻𝗴 𝗖𝗵𝘂̛𝗮 𝗖𝘂̣𝗰 𝗖𝘂̛𝗻𝗴  😝`,mentions: [{tag: tag,id: Object.keys(event.mentions)[0]}],attachment: fs.createReadStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_bopvu.gif")}, event.threadID, () => fs.unlinkSync(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_bopvu.gif"));  
      return request(encodeURI(link[Math.floor(Math.random() * link.length)])).pipe(fs.createWriteStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_bopvu.gif")).on("close",() => callback());
   }