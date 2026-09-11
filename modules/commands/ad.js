module.exports.config = {
  name: "ad",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "",
  description: "Kiểm tra thông tin admin .",
  commandCategory: "Thông tin admin",
  usages: "adm",
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
"https://i.imgur.com/rUIYng2.mp4",
  ];
  var callback = () => api.sendMessage({body:`[admin]
  👀 Tên: Nguyễn Đạt
💮 Biệt danh: 🌸Đạt🌸
❎ Tuổi: 18
👤 Giới tính: Nam
💫 Chiều cao : 1m7
💘 Mối quan hệ:vẫn đang chờ ny❤️
🌎 Quê quán: Hải Dương
👫 Gu: biết nấu cơm
🌸 Tính cách: Trầm
🌀 Sở thích: Chơi game,nghe nhạc
💻Contact💻
☎ SĐT:0868963942
🌐Facebook:https://www.facebook.com/datproo
✉️ Email: ndat1010205@gmail.com
✔Donate:
💳tsr MB BANK 
💳 VCB 0868963942
            🌸Đạt🌸`,attachment: fs.createReadStream(__dirname + "/cache/5.mp4")}, event.threadID, () => fs.unlinkSync(__dirname + "/cache/5.mp4")); 
      return request(encodeURI(link[Math.floor(Math.random() * link.length)])).pipe(fs.createWriteStream(__dirname+"/cache/5.mp4")).on("close",() => callback());
   };