const request = require("request");
const fs = require("fs")
const axios = require("axios")
module.exports.config = {
  name: "chacu",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "huy hoàng và hoàng",
  description: "Chà Cu Người Bạn Muốn",
  commandCategory: "Lệnh 18+",
  usages: "chacu",
  cooldowns: 5,
  dependencies: {
        "fs": "",
        "axios": "",
		"request": ""
    }
};

module.exports.run = async({api,event,args,client,Users,Threads,__GLOBAL,Currencies}) => {
        const request = require('request')
                const fs = require('fs')
                if (args.join().indexOf('@') !== -1)
        var link = [
          "https://i.imgur.com/iHHclXs.gif",
             ];
   var callback = () => api.sendMessage({body:`𝗖𝗵𝗮̀ 𝗖𝘂 𝗔𝗶 𝗠𝗮̀ 𝗠𝗮̣̆𝘁 𝗣𝗵𝗲̂ 𝗩𝗮̣̂𝘆 𝗘𝗺 🥀`
  ,attachment: fs.createReadStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_bulon.gif")}, event.threadID, () => fs.unlinkSync(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_bulon.gif"));
      return request(encodeURI(link[Math.floor(Math.random() * link.length)])).pipe(fs.createWriteStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_bulon.gif")).on("close",() => callback());
   };