/** Đổi Credit ? Bọn t đã không mã hóa cho mà edit rồi thì tôn trọng nhau tý đi ¯\_(ツ)_/¯ **/
module.exports.config = {
  name: "\n",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Suhao",
  description: "Random ảnh gái khi dùng dấu lệnh",
  commandCategory: "Hình ảnh",
  usages: "ig",
  cooldowns: 5,
  dependencies: {
    "request":"",
    "fs-extra":"",
    "axios":""
  }
};

module.exports.run = async({api,event,args,client,Users,Threads,__GLOBAL,Currencies}) => {
const axios = global.nodemodule["axios"];
const request = global.nodemodule["request"];
const fs = global.nodemodule["fs-extra"];
  var link = [
"https://imgur.com/k4xESsc.jpg",
"https://imgur.com/gxajrQw.jpg",
"https://imgur.com/i4UckYW.jpg",
"https://imgur.com/Q9Eein6.jpg",
"https://imgur.com/uuBaZQX.jpg",
"https://imgur.com/svP4AZI.jpg",
"https://imgur.com/wUCksfG.jpg",
"https://imgur.com/IMI9pKx.jpg",
"https://imgur.com/uuW7Qoy.jpg",
"https://imgur.com/jIiTgtZ.jpg",
"https://imgur.com/NFYAPeG.jpg",
"https://imgur.com/WVvUtDM.jpg",
"https://imgur.com/Gr4HfPV.jpg",
"https://imgur.com/Y5mAAsw.jpg",
"https://imgur.com/NhBiIYm.jpg",
"https://imgur.com/woXyGyy.jpg",
"https://imgur.com/yyXaQGN.jpg",
"https://imgur.com/MDaPFwJ.jpg",
"https://imgur.com/EuuZwyj.jpg",
"https://imgur.com/4ByQe4P.jpg",
"https://imgur.com/rwHFhSr.jpg",
"https://imgur.com/9Yank8H.jpg",
"https://imgur.com/QojcuvN.jpg",
"https://imgur.com/rygaXkp.jpg",
"https://imgur.com/2C6QFuo.jpg",
"https://imgur.com/mStbPdH.jpg",
"https://imgur.com/7p5kpP0.jpg",
"https://imgur.com/TZbZ07p.jpg",
"https://imgur.com/wR072Dl.jpg",
"https://imgur.com/qU2FRbJ.jpg",
"https://imgur.com/2PygSEN.jpg",
"https://imgur.com/NKoZwpV.jpg",
"https://imgur.com/OYoMVa4.jpg",
"https://imgur.com/WwtYdmG.jpg",
"https://imgur.com/1Rgk61m.jpg",
"https://imgur.com/LbNIAKP.jpg",
"https://imgur.com/N0da6Hu.jpg",
"https://imgur.com/OcY4plA.jpg",
"https://imgur.com/68YxoZm.jpg",
"https://imgur.com/QVdl6C9.jpg",
"https://imgur.com/3lOSIB6.jpg",
];
	 var callback = () => api.sendMessage({body:`[𝐃𝐎𝐑𝐀𝐄𝐌𝐎𝐍] Sai lệnh rồi kìa gõ /help hoặc /menu để xem lệnh ik nè\n──── •❤️• ────`,attachment: fs.createReadStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_5.jpg")}, event.threadID, () => fs.unlinkSync(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_5.jpg"));	
      return request(encodeURI(link[Math.floor(Math.random() * link.length)])).pipe(fs.createWriteStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_5.jpg")).on("close",() => callback());
   };