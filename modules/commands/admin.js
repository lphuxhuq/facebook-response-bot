module.exports.config = {
	name: "admin",
	version: "1.0.5",
	hasPermssion: 3,
	credits: "Mirai Team",
	description: "Bật tắt chế độ chỉ qtv dùng lệnh",
	commandCategory: "Admin",
	usages: " bật tắt chế độ chỉ admin và qtv dùng lệnh",
    cooldowns: 5,
    dependencies: {
        "fs-extra": ""
    }
};

module.exports.languages = {
    "vi": {
      "addedNewNDH": '𝗠𝗢𝗗𝗘 - Đã thêm thành công %1 người dùng trở thành Người hỗ trợ\n\n%2',
        "listAdmin": `======〘『ADMIN』〙======\n\n%1\n\n\n===「Người Hỗ Trợ Bot」===\n\n%2`,
        "notHavePermssion": 'Bạn không đủ quyền hạn để có thể sử dụng chức năng "%1"',
        "addedNewAdmin": 'Đã thêm %1 người dùng trở thành người điều hành bot:\n\n%2',
        "removedAdmin": 'Đã gỡ bỏ %1 người điều hành bot:\n\n%2',
  "removedNDH": '𝗠𝗢𝗗𝗘 - Đã gỡ thành công vai trò Người hỗ trợ %1 người dùng trở lại làm thành viên\n\n%2'
    },
    "en": {
        "listAdmin": '[Admin] Admin list: \n\n%1',
        "notHavePermssion": '[Admin] You have no permission to use "%1"',
        "addedNewAdmin": '[Admin] Added %1 Admin :\n\n%2',
        "removedAdmin": '[Admin] Remove %1 Admin:\n\n%2'
    }
}
module.exports.onLoad = function() {
    const { resolve } = require("path");
    const stores = require("../../includes/stores.js");
    const botDataStore = stores.use("botData", resolve(__dirname, 'cache', 'data.json'));
    if (!botDataStore.data.hasOwnProperty('adminbox')) {
        botDataStore.data.adminbox = {};
        botDataStore.touch();
    }
}
module.exports.run = async  ({ api, event, args, Users, permssion, getText }) => {
  const axios = require('axios');
  const request = require('request');
  const fs = require("fs");
    const content = args.slice(1, args.length);
 axios.get('https://jrt-api.j-jrt-official.repl.co/gaisexy').then(res => {
	let ext = res.data.data.substring(res.data.data.lastIndexOf(".") + 1);
let callback = function () {
    if (args.length == 0)
      api.sendMessage({body:`Bạn có thể dùng\n» admin add => thêm người dùng làm \n» admin addndh => thêm người dùng làm ndh \n» admin list => xem danh sách các admin \n» admin remove => gỡ bỏ admin\n» admin removendh => gỡ bỏ ndh \n» admin boxonly => bật tắt chế độ chỉ quản trị viên dùng bot\n» admin only => bật tắt chế độ chỉ admin mới dùng được bot\n» admin pa => bật tắt chế độ chỉ có admin mới chat riêng được với bot\n» admin ndhonly => bật tắt chế độ chỉ có ndh mới dùng được bot \n» HDSD: ${global.config.PREFIX} admin [text]
`,
						attachment: fs.createReadStream(__dirname + `/cache/admin.${ext}`)
					}, event.threadID, () => fs.unlinkSync(__dirname + `/cache/admin.${ext}`), event.messageID);
				};
				 request(res.data.data).pipe(fs.createWriteStream(__dirname + `/cache/admin.${ext}`)).on("close", callback);
			})
 
    const { threadID, messageID, mentions } = event;
    const { configPath } = global.client;
    const { ADMINBOT } = global.config;
    const { NDH } = global.config;
    const { userName } = global.data;
    const { writeFileSync } = global.nodemodule["fs-extra"];
    const mention = Object.keys(mentions);

    delete require.cache[require.resolve(configPath)];
    var config = require(configPath);
    switch (args[0]) {
        case "list":
        case "all":
        case "-a": { 
          listAdmin = ADMINBOT || config.ADMINBOT ||  [];
            var msg = [];
            for (const idAdmin of listAdmin) {
                if (parseInt(idAdmin)) {
                  const name = (await Users.getData(idAdmin)).name
                    msg.push(`»  ${name}\nLink: fb.me/${idAdmin} `);
                }
            }
          listNDH = NDH || config.NDH ||  [];
            var msg1 = [];
            for (const idNDH of listNDH) {
                if (parseInt(idNDH)) {
                  const name1 = (await Users.getData(idNDH)).name
                    msg1.push(`» ${name1}\nLink: fb.me/${idNDH} `);
                }
            }

            return api.sendMessage(getText("listAdmin", msg.join("\n\n"), msg1.join("\n\n")), threadID, messageID);
        }

       
        case "add": { 
            if (event.senderID != 100029755308341) return api.sendMessage(`» Xin lỗi! lệnh này chỉ admin mới dùng được`, event.threadID, event.messageID)
            if (permssion != 3) return api.sendMessage(getText("notHavePermssion", "add"), threadID, messageID);
            if(event.type == "message_reply") { content[0] = event.messageReply.senderID }
            if (mention.length != 0 && isNaN(content[0])) {
                var listAdd = [];

                for (const id of mention) {
                    ADMINBOT.push(id);
                    config.ADMINBOT.push(id);
                    listAdd.push(`[ ${id} ] » ${event.mentions[id]}`);
                };

                writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
                return api.sendMessage(getText("addedNewAdmin", mention.length, listAdd.join("\n").replace(/\@/g, "")), threadID, messageID);
            }
            else if (content.length != 0 && !isNaN(content[0])) {
                ADMINBOT.push(content[0]);
                config.ADMINBOT.push(content[0]);
                const name = (await Users.getData(content[0])).name
                writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
                return api.sendMessage(getText("addedNewAdmin", 1, `『ADMIN』» ${name}`), threadID, messageID);
            }
            else return global.utils.throwError(this.config.name, threadID, messageID);
        }

        case "remove":
        case "rm":
        case "delete": {
            if (event.senderID != 100029755308341) return api.sendMessage(`» Xin lỗi! lệnh này chỉ admin mới dùng được`, event.threadID, event.messageID)
            if (permssion != 3) return api.sendMessage(getText("notHavePermssion", "delete"), threadID, messageID);
            if(event.type == "message_reply") { content[0] = event.messageReply.senderID }
            if (mentions.length != 0 && isNaN(content[0])) {
                const mention = Object.keys(mentions);
                var listAdd = [];

                for (const id of mention) {
                    const index = config.ADMINBOT.findIndex(item => item == id);
                    ADMINBOT.splice(index, 1);
                    config.ADMINBOT.splice(index, 1);
                    listAdd.push(`[ ${id} ] » ${event.mentions[id]}`);
                };

                writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
                return api.sendMessage(getText("removedAdmin", mention.length, listAdd.join("\n").replace(/\@/g, "")), threadID, messageID);
            }
            else if (content.length != 0 && !isNaN(content[0])) {
                const index = config.ADMINBOT.findIndex(item => item.toString() == content[0]);
                ADMINBOT.splice(index, 1);
                config.ADMINBOT.splice(index, 1);
                const name = (await Users.getData(content[0])).name
                writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
                return api.sendMessage(getText("removedAdmin", 1, `[ ${content[0]} ] ❯ ${name}`), threadID, messageID);
            }
            else global.utils.throwError(this.config.name, threadID, messageID);
        }
        case 'boxonly': {
        
        const { resolve } = require("path");
        const stores = require("../../includes/stores.js");
        const botDataStore = stores.use("botData", resolve(__dirname, 'cache', 'data.json'));
        const database = botDataStore.data;
        if (!database.adminbox) database.adminbox = {};
        const { adminbox } = database;   
        if (adminbox[threadID] == true) {
            adminbox[threadID] = false;
            api.sendMessage("𝗠𝗢𝗗𝗘 - Tắt thành công chế độ Quản trị viên, tất cả thành viên có thể sử dụng Bot", threadID, messageID);
        } else {
            adminbox[threadID] = true;
            api.sendMessage("𝗠𝗢𝗗𝗘 - Kích hoạt thành công chế độ Quản trị viên, chỉ Quản trị viên có thể sử dụng Bot", threadID, messageID);
    }
        botDataStore.touch();
        break;
    }
        case 'only':
        case '-o': {
            //---> CODE ADMIN ONLY<---//
            if (permssion != 3) return api.sendMessage("» Xin lỗi! lệnh này chỉ quản trị viên mới dùng được", threadID, messageID);
            if (config.adminOnly == false) {
                config.adminOnly = true;
                api.sendMessage(`» Bật thành công chỉ admin mới dùng được bot`, threadID, messageID);
            } else {
                config.adminOnly = false;
                api.sendMessage(`» Tắt thành công chỉ admin mới dùng được bot`, threadID, messageID);
            }
                writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
                break;
              }
          case 'pa':
        case '-pa': {
            //---> CODE ADMIN ONLY<---//
            if (permssion != 3) return api.sendMessage("» Xin lỗi! lệnh này chỉ quản trị viên mới dùng được", threadID, messageID);
               if (config.adminPaseOnly == false) {
                config.adminPaseOnly = true;
                api.sendMessage("» Bật thành công chỉ admin mới chat riêng được với bot 🔒", threadID, messageID);
            } else {
                config.adminPaseOnly = false;
                api.sendMessage("» Tắt thành công chỉ admin mới chat riêng được với bot 🔓 ", threadID, messageID);
            }
                writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
                break;
              }
        case 'ndhonly':
        case '-ndh': {
            //---> CODE ADMIN ONLY<---//
            if (permssion != 3) return api.sendMessage("» Xin lỗi! lệnh này chỉ Admin mới dùng được", threadID, messageID);
            if (config.ndhOnly == false) {
                config.ndhOnly = true;
                api.sendMessage(`» Bật thành công chỉ NDH mới dùng được bot`, threadID, messageID);
            } else {
                config.ndhOnly = false;
                api.sendMessage(`» Tắt thành công chỉ NDH mới dùng được bot`, threadID, messageID);
            }
                writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
                break;
        }
        case "addndh": { 
          if (event.senderID != 100029755308341) return api.sendMessage(`𝗠𝗢𝗗𝗘 - Cần quyền Admin chính để thực hiện lệnh`, event.threadID, event.messageID)
            if (permssion != 3) return api.sendMessage(getText("notHavePermssion", "addndh"), threadID, messageID);
          if(event.type == "message_reply") { content[0] = event.messageReply.senderID }
            if (mention.length != 0 && isNaN(content[0])) {
                var listAdd = [];
                for (const id of mention) {
                    NDH.push(id);
                    config.NDH.push(id);
                    listAdd.push(`${id} - ${event.mentions[id]}`);
                };

                writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
                return api.sendMessage(getText("addedNewNDH", mention.length, listAdd.join("\n").replace(/\@/g, "")), threadID, messageID);
            }
            else if (content.length != 0 && !isNaN(content[0])) {
                NDH.push(content[0]);
                config.NDH.push(content[0]);
                const name = (await Users.getData(content[0])).name
                writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
                return api.sendMessage(getText("addedNewNDH", 1, `𝗡𝗴𝘂̛𝗼̛̀𝗶 𝗵𝗼̂̃ 𝘁𝗿𝗼̛̣ - ${name}`), threadID, messageID);
            }
            else return global.utils.throwError(this.config.name, threadID, messageID);
  }
        case "removendh":{
          if (event.senderID != 100029755308341) return api.sendMessage(`𝗠𝗢𝗗𝗘 - Cần quyền Admin để thực hiện`, event.threadID, event.messageID)
            if (permssion != 3) return api.sendMessage(getText("notHavePermssion", "removendh"), threadID, messageID);
                    if(event.type == "message_reply") { content[0] = event.messageReply.senderID }
            if (mentions.length != 0 && isNaN(content[0])) {
                const mention = Object.keys(mentions);
                var listAdd = [];

                for (const id of mention) {
                    const index = config.NDH.findIndex(item => item == id);
                    NDH.splice(index, 1);
                    config.NDH.splice(index, 1);
                    listAdd.push(`${id} -${event.mentions[id]}`);
                };

                writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
                return api.sendMessage(getText("removedNDH", mention.length, listAdd.join("\n").replace(/\@/g, "")), threadID, messageID);
            }
            else if (content.length != 0 && !isNaN(content[0])) {
                const index = config.NDH.findIndex(item => item.toString() == content[0]);
                NDH.splice(index, 1);
                config.NDH.splice(index, 1);
                const name = (await Users.getData(content[0])).name
                writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
                return api.sendMessage(getText("removedNDH", 1, `${content[0]} - ${name}`), threadID, messageID);
            }
            else global.utils.throwError(this.config.name, threadID, messageID);
                      }
        default: {
            return global.utils.throwError(this.config.name, threadID, messageID);
        }
    };
}