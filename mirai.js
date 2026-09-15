process.noDeprecation = true;
//////////////////////////////////////////////////////
//========= Require all variable need use =========//
/////////////////////////////////////////////////////

const { readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync, rm } = require("fs-extra");
const { join, resolve } = require("path");
const { execSync } = require('child_process');
const logger = require("./utils/log.js");
const login = require("fca-horizon-remake"), moment = require("moment-timezone");
require("dotenv").config();
const axios = require("axios");
axios.defaults.timeout = 8000;

const { getTempCachePath, safeUnlink } = require("./utils/cacheHelper.js");
global.getTempCachePath = getTempCachePath;
global.safeUnlink = safeUnlink;

const listPackage = JSON.parse(readFileSync('./package.json')).dependencies;
const listbuiltinModules = require("module").builtinModules;

process.on('unhandledRejection', (reason) => {
    console.error('[UNHANDLED REJECTION]:', (reason && reason.message) || reason);
});
process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION]:', (err && err.message) || err);
});

class HandleReplyList extends Array {
    push(...items) {
        for (const it of items) {
            if (it && typeof it === 'object') {
                if (!it._registeredAt) it._registeredAt = Date.now();
                if (!it.threadID && global.client && global.client._activeThreadID) {
                    it.threadID = global.client._activeThreadID;
                }
            }
        }
        return super.push(...items);
    }
}

global.client = new Object({
    commands: new Map(),
    events: new Map(),
    cooldowns: new Map(),
    eventRegistered: new Array(),
    handleSchedule: new Array(),
    handleReaction: new Array(),
    handleReply: new HandleReplyList(),
    mainPath: process.cwd(),
    configPath: new String(),
  getTime: function (option) {
        switch (option) {
            case "seconds":
                return `${moment.tz("Asia/Ho_Chi_minh").format("ss")}`;
            case "minutes":
                return `${moment.tz("Asia/Ho_Chi_minh").format("mm")}`;
            case "hours":
                return `${moment.tz("Asia/Ho_Chi_minh").format("HH")}`;
            case "date": 
                return `${moment.tz("Asia/Ho_Chi_minh").format("DD")}`;
            case "month":
                return `${moment.tz("Asia/Ho_Chi_minh").format("MM")}`;
            case "year":
                return `${moment.tz("Asia/Ho_Chi_minh").format("YYYY")}`;
            case "fullHour":
                return `${moment.tz("Asia/Ho_Chi_minh").format("HH:mm:ss")}`;
            case "fullYear":
                return `${moment.tz("Asia/Ho_Chi_minh").format("DD/MM/YYYY")}`;
            case "fullTime":
                return `${moment.tz("Asia/Ho_Chi_minh").format("HH:mm:ss DD/MM/YYYY")}`;
        }
  }
});

class SafeIdMap extends Map {
    get(k) { return super.get(k != null ? String(k) : k); }
    set(k, v) { return super.set(k != null ? String(k) : k, v); }
    has(k) { return super.has(k != null ? String(k) : k); }
    delete(k) { return super.delete(k != null ? String(k) : k); }
}

global.data = new Object({
    threadInfo: new SafeIdMap(),
    threadData: new SafeIdMap(),
    userName: new SafeIdMap(),
    userBanned: new SafeIdMap(),
    threadBanned: new SafeIdMap(),
    commandBanned: new SafeIdMap(),
    threadAllowNSFW: new Array(),
    allUserID: new Array(),
    allCurrenciesID: new Array(),
    allThreadID: new Array()
});

global.taixiuS = new Map();
global.baucuaS = new Map();
global.chanle = new Map();

global.utils = require("./utils");

global.nodemodule = new Proxy({}, {
    get: (target, name) => {
        if (typeof name === 'symbol') return target[name];
        if (!(name in target)) {
            try {
                target[name] = require(name);
            } catch (e) {
                try {
                    target[name] = require(join(__dirname, "nodemodules", "node_modules", name));
                } catch {
                    target[name] = undefined;
                }
            }
        }
        return target[name];
    },
    set: (target, name, value) => {
        target[name] = value;
        return true;
    },
    has: (target, name) => {
        return true;
    }
});

global.config = new Object();

global.configModule = new Object();

global.moduleData = new Array();

global.language = new Object();

