module.exports.config = {
  name: "help",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Mirai Team Mod By Kadeer", // fix DuyVuong
  description: "Hướng dẫn cho người mới",
  commandCategory: "Trợ Giúp",
  usages: "[Tên module]",
  cooldowns: 5,
  envConfig: {
    autoUnsend: true,
    delayUnsend: 60
  }
};

module.exports.handleEvent = function ({ api, event }) {
    const axios = require('axios');
    const request = require('request');
    const fs = require("fs");
    const { commands } = global.client;
    const { threadID, messageID, body } = event;
    if (!body || typeof body == "undefined" || body.indexOf("help") != 0) return;
    const splitBody = body.slice(body.indexOf("help")).trim().split(/\s+/);
    if (splitBody.length == 1 || !commands.has(splitBody[1].toLowerCase())) return;
    const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
    const command = commands.get(splitBody[1].toLowerCase());
    const prefix = (threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : global.config.PREFIX;
        return axios.get('https://apikanna.khoahoang3.repl.co/').then(res => {
    let ext = res.data.data.substring(res.data.data.lastIndexOf(".") + 1);
    let callback = function () {
    
          api.sendMessage({body:` » Lệnh: ${command.config.name}
» Thực thi: ${command.config.description}
» Cách sử dụng: ${prefix}${command.config.name} ${(command.config.usages) ? command.config.usages : "Chưa có hướng dẫn cụ thể"}
» Thời gian chờ: ${command.config.cooldowns}
» Quyền hạn: ${((command.config.hasPermssion == 0) ? `Người dùng` : (command.config.hasPermssion == 1) ? `Quản trị viên nhóm` : `Quản trị viên BOT`)}
» Credit: ${command.config.credits}`, 
            attachment: fs.createReadStream(__dirname + `/cache/4723.${ext}`)
        }, event.threadID, () => fs.unlinkSync(__dirname + `/cache/4723.${ext}`), event.messageID);
        }; request(res.data.data).pipe(fs.createWriteStream(__dirname + `/cache/4723.${ext}`)).on("close", callback);
     });
}

module.exports.run = function({ api, event, args }) {
    const axios = require('axios');
    const request = require('request');
    const fs = require("fs-extra");
    const { commands } = global.client;
    const { threadID, messageID } = event;
    const command = commands.get((args[0] || "").toLowerCase());
    const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
    const { autoUnsend, delayUnsend } = global.configModule[this.config.name];
    const prefix = (threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : global.config.PREFIX;
  var tl = ["Bạn yêu admin khi nào vậy ?","Admin cute hơn bạn","tôi không có khả năng hiểu con gái","con bot này giúp bạn hỗ trợ trong việc học?","spam bot tôi sẽ ban bạn khỏi người dùng bot","đừng để tôi cáu nhé!","việc bạn đang làm là vô nghĩa","bạn đã làm tôi cáu😡","tôi yêu bạn vai lon","bạn có yêu tôi không ?","cái gì chưa biết chỉ cần biết là được","con chuột bị ốm uống thuốc chuột thì tại sao con chuột lại chết ?","chảy máu cam nhưng sao màu máu là màu đỏ ?","đây chỉ là sản phẩm kem chống nắng ?","Tôi không có khả năng hiểu được bạn","Ngày 29 tháng 11 là ngày sinh nhật của admin ?","Con bot này giống bạn nó cũng yêu bạn như bạn yêu admin vậy !","Đây là tình yêu bạn giành cho admin hả ?","Bạn yêu admin hả ?","228922 là một con số tuyệt vời.","Đây là một lệnh vô dụng","177013 là một con số tuyệt vời","Đã từng có 600+ code JAV ở phiên bản đầu tiên","Ngôn ngữ của admin là ngôn ngữ của chúa","Nếu bạn gặp 1 người có tên là admin hãy tránh xa người đó càng nhiều càng tốt. Nếu không cả gia phả nhà người đó sẽ ám bạn suốt đời, con cháu bạn sẽ bị ám bởi cái tên admin","Đây là con bot tự viết code cho chính nó","7749 là con số đẹp cho tình yêu","bạn có yêu tôi không ?","bạn rất ngu"];
  var tle = tl[Math.floor(Math.random() * tl.length)];
  if (args[0] == "all") {
    const command = commands.values();
    var group = [], msg = "";
    for (const commandConfig of command) {
      if (!group.some(item => item.group.toLowerCase() == commandConfig.config.commandCategory.toLowerCase())) group.push({ group: commandConfig.config.commandCategory.toLowerCase(), cmds: [commandConfig.config.name] });
      else group.find(item => item.group.toLowerCase() == commandConfig.config.commandCategory.toLowerCase()).cmds.push(commandConfig.config.name);
    }
    group.forEach(commandGroup => msg += `🌸 ${commandGroup.group.charAt(0).toUpperCase() + commandGroup.group.slice(1)} 🌸\n${commandGroup.cmds.join(' • ')}\n\n`);
    return axios.get('https://apikanna.khoahoang3.repl.co/').then(res => {
    let ext = res.data.data.substring(res.data.data.lastIndexOf(".") + 1);
    let callback = function () {
        api.sendMessage({ body:`  ❤️ 𝐋𝐈𝐒𝐓 𝐓𝐎̂̉𝐍𝐆 𝐋𝐄̣̂𝐍𝐇 💜\n\n` + msg + `≻───── •❤️‍🔥• ─────≺\n💓 𝐇𝐢𝐞̣̂𝐧 𝐭𝐚̣𝐢 𝐜𝐨́ ${commands.size} 𝐥𝐞̣̂𝐧𝐡 𝐜𝐨́ 𝐭𝐡𝐞̂̉ 𝐬𝐮̛̉ 𝐝𝐮̣𝐧𝐠 𝐭𝐫𝐞̂𝐧 𝐛𝐨𝐭 𝐧𝐚̀𝐲 💗\n🌟𝐒𝐮̛̉ 𝐝𝐮̣𝐧𝐠: "${prefix}𝗵𝗲𝗹𝗽 + 𝘁𝗲̂𝗻 𝗹𝗲̣̂𝗻𝗵" 𝗰𝗵𝗼 𝗯𝗶𝗲̂́𝘁 𝗰𝗵𝗶 𝘁𝗶𝗲̂́𝘁 𝘀𝘂̛̉ 𝗱𝘂̣𝗻𝗴 𝗹𝗲̣̂𝗻𝗵\n💝𝐁𝐨𝐭 𝐤𝐡𝐨̛̉𝐢 𝐜𝐡𝐚̣𝐲 𝐛𝐨̛̉𝐢 ĐạT\n[💝] 𝐓𝐫𝐞̂𝐧 𝐋𝐚̀ 𝐓𝐨𝐚̀𝐧 𝐁𝐨̣̂ 𝐋𝐞̣̂𝐧𝐡 𝐂𝐨́ 𝐓𝐫𝐨𝐧𝐠 𝐅𝐢𝐥𝐞 𝐁𝐨𝐭 𝐂𝐮̉𝐚 Đạt. [❗]\n🔰𝗩𝘂𝗶 𝗟𝗼̀𝗻𝗴 𝗞𝗵𝗼̂𝗻𝗴 𝗦𝗽𝗮𝗺 𝗕𝗼𝘁  [❗]`, 
            attachment: fs.createReadStream(__dirname + `/cache/472.${ext}`)
        }, event.threadID, (err, info) => {
        fs.unlinkSync(__dirname + `/cache/472.${ext}`);
        if (autoUnsend == true) {
            setTimeout(() => { 
                return api.unsendMessage(info.messageID);
            }, delayUnsend * 1000);
        }
        else return;
    }, event.messageID);
        }
         request(res.data.data).pipe(fs.createWriteStream(__dirname + `/cache/472.${ext}`)).on("close", callback);
     })
};
if (!command) {
    const commandsPush = [];
    const page = parseInt(args[0]) || 1;
    const pageView = 20;
    let i = 0;
    let msg = " 🔱 𝐃𝐀𝐍𝐇 𝐒𝐀́𝐂𝐇 𝐋𝐄̣̂𝐍𝐇 🔱\n\n";
    for (var [name, value] of (commands)) {
        name += `
» ${value.config.description}
Thời gian chờ: ${value.config.cooldowns}s
Quyền hạn: ${((value.config.hasPermssion == 0) ? `Người dùng` : (value.config.hasPermssion == 1) ? `Quản trị viên nhóm` : `Quản trị viên BOT`)}\n`;
        commandsPush.push(name);
    }

    commandsPush.sort((a, b) => a.data - b.data);

    const first = pageView * page - pageView;
    i = first;
    const helpView = commandsPush.slice(first, first + pageView);

    for (let cmds of helpView)
        msg += `🌸 ${cmds}\n`;
    const cmdsView = `
🔱 𝐓𝐫𝐚𝐧𝐠 ${page}/${Math.ceil(commandsPush.length/pageView)}
≻───── •❤️‍🔥• ─────≺
💓 𝐇𝐢𝐞̣̂𝐧 𝐭𝐚̣𝐢 𝐜𝐨́ ${commandsPush.length} 𝐥𝐞̣̂𝐧𝐡 𝐜𝐨́ 𝐭𝐡𝐞̂̉ 𝐬𝐮̛̉ 𝐝𝐮̣𝐧𝐠 𝐭𝐫𝐞̂𝐧 𝐛𝐨𝐭 𝐧𝐚̀𝐲 💗
🌟𝐒𝐮̛̉ 𝐝𝐮̣𝐧𝐠: "${prefix}𝗵𝗲𝗹𝗽 + 𝘁𝗲̂𝗻 𝗹𝗲̣̂𝗻𝗵" 𝗰𝗵𝗼 𝗯𝗶𝗲̂́𝘁 𝗰𝗵𝗶 𝘁𝗶𝗲̂́𝘁 𝘀𝘂̛̉ 𝗱𝘂̣𝗻𝗴 𝗹𝗲̣̂𝗻𝗵
💝𝐁𝐨𝐭 𝐤𝐡𝐨̛̉𝐢 𝐜𝐡𝐚̣𝐲 𝐛𝐨̛̉𝐢 Đạt
[💝] 𝐓𝐫𝐞̂𝐧 𝐋𝐚̀ 𝐓𝐨𝐚̀𝐧 𝐁𝐨̣̂ 𝐋𝐞̣̂𝐧𝐡 𝐂𝐨́ 𝐓𝐫𝐨𝐧𝐠 𝐅𝐢𝐥𝐞 𝐁𝐨𝐭 𝐂𝐮̉𝐚 Đạt. [❗]
🔰𝗩𝘂𝗶 𝗟𝗼̀𝗻𝗴 𝗞𝗵𝗼̂𝗻𝗴 𝗦𝗽𝗮𝗺 𝗕𝗼𝘁  [❗]`;
    return axios.get('https://apikanna.khoahoang3.repl.co/').then(res => {
    let ext = res.data.data.substring(res.data.data.lastIndexOf(".") + 1);
    let callback = function () {
        api.sendMessage({body: msg + cmdsView, attachment: fs.createReadStream(__dirname + `/cache/478.${ext}`)
        }, event.threadID, (err, info) => {
        fs.unlinkSync(__dirname + `/cache/478.${ext}`);
        if (autoUnsend == true) {
            setTimeout(() => { 
                return api.unsendMessage(info.messageID);
            }, delayUnsend * 1000);
        }
        else return; 
        }, event.messageID);
    }
        request(res.data.data).pipe(fs.createWriteStream(__dirname + `/cache/478.${ext}`)).on("close", callback);
     })
};
return axios.get('https://apikanna.khoahoang3.repl.co/').then(res => {
    let ext = res.data.data.substring(res.data.data.lastIndexOf(".") + 1);
    let callback = function () {
        api.sendMessage({body:`
╭───╮\n   ${command.config.name}\n╰───╯ \n
» 📜 𝐌𝐨̂ 𝐭𝐚̉: ${command.config.description}
» 💓 𝐇𝐮̛𝐨̛́𝐧𝐠 𝐝𝐚̂̃𝐧 𝐬𝐮̛̉ 𝐝𝐮̣𝐧𝐠: ${prefix}${command.config.name} ${(command.config.usages) ? command.config.usages : "Chưa có hướng dẫn cụ thể"}
» ⏱ 𝐓𝐡𝐨̛̀𝐢 𝐠𝐢𝐚𝐧 𝐜𝐡𝐨̛̀: ${command.config.cooldowns}
» 🗂 𝐓𝐡𝐮𝐨̣̂𝐜 𝐧𝐡𝐨́𝐦: ${command.config.commandCategory}
» 👥 𝐐𝐮𝐲𝐞̂̀𝐧 𝐡𝐚̣𝐧: ${((command.config.hasPermssion == 0) ? `Người dùng` : (command.config.hasPermssion == 1) ? `Quản trị viên nhóm` : `Quản trị viên BOT`)}
» 👻 𝐂𝐫𝐞𝐝𝐢𝐭: ${command.config.credits}
✎﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏
💓 𝐐𝐮ả𝐧 𝐋í 𝐁ở𝐢 Nguyễn Đạt 🐉`,
        attachment: fs.createReadStream(__dirname + `/cache/475.${ext}`)
        }, event.threadID, () => fs.unlinkSync(__dirname + `/cache/475.${ext}`), event.messageID);
        }; request(res.data.data).pipe(fs.createWriteStream(__dirname + `/cache/475.${ext}`)).on("close", callback);
     })
};
