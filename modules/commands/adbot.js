module.exports.config = {
    name: "adbot",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "HungCho Mod By NguyenHoangAnhProCoder",
    description: "",
    commandCategory: "Admin",
    usages: "",
    cooldowns: 4,
    dependencies: {
        "request": "",
        "fs": ""
    }
    
};

module.exports.run = async({api,event,args}) => {
    const fs = global.nodemodule["fs-extra"];
    const request = global.nodemodule["request"];
    const threadSetting = global.data.threadData.get(parseInt(event.threadID)) || {};
    const prefix = (threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : global.config.PREFIX;
     if (args.length == 0) return api.sendMessage(`Bạn có thể dùng:\n\n${prefix}${this.config.name} user => nó sẽ lấy thông tin của chính bạn.\n\n${prefix}${this.config.name} user @[Tag] => nó sẽ lấy thông tin người bạn tag.\n\n${prefix}${this.config.name} box => nó sẽ lấy thông tin box của bạn (số thành viên, djt nhau,...)\n\n${prefix}${this.config.name} user box [uid || tid.:\n\n${prefix}${this.config.name} admin => Thông tin cá nhân của Admin Bot]`, event.threadID, event.messageID);
    if (args[0] == "box") {
           if(args[1]){ let threadInfo = await api.getThreadInfo(args[1]);
           let imgg = threadInfo.imageSrc;
           var gendernam = [];
            var gendernu = [];
                for (let z in threadInfo.userInfo) {
                var gioitinhone = threadInfo.userInfo[z].gender;
                if(gioitinhone == "MALE"){gendernam.push(gioitinhone)
                }else{gendernu.push(gioitinhone)
                }};
             var nam = gendernam.length;
             var nu = gendernu.length;
             let sex = threadInfo.approvalMode;
       var pd = sex == false ? "tắt" : sex == true ? "bật" : "Kh";
       if(!imgg) api.sendMessage(`👀 Tên nhóm: ${threadInfo.threadName}\n🐧 TID: ${args[1]}\n🦋 Phê duyệt: ${pd}\n🐤 Emoji: ${threadInfo.emoji}\n☺️ Thông tin: \n» ${threadInfo.participantIDs.length} thành viên và ${threadInfo.adminIDs.length} quản trị viên.\n» Gồm ${nam} nam và ${nu} nữ.\n» Tổng số tin nhắn: ${threadInfo.messageCount}.`,event.threadID,event.messageID);
        else var callback = () => api.sendMessage({body:`👀 Tên nhóm: ${threadInfo.threadName}\n🐧 TID: ${args[1]}\n🦋 Phê duyệt: ${pd}\n🐤 Emoji: ${threadInfo.emoji}\n☺️ Thông tin: \n» ${threadInfo.participantIDs.length} thành viên và ${threadInfo.adminIDs.length} quản trị viên.\n» Gồm ${nam} nam và ${nu} nữ.\n» Tổng số tin nhắn: ${threadInfo.messageCount}.`,attachment: fs.createReadStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png")}, event.threadID, () => fs.unlinkSync(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png"), event.messageID); 
      return request(encodeURI(`${threadInfo.imageSrc}`)).pipe(fs.createWriteStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png")).on('close',() => callback());
      
      }
          
            let threadInfo = await api.getThreadInfo(event.threadID);
            let img = threadInfo.imageSrc;
            var gendernam = [];
            var gendernu = [];
                for (let z in threadInfo.userInfo) {
                var gioitinhone = threadInfo.userInfo[z].gender;
                if(gioitinhone == "MALE"){gendernam.push(gioitinhone)
                }else{gendernu.push(gioitinhone)
                }};
             var nam = gendernam.length;
             var nu = gendernu.length;
             let sex = threadInfo.approvalMode;
       var pd = sex == false ? "tắt" : sex == true ? "bật" : "Kh";
          if(!img) api.sendMessage(`👀 Tên nhóm: ${threadInfo.threadName}\n🐧 TID: ${event.threadID}\n🦋 Phê duyệt: ${pd}\n🐤 Emoji: ${threadInfo.emoji}\n☺️ Thông tin: \n» ${threadInfo.participantIDs.length} thành viên và ${threadInfo.adminIDs.length} quản trị viên.\n» Gồm ${nam} nam và ${nu} nữ.\n» Tổng số tin nhắn: ${threadInfo.messageCount}.`,event.threadID,event.messageID)
          else  var callback = () => api.sendMessage({body:`👀 Tên nhóm: ${threadInfo.threadName}\n🐧 TID: ${event.threadID}\n🦋 Phê duyệt: ${pd}\n🐤 Emoji: ${threadInfo.emoji}\n☺️ Thông tin: \n» ${threadInfo.participantIDs.length} thành viên và ${threadInfo.adminIDs.length} quản trị viên.\n» Gồm ${nam} nam và ${nu} nữ.\n» Tổng số tin nhắn: ${threadInfo.messageCount}.`,attachment: fs.createReadStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png")}, event.threadID, () => fs.unlinkSync(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png"), event.messageID);   
      return request(encodeURI(`${threadInfo.imageSrc}`)).pipe(fs.createWriteStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png")).on('close',() => callback());
    }
               if (args.length == 0) return api.sendMessage(`Bạn có thể dùng:\n\n${prefix}${this.config.name} user => nó sẽ lấy thông tin của chính bạn.\n\n${prefix}${this.config.name} user @[Tag] => nó sẽ lấy thông tin người bạn tag.\n\n${prefix}${this.config.name} box => nó sẽ lấy thông tin box của bạn (số thành viên, djt nhau,...)\n\n${prefix}${this.config.name} user box [uid || tid]`, event.threadID, event.messageID);
    if (args[0] == "admin") {
      var callback = () => api.sendMessage(
  {body:`ㅤㅤ🌸 𝐀𝐃𝐌𝐈𝐍 𝐁𝐎𝐓 🌸\n
👀 𝐓𝐞̂𝐧: Nguyễn Quốc Đạt
❎ 𝐓𝐮𝐨̂̉𝐢: 18
👤 𝐆𝐢𝐨̛́𝐢 𝐓𝐢́𝐧𝐡: 𝗡𝗮𝗺
💫 𝐂𝐡𝐢𝐞̂̀𝐮 𝐜𝐚𝐨 𝐜𝐚̂𝐧 𝐧𝐚̣̆𝐧𝐠: 𝟭𝗺𝟳𝟗 𝘅 𝟔𝟑𝗸𝗴
💘 𝐌𝐨̂́𝐢 𝐪𝐮𝐚𝐧 𝐡𝐞̣̂: 𝗙.𝗔
🌎 𝐐𝐮𝐞̂ 𝐪𝐮𝐚́𝐧: Nam Định
👫 𝐆𝐮: 𝗕𝗶𝗲̂́𝘁 𝗻𝗮̂́𝘂 𝗰𝗼̛𝗺, 𝗱𝗮𝗺𝗱𝗮𝗻𝗴
🌸 𝐓𝐢́𝐧𝐡 𝐜𝐚́𝐜𝐡: 𝑪𝒉𝒊̣𝒖
🌀 𝐒𝐨̛̉ 𝐭𝐡𝐢́𝐜𝐡: 𝗖𝗵𝗼̛𝗶 𝗴𝗮𝗺𝗲, 𝘅𝗲𝗺 𝗽𝗵𝗶𝗺 𝗯𝗹𝗮𝗯𝗹𝗮, 𝗮̆𝗻, 𝗻𝗴𝘂̉
💻𝐂𝐨𝐧𝐭𝐚𝐜𝐭💻
☎ 𝗦𝗗𝗧 & 𝗭𝗮𝗹𝗼: 𝟎868963942
🌐 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤: 𝒉𝒕𝒕𝒑𝒔://𝒘𝒘𝒘.𝒇𝒂𝒄𝒆𝒃𝒐𝒐𝒌.𝒄𝒐𝒎/100063918255502/`,
    attachment: fs.createReadStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png")}, event.threadID, () => 
    fs.unlinkSync(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png"));  
      return request(
        encodeURI(`https://graph.facebook.com/${100000287637041}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)).pipe(
fs.createWriteStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png")).on('close',() => callback());
    
      };

if (args[0] == "user") { 
    if(!args[1]){
    if(event.type == "message_reply") id = event.messageReply.senderID
    else id = event.senderID;
    let data = await api.getUserInfo(id);
    let url = data[id].profileUrl;
    let b = data[id].isFriend == false ? "không !" : data[id].isFriend == true ? "có !" : "Đéo";
    let sn = data[id].vanity;
    let name = await data[id].name;
    var sex = await data[id].gender;
    var gender = sex == 2 ? "Nam" : sex == 1 ? "Nữ" : "Trần Đức Bo";
    var callback = () => api.sendMessage({body:`😚Tên: ${name}` + `\n🏝URL cá nhân: ${url}` + `\n💦Tên người dùng: ${sn}\n🐧UID: ${id}\n🦋Giới tính: ${gender}\n❄️Kết bạn bot: ${b}`,attachment: fs.createReadStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png")}, event.threadID, () => fs.unlinkSync(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png"),event.messageID); 
       return request(encodeURI(`https://graph.facebook.com/${id}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)).pipe(fs.createWriteStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png")).on('close',() => callback());
   }
    else {
    
    if (args.join().indexOf('@') !== -1){
    var mentions = Object.keys(event.mentions)
    let data = await api.getUserInfo(mentions);
    let url = data[mentions].profileUrl;
    let b = data[mentions].isFriend == false ? "không !" : data[mentions].isFriend == true ? "có !" : "Đéo";
    let sn = data[mentions].vanity;
    let name = await data[mentions].name;
    var sex = await data[mentions].gender;
    var gender = sex == 2 ? "Nam" : sex == 1 ? "Nữ" : "Trần Đức Bo";
    var callback = () => api.sendMessage({body:`😚Tên: ${name}` + `\n🏝URL cá nhân: ${url}` + `\n💦Tên người dùng: ${sn}\n🐧UID: ${mentions}\n🦋Giới tính: ${gender}\n❄️Kết bạn bot: ${b}`,attachment: fs.createReadStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png")}, event.threadID, () => fs.unlinkSync(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png"),event.messageID);   
       return request(encodeURI(`https://graph.facebook.com/${mentions}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)).pipe(fs.createWriteStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png")).on('close',() => callback());
    }
    else {
    let data = await api.getUserInfo(args[1]);
    let url = data[args[1]].profileUrl;
    let b = data[args[1]].isFriend == false ? "không !" : data[args[1]].isFriend == true ? "có !" : "Đéo";
    let sn = data[args[1]].vanity;
    let name = await data[args[1]].name;
    var sex = await data[args[1]].gender;
    var gender = sex == 2 ? "Nam" : sex == 1 ? "Nữ" : "Trần Đức Bo";
    var callback = () => api.sendMessage({body:`😚Tên: ${name}` + `\n🏝URL cá nhân: ${url}` + `\n💦Tên người dùng: ${sn}\n🐧UID: ${args[1]}\n🦋Giới tính: ${gender}\n❄️Kết bạn bot: ${b}`,attachment: fs.createReadStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png")}, event.threadID, () => fs.unlinkSync(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png"),event.messageID);   
       return request(encodeURI(`https://graph.facebook.com/${args[1]}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)).pipe(fs.createWriteStream(__dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_1.png")).on('close',() => callback());
    }
     }
   
    
     }


      }





  