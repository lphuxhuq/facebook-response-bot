module.exports.config = {
  name: "ma",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Tuấn",
  description: "Random ảnh kinh dị",
  commandCategory: "Random-IMG",
  usages: "ma",
  cooldowns: 2,
  dependencies: {
    "request":"",
    "fs-extra":"",
    "axios":""
  }
    
};

module.exports.run = async({api,event,args,Users,Threads,Currencies}) => {
const axios = global.nodemodule["axios"];
const request = global.nodemodule["request"];
const fs = global.nodemodule["fs-extra"];
    var link = [
"https://i.imgur.com/x6PXJMO.jpg",
"https://i.imgur.com/OesTe1r.jpg",
"https://i.imgur.com/gwduJ8I.jpg",
"https://i.imgur.com/o9ymSbO.jpg",
"https://i.imgur.com/jZk1Dpz.jpg",
"https://i.imgur.com/Lexk1ja.jpg",
"https://i.imgur.com/N4lY35p.jpg",
"https://i.imgur.com/f45gAPS.jpg",
"https://i.imgur.com/FgBOBS6.jpg",
"https://i.imgur.com/jYDWZm7.jpg",
"https://i.imgur.com/uvwANX7.jpg",
"https://i.imgur.com/jW3yfgc.jpg",
"https://i.imgur.com/lCJykyZ.jpg",
"https://i.imgur.com/OsLJYqk.jpg",
"https://i.imgur.com/TC6LdQi.jpg",
"https://i.imgur.com/GYSx3Kr.jpg",
"https://i.imgur.com/nSUSAiu.jpg",
"https://i.imgur.com/iyiUP96.jpg",
"https://i.imgur.com/vMBIJrA.jpg",
"https://i.imgur.com/oU2SIRm.jpg",
     ];
     var callback = () => api.sendMessage({body:`𝐈 𝐂𝐚𝐧'𝐭 𝐒𝐞𝐞 𝐘𝐨𝐮 ⚠️`,attachment: fs.createReadStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.jpg")}, event.threadID, () => fs.unlinkSync(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.jpg"));  
      return request(encodeURI(link[Math.floor(Math.random() * link.length)])).pipe(fs.createWriteStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.jpg")).on("close",() => callback());
   };