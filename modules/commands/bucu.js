const request = require("request");
const fs = require("fs")
const axios = require("axios")
module.exports.config = {
  name: "bucu",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "Kaneki",
  description: "Bú cu người bạn tag",
  commandCategory: "Lệnh 18+",
  usages: "[tag]",
  cooldowns: 5,
};

module.exports.run = async({ api, event, Threads, global }) => {
  var link = [    
"https://i.postimg.cc/4y4FLjSN/blowjob-madoka-higuchi-najar-001.gif",
"https://i.postimg.cc/SQVP2NnX/by-buckethead-porn-gifs-sex-gif.gif",
"https://i.postimg.cc/HsxhQDM6/cartoon-bj-001.gif",
"https://i.postimg.cc/GmTg5FqY/detail.gif",
"https://i.postimg.cc/W3T9zQj6/Nats-Cocksuckers-Gif.gif",
   ];
   var mention = Object.keys(event.mentions);
     let tag = event.mentions[mention].replace("@", "");
    if (!mention) return api.sendMessage("Vui lòng tag 1 người", threadID, messageID);
   var callback = () => api.sendMessage({body:`${tag}` + ` 𝗕𝘂́ 𝗰𝘂 𝗰𝗵𝗼 𝗮𝗻𝗵 𝗯𝗮̆́𝗻 𝗻𝗵𝗮𝗻𝗵 𝗻𝗮̀𝗼 😋`,mentions: [{tag: tag,id: Object.keys(event.mentions)[0]}],attachment: fs.createReadStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_bucu.gif")}, event.threadID, () => fs.unlinkSync(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_bucu.gif"));  
      return request(encodeURI(link[Math.floor(Math.random() * link.length)])).pipe(fs.createWriteStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_bucu.gif")).on("close",() => callback());
   }