//////////////////////////////////////////////////////////
//========= Find and get variable from Config =========//
/////////////////////////////////////////////////////////

var configValue;
try {
    global.client.configPath = join(global.client.mainPath, "config.json");
    configValue = require(global.client.configPath);
    logger.loader("Found file config: config.json");
}
catch {
    if (existsSync(global.client.configPath.replace(/\.json/g,"") + ".temp")) {
        configValue = readFileSync(global.client.configPath.replace(/\.json/g,"") + ".temp");
        configValue = JSON.parse(configValue);
        logger.loader(`Found: ${global.client.configPath.replace(/\.json/g,"") + ".temp"}`);
    }
    else {
        logger.loader("config.json not found!", "error");
        process.exit(1);
    }
}

try {
    for (const key in configValue) global.config[key] = configValue[key];
    if (process.env.WOLFRAM_API_KEY) {
        if (!global.config.math) global.config.math = {};
        global.config.math.WOLFRAM = process.env.WOLFRAM_API_KEY;
    }
    if (process.env.OPENWEATHER_API_KEY) {
        if (!global.config.weather) global.config.weather = {};
        global.config.weather.OPEN_WEATHER = process.env.OPENWEATHER_API_KEY;
    }
    if (process.env.TENOR_API_KEY) {
        if (!global.config.gif) global.config.gif = {};
        global.config.gif.TENOR = process.env.TENOR_API_KEY;
    }
    if (process.env.RAPIDAPI_KEY) {
        if (!global.config.instagram) global.config.instagram = {};
        global.config.instagram.APIKEY = process.env.RAPIDAPI_KEY;
    }
    logger.loader("Config Loaded!");
}
catch {
    logger.loader("Can't load file config!", "error");
    process.exit(1);
}

const { Sequelize, sequelize } = require("./includes/database");

writeFileSync(global.client.configPath + ".temp", JSON.stringify(global.config, null, 4), 'utf8');

/////////////////////////////////////////
//========= Load language use =========//
/////////////////////////////////////////

const langFile = (readFileSync(`${__dirname}/languages/${global.config.language || "en"}.lang`, { encoding: 'utf-8' })).split(/\r?\n|\r/);
const langData = langFile.filter(item => item.indexOf('#') != 0 && item != '');
for (const item of langData) {
    const getSeparator = item.indexOf('=');
    const itemKey = item.slice(0, getSeparator);
    const itemValue = item.slice(getSeparator + 1, item.length);
    const head = itemKey.slice(0, itemKey.indexOf('.'));
    const key = itemKey.replace(head + '.', '');
    const value = itemValue.replace(/\\n/gi, '\n');
    if (typeof global.language[head] == "undefined") global.language[head] = new Object();
    global.language[head][key] = value;
}

global.getText = function (...args) {
    const langText = global.language;    
    if (!langText || !langText.hasOwnProperty(args[0])) return args[1] || args[0] || '';
    var text = langText[args[0]][args[1]];
    if (typeof text !== 'string') return args[1] || `${args[0]}.${args[1]}`;
    for (var i = args.length - 1; i > 0; i--) {
        const regEx = RegExp(`%${i}`, 'g');
        text = text.replace(regEx, args[i + 1] !== undefined ? args[i + 1] : '');
    }
    return text;
}

try {
    var appStateFile = resolve(join(global.client.mainPath, global.config.APPSTATEPATH || "appstate.json"));
    var appState = require(appStateFile);
    if (appState && !Array.isArray(appState) && Array.isArray(appState.cookies)) {
        appState = appState.cookies;
    }
    logger.loader(global.getText("mirai", "foundPathAppstate"))

    // Tự động vá lỗi tràn số 32-bit (timestamp << 22) của OTID trong sendMessageMqtt nếu có
    const smMqttPath = resolve(join(global.client.mainPath, 'node_modules/fca-horizon-remake/src/actions/sendMessageMqtt.js'));
    if (existsSync(smMqttPath)) {
        let code = readFileSync(smMqttPath, 'utf8');
        if (code.includes('timestamp << 22')) {
            code = code.replace(/var timestamp = Date\.now\(\);\s*var epoch = timestamp << 22;\s*var otid = epoch \+ Math\.floor\(Math\.random\(\) \* 4194304\);/g, 'var otid = utils.generateOfflineThreadingID();');
            code = code.replace(/otid:\s*\(otid \+ 1\)\.toString\(\)/g, 'otid: utils.generateOfflineThreadingID()');
            writeFileSync(smMqttPath, code, 'utf8');
        }
    }
}
catch {
    logger.loader(global.getText("mirai", "notFoundPathAppstate"), "error");
    process.exit(1);
}

