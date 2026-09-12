const path = require("path");
const { mkdirSync, writeFileSync, existsSync, createReadStream, readdirSync, readFileSync } = require("fs-extra");
const axios = require("axios");

module.exports.config = {
    name: "heodenroi",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "D-Jukie",
    description: "Trò Chơi Con Heo",
    commandCategory: "Trò Chơi",
    usages: "",
    cooldowns: 2
};
module.exports.onLoad = async () => {
    const dir = __dirname + `/heodenroi/datauser/`;
    const _dir = __dirname + `/heodenroi/datauser/`;
    const __dir = __dirname + `/heodenroi/cache/`;
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    if (!existsSync(_dir)) mkdirSync(_dir, { recursive: true });
    if (!existsSync(__dir)) mkdirSync(__dir, { recursive: true });
    setInterval(increaseTurn, 1000*60*10);
    function increaseTurn() {
        try {
            const data = readdirSync(__dirname + `/heodenroi/datauser`);
            if(data.length == 0) return;
            for (let i of data) { 
                if (!i.endsWith('.json')) continue;
                const p = path.join(__dirname, 'heodenroi', 'datauser', i);
                try {
                    const o = JSON.parse(readFileSync(p, 'utf-8'));
                    if(o && o.spin < 30) {
                        o.spin = o.spin + 5;
                        writeFileSync(p, JSON.stringify(o, null, 4));
                    }
                } catch(err) {}
            }
        } catch(e) {}
    }
    return;
}

module.exports.checkPath = function (type, senderID) {
    const pathGame = path.join(__dirname, 'heodenroi', 'datauser', `${senderID}.json`);
    if (type == 1) return pathGame;
    if (type == 2) {
        if (!existsSync(pathGame)) return {};
        try {
            return JSON.parse(readFileSync(pathGame, 'utf-8'));
        } catch (e) {
            return {};
        }
    }
}

module.exports.image = async function(link) {
    var images = [];
    let download = (await axios.get(link, { responseType: "arraybuffer" } )).data; 
        writeFileSync( __dirname + `/heodenroi/cache/heodenroi.png`, Buffer.from(download, "utf-8"));
        images.push(createReadStream(__dirname + `/heodenroi/cache/heodenroi.png`));
    return images
}

module.exports.run = async function ({ api, event, args, Users, Currencies }) {
    const { threadID, messageID, senderID } = event;
    const pathData = path.join(__dirname, 'heodenroi', 'datauser', `${senderID}.json`);
    switch (args[0]) {
        case 'register':
        case 'r': {
            const nDate = new Date().toLocaleString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh'
            });
            if (!existsSync(pathData)) {
                var obj = {};
                obj.name = (await Users.getData(senderID)).name;
                obj.ID = senderID;
                obj.shield = 3
                obj.coins = 20000
                obj.Island = {};
                obj.Island.level = 1
                obj.Island.coinsLV = 200
                obj.Island.data = {};
                obj.Island.data.tower = 0
                obj.Island.data.tree = 0
                obj.Island.data.pool = 0
                obj.Island.data.pet = 0
                obj.spin = 20
                obj.timeRegister = nDate
                writeFileSync(pathData, JSON.stringify(obj, null, 4));
                return api.sendMessage("𝐓𝐚̣𝐨 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 𝐠𝐚𝐦𝐞 𝐡𝐞𝐨 𝐭𝐨̛́𝐢 𝐫𝐨̂̀𝐢 🐷", threadID, messageID);
            } else return api.sendMessage("𝐁𝐚̣𝐧 𝐡𝐢𝐞̣̂𝐧 𝐜𝐨́ 𝐭𝐫𝐨𝐧𝐠 𝐜𝐨̛ 𝐬𝐨̛̉ 𝐡𝐞̣̂ 𝐭𝐡𝐨̂́𝐧𝐠 𝐫𝐨̂̀𝐢 🐷", threadID, messageID);

        }
        case 'spin': {
            if (!existsSync(pathData)) {
                return api.sendMessage({body: "𝐁𝐚̣𝐧 𝐜𝐡𝐮̛𝐚 𝐭𝐚̣𝐨 𝐭𝐚̀𝐢 𝐤𝐡𝐨𝐚̉𝐧 𝐠𝐚𝐦𝐞 🐷", attachment: await this.image('https://i.imgur.com/uMaDJAH.jpg')}, threadID, messageID);
            }
            if(this.checkPath(2, senderID).spin == 0) return api.sendMessage('𝐁𝐚̣𝐧 𝐡𝐞̂́𝐭 𝐥𝐮̛𝐨̛̣𝐭 𝐪𝐮𝐚𝐲 𝐫𝐨̂̀𝐢, 𝐯𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐦𝐮𝐚 𝐭𝐡𝐞̂𝐦 𝐡𝐨𝐚̣̆𝐜 𝐜𝐡𝐨̛̀ 𝟓𝐩 𝐡𝐞̣̂ 𝐭𝐡𝐨́𝐧𝐠 𝐬𝐞̃ 𝐭𝐚̣̆𝐧𝐠 𝐛𝐚̣𝐧 𝟓 𝐥𝐮̛𝐨̛̣𝐭 𝐬𝐩𝐢𝐧 🐷', threadID, messageID);
            this.checkPath(2, senderID).spin = parseInt(this.checkPath(2, senderID).spin) - 1;
            writeFileSync(this.checkPath(1, senderID), JSON.stringify(this.checkPath(2, senderID), null, 4));
            var items = [`${this.checkPath(2, senderID).Island.level * 1000} 𝗰𝗼𝗶𝗻𝘀 💸`, `${this.checkPath(2, senderID).Island.level * 3000} 𝗰𝗼𝗶𝗻𝘀 💸`, `${this.checkPath(2, senderID).Island.level * 5000} 𝗰𝗼𝗶𝗻𝘀 💸`, '𝘀𝗶𝗲̂𝘂 𝘁𝗿𝗼̣̂𝗺 🎭', '𝗸𝗵𝗶𝗲̂𝗻 🛡', '𝘁𝗮̂́𝗻 𝗰𝗼̂𝗻𝗴 💣', '𝟭 𝗹𝘂̛𝗼̛̣𝘁 𝗾𝘂𝗮𝘆 ⚗', '𝟮 𝗹𝘂̛𝗼̛̣𝘁 𝗾𝘂𝗮𝘆 ⚗', '𝟱 𝗹𝘂̛𝗼̛̣𝘁 𝗾𝘂𝗮𝘆 ⚗'];
            var getItem = items[Math.floor(Math.random() * items.length)];
            var i = this.getSpin(items, getItem, senderID);
            api.sendMessage({body: `️🎉 𝐂𝐡𝐮́𝐜 𝐦𝐮̛̀𝐧𝐠 𝐛𝐚̣𝐧 𝐪𝐮𝐚𝐲 𝐭𝐫𝐮́𝐧𝐠: ${getItem}`, attachment: await this.image('https://i.imgur.com/CRn3aFH.png')}, threadID, messageID);
            await new Promise(resolve => setTimeout(resolve, 1000));
            const data = readdirSync(__dirname + `/heodenroi/datauser`);
            if(i == 3) {
                if(data.length < 4) return api.sendMessage(`🔐 𝐂𝐚̂̀𝐧 𝐢́𝐭 𝐧𝐡𝐚̂́𝐭 𝟑 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐭𝐫𝐞̂𝐧 𝐬𝐞𝐫𝐯𝐞𝐫 𝐦𝐨̛́𝐢 𝐜𝐨́ 𝐭𝐡𝐞̂̉ 𝐭𝐫𝐨̣̂𝐦`, threadID, messageID);
                const dem = [];
                for (let i of data) { 
                    if(i != `${senderID}.json`) {
                        dem.push(require(`./heodenroi/datauser/${i}`));
                    }
                }
                dem.sort((a, b) => a.coins + b.coins);
                var msg = `𝐒𝐨̂́ 𝐭𝐢𝐞̂̀𝐧 𝐜𝐚𝐨 𝐧𝐡𝐚̂́𝐭 𝐥𝐚̀: ${dem[0].coins / 2}\n`
                const randomIndex = dem.sort(function() { return .5 - Math.random() });
                for(var i = 0; i < 3; i ++) {
                    msg += `${i+1}. ${randomIndex[i].name} - 𝐇𝐚̀𝐧𝐡 𝐭𝐢𝐧𝐡 𝐥𝐞𝐯𝐞𝐥 ${randomIndex[i].Island.level}\n`
                }
                msg += '✉️ 𝐕𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐫𝐞𝐩𝐥𝐲 𝐯𝐨̛́𝐢 𝐥𝐮̛̣𝐚 𝐜𝐡𝐨̣𝐧 𝐛𝐚̣𝐧 𝐦𝐮𝐨̂́𝐧 𝐭𝐫𝐨̣̂𝐦 !'
                const picture = (await axios.get(`https://i.imgur.com/OmvHHyC.jpg`, { responseType: "stream"})).data
  const { threadID, messageID } = event;
   return api.sendMessage({body: `🐷=== 𝐒𝐢𝐞̂𝐮 𝐓𝐫𝐨̣̂𝐦 𝐂𝐮̛𝐨̛́𝐩 ===🐷\n${msg}`, attachment: (picture)
        }, threadID, (_error, info) => {
                    global.client.handleReply.push({
                        name: this.config.name,
                        messageID: info.messageID,
                        author: event.senderID,
                        type: "steal",
                        dem,
                        randomIndex
                    })
                }, messageID);
            }
            else if(i == 5) {
                if(data.length < 4) return api.sendMessage({body: "𝐂𝐚̂̀𝐧 𝐢́𝐭 𝐧𝐡𝐚̂́𝐭 𝟑 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐭𝐫𝐞̂𝐧 𝐬𝐞𝐫𝐯𝐞𝐫 𝐦𝐨̛́𝐢 𝐜𝐨́ 𝐭𝐚̂́𝐧 𝐜𝐨̂𝐧𝐠", attachment: await this.image('https://i.imgur.com/1vWv69Z.jpg')}, threadID, messageID);
                var msgf = `🗡[====𝐀𝐓𝐓𝐀𝐂𝐊====]🗡\n`, number = 1, p = [];
                for (let i of data) { 
                    if(i != `${senderID}.json`) {
                        var o = require(`./heodenroi/datauser/${i}`);
                        p.push(o)
                        msgf += `🔫${number++}. ${o.name} ⚙️ 𝐇𝐚̀𝐧𝐡 𝐭𝐢𝐧𝐡 𝐥𝐞𝐯𝐞𝐥 ${o.Island.level}\n`
                    }
                }
                const picture = (await axios.get(`https://i.imgur.com/8mQsLdf.jpg`, { responseType: "stream"})).data
  const { threadID, messageID } = event;
   return api.sendMessage({body: msgf, attachment: (picture)
        }, threadID, (_error, info) => {
                    global.client.handleReply.push({
                        name: this.config.name,
                        messageID: info.messageID,
                        author: event.senderID,
                        type: "attack",
                        p
                    })
                }, messageID);
            }
            break;
        }
        case 'build': 
        case 'xaydung': {
            if (!existsSync(pathData)) {
                return api.sendMessage({body: "𝐁𝐚̣𝐧 𝐜𝐡𝐮̛𝐚 𝐭𝐚̣𝐨 𝐭𝐚̀𝐢 𝐤𝐡𝐨𝐚̉𝐧 𝐠𝐚𝐦𝐞 🐷", attachment: await this.image('https://i.imgur.com/uMaDJAH.jpg')}, threadID, messageID);
            }
            var a = require(`./heodenroi/datauser/${senderID}.json`);
            const picture = (await axios.get(`https://i.imgur.com/5vV1SjV.jpg`, { responseType: "stream"})).data
  const { threadID, messageID } = event;
   return api.sendMessage({body: `🐷==𝐕𝐚̣̂𝐭 𝐋𝐢𝐞̣̂𝐮 𝐗𝐚̂𝐲 𝐃𝐮̛̣𝐧𝐠==🐷\n\n𝐁𝐚̣𝐧 𝐦𝐮𝐨̂́𝐧 𝐱𝐚̂𝐲 𝐝𝐮̛̣𝐧𝐠 𝐨̛̉ 𝐤𝐡𝐮 𝐯𝐮̛̣𝐜 𝐧𝐨̛𝐢 𝐧𝐚̀𝐨 𝐭𝐫𝐞̂𝐧 𝐡𝐚̀𝐧𝐡 𝐭𝐢𝐧𝐡 ⛏\n𝟏. 𝐓𝐡𝐚́𝐩🔩 ${a.Island.coinsLV * (a.Island.data.tower + 1)} 𝐜𝐨𝐢𝐧𝐬 (${a.Island.data.tower}/50)\n𝟐. 𝐂𝐚̂𝐲 𝐱𝐚𝐧𝐡🌵 ${a.Island.coinsLV * (a.Island.data.tree + 1)} 𝐜𝐨𝐢𝐧𝐬 (${a.Island.data.tree}/50)\n𝟑. 𝐇𝐨̂̀ 𝐛𝐨̛𝐢💧 ${a.Island.coinsLV * (a.Island.data.pool + 1)} 𝐜𝐨𝐢𝐧𝐬 (${a.Island.data.pool}/50)\n𝟒. 𝐓𝐡𝐮́ 𝐜𝐮̛𝐧𝐠 𝐭𝐫𝐮̛𝐧𝐠 𝐛𝐚̀𝐲🐹 ${a.Island.coinsLV * (a.Island.data.pet + 1)} 𝐜𝐨𝐢𝐧𝐬 (${a.Island.data.pet}/50)\n`, attachment: (picture)
        }, threadID, (_error, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: event.senderID,
                    type: "build"
                })
            }, messageID);
        }
        case 'shop': {
            if (!existsSync(pathData)) {
                return api.sendMessage({body: "𝐁𝐚̣𝐧 𝐜𝐡𝐮̛𝐚 𝐭𝐚̣𝐨 𝐭𝐚̀𝐢 𝐤𝐡𝐨𝐚̉𝐧 𝐠𝐚𝐦𝐞 🐷", attachment: await this.image('https://i.imgur.com/uMaDJAH.jpg')}, threadID, messageID);
            }
            const picture = (await axios.get(`https://i.imgur.com/sd3qdzk.jpg`, { responseType: "stream"})).data
  const { threadID, messageID } = event;
   return api.sendMessage({body: "🐷=== 𝐒𝐡𝐨𝐩 𝐇𝐞𝐨𝐂𝐮𝐭𝐞 ===🐷\n\n𝟏. 𝐂𝐡𝐮𝐲𝐞̂̉𝐧 𝐭𝐢𝐞̂̀𝐧 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨𝐢𝐧𝐬 💰\n𝟐. 𝐂𝐡𝐮𝐲𝐞̂̉𝐧 𝐜𝐨𝐢𝐧𝐬 𝐭𝐡𝐚̀𝐧𝐡 𝐭𝐢𝐞̂̀𝐧 💵\n𝟑. 𝐌𝐮𝐚 𝐭𝐡𝐞̂𝐦 𝐥𝐮̛𝐨̛̣𝐭 𝐬𝐩𝐢𝐧 ⚗\n\n𝐕𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐧𝐡𝐚̣̂𝐩 𝐜𝐚́𝐜 𝐥𝐮̛̣𝐚 𝐜𝐡𝐨̣𝐧 🛍️",attachment: (picture)
        }, threadID, (_error, info) => {
            global.client.handleReply.push({
               name: this.config.name,
                    messageID: info.messageID,
                    author: event.senderID,
                    type: "shop",
            })
        }, event.messageID)
        }
        case 'me':
        case 'info': {
            if (!existsSync(pathData)) {
                return api.sendMessage({body: "𝐁𝐚̣𝐧 𝐜𝐡𝐮̛𝐚 𝐭𝐚̣𝐨 𝐭𝐚̀𝐢 𝐤𝐡𝐨𝐚̉𝐧 𝐠𝐚𝐦𝐞 🐷", attachment: await this.image('https://i.imgur.com/uMaDJAH.jpg')}, threadID, messageID);
            }
            var a = require(`./heodenroi/datauser/${senderID}.json`);
            return api.sendMessage(`[🐷=== 𝐇𝐄𝐎 𝐓𝐎̛́𝐈 𝐑𝐎̂̀𝐈 ===🐷]\n\n🔍 𝐇𝐚̀𝐧𝐡 𝐭𝐢𝐧𝐡 𝐜𝐮̉𝐚 𝐛𝐚̣𝐧 𝐡𝐢𝐞̣̂𝐧 𝐨̛̉ 𝐥𝐯 ${a.Island.level}\n💎 𝐒𝐨̂́ 𝐥𝐮̛𝐨̛̣𝐭 𝐬𝐩𝐢𝐧 𝐜𝐨̀𝐧 𝐥𝐚̣𝐢: ${a.spin}\n🛡 𝐒𝐨̂́ 𝐤𝐡𝐢𝐞̂𝐧 𝐜𝐨̀𝐧 𝐥𝐚̣𝐢: ${a.shield}\n💰 𝐂𝐨𝐢𝐧𝐬: ${a.coins}\n⚙️ 𝐓𝐡𝐨̂𝐧𝐠 𝐭𝐢𝐧 𝐡𝐚̀𝐧𝐡 𝐭𝐢𝐧𝐡:\n• 𝐓𝐡𝐚́𝐩 🔩(${a.Island.data.tower}/50)\n• 𝐂𝐚̂𝐲 𝐱𝐚𝐧𝐡 🌵(${a.Island.data.tree}/50)\n• 𝐇𝐨̂̀ 𝐛𝐨̛𝐢 💧(${a.Island.data.pool}/50)\n• 𝐓𝐡𝐮́ 𝐜𝐮̛𝐧𝐠 🐹(${a.Island.data.pet}/50)`, threadID, messageID);
        }
        case 'top': {
            if (!existsSync(pathData)) {
                return api.sendMessage({body: "𝐁𝐚̣𝐧 𝐜𝐡𝐮̛𝐚 𝐭𝐚̣𝐨 𝐭𝐚̀𝐢 𝐤𝐡𝐨𝐚̉𝐧 𝐠𝐚𝐦𝐞 🐷", attachment: await this.image('https://i.imgur.com/uMaDJAH.jpg')}, threadID, messageID);
            }
            const data = readdirSync(__dirname + `/heodenroi/datauser`);
            if(data.length < 3) return api.sendMessage(`𝐂𝐚̂̀𝐧 𝐢́𝐭 𝐧𝐡𝐚̂́𝐭 𝐜𝐨́ 𝟑 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐜𝐡𝐨̛𝐢 𝐭𝐫𝐞̂𝐧 𝐬𝐞𝐫𝐯𝐞𝐫 𝐦𝐨̛́𝐢 𝐜𝐨́ 𝐭𝐡𝐞̂̉ 𝐱𝐞𝐦 𝐭𝐨𝐩 ️🏆`, threadID, messageID);
            var p = []
            for (let i of data) { 
                var o = require(`./heodenroi/datauser/${i}`);
                p.push(o)
                msgf += `${number++}. ${o.name} - 𝐋𝐞𝐯𝐞𝐥 𝐜𝐮̉𝐚 𝐡𝐚̀𝐧𝐡 𝐭𝐢𝐧𝐡 ${o.Island.level}\n`
            }
            p.sort((a, b) => b.Island.level - a.Island.level);
            var msg = '⚙️=𝐓𝐎𝐏 𝟑 𝐇𝐀̀𝐍𝐇 𝐓𝐈𝐍𝐇 𝐋𝐄𝐕𝐄𝐋 𝐂𝐀𝐎 𝐍𝐇𝐀̂́𝐓=⚙️\n'
            for(var i = 0; i < 3; i++) {
                msg += `🏆 ${i+1}. ${p[i].name} 𝐯𝐨̛́𝐢 𝐡𝐚̀𝐧𝐡 𝐭𝐢𝐧𝐡 𝐜𝐨́ 𝐥𝐞𝐯𝐞𝐥 ${p[i].Island.level}\n`
            }
            return api.sendMessage(msg, threadID, messageID);
        }
        default: {
            return api.sendMessage({body: `[🐷=== 𝐇𝐄𝐎 𝐓𝐎̛́𝐈 𝐑𝐎̂̀𝐈 ===🐷]\n\n» 𝗥: 𝗧𝗮̣𝗼 𝘁𝗮̀𝗶 𝗸𝗵𝗼𝗮̉𝗻 𝗛𝗲𝗼𝗱𝗲𝗻𝗿𝗼𝗶 📲\n» 𝗦𝗣𝗜𝗡: 𝗩𝗼̀𝗻𝗴 𝗾𝘂𝗮𝘆 𝗚𝗮𝗺𝗲 🎰\n» 𝗕𝗨𝗜𝗟𝗗: 𝗫𝗮̂𝘆 𝗱𝘂̛̣𝗻𝗴 𝗜𝘀𝗹𝗮𝗻𝗱 🏝\n» 𝗦𝗛𝗢𝗣: 𝗖𝗵𝘂𝘆𝗲̂̉𝗻 𝘁𝗶𝗲̂̀𝗻 𝘁𝗵𝗮̀𝗻𝗵 𝗰𝗼𝗶𝗻𝘀, 𝗺𝘂𝗮 𝘀𝗽𝗶𝗻 💸\n» 𝗜𝗡𝗙𝗢: 𝗧𝗵𝗼̂𝗻𝗴 𝘁𝗶𝗻 𝘃𝗲̂̀ 𝗯𝗮̣𝗻 👤\n» 𝗧𝗢𝗣: 𝗧𝗼𝗽 𝗹𝗲𝘃𝗲𝗹 𝘁𝗿𝗲̂𝗻 𝗦𝗲𝗿𝘃𝗲𝗿🏆\n🌸====== 𝐃-𝐉𝐮𝐤𝐢𝐞 ======🌸\n`, attachment: await this.image('https://i.imgur.com/uMaDJAH.jpg')}, threadID, messageID);
        }
    }
}
module.exports.handleReply = async ({ event, api, Currencies, handleReply, Users }) => {
    const { body, threadID, messageID, senderID } = event;
    switch (handleReply.type) {
        case 'steal': {
            if(body != 1 && body != 2 && body != 3) return
            api.unsendMessage(handleReply.messageID)
            var dem = handleReply.dem
            var dataUser = require(`./heodenroi/datauser/${senderID}`);
            var f = dem.findIndex(i => i.ID == (handleReply.randomIndex[parseInt(body) - 1]).ID)
            dataUser.coins = dataUser.coins + dem[parseInt(body) -1].coins / 2;
            writeFileSync(this.checkPath(1, senderID), JSON.stringify(dataUser, null, 4));
            dem[parseInt(body) -1].coins = dem[parseInt(body) -1].coins / 2;
            writeFileSync(this.checkPath(1, (handleReply.randomIndex[parseInt(body) - 1]).ID), JSON.stringify(dem[parseInt(body) -1], null, 4));
            if(f == 0) return api.sendMessage(`𝐂𝐡𝐮́𝐜 𝐦𝐮̛̀𝐧𝐠 𝐛𝐚̣𝐧 𝐯𝐮̛̀𝐚 𝐜𝐡𝐨̣𝐧 𝐭𝐫𝐮́𝐧𝐠 𝐧𝐠𝐮̛𝐨̛̀𝐢 𝐜𝐨́ 𝐬𝐨̂́ 𝐭𝐢𝐞̂̀𝐧 𝐜𝐚𝐨 𝐧𝐡𝐚̂́𝐭 💸\n🧧 𝐁𝐚̣𝐧 𝐧𝐡𝐚̣̂𝐧 𝐯𝐞̂̀ ${dem[parseInt(body) -1].coins / 2} 𝐜𝐨𝐢𝐧𝐬 💰`, threadID, messageID);
            api.sendMessage(`⚠️ 𝐂𝐀̉𝐍𝐇 𝐁𝐀́𝐎 𝐇𝐄𝐎𝐃𝐄𝐍𝐑𝐎𝐈: 𝐁𝐚̣𝐧 𝐯𝐮̛̀𝐚 𝐛𝐢̣ 𝐭𝐫𝐨̣̂𝐦 ${dem[parseInt(body) -1].coins / 2} 𝐜𝐨𝐢𝐧𝐬 𝐛𝐨̛̉𝐢 '${(this.checkPath(2, senderID)).name}'!`, dem[parseInt(body) -1].ID);
            return api.sendMessage(`🔑 𝐁𝐚̣𝐧 𝐭𝐫𝐨̣̂𝐦 𝐜𝐮̉𝐚 ${dem[parseInt(body) -1].name}!\n🧧 𝐁𝐚̣𝐧 𝐧𝐡𝐚̣̂𝐧 𝐯𝐞̂̀ ${dem[parseInt(body) -1].coins / 2} 𝐜𝐨𝐢𝐧𝐬 💰`, threadID, messageID);
        }
        case 'attack': {
            api.unsendMessage(handleReply.messageID)
            var u = handleReply.p[parseInt(body) - 1]
            return api.sendMessage(`𝐁𝐚̣𝐧 𝐦𝐮𝐨̂́𝐧 𝐭𝐚̂́𝐧 𝐜𝐨̂𝐧𝐠 𝐯𝐚̀𝐨 𝐧𝐨̛𝐢 𝐧𝐚̀𝐨 𝐭𝐫𝐞̂𝐧 𝐡𝐚̀𝐧𝐡 𝐭𝐢𝐧𝐡 𝐧𝐚̀𝐲 ⚔️\n𝟏. 𝐓𝐡𝐚́𝐩 🔩(${u.Island.data.tower}/50)\n𝟐. 𝐂𝐚̂𝐲 𝐱𝐚𝐧𝐡 🌵(${u.Island.data.tree}/50)\n𝟑. 𝐇𝐨̂̀ 𝐛𝐨̛𝐢 💧(${u.Island.data.pool}/50)\n𝟒. 𝐓𝐡𝐮́ 𝐜𝐮̛𝐧𝐠 𝐭𝐫𝐮̛𝐧𝐠 𝐛𝐚̀𝐲 🐹(${u.Island.data.pet}/50)\n================`, threadID, (error, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: event.senderID,
                    type: "chosseAttack",
                    p: handleReply.p[parseInt(body) - 1]
                })
            }, messageID);
        }
        case 'build': {
            var a = require(`./heodenroi/datauser/${senderID}.json`);
            var l = ['tower', 'tree', 'pool', 'pet']
            if(a.coins < a.Island.coinsLV * (a.Island.data[l[parseInt(body) - 1]] + 1)) return api.sendMessage(`⛏ 𝐁𝐚̣𝐧 𝐜𝐨̀𝐧 𝐭𝐡𝐢𝐞̂́𝐮 𝐜𝐨𝐢𝐧𝐬 𝐭𝐫𝐨𝐧𝐠 𝐠𝐚𝐦𝐞 𝐤𝐡𝐨̂𝐧𝐠 𝐭𝐡𝐞̂̉ 𝐱𝐚̂𝐲 𝐝𝐮̛̣𝐧𝐠`, threadID, messageID);
           a.coins = a.coins - (a.Island.coinsLV * (a.Island.data[l[parseInt(body) - 1]] + 1));
            api.unsendMessage(handleReply.messageID)
            if(body == 1) {
                if(a.Island.data.tower == 50) return api.sendMessage('⛏ 𝐂𝐚̂́𝐩 𝐛𝐚̣̂𝐜 𝐤𝐡𝐮 𝐯𝐮̛̣𝐜 𝐧𝐚̀𝐲 𝐡𝐢𝐞̣̂𝐧 𝐦𝐚𝐱 𝐥𝐞𝐯𝐞𝐥 𝐧𝐞̂𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐭𝐡𝐞̂̉ 𝐱𝐚̂𝐲 𝐝𝐮̛̣𝐧𝐠', threadID, messageID);
                a.Island.data.tower = a.Island.data.tower + 10;
                api.sendMessage(`⚒ 𝐗𝐚̂𝐲 𝐝𝐮̛̣𝐧𝐠 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠: ${a.Island.data.tower}/50`, threadID, messageID);
            }
            if(body == 2) {
                if(a.Island.data.tree == 50) return api.sendMessage('⛏ 𝐂𝐚̂́𝐩 𝐛𝐚̣̂𝐜 𝐤𝐡𝐮 𝐯𝐮̛̣𝐜 𝐧𝐚̀𝐲 𝐡𝐢𝐞̣̂𝐧 𝐦𝐚𝐱 𝐥𝐞𝐯𝐞𝐥 𝐧𝐞̂𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐭𝐡𝐞̂̉ 𝐱𝐚̂𝐲 𝐝𝐮̛̣𝐧𝐠', threadID, messageID);
                a.Island.data.tree = a.Island.data.tree + 10;
                api.sendMessage(`⚒ 𝐗𝐚̂𝐲 𝐝𝐮̛̣𝐧𝐠 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠: ${a.Island.data.tree}/50`, threadID, messageID);
            }
            if(body == 3) {
                if(a.Island.data.pool == 50) return api.sendMessage('⛏ 𝐂𝐚̂́𝐩 𝐛𝐚̣̂𝐜 𝐤𝐡𝐮 𝐯𝐮̛̣𝐜 𝐧𝐚̀𝐲 𝐡𝐢𝐞̣̂𝐧 𝐦𝐚𝐱 𝐥𝐞𝐯𝐞𝐥 𝐧𝐞̂𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐭𝐡𝐞̂̉ 𝐱𝐚̂𝐲 𝐝𝐮̛̣𝐧𝐠', threadID, messageID);
                a.Island.data.pool = a.Island.data.pool + 10;
                api.sendMessage(`⚒ 𝐗𝐚̂𝐲 𝐝𝐮̛̣𝐧𝐠 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠: ${a.Island.data.pool}/50`, threadID, messageID);
            }
            if(body == 4) {
                if(a.Island.data.pet == 50) return api.sendMessage('⛏ 𝐂𝐚̂́𝐩 𝐛𝐚̣̂𝐜 𝐤𝐡𝐮 𝐯𝐮̛̣𝐜 𝐧𝐚̀𝐲 𝐡𝐢𝐞̣̂𝐧 𝐦𝐚𝐱 𝐥𝐞𝐯𝐞𝐥 𝐧𝐞̂𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐭𝐡𝐞̂̉ 𝐱𝐚̂𝐲 𝐝𝐮̛̣𝐧𝐠', threadID, messageID);
                a.Island.data.pet = a.Island.data.pet + 10;
                api.sendMessage(`⚒ 𝐗𝐚̂𝐲 𝐝𝐮̛̣𝐧𝐠 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠: ${a.Island.data.pet}/50`, threadID, messageID);
            }
            if(a.Island.data.tower == 50 && a.Island.data.tree == 50 && a.Island.data.pool == 50 && a.Island.data.pet == 50) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                api.sendMessage(`⚒ 𝐗𝐚̂𝐲 𝐝𝐮̛̣𝐧𝐠 𝐭𝐫𝐞̂𝐧 𝐡𝐚̀𝐧𝐡 𝐭𝐢𝐧𝐡 𝐛𝐚̣𝐧 𝐡𝐢𝐞̣̂𝐧 𝐨̛̉ 𝐜𝐚̂́𝐩 𝐭𝐨̂́𝐢 𝐜𝐚𝐨\n🧿 𝐁𝐚̣𝐧 𝐬𝐞̃ 𝐧𝐡𝐚̣̂𝐧 𝐯𝐞́ 𝐧𝐚̂𝐧𝐠 𝐜𝐚̂́𝐩 𝐥𝐞̂𝐧 𝐡𝐚̀𝐧𝐡 𝐭𝐢𝐧𝐡 𝐥𝐞𝐯𝐞𝐥 ${(a.Island.level) + 1}`, threadID, messageID);
                a.Island.level = a.Island.level + 1;
                a.Island.coinsLV = a.Island.coinsLV + 100;
                a.Island.data.tower = 0;
                a.Island.data.tree = 0;
                a.Island.data.pool = 0;
                a.Island.data.pet = 0;
            }
            return writeFileSync(this.checkPath(1, senderID), JSON.stringify(a, null, 4));
        }
        case 'chosseAttack': {
            var msg
            api.unsendMessage(handleReply.messageID)
            var j = ['tòa tháp', 'cây xanh', 'hồ bơi', 'thú cưng']
            if(handleReply.p.shield != 0) {
                handleReply.p.shield = handleReply.p.shield - 1
                writeFileSync(this.checkPath(1, handleReply.p.ID), JSON.stringify(handleReply.p, null, 4));
                api.sendMessage(`⚠️ 𝐂𝐀̉𝐍𝐇 𝐁𝐀́𝐎 𝐇𝐄𝐎𝐃𝐄𝐍𝐑𝐎𝐈: 𝐊𝐡𝐢𝐞̂𝐧 𝐯𝐮̛̀𝐚 𝐧𝐠𝐚̆𝐧 𝐜𝐡𝐚̣̆𝐧 𝐦𝐨̣̂𝐭 𝐜𝐮𝐨̣̂𝐜 𝐭𝐚̂́𝐧 𝐜𝐨̂𝐧𝐠 𝐭𝐮̛̀ '${(this.checkPath(2, senderID)).name}'!`, handleReply.p.ID);
                return api.sendMessage('🛡 𝐂𝐮𝐨̣̂𝐜 𝐭𝐚̂́𝐧 𝐜𝐨̂𝐧𝐠 𝐯𝐮̛̀𝐚 𝐛𝐢̣ 𝐤𝐡𝐢𝐞̂𝐧 𝐧𝐠𝐚̆𝐧 𝐜𝐡𝐚̣̆𝐧', threadID, messageID);
            }
            if(body == 1) {
                if(handleReply.p.Island.data.tower == 0) return api.sendMessage('⚔️ 𝐓𝐚̂́𝐧 𝐜𝐨̂𝐧𝐠 𝐭𝐡𝐚̂́𝐭 𝐛𝐚̣𝐢. 𝐂𝐡𝐢̉ 𝐬𝐨̂́ 𝐤𝐡𝐮 𝐯𝐮̛̣𝐜 𝐧𝐚̀𝐲 𝐛𝐚̆̀𝐧𝐠 𝟎', threadID, messageID);
                handleReply.p.Island.data.tower = handleReply.p.Island.data.tower - 10
                msg = '⚔️ 𝐁𝐚̣𝐧 𝐯𝐮̛̀𝐚 𝐭𝐚̂́𝐧 𝐜𝐨̂𝐧𝐠 𝐭𝐨̀𝐚 𝐭𝐡𝐚́𝐩 𝐭𝐫𝐞̂𝐧 𝐡𝐚̀𝐧𝐡 𝐭𝐢𝐧𝐡 𝐜𝐮̉𝐚 ' + `${handleReply.p.name} 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 !`
            }
            if(body == 2) {
                if(handleReply.p.Island.data.tree == 0) return api.sendMessage('⚔️ 𝐓𝐚̂́𝐧 𝐜𝐨̂𝐧𝐠 𝐭𝐡𝐚̂́𝐭 𝐛𝐚̣𝐢. 𝐂𝐡𝐢̉ 𝐬𝐨̂́ 𝐤𝐡𝐮 𝐯𝐮̛̣𝐜 𝐧𝐚̀𝐲 𝐛𝐚̆̀𝐧𝐠 𝟎', threadID, messageID);
                handleReply.p.Island.data.tree = handleReply.p.Island.data.tree - 10
                msg = '⚔️ 𝐁𝐚̣𝐧 𝐯𝐮̛̀𝐚 𝐭𝐚̂́𝐧 𝐜𝐨̂𝐧𝐠 𝐜𝐚̂𝐲 𝐱𝐚𝐧𝐡 𝐭𝐫𝐞̂𝐧 𝐡𝐚̀𝐧𝐡 𝐭𝐢𝐧𝐡 𝐜𝐮̉𝐚 ' + `${handleReply.p.name} 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 !`
            }
            if(body == 3) {
                if(handleReply.p.Island.data.pool == 0) return api.sendMessage('⚔️ 𝐓𝐚̂́𝐧 𝐜𝐨̂𝐧𝐠 𝐭𝐡𝐚̂́𝐭 𝐛𝐚̣𝐢. 𝐂𝐡𝐢̉ 𝐬𝐨̂́ 𝐤𝐡𝐮 𝐯𝐮̛̣𝐜 𝐧𝐚̀𝐲 𝐛𝐚̆̀𝐧𝐠 𝟎', threadID, messageID);
                handleReply.p.Island.data.pool = handleReply.p.Island.data.pool - 10
                msg = '⚔️ 𝐁𝐚̣𝐧 𝐯𝐮̛̀𝐚 𝐭𝐚̂́𝐧 𝐜𝐨̂𝐧𝐠 𝐡𝐨̂̀ 𝐛𝐨̛𝐢 𝐭𝐫𝐞̂𝐧 𝐡𝐚̀𝐧𝐡 𝐭𝐢𝐧𝐡 𝐜𝐮̉𝐚 ' + `${handleReply.p.name} 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 !`
            }
            if(body == 4) {
                if(handleReply.p.Island.data.pet == 0) return api.sendMessage('⚔️ 𝐓𝐚̂́𝐧 𝐜𝐨̂𝐧𝐠 𝐭𝐡𝐚̂́𝐭 𝐛𝐚̣𝐢. 𝐂𝐡𝐢̉ 𝐬𝐨̂́ 𝐤𝐡𝐮 𝐯𝐮̛̣𝐜 𝐧𝐚̀𝐲 𝐛𝐚̆̀𝐧𝐠 𝟎', threadID, messageID);
                handleReply.p.Island.data.pet = handleReply.p.Island.data.pet - 10
                msg = '⚔️ 𝐁𝐚̣𝐧 𝐯𝐮̛̀𝐚 𝐭𝐚̂́𝐧 𝐜𝐨̂𝐧𝐠 𝐭𝐡𝐮́ 𝐜𝐮̛𝐧𝐠 𝐭𝐫𝐞̂𝐧 𝐡𝐚̀𝐧𝐡 𝐭𝐢𝐧𝐡 𝐜𝐮̉𝐚 ' + `${handleReply.p.name} 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 !`
            }
            writeFileSync(this.checkPath(1, handleReply.p.ID), JSON.stringify(handleReply.p, null, 4));
            api.sendMessage(`⚠️ 𝐂𝐀̉𝐍𝐇 𝐁𝐀́𝐎 𝐇𝐄𝐎𝐃𝐄𝐍𝐑𝐎𝐈: 𝐁𝐚̣𝐧 𝐯𝐮̛̀𝐚 𝐛𝐢̣ ${(this.checkPath(2, senderID)).name} 𝐭𝐚̂́𝐧 𝐜𝐨̂𝐧𝐠 𝐯𝐚̀𝐨 ${j[parseInt(body) - 1]}!`, handleReply.p.ID);
            return api.sendMessage(msg, threadID, messageID);
        }
        case 'shop': {
            if(body == 1) {
                return api.sendMessage('💶 𝐕𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐫𝐞𝐩𝐥𝐲 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 𝐯𝐨̛́𝐢 𝐬𝐨̂́ 𝐭𝐢𝐞̂̀𝐧 𝐛𝐚̣𝐧 𝐦𝐮𝐨̂́𝐧 𝐜𝐡𝐮𝐲𝐞̂̉𝐧 ! 𝐂𝐡𝐢𝐞̂́𝐭 𝐤𝐡𝐚̂́𝐮 𝟎%', threadID, (error, info) => {
                    global.client.handleReply.push({
                        name: this.config.name,
                        messageID: info.messageID,
                        author: event.senderID,
                        type: "botcoins"
                    })
                }, messageID);
            }
            else if(body == 2) {
                return api.sendMessage('💶 𝐕𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐫𝐞𝐩𝐥𝐲 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 𝐯𝐨̛́𝐢 𝐬𝐨̂́ 𝐭𝐢𝐞̂̀𝐧 𝐛𝐚̣𝐧 𝐦𝐮𝐨̂́𝐧 𝐜𝐡𝐮𝐲𝐞̂̉𝐧 ! 𝐂𝐡𝐢𝐞̂́𝐭 𝐤𝐡𝐚̂́𝐮 𝟎%', threadID, (error, info) => {
                    global.client.handleReply.push({
                        name: this.config.name,
                        messageID: info.messageID,
                        author: event.senderID,
                        type: "coinsbot"
                    })
                }, messageID);
            }
            else if(body == 3) {
                return api.sendMessage('💶 𝐕𝐮𝐢 𝐥𝐨̀𝐧𝐠 𝐫𝐞𝐩𝐥𝐲 𝐭𝐢𝐧 𝐧𝐡𝐚̆́𝐧 𝐧𝐚̀𝐲 𝐯𝐨̛́𝐢 𝐬𝐨̂́ 𝐥𝐮̛𝐨̛̣𝐭 𝐪𝐮𝐚𝐲 𝐛𝐚̣𝐧 𝐦𝐮𝐨̂́𝐧 𝐦𝐮𝐚 (𝟏𝟎 𝐥𝐮̛𝐨̛̣𝐭 𝐪𝐮𝐚𝐲 𝟐𝟎𝟎𝟎$)', threadID, (error, info) => {
                    global.client.handleReply.push({
                        name: this.config.name,
                        messageID: info.messageID,
                        author: event.senderID,
                        type: "spinn"
                    })
                }, messageID);
            }
            else {
                return api.sendMessage('⚙️ 𝐋𝐮̛̣𝐚 𝐜𝐡𝐨̣𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐡𝐨̛̣𝐩 𝐥𝐞̣̂', threadID, messageID);
            }
        }
        case 'spinn': {
            var a = require(`./heodenroi/datauser/${senderID}.json`);
            await checkMoney(senderID, parseInt(body));
            api.unsendMessage(handleReply.messageID)
            await Currencies.decreaseMoney(senderID, parseInt(body));
            a.spin = a.spin + parseInt(body)
            writeFileSync(this.checkPath(1, senderID), JSON.stringify(a, null, 4));
            return api.sendMessage(`💎 𝐌𝐮𝐚 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 ${body} 𝐥𝐮̛𝐨̛̣𝐭 𝐪𝐮𝐚𝐲 (${parseInt(body) * 200}$`, threadID, messageID);
        }
        case 'botcoins': {
            var a = require(`./heodenroi/datauser/${senderID}.json`);
            await checkMoney(senderID, parseInt(body));
            api.unsendMessage(handleReply.messageID)
            await Currencies.decreaseMoney(senderID, parseInt(body));
            a.coins = a.coins + parseInt(body)
            writeFileSync(this.checkPath(1, senderID), JSON.stringify(a, null, 4));
            return api.sendMessage(`💎 𝐍𝐚̣𝐩 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 ${body} 𝐜𝐨𝐢𝐧𝐬 𝐯𝐚̀𝐨 𝐠𝐚𝐦𝐞`, threadID, messageID);
        }
        case 'coinsbot': {
            var a = require(`./heodenroi/datauser/${senderID}.json`);
            if(a.coins < parseInt(body)) return api.sendMessage('💰 𝐁𝐚̣𝐧 𝐭𝐡𝐢𝐞̂́𝐮 𝐭𝐢𝐞̂̀𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐭𝐡𝐞̂̉ 𝐭𝐡𝐮̛̣𝐜 𝐡𝐢𝐞̣̂𝐧 𝐠𝐢𝐚𝐨 𝐝𝐢̣𝐜𝐡 𝐧𝐚̀𝐲 !', threadID, messageID);
            api.unsendMessage(handleReply.messageID)
            await Currencies.increaseMoney(senderID, parseInt(body));
            a.coins = a.coins - parseInt(body)
            writeFileSync(this.checkPath(1, senderID), JSON.stringify(a, null, 4));
            return api.sendMessage(`💎 𝐑𝐮́𝐭 𝐭𝐡𝐚̀𝐧𝐡 𝐜𝐨̂𝐧𝐠 ${body} 𝐜𝐨𝐢𝐧𝐬 𝐯𝐞̂̀ 𝐭𝐚̀𝐢 𝐤𝐡𝐨𝐚̉𝐧 𝐜𝐮̉𝐚 𝐛𝐚̣𝐧`, threadID, messageID);
        }
    }
    async function checkMoney(senderID, maxMoney) {
        var i, w;
        i = (await Currencies.getData(senderID)) || {};
        w = i.money || 0
        if (w < parseInt(maxMoney)) return api.sendMessage('💰 𝐁𝐚̣𝐧 𝐭𝐡𝐢𝐞̂́𝐮 𝐭𝐢𝐞̂̀𝐧 𝐤𝐡𝐨̂𝐧𝐠 𝐭𝐡𝐞̂̉ 𝐭𝐡𝐮̛̣𝐜 𝐡𝐢𝐞̣̂𝐧 𝐠𝐢𝐚𝐨 𝐝𝐢̣𝐜𝐡 𝐧𝐚̀𝐲 !', threadID, messageID);
    }
}
module.exports.getSpin = function (items, getItem, senderID) {
    const path = this.checkPath(1, senderID)
    var pathData = this.checkPath(2, senderID)
    var i = items.findIndex(index => index == getItem);
    if(i == 0) pathData.coins = parseInt(pathData.coins) + pathData.Island.level * 1000
    if(i == 1) pathData.coins = parseInt(pathData.coins) + pathData.Island.level * 3000
    if(i == 2) pathData.coins = parseInt(pathData.coins) + pathData.Island.level * 5000
    if(i == 4) {
        if(pathData.shield != 3) {
            pathData.spin = parseInt(pathData.spin) + 1
            pathData.shield = parseInt(pathData.shield) + 1;
        }
    }
    if(i == 6) pathData.spin = parseInt(pathData.spin) + 1
    if(i == 7) pathData.spin = parseInt(pathData.spin) + 2
    if(i == 8) pathData.spin = parseInt(pathData.spin) + 5
    writeFileSync(path, JSON.stringify(pathData, null, 4));
    return i
}