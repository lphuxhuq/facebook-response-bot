module.exports = function ({ api, models, Users, Threads, Currencies }) {
  const fs = require("fs");
  const path = require("path");
  const stringSimilarity = require('string-similarity'),
    escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    logger = require("../../utils/log.js");
  const axios = require('axios');
  const moment = require("moment-timezone");
  const stores = require("../stores.js");
  const getThreadInfoCached = require("./threadInfo.js")({ api, models, Users, Threads, Currencies });
  const usagesStore = stores.use("usages", path.join(__dirname, "usages.json"));
  const adboxStore = stores.use("botData", path.join(__dirname, "../../modules/commands/cache/data.json"));
  return async function ({ event }) {
    const dateNow = Date.now()
    const time = moment.tz("Asia/Ho_Chi_minh").format("HH:mm:ss DD/MM/YYYY");
    const { allowInbox, PREFIX, ADMINBOT, NDH, DeveloperMode, adminOnly, keyAdminOnly, ndhOnly,adminPaseOnly } = global.config;
    const { userBanned, threadBanned, threadInfo, threadData, commandBanned } = global.data;
    const client = global.client;
    const { commands, cooldowns } = global.client;
    var { body, senderID, threadID, messageID } = event;
    var senderID = String(senderID),
      threadID = String(threadID);
    if (global.client) global.client._activeThreadID = threadID;
    const threadSetting = threadData.get(threadID) || {}
    const activePrefix = (threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : PREFIX;
    const prefixRegex = new RegExp(`^(<@!?${senderID}>|${escapeRegex(activePrefix)}|[!/])\\s*`);
    if (!prefixRegex.test(body)) return;
    const adminbot = global.config || require('./../../config.json');
    let getDay = moment.tz("Asia/Ho_Chi_Minh").day();
    let usages = usagesStore.data;
    if (!(senderID in usages)) {
      usages[senderID] = {};
      usages[senderID].usages = 20;
      usagesStore.touch();
    };
    
    if(!global.data.allThreadID.includes(threadID) && !ADMINBOT.includes(senderID) && adminbot.adminPaseOnly == true)return api.sendMessage("[ MODE ] - Chỉ admin mới được sử dụng bot trong chat riêng.", threadID, messageID)
   
    if (!ADMINBOT.includes(senderID) && adminbot.adminOnly == true) {
      return api.sendMessage('[ MODE ] - Chỉ admin bot mới có thể sử dụng bot', threadID, messageID);
    }
    if (!NDH.includes(senderID) && !ADMINBOT.includes(senderID) && adminbot.ndhOnly == true) {
      return api.sendMessage('[ MODE ] - Chỉ người hỗ trợ bot mới có thể sử dụng bot', threadID, messageID);
    }
    var threadInf = event.isGroup ? await getThreadInfoCached(threadID) : (threadInfo.get(threadID) || {});
    threadInf = threadInf || {};
    const findd = (Array.isArray(threadInf.adminIDs)) ? threadInf.adminIDs.find(el => el && el.id == senderID) : false;
    const dataAdbox = adboxStore.data;
    if (dataAdbox.adminbox && dataAdbox.adminbox.hasOwnProperty(threadID) && dataAdbox.adminbox[threadID] == true && !ADMINBOT.includes(senderID) && !findd && event.isGroup == true) return api.sendMessage('[ MODE ] - Chỉ admin nhóm mới được sử dụng bot!!', event.threadID, event.messageID)
    if (userBanned.has(senderID) || threadBanned.has(threadID) || allowInbox == ![] && senderID == threadID) {
      if (!ADMINBOT.includes(senderID.toString())) {
        if (userBanned.has(senderID)) {
          const { reason, dateAdded } = userBanned.get(senderID) || {};
          return api.sendMessage(global.getText("handleCommand", "userBanned", reason, dateAdded), threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          }, messageID);
        } else {
          if (threadBanned.has(threadID)) {
            const { reason, dateAdded } = threadBanned.get(threadID) || {};
            return api.sendMessage(global.getText("handleCommand", "threadBanned", reason, dateAdded), threadID, async (err, info) => {
              await new Promise(resolve => setTimeout(resolve, 5 * 1000));
              return api.unsendMessage(info.messageID);
            }, messageID);
          }
        }
      }
    }
    const [matchedPrefix] = body.match(prefixRegex),
      args = body.slice(matchedPrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    var command = commands.get(commandName);

    
    if (!ADMINBOT.includes(senderID) && usages[senderID] && usages[senderID].usages <= 0 && !["daily","check","ld"].includes(commandName)) return api.sendMessage("Bạn đã hết lượt sử dụng bot trong hôm nay! Bấm !daily để nhận thêm 20 lượt dùng bot", threadID, messageID);
    if (!command) {
      var allCommandName = [];
      const commandValues = commands['keys']();
      for (const cmd of commandValues) allCommandName.push(cmd)
      const checker = stringSimilarity.findBestMatch(commandName, allCommandName);
      if (checker.bestMatch.rating >= 0.5) command = client.commands.get(checker.bestMatch.target);
      else return api.sendMessage(global.getText("handleCommand", "commandNotExist", checker.bestMatch.target), threadID);
    }
    if (commandBanned.get(threadID) || commandBanned.get(senderID)) {
      if (!ADMINBOT.includes(senderID)) {
        const banThreads = commandBanned.get(threadID) || [],
          banUsers = commandBanned.get(senderID) || [];
        if (banThreads.includes(command.config.name))
          return api.sendMessage(global.getText("handleCommand", "commandThreadBanned", command.config.name), threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 5 * 1000))
            return api.unsendMessage(info.messageID);
          }, messageID);
        if (banUsers.includes(command.config.name))
          return api.sendMessage(global.getText("handleCommand", "commandUserBanned", command.config.name), threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          }, messageID);
      }
    }
    if (command.config.commandCategory.toLowerCase() == 'nsfw' && !global.data.threadAllowNSFW.includes(threadID) && !ADMINBOT.includes(senderID))
      return api.sendMessage(global.getText("handleCommand", "threadNotAllowNSFW"), threadID, async (err, info) => {

        await new Promise(resolve => setTimeout(resolve, 5 * 1000))
        return api.unsendMessage(info.messageID);
      }, messageID);
    var threadInfoo = threadInf || {};
    const find = (Array.isArray(threadInfoo.adminIDs)) ? threadInfoo.adminIDs.find(el => el && el.id == senderID) : false;
    var permssion = 0;
    if (NDH.includes(senderID.toString())) permssion = 2;
    if (ADMINBOT.includes(senderID.toString())) permssion = 3;
    else if (!ADMINBOT.includes(senderID) && !NDH.includes(senderID) && find) permssion = 1;
    if (command.config.hasPermssion > permssion) return api.sendMessage(global.getText("handleCommand", "permssionNotEnough", command.config.name), event.threadID, event.messageID);

   if (!client.cooldowns.has(command.config.name)) client.cooldowns.set(command.config.name, new Map());
    const timestamps = client.cooldowns.get(command.config.name);;
    const expirationTime = (command.config.cooldowns || 1) * 1000;
    if (timestamps.has(senderID) && dateNow < timestamps.get(senderID) + expirationTime)
      return api.sendMessage(global.getText("handleCommand", "delayTime", command.config.name, command.config.cooldowns), threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          }, messageID);
    
    var getText2;
    if (command.languages && typeof command.languages == 'object' && command.languages.hasOwnProperty(global.config.language))
      getText2 = (...values) => {
        var lang = command.languages[global.config.language][values[0]] || '';
        for (var i = values.length; i > 0x2533 + 0x1105 + -0x3638; i--) {
          const expReg = RegExp('%' + i, 'g');
          lang = lang.replace(expReg, values[i]);
        }
        return lang;
      };
    else getText2 = () => { };
    try {
      const Obj = {};
      Obj.api = api
      Obj.event = event
      Obj.args = args
      Obj.models = models
      Obj.Users = Users
      Obj.Threads = Threads
      Obj.Currencies = Currencies
      Obj.permssion = permssion
      Obj.getText = getText2
      if (!ADMINBOT.includes(senderID) && !["daily","check","ld"].includes(commandName)) {
        if (!usages[senderID]) usages[senderID] = { usages: 20 };
        usages[senderID].usages -= 1;
        usagesStore.touch();
      }
      timestamps.set(senderID, dateNow);
      Promise.resolve(command.run(Obj)).catch(e => {
        console.error(`[COMMAND ERROR in ${commandName}]:`, (e && e.message) || e);
        api.sendMessage(global.getText("handleCommand", "commandError", commandName, (e && e.message) || e), threadID, messageID);
      });
      if (DeveloperMode == !![])
        logger(global.getText("handleCommand", "executeCommand", time, commandName, senderID, threadID, args.join(" "), (Date.now()) - dateNow), "[ DEV MODE ]");
      return;
    } catch (e) {
      console.error(`[COMMAND ERROR in ${commandName}]:`, (e && e.message) || e);
      return api.sendMessage(global.getText("handleCommand", "commandError", commandName, (e && e.message) || e), threadID, messageID);
    }
  };
};