////////////////////////////////////////////////////////////
//========= Login account and start Listen Event =========//
////////////////////////////////////////////////////////////

function checkBan(checkban) {
    return; // Da bo qua link gban 404 de tang toc khoi dong
    const [_0x4e5718, _0x28e5ae] = global.utils.homeDir();
    logger(global.getText('mirai', 'checkListGban'), '[ GLOBAL BAN ]'), global.checkBan = !![];
    if (existsSync('/home/runner/.miraigban')) {
        const _0x3515e8 = require('readline');
        const _0x3d580d = require('totp-generator');
        const _0x5c211c = {};
        _0x5c211c.input = process.stdin, 
        _0x5c211c.output = process.stdout;
        var _0x2cd8f4 = _0x3515e8.createInterface(_0x5c211c);
        global.handleListen.stopListening(), 
        logger(global.getText('mirai', 'banDevice'), '[ GLOBAL BAN ]'), _0x2cd8f4.on('line', _0x4244d8 => {
            _0x4244d8 = String(_0x4244d8);

            if (isNaN(_0x4244d8) || _0x4244d8.length < 6 || _0x4244d8.length > 6) 
                console.log(global.getText('mirai', 'keyNotSameFormat'));
            else return axios.get('https://raw.githubusercontent.com/D-Jukie/gban-mirai/main/listgban.json').then(_0x2f978e => {
                // if (_0x2f978e.headers.server != 'cloudflare') return logger('BYPASS DETECTED!!!', '[ GLOBAL BAN ]'), 
                //  process.exit(0);
                const _0x360aa8 = _0x3d580d(String(_0x2f978e.data).replace(/\s+/g, '').toLowerCase());                
                if (_0x360aa8 !== _0x4244d8) return console.log(global.getText('mirai', 'codeInputExpired'));
                else {
                    const _0x1ac6d2 = {};
                    return _0x1ac6d2.recursive = !![], rm('/.miraigban', _0x1ac6d2), _0x2cd8f4.close(), 
                    logger(global.getText('mirai', 'unbanDeviceSuccess'), '[ GLOBAL BAN ]');
                }
            });
        });
        return;
    };
    return axios.get('https://raw.githubusercontent.com/D-Jukie/gban-mirai/main/listgban.json').then(dataGban => {
        // if (dataGban.headers.server != 'cloudflare') 
        //  return logger('BYPASS DETECTED!!!', '[ GLOBAL BAN ]'), 
        // process.exit(0);
        for (const _0x125f31 of global.data.allUserID)
            if (dataGban.data.hasOwnProperty(_0x125f31) && !global.data.userBanned.has(_0x125f31)) global.data.userBanned.set(_0x125f31, {
                'reason': dataGban.data[_0x125f31]['reason'],
                'dateAdded': dataGban.data[_0x125f31]['dateAdded']
            });
        for (const thread of global.data.allThreadID)
            if (dataGban.data.hasOwnProperty(thread) && !global.data.userBanned.has(thread)) global.data.threadBanned.set(thread, {
                'reason': dataGban.data[thread]['reason'],
                'dateAdded': dataGban.data[thread]['dateAdded']
            });
        delete require.cache[require.resolve(global.client.configPath)];
        const admin = require(global.client.configPath).ADMINBOT || [];
        for (const adminID of admin) {
            if (!isNaN(adminID) && dataGban.data.hasOwnProperty(adminID)) {
                logger(global.getText('mirai','userBanned', dataGban.data[adminID]['dateAdded'], dataGban.data[adminID]['reason']), '[ GLOBAL BAN ]'), 
                mkdirSync(_0x4e5718 + ('/.miraigban'));
                if (_0x28e5ae == 'win32') execSync('attrib +H' + '+S' + _0x4e5718 + ('/.miraigban'));
                return process.exit(0);
            }
        }                                                                                                      
        if (dataGban.data.hasOwnProperty(checkban.getCurrentUserID())) {
            logger(global.getText('mirai', 'userBanned', dataGban.data[checkban.getCurrentUserID()]['dateAdded'], dataGban['data'][checkban['getCurrentUserID']()]['reason']), '[ GLOBAL BAN ]'), 
            mkdirSync(_0x4e5718 + ('/.miraigban'));
            if (_0x28e5ae == 'win32') 
                execSync('attrib +H +S ' + _0x4e5718 + ('/.miraigban'));
            return process.exit(0);
        }
        return axios.get('https://raw.githubusercontent.com/D-Jukie/gban-mirai/main/data.json').then(json => {
            
            // if (json.headers.server == 'cloudflare') 
            //  return logger('BYPASS DETECTED!!!', '[ GLOBAL BAN ]'), 
            // process.exit(0);
            logger(json.data[Math['floor'](Math['random']() * json.data.length)], '[ BROAD CAST ]');
        }), logger(global.getText('mirai','finishCheckListGban'), '[ GLOBAL BAN ]');
    }).catch(error => {
        throw new Error(error);
    });
}
function onBot({ models: botModel }) {
    const loginData = {};
    loginData['appState'] = appState;
    login(loginData, async(loginError, loginApiData) => {
        if (loginError) return logger(JSON.stringify(loginError), `ERROR`);
        loginApiData.setOptions(global.config.FCAOption);

        // Ghi đè api.sendMessage để tự động định tuyến toàn bộ qua MQTT sendMessageMqtt (tránh lỗi 404 HTTP endpoint /messaging/send/ của Facebook)
        loginApiData.sendMessage = function (msg, threadID, callback, replyToMessage) {
            let cb = callback;
            let replyMsg = replyToMessage;
            if (typeof callback === 'string' || typeof callback === 'number') {
                replyMsg = callback;
                cb = () => {};
            } else if (typeof callback !== 'function') {
                cb = () => {};
            }

            let normMsg = msg;
            if (typeof normMsg === 'string' || typeof normMsg === 'number') {
                normMsg = { body: String(normMsg) };
            } else if (normMsg && typeof normMsg === 'object' && normMsg.body == null && !normMsg.attachment && !normMsg.sticker) {
                normMsg = { body: JSON.stringify(normMsg) };
            }

            if (replyMsg && typeof normMsg === 'object') {
                normMsg.replyToMessage = replyMsg;
            }

            const preview = (normMsg && normMsg.body) ? normMsg.body.slice(0, 60).replace(/\n/g, ' ') : (normMsg && normMsg.attachment ? '(attachment)' : '(sticker/media)');
            console.log(`[API SEND MESSAGE]: threadID=${threadID}, preview=${preview}`);

            const otid = (Date.now().toString() + Math.floor(Math.random() * 1000000).toString()).slice(0, 16);

            function sendViaMqtt(attempt = 1) {
                if (typeof loginApiData.sendMessageMqtt === 'function') {
                    return loginApiData.sendMessageMqtt(normMsg, threadID, (err, res) => {
                        if (err) {
                            const errStr = String(err.error || err.message || err);
                            if (attempt <= 3 && (/not connected/i.test(errStr) || /timeout/i.test(errStr))) {
                                const delay = attempt * 600;
                                console.log(`[MQTT đang kết nối lại, thử lại sau ${delay}ms... lần ${attempt}/3]`);
                                return setTimeout(() => sendViaMqtt(attempt + 1), delay);
                            }
                            if (normMsg.attachment && normMsg.body) {
                                console.log(`[ATTACHMENT FAILED]: Lỗi tải tệp (${errStr}), tự động fallback gửi văn bản...`);
                                const textOnly = { body: normMsg.body };
                                return loginApiData.sendMessageMqtt(textOnly, threadID, cb, replyMsg);
                            }
                            console.error(`[MQTT SEND FAILED]: threadID=${threadID}, err=${errStr}`);
                            return cb(err);
                        }
                        console.log(`[MQTT SEND SUCCESS]: threadID=${threadID}`);
                        const info = Object.assign({ messageID: otid, threadID: String(threadID) }, res || {});
                        try {
                            cb(null, info);
                        } catch (cbErr) {
                            console.error('[sendMessage callback error]:', cbErr);
                        }
                    }, replyMsg);
                }
                console.error('[ERROR]: sendMessageMqtt không khả dụng');
                return cb(new Error('sendMessageMqtt is not available'));
            }

            return sendViaMqtt();
        };

        writeFileSync(appStateFile, JSON.stringify(loginApiData.getAppState(), null, '\x09'))
        global.config.version = '1.2.14'
        global.client.timeStart = new Date().getTime(),
            function () {
                const listCommand = readdirSync(global.client.mainPath + '/modules/commands').filter(command => command.endsWith('.js') && !command.includes('example') && !global.config.commandDisabled.includes(command));
                for (const command of listCommand) {
                    try {
                        var module = require(global.client.mainPath + '/modules/commands/' + command);
                        if (!module.config || !module.run || !module.config.commandCategory) throw new Error(global.getText('mirai', 'errorFormat'));
                        if (global.client.commands.has(module.config.name || '')) throw new Error(global.getText('mirai', 'nameExist'));
                        if (!module.languages || typeof module.languages != 'object' || Object.keys(module.languages).length == 0) logger.loader(global.getText('mirai', 'notFoundLanguage', module.config.name), 'warn');
                        if (module.config.dependencies && typeof module.config.dependencies == 'object') {
                            for (const reqDependencies in module.config.dependencies) {
                                const reqDependenciesPath = join(__dirname, 'nodemodules', 'node_modules', reqDependencies);
                                try {
                                    if (!global.nodemodule.hasOwnProperty(reqDependencies)) {
                                        try {
                                            global.nodemodule[reqDependencies] = require(reqDependencies);
                                        } catch {
                                            global.nodemodule[reqDependencies] = require(reqDependenciesPath);
                                        }
                                    }
                                } catch {
                                    var check = false;
                                    var isError;
                                    logger.loader(global.getText('mirai', 'notFoundPackage', reqDependencies, module.config.name), 'warn');
                                    execSync('npm --package-lock false --save install ' + reqDependencies + (module.config.dependencies[reqDependencies] == '*' || module.config.dependencies[reqDependencies] == '' ? '' : '@' + module.config.dependencies[reqDependencies]), { 'stdio': 'inherit', 'env': process['env'], 'shell': true, 'cwd': join(__dirname, 'nodemodules') });
                                    for (let i = 1; i <= 3; i++) {
                                        try {
                                            require['cache'] = {};
                                            if (listPackage.hasOwnProperty(reqDependencies) || listbuiltinModules.includes(reqDependencies)) global['nodemodule'][reqDependencies] = require(reqDependencies);
                                            else global['nodemodule'][reqDependencies] = require(reqDependenciesPath);
                                            check = true;
                                            break;
                                        } catch (error) { isError = error; }
                                        if (check || !isError) break;
                                    }
                                    if (!check || isError) throw global.getText('mirai', 'cantInstallPackage', reqDependencies, module.config.name, isError);
                                }
                            }
                            logger.loader(global.getText('mirai', 'loadedPackage', module.config.name));
                        }
                        if (module.config.envConfig) try {
                            for (const envConfig in module.config.envConfig) {
                                if (typeof global.configModule[module.config.name] == 'undefined') global.configModule[module.config.name] = {};
                                if (typeof global.config[module.config.name] == 'undefined') global.config[module.config.name] = {};
                                if (typeof global.config[module.config.name][envConfig] !== 'undefined') global['configModule'][module.config.name][envConfig] = global.config[module.config.name][envConfig];
                                else global.configModule[module.config.name][envConfig] = module.config.envConfig[envConfig] || '';
                                if (typeof global.config[module.config.name][envConfig] == 'undefined') global.config[module.config.name][envConfig] = module.config.envConfig[envConfig] || '';
                            }
                            logger.loader(global.getText('mirai', 'loadedConfig', module.config.name));
                        } catch (error) {
                            throw new Error(global.getText('mirai', 'cantLoadConfig', module.config.name, JSON.stringify(error)));
                        }
                        if (module.onLoad) {
                            try {
                                const moduleData = {};
                                moduleData.api = loginApiData;
                                moduleData.models = botModel;
                                module.onLoad(moduleData);
                            } catch (_0x20fd5f) {
                                throw new Error(global.getText('mirai', 'cantOnload', module.config.name, JSON.stringify(_0x20fd5f)), 'error');
                            };
                        }
                        if (module.handleEvent) global.client.eventRegistered.push(module.config.name);
                        global.client.commands.set(module.config.name, module);
                        logger.loader(global.getText('mirai', 'successLoadModule', module.config.name));
                    } catch (error) {
                        logger.loader(global.getText('mirai', 'failLoadModule', module.config.name, error), 'error');
                    };
                }
            }(),
            function() {
                const events = readdirSync(global.client.mainPath + '/modules/events').filter(event => event.endsWith('.js') && !global.config.eventDisabled.includes(event));
                for (const ev of events) {
                    try {
                        var event = require(global.client.mainPath + '/modules/events/' + ev);
                        if (!event.config || !event.run) throw new Error(global.getText('mirai', 'errorFormat'));
                        if (global.client.events.has(event.config.name) || '') throw new Error(global.getText('mirai', 'nameExist'));
                        if (event.config.dependencies && typeof event.config.dependencies == 'object') {
                            for (const dependency in event.config.dependencies) {
                                const _0x21abed = join(__dirname, 'nodemodules', 'node_modules', dependency);
                                try {
                                    if (!global.nodemodule.hasOwnProperty(dependency)) {
                                        try {
                                            global.nodemodule[dependency] = require(dependency);
                                        } catch {
                                            global.nodemodule[dependency] = require(_0x21abed);
                                        }
                                    }
                                } catch {
                                    let check = false;
                                    let isError;
                                    logger.loader(global.getText('mirai', 'notFoundPackage', dependency, event.config.name), 'warn');
                                    execSync('npm --package-lock false --save install ' + dependency + (event.config.dependencies[dependency] == '*' || event.config.dependencies[dependency] == '' ? '' : '@' + event.config.dependencies[dependency]), { 'stdio': 'inherit', 'env': process['env'], 'shell': true, 'cwd': join(__dirname, 'nodemodules') });
                                    for (let i = 1; i <= 3; i++) {
                                        try {
                                            if (global.nodemodule.hasOwnProperty(dependency)) break;
                                            if (listPackage.hasOwnProperty(dependency) || listbuiltinModules.includes(dependency)) global.nodemodule[dependency] = require(dependency);
                                            else global.nodemodule[dependency] = require(_0x21abed);
                                            check = true;
                                            break;
                                        } catch (error) { isError = error; }
                                        if (check || !isError) break;
                                    }
                                    if (!check || isError) throw global.getText('mirai', 'cantInstallPackage', dependency, event.config.name);
                                }
                            }
                            logger.loader(global.getText('mirai', 'loadedPackage', event.config.name));
                        }
                        if (event.config.envConfig) try {
                            for (const _0x5beea0 in event.config.envConfig) {
                                if (typeof global.configModule[event.config.name] == 'undefined') global.configModule[event.config.name] = {};
                                if (typeof global.config[event.config.name] == 'undefined') global.config[event.config.name] = {};
                                if (typeof global.config[event.config.name][_0x5beea0] !== 'undefined') global.configModule[event.config.name][_0x5beea0] = global.config[event.config.name][_0x5beea0];
                                else global.configModule[event.config.name][_0x5beea0] = event.config.envConfig[_0x5beea0] || '';
                                if (typeof global.config[event.config.name][_0x5beea0] == 'undefined') global.config[event.config.name][_0x5beea0] = event.config.envConfig[_0x5beea0] || '';
                            }
                            logger.loader(global.getText('mirai', 'loadedConfig', event.config.name));
                        } catch (error) {
                            throw new Error(global.getText('mirai', 'cantLoadConfig', event.config.name, JSON.stringify(error)));
                        }
                        if (event.onLoad) try {
                            const eventData = {};
                            eventData.api = loginApiData, eventData.models = botModel;
                            event.onLoad(eventData);
                        } catch (error) {
                            throw new Error(global.getText('mirai', 'cantOnload', event.config.name, JSON.stringify(error)), 'error');
                        }
                        global.client.events.set(event.config.name, event);
                        logger.loader(global.getText('mirai', 'successLoadModule', event.config.name));
                    } catch (error) {
                        logger.loader(global.getText('mirai', 'failLoadModule', event.config.name, error), 'error');
                    }
                }
            }()
        logger.loader(global.getText('mirai', 'finishLoadModule', global.client.commands.size, global.client.events.size)) 
        logger.loader('=== ' + (Date.now() - global.client.timeStart) + 'ms ===')
        writeFileSync(global.client['configPath'], JSON['stringify'](global.config, null, 4), 'utf8') 
        unlinkSync(global['client']['configPath'] + '.temp');        
        const listenerData = {};
        listenerData.api = loginApiData; 
        listenerData.models = botModel;
        const listener = require('./includes/listen')(listenerData);

        function listenerCallback(error, message) {
            if (error) return logger(global.getText('mirai', 'handleListenError', JSON.stringify(error)), 'error');
            if (['presence', 'typ', 'read_receipt'].some(data => data == message.type)) return;
            console.log('[TIN NHAN DEN]: type=' + message.type + ', senderID=' + message.senderID + ', threadID=' + message.threadID + ', body=' + (message.body || '(non-text)'));
            if (global.config.DeveloperMode == !![]) console.log(message);
            return listener(message);
        };
        global.handleListen = loginApiData.listenMqtt(listenerCallback);
        global.client.api = loginApiData;
        try {
            await checkBan(loginApiData);
        } catch (error) {
            logger('Bo qua checkBan (link gban khong kha dung)', '[ GLOBAL BAN ]');
        }

        // Tự động gửi tin nhắn test sau khi MQTT kết nối ổn định (5 giây)
        setTimeout(() => {
            try {
                const timeStr = new Date().toLocaleTimeString('vi-VN');
                const testMsg = `🤖 [RAILWAY]: Bot Mirai đã sẵn sàng hoạt động (${timeStr})! Gõ !menu hoặc /help để kiểm tra.`;
                loginApiData.sendMessage(testMsg, "1671415294995657", (err, info) => {
                    if (err) {
                        console.log('[TEST GUI TIN NHAN NHOM THAT BAI]:', JSON.stringify(err));
                    } else {
                        console.log('[TEST GUI TIN NHAN NHOM THANH CONG]: MessageID =', info ? info.messageID : 'OK');
                    }
                });
                loginApiData.getThreadList(10, null, ["INBOX"], (err, list) => {
                    if (err) {
                        console.log('[GET THREAD LIST ERROR]:', JSON.stringify(err));
                    } else if (list && list.length > 0) {
                        console.log('[DANH SACH 10 HOI THOAI GAN NHAT]:');
                        list.forEach(t => {
                            console.log(`- ID: ${t.threadID} | Ten: ${t.name || '(Inbox/Ca nhan)'} | So TV: ${t.participantIDs ? t.participantIDs.length : 0} | isGroup: ${t.isGroup}`);
                        });
                    }
                });
            } catch (testErr) {
                console.log('[TEST ERROR]:', testErr.message);
            }
        }, 5000);
        //     // global.handleListen.stopListening(),
        //     global.checkBan = ![],
        //     setTimeout(function () {
        //         return global.handleListen = loginApiData.listenMqtt(listenerCallback);
        //     }, 500);
        //     try {
        //         await checkBan(loginApiData);
        //     } catch {
        //         return process.exit(0);
        //     };
        //     if (!global.checkBan) logger(global.getText('mirai', 'warningSourceCode'), '[ GLOBAL BAN ]');
        //     global.config.autoClean && (global.data.threadInfo.clear(), global.client.handleReply = global.client.handleReaction = {});
        //     if (global.config.DeveloperMode == !![]) 
        //         return logger(global.getText('mirai', 'refreshListen'), '[ DEV MODE ]');
        // }, 600000);
    });
}
//////////////////////////////////////////////
//========= Connecting to Database =========//
//////////////////////////////////////////////

(async() => {
    try {
        await sequelize.authenticate();
        const authentication = {};
        authentication.Sequelize = Sequelize;
        authentication.sequelize = sequelize;
        const models = require('./includes/database/model')(authentication);
        logger(global.getText('mirai', 'successConnectDatabase'), '[ DATABASE ]');
        const botData = {};
        botData.models = models
        onBot(botData);
    } catch (error) { logger(global.getText('mirai', 'failConnectDatabase', JSON.stringify(error)), 'error'); }
})();
process.on('unhandledRejection', (err, p) => {
    console.error('[UNHANDLED REJECTION]:', err);
});
//THIZ BOT WAS MADE BY ME(CATALIZCS) AND MY BROTHER SPERMLORD - DO NOT STEAL MY CODE (つ ͡ ° ͜ʖ ͡° )つ ✄ ╰⋃╯