const path = require("path");
const { mkdirSync, writeFileSync, existsSync, createReadStream, readdirSync, readFileSync } = require("fs-extra");
const axios = require("axios");

module.exports.config = {
    name: "duaxe",
    version: "1.0.0",
    hasPermssion: 2,
    credits: "...",
    description: "Đua xe lấy top",
    commandCategory: "Game",
    usages: "[]",
    cooldowns: 0
};


module.exports.onLoad = async () => {
    const dir = __dirname + `/duaxe/datauser/`;
    const _dir = __dirname + `/duaxe/datauser/`;
    const __dir = __dirname + `/duaxe/cache/`;
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    if (!existsSync(_dir)) mkdirSync(_dir, { recursive: true });
    if (!existsSync(__dir)) mkdirSync(__dir, { recursive: true });
    return;
}

module.exports.checkPath = function (type, senderID) {
    const pathGame = path.join(__dirname, 'duaxe', 'datauser', `${senderID}.json`);
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
        writeFileSync( __dirname + `/duaxe/cache/duaxe.png`, Buffer.from(download, "utf-8"));
        images.push(createReadStream(__dirname + `/duaxe/cache/duaxe.png`));
    return images
}

module.exports.run = async function ({ api, event, args, client,Threads,__GLOBAL, Users, Currencies,getText }) {
   const { senderID, messageID, threadID } = event;
     const axios = require('axios');
    const request = require('request');
    const fs = require('fs-extra');
    const pathData = path.join(__dirname, 'duaxe', 'datauser', `${senderID}.json`);
    switch (args[0]) {
        case 'register':
        case '-r': {
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
                return api.sendMessage("🏎 Đăng kí thành công tiến vào đấu trường", threadID, messageID);
            } else return api.sendMessage("⚔🏎 Bạn đã có trong cơ sở dữ liệu", threadID, messageID);

        }
        case 'spin': {
            if (!existsSync(pathData)) {
                return api.sendMessage({body: `Bạn chưa đăng kí game!`, attachment: await this.image('https://i.imgur.com/XZITZoN.gif')}, threadID, messageID);
            }
            if(this.checkPath(2, senderID).spin == 0) return api.sendMessage('» Bạn đã hết lượt quay vui lòng mua thêm lượt hoặc đợi 5phut để hệ thống tự tặng bạn thêm lượt quay', threadID, messageID);
            this.checkPath(2, senderID).spin = parseInt(this.checkPath(2, senderID).spin) - 1;
            writeFileSync(this.checkPath(1, senderID), JSON.stringify(this.checkPath(2, senderID), null, 4));
            var items = [`${this.checkPath(2, senderID).Island.level * 1000} coins`, `${this.checkPath(2, senderID).Island.level * 3000} coins`, `${this.checkPath(2, senderID).Island.level * 5000} coins`, 'Bạn đã quay trúng xe đạp', 'Siêu xe', ' Nâng cấp động cơ', '1 lượt quay', '2 lượt quay', '7 lượt quay', '5 lượt quay'];
            var getItem = items[Math.floor(Math.random() * items.length)];
            var i = this.getSpin(items, getItem, senderID);
            api.sendMessage({body: `Chúc mừng bạn quay trúng : ${getItem}`, attachment: await this.image('https://i.imgur.com/XZITZoN.gif')}, threadID, messageID);
            await new Promise(resolve => setTimeout(resolve, 1000));
            const data = readdirSync(__dirname + `/duaxe/datauser`);
            if(i == 3) {
                if(data.length < 4) return api.sendMessage(`Cần ít nhất có 3 người chơi trên server để trộm nguyên liệu xe`, threadID, messageID);
                const dem = [];
                for (let i of data) { 
                    if(i != `${senderID}.json`) {
                        dem.push(require(`./duaxe/datauser/${i}`));
                    }
                }
                dem.sort((a, b) => a.coins + b.coins);
                var msg = `Số tiền cao nhất là: ${dem[0].coins / 2}\n`
                const randomIndex = dem.sort(function() { return .5 - Math.random() });
                for(var i = 0; i < 3; i ++) {
                    msg += `${i+1}. ${randomIndex[i].name} - Động cơ level ${randomIndex[i].Island.level}\n`
                }
                msg += 'Vui lòng reply với lựa chọn bạn muốn trộm nguyên liệu xe'
                return api.sendMessage(`==========\n${msg}`, threadID, (error, info) => {
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
                if(data.length < 4) return api.sendMessage(`Cần ít nhất có 3 người chơi trên server để tấn công người chơi`, threadID, messageID);
                var msgf = `[====ATTACK====]\n`, number = 1, p = [];
                for (let i of data) { 
                    if(i != `${senderID}.json`) {
                        var o = require(`./duaxe/datauser/${i}`);
                        p.push(o)
                        msgf += `${number++}. ${o.name} - Đảo level ${o.Island.level}\n`
                    }
                }
                return api.sendMessage(msgf, threadID, (error, info) => {
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
                return api.sendMessage({body: "Bạn chưa đăng kí game!", attachment: await this.image('https://i.imgur.com/clX87Qt.jpg')}, threadID, messageID);
            }
            var a = require(`./duaxe/datauser/${senderID}.json`);
            return api.sendMessage(`» Bạn muốn nâng cấp gì ở Garaxe\n1. Động cơ - ${a.Island.coinsLV * (a.Island.data.tower + 1)} coins (${a.Island.data.tower}/50)\n2. Mui xe - ${a.Island.coinsLV * (a.Island.data.tree + 1)} coins(${a.Island.data.tree}/50)\n3.Nguyên liệu tái chế - ${a.Island.coinsLV * (a.Island.data.pool + 1)} coins (${a.Island.data.pool}/50)\n4.Mini Boost - ${a.Island.coinsLV * (a.Island.data.pet + 1)} coins (${a.Island.data.pet}/50)\n==============`, threadID, (error, info) => {
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
                return api.sendMessage({body: "Bạn chưa đăng kí game!", attachment: await this.image('https://i.imgur.com/z4Q5tWp.jpg')}, threadID, messageID);
            }
     return api.sendMessage({body: `── [ Shop ] ──  \n\n🐸Danh sách xe đua bạn có thể mua\n[🏎1]. Song thần sinh đôi\n[🏎2].S-LIGHT\n[🏎3].ETARNA\n[🏎4].Sói Địa Ngục\n[🏎5].Vết Gió\n[🏎6].Tia Chóp\n[🏎7].Lamborini\n[🏎8].Hào Quang\n[🏎9].Bá Chủ\n[⭐️] Hãy reply tin nhắn bot và kèm theo số`, attachment: await this.image('https://i.imgur.com/z4Q5tWp.jpg')}, threadID, (error, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: event.senderID,
                    type: "shop"
                })
            }, messageID);
        }
        case 'đua': {
            if (!existsSync(pathData)) {
                return api.sendMessage({body: "Bạn chưa đăng kí game!", attachment: await this.image('https://i.imgur.com/lo8wFLT.jpg')}, threadID, messageID);
            }
     return api.sendMessage({body: `── [ CHỌN MAPS THI ĐẤU ] ──  \n\n❤️ Chọn maps để thi đấu\n[🗺1]. Rừng Tàn Phá\n[🗺2].Lông Môn Tân Xuân\n[🗺3].Ngôi Nhà Linh Thiên\n`, attachment: await this.image('https://i.imgur.com/9YaNyZA.jpg')}, threadID, (error, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: event.senderID,
                    type: "đua"
                })
            }, messageID);
        }
        case 'me':
        case 'info': {
            if (!existsSync(pathData)) {
                return api.sendMessage({body: "Bạn chưa đăng kí game!", attachment: await this.image('https://i.imgur.com/R5eyoyZ.jpg')}, threadID, messageID);
            }
            var a = require(`./duaxe/datauser/${senderID}.json`);
            return api.sendMessage(`⭐️ KHO ĐỒ NÂNG CẤP ⭐️\n- ... ${a.Island.level}\n- Số lượt quay còn lại: ${a.spin}\n- Coins: ${a.coins}\n- ĐỘNG CƠ:\n• ... (${a.Island.data.tower}/50)\n• ... (${a.Island.data.tree}/50)\n• ... (${a.Island.data.pool}/50)\n• ... (${a.Island.data.pet}/50)`, threadID, messageID);
        }
        case 'top': {
            if (!existsSync(pathData)) {
                return api.sendMessage({body: "Bạn chưa đăng kí game!", attachment: await this.image('https://i.imgur.com/R5eyoyZ.jpg')}, threadID, messageID);
            }
            const data = readdirSync(__dirname + `/duaxe/datauser`);
            if(data.length < 3) return api.sendMessage(`Cần ít nhất có 3 người chơi trên server để xem top`, threadID, messageID);
            var p = []
            for (let i of data) { 
                var o = require(`./duaxe/datauser/${i}`);
                p.push(o)
                msgf += `${number++}. ${o.name} - Đảo level ${o.Island.level}\n`
            }
            p.sort((a, b) => b.Island.level - a.Island.level);
            var msg = '===TOP 3 CHUỒNG LEVEL CAO NHẤT===\n'
            for(var i = 0; i < 3; i++) {
                msg += `${i+1}. ${p[i].name} với đảo level ${p[i].Island.level}\n`
            }
            return api.sendMessage(msg, threadID, messageID);
        }
        default: {
            return api.sendMessage({body: `===[ ĐUA XE S1 ]===\n» R: Đăng kí\n» SPIN: Vòng quay game\n» BUILD: Nâng cấp động cơ\n» SHOP: Shop mua súng\n» INFO: Xem thông tin về bạn\n» TOP: Xem top level trên server\n» CHANGE: Quy đổi tiền của bot sang tiền game và ngược lại`, attachment: await this.image('https://i.imgur.com/28F3cY4.jpg')}, threadID, messageID);
        }
    }
}
module.exports.handleReply = async ({ event, api, Currencies, handleReply, Users, getText}) => {

  const { body, threadID, messageID, senderID } = event;
  const axios = require('axios');
  const request = require('request');
  const fs = require("fs");
    switch (handleReply.type) {
        case 'build': {
            var a = require(`./duaxe/datauser/${senderID}.json`);
            var l = ['tower', 'tree', 'pool', 'pet']
            if(a.coins < a.Island.coinsLV * (a.Island.data[l[parseInt(body) - 1]] + 1)) return api.sendMessage(`Bạn không đủ số coins trong game để xây dựng!`, threadID, messageID);
            a.coins = a.Island.coinsLV * (a.Island.data[l[parseInt(body) - 1]] + 1);
            await Currencies.decreaseMoney(senderID, a.Island.coinsLV * (a.Island.data[l[parseInt(body) - 1]] + 1));
            api.unsendMessage(handleReply.messageID)
            if(body == 1) {
                if(a.Island.data.tower == 50) return api.sendMessage('Cấp bậc khu vực này đang ở mức tối đa nên không thể xây dựng', threadID, messageID);
                a.Island.data.tower = a.Island.data.tower + 10;
                api.sendMessage(`Xây dựng thành công: ${a.Island.data.tower}/50`, threadID, messageID);
            }
            if(body == 2) {
                if(a.Island.data.tree == 50) return api.sendMessage('Cấp bậc khu vực này đang ở mức tối đa nên không thể xây dựng', threadID, messageID);
                a.Island.data.tree = a.Island.data.tree + 10;
                api.sendMessage(`Xây dựng thành công: ${a.Island.data.tree}/50`, threadID, messageID);
            }
            if(body == 3) {
                if(a.Island.data.pool == 50) return api.sendMessage('Cấp bậc khu vực này đang ở mức tối đa nên không thể xây dựng', threadID, messageID);
                a.Island.data.pool = a.Island.data.pool + 10;
                api.sendMessage(`Xây dựng thành công: ${a.Island.data.pool}/50`, threadID, messageID);
            }
            if(body == 4) {
                if(a.Island.data.pet == 50) return api.sendMessage('Cấp bậc khu vực này đang ở mức tối đa nên không thể xây dựng', threadID, messageID);
                a.Island.data.pet = a.Island.data.pet + 10;
                api.sendMessage(`Nâng cấp thành công: ${a.Island.data.pet}/50`, threadID, messageID);
            }
            if(a.Island.data.tower == 50 && a.Island.data.tree == 50 && a.Island.data.pool == 50 && a.Island.data.pet == 50) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                api.sendMessage(`Nâng cấp của bạn đã đạt được cấp tối đa!\nBạn sẽ được nâng cấp lên động cơ ${(a.Island.level) + 1}`, threadID, messageID);
                a.Island.level = a.Island.level + 1;
                a.Island.coinsLV = a.Island.coinsLV + 100;
                a.Island.data.tower = 0;
                a.Island.data.tree = 0;
                a.Island.data.pool = 0;
                a.Island.data.pet = 0;
            }
            return writeFileSync(this.checkPath(1, senderID), JSON.stringify(a, null, 4));
        }
        case 'shop': {
            if(body == 1) {
                return api.sendMessage({body: `⭐️ MUA THÀNH CÔNG ⭐️\n[🚘]Tên : Song thần sinh đôi
[🍁]Thông Tin : bóng tối thời gian
Tốc độ: 1.8km/h tối đa
Sức mạnh boost: 2.3
Drift: 61%
Sức mạnh tông: 58%`, attachment: await this.image('https://i.imgur.com/UOgDVlh.jpg')}, threadID, messageID);
            }
            else if(body == 2) {
                return api.sendMessage({body: `⭐️ MUA THÀNH CÔNG ⭐️\n[🚘]Tên : S-LIGHT
[🍁]Thông Tin : Bá chủ trời đất
Tốc độ: 1.9/h tối đa
Sức mạnh boost: 2.9
Drift: ${huhong}%
Sức mạnh tông: ${huhong}%`, attachment: await this.image('https://i.imgur.com/t7wrAX1.jpg')}, threadID, messageID);
            }
            else if(body == 3) {

                return api.sendMessage({body: `⭐️ MUA THÀNH CÔNG ⭐️\n[🚘]Tên : ETARNA
[🍁]Thông Tin : Lửa h��y diệt 
Tốc độ: 2.1/h tối đa
Sức mạnh boost: 3.1
Drift: 31%
Sức mạnh tông: 19%`, attachment: await this.image('https://i.imgur.com/jkkHbS3.jpg')}, threadID, messageID);
             }
            else if(body == 4) {
                return api.sendMessage({body: `⭐️ MUA THÀNH CÔNG ⭐️\n[🚘]Tên : Sói Địa Ngục
[🍁]Thông Tin : Mãnh thú tối thượng
Tốc độ: 3.9/h tối đa
Sức mạnh boost: 7.2
Drift: 59%
Sức mạnh tông: 88%`, attachment: await this.image('https://i.imgur.com/8emkSZg.jpg')}, threadID, messageID);
            }
            else if(body == 5) {
                return api.sendMessage({body: `⭐️ MUA THÀNH CÔNG ⭐️\n[🚘]Tên : Vết Gió
[🍁]Thông Tin : Gió Thiên Tai 
Tốc độ: 1.5/h tối đa
Sức mạnh boost: 3.2
Drift: 37%
Sức mạnh tông: 32%`, attachment: await this.image('https://i.imgur.com/5w8wvOM.jpgg')}, threadID, messageID);
            }
            else if(body == 6) {
                return api.sendMessage({body: `⭐️ MUA THÀNH CÔNG ⭐️
[🚘] Tên: Tia chóp 
[🍁] Thông Tin: Điện Ma Quái
Tốc độ: 3.4km/h tối đa
Sức mạnh boost: 1.3
Drift: 44%
Sức mạnh tông: 11%`, attachment: await this.image('https://i.imgur.com/8KQOATL.jpg')}, threadID, messageID);
            }
            else if(body == 7) {
                return api.sendMessage({body: `⭐️ MUA THÀNH CÔNG ⭐️
[🚘] Tên: Lamborini 
[🍁] Thông Tin: Bất bại ngàn cân
Tốc độ: 7.9km/h tối đa
Sức mạnh boost: 9.2
Drift: 96%
Sức mạnh tông: 98%`, attachment: await this.image('https://i.imgur.com/WFHExvo.jpg')}, threadID, messageID);
            }
            else if(body == 8) {
                return api.sendMessage({body: `⭐️ MUA THÀNH CÔNG ⭐️
[🚘] Tên: Hào quang
[🍁] Thông Tin: Ánh sáng kiêu gọi
Tốc độ: 8.9km/h tối đa
Sức mạnh boost: 8.9
Drift: 87%
Sức mạnh tông: 79%`, attachment: await this.image('https://i.imgur.com/Au9cojd.jpg')}, threadID, messageID);
            }
            else if(body == 9) {
                return api.sendMessage({body: `⭐️ MUA THÀNH CÔNG ⭐️
[🚘] Tên: Bá chủ
[🍁] Thông Tin: Sức mạnh tàn phá
Tốc độ: 10.1km/h tối đa
Sức mạnh boost: 7.1
Drift: 7%
Sức mạnh tông: 100%`, attachment: await this.image('https://i.imgur.com/HfK8lJD.jpg')}, threadID, messageID);
            }
            else {
                return api.sendMessage('Lựa chọn không hợp lệ!', threadID, messageID);
            }
        }

         case 'mua': {
            if(body == 1) {
                return api.sendMessage('Vui lòng reply tin nhắn này với số tiền bạn muốn đổi! Chiết khấu 0%', threadID, (error, info) => {
                    global.client.handleReply.push({
                        name: this.config.name,
                        messageID: info.messageID,
                        author: event.senderID,
                        type: "botcoins"
                    })
                }, messageID);
            }
            else if(body == 2) {
                return api.sendMessage('Vui lòng reply tin nhắn này với số tiền bạn muốn đổi! Chiết khấu 0%', threadID, (error, info) => {
                    global.client.handleReply.push({
                        name: this.config.name,
                        messageID: info.messageID,
                        author: event.senderID,
                        type: "coinsbot"
                    })
                }, messageID);
            }
            else if(body == 3) {
                return api.sendMessage('Vui lòng reply tin nhắn này với số lượt quay bạn muốn mua! (10 lượt quay 2000$)', threadID, (error, info) => {
                    global.client.handleReply.push({
                        name: this.config.name,
                        messageID: info.messageID,
                        author: event.senderID,
                        type: "spinn"
                    })
                }, messageID);
            }
            else {
                return api.sendMessage('Lựa chọn không hợp lệ!', threadID, messageID);
            }
        }
        case 'đua': {
            if(body == 1) {
  var coinduaxe = Math.floor(Math.random() * 80000) + 10000;
  var huhong = Math.floor(Math.random() * 90) + 20;
                return api.sendMessage({body: `⭐️ THI ĐẤU ⭐️\n[🗺] MAPS: Rừng Tàn Phá.\n[🏆] Chúc Mừng bạn đã chiến thắng đối thủ\n» Giải thưởng của bạn là: ${coinduaxe}$\n» Xe Hỏng: ${huhong}%`, attachment: await this.image('https://i.imgur.com/VyNAU4R.jpg')}, threadID, messageID);
        }
            else if(body == 2) {
               var coinduaxe = Math.floor(Math.random() * 80000) + 10000;
  var huhong = Math.floor(Math.random() * 90) + 20;
                return api.sendMessage({body: `⭐️ THI ĐẤU ⭐️\n[🗺] MAPS: Lông Môn Tâm Xuân.\n[🏆] Chúc Mừng bạn đã chiến thắng đối thủ\n» Giải thưởng của bạn là: ${coinduaxe}$\n» Xe Hỏng: ${huhong}%`, attachment: await this.image('https://i.imgur.com/NHbz90K.jpg')}, threadID, messageID);
        }
            else if(body == 3) {
   var coinduaxe = Math.floor(Math.random() * 80000) + 10000;
  var huhong = Math.floor(Math.random() * 90) + 20;
                return api.sendMessage({body: `⭐️ THI ĐẤU ⭐️\n[🗺] MAPS: Ngôi Nhà Linh Thiên.\n[🏆] Chúc Mừng bạn đã chiến thắng đối thủ\n» Giải thưởng của bạn là: ${coinduaxe}$\n» Xe Hỏng: ${huhong}%`, attachment: await this.image('https://i.imgur.com/93XPPtv.jpg')}, threadID, messageID);
            }
        }        
        case 'spinn': {
            await checkMoney(senderID, parseInt(body));
            api.unsendMessage(handleReply.messageID)
            await Currencies.decreaseMoney(senderID, parseInt(body));
            a.spin = a.spin + parseInt(body)
            writeFileSync(this.checkPath(1, senderID), JSON.stringify(a, null, 4));
            return api.sendMessage(`Mua thành công ${body} lượt quay (${parseInt(body) * 200}$`, threadID, messageID);
        }
        case 'botcoins': {
            var a = require(`./duaxe/datauser/${senderID}.json`);
            await checkMoney(senderID, parseInt(body));
            api.unsendMessage(handleReply.messageID)
            await Currencies.decreaseMoney(senderID, parseInt(body));
            a.coins = a.coins + parseInt(body)
            writeFileSync(this.checkPath(1, senderID), JSON.stringify(a, null, 4));
            return api.sendMessage(`Nạp thành công ${body} coins vào game!`, threadID, messageID);
        }
        case 'coinsbot': {
            var a = require(`./duaxe/datauser/${senderID}.json`);
            if(a.coins < parseInt(body)) return api.sendMessage('Bạn không đủ tiền để thực hiện giao dịch này!', threadID, messageID);
            api.unsendMessage(handleReply.messageID)
            await Currencies.increaseMoney(senderID, parseInt(body));
            a.coins = a.coins - parseInt(body)
            writeFileSync(this.checkPath(1, senderID), JSON.stringify(a, null, 4));
            return api.sendMessage(`Rút thành công ${body} coins về tài khoản bot!`, threadID, messageID);
        }
    }
    async function checkMoney(senderID, maxMoney) {
        var i, w;
        i = (await Currencies.getData(senderID)) || {};
        w = i.money || 0
        if (w < parseInt(maxMoney)) return api.sendMessage('Bạn không đủ tiền để thực hiện giao dịch này!', threadID, messageID);
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