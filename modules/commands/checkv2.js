  module.exports.config = {
    name: "checkv2",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "binee",
    description: "check trình độ xạo lìn và v.v...",
    commandCategory: "Thông tin",
    usages: "",
    cooldowns: 3,
    dependencies: {
        "request": "",
        "fs": ""
    }
    
};

module.exports.run = async({ api, event, args, Users }) => {

    const fs = global.nodemodule["fs-extra"];
    const request = global.nodemodule["request"];
    var tile = Math.floor(Math.random() * 101);
    var tm = Math.floor(Math.random() * 101);
    var sm = Math.floor(Math.random() * 101);
    var st = Math.floor(Math.random() * 101);
    var sl = Math.floor(Math.random() * 101);
    var giau = Math.floor(Math.random() * 101);
    var chet = Math.floor(Math.random() * 150);
    
if (!args[0]) {
    var id = event.senderID;
    var name = (await Users.getData(id)).name
    var callback = () => api.sendMessage({body:`【${name}】\n🧠Thông minh: ${tm}% \n💪Sức mạnh:${sm}%\n🧛‍♂️Khả năng sinh tồn:${st}%\n🧟‍♀️Độ xạo lồn :${sl}%\n💸Độ giàu có:${giau}%\n⏳ Tuổi chết:${chet}`,attachment: fs.createReadStream(__dirname + "/cache/1.png")}, event.threadID, () => fs.unlinkSync(__dirname + "/cache/1.png"),event.messageID); 
       return request(encodeURI(`https://graph.facebook.com/${id}/picture?height=750&width=750&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)).pipe(fs.createWriteStream(__dirname+'/cache/1.png')).on('close',() => callback());
   }

else if (Object.keys(event.mentions).length == 1) {
    var mentions = Object.keys(event.mentions)
    var name = (await Users.getData(mentions)).name
    var callback = () => api.sendMessage({body:`【${name}】\n🧠Thông minh: ${tm}% \n💪Sức mạnh:${sm}%\n🧛‍♂️Khả năng sinh tồn:${st}%\n🧟‍♀️Độ xạo lồn :${sl}%\n💸Độ giàu có:${giau}%\n⏳ Tuổi chết:${chet}`,attachment: fs.createReadStream(__dirname + "/cache/1.png")}, event.threadID, () => fs.unlinkSync(__dirname + "/cache/1.png"),event.messageID);   
       return request(encodeURI(`https://graph.facebook.com/${mentions}/picture?height=750&width=750&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)).pipe(fs.createWriteStream(__dirname+'/cache/1.png')).on('close',() => callback());
    }

else {
  if(!args[1]){
  if (event.type == "message_reply") idmen = event.messageReply.senderID
    else idmen = event.senderID;
    var name = (await Users.getData(idmen)).name
    var callback = () => api.sendMessage({body:`【${name}】\n🧠Thông minh: ${tm}% \n💪Sức mạnh:${sm}%\n🧛‍♂️Khả năng sinh tồn:${st}%\n🧟‍♀️Độ xạo lồn :${sl}%\n💸Độ giàu có:${giau}%\n⏳ Tuổi chết:${chet}`,attachment: fs.createReadStream(__dirname + "/cache/1.png")}, event.threadID, () => fs.unlinkSync(__dirname + "/cache/1.png"),event.messageID); 
       return request(encodeURI(`https://graph.facebook.com/${idmen}/picture?height=750&width=750&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)).pipe(fs.createWriteStream(__dirname+'/cache/1.png')).on('close',() => callback());
   
    }
  }
}