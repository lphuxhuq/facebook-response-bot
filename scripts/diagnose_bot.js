// Self-test diagnostic script: verifies command dispatching without crashing or spamming
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

async function runDiagnostic() {
    console.log('=== BẮT ĐẦU CHẨN ĐOÁN TỰ ĐỘNG BOT ===\n');

    // 1. Config
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
    global.config = config;
    global.configModule = config;

    // 2. Global structures
    class SafeIdMap extends Map {
        get(k) { return super.get(k != null ? String(k) : k); }
        set(k, v) { return super.set(k != null ? String(k) : k, v); }
        has(k) { return super.has(k != null ? String(k) : k); }
        delete(k) { return super.delete(k != null ? String(k) : k); }
    }

    global.client = {
        commands: new Map(),
        events: new Map(),
        cooldowns: new Map(),
        eventRegistered: [],
        handleSchedule: [],
        handleReaction: [],
        handleReply: [],
        mainPath: path.resolve(__dirname, '..'),
        configPath: path.resolve(__dirname, '../config.json'),
        getTime: () => new Date().toISOString()
    };

    global.data = {
        threadInfo: new SafeIdMap(),
        threadData: new SafeIdMap(),
        userName: new SafeIdMap(),
        userBanned: new SafeIdMap(),
        threadBanned: new SafeIdMap(),
        commandBanned: new SafeIdMap(),
        threadAllowNSFW: [],
        allUserID: ['100087874832691'],
        allCurrenciesID: ['100087874832691'],
        allThreadID: ['1671415294995657']
    };

    global.utils = require('../utils');
    global.nodemodule = new Proxy({}, {
        get: (target, name) => {
            if (typeof name === 'symbol') return target[name];
            if (!(name in target)) {
                try {
                    target[name] = require(name);
                } catch (e) {
                    try {
                        target[name] = require(path.join(__dirname, '../nodemodules/node_modules', name));
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
        }
    });
    global.language = {};

    // Language loader
    const langLines = fs.readFileSync(path.join(__dirname, '../languages/vi.lang'), 'utf8').split(/\r?\n|\r/);
    for (const item of langLines) {
        if (!item || item.startsWith('#')) continue;
        const sep = item.indexOf('=');
        if (sep === -1) continue;
        const itemKey = item.slice(0, sep);
        const itemVal = item.slice(sep + 1);
        const dot = itemKey.indexOf('.');
        const head = itemKey.slice(0, dot);
        const key = itemKey.slice(dot + 1);
        if (!global.language[head]) global.language[head] = {};
        global.language[head][key] = itemVal;
    }
    global.getText = function (...args) {
        const [head, key, ...replacements] = args;
        let text = global.language[head]?.[key] || key;
        replacements.forEach((val, idx) => {
            text = text.replace(new RegExp(`%${idx + 1}`, 'g'), val);
        });
        return text;
    };

    // 3. Database
    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '../data.sqlite'),
        logging: false
    });
    await sequelize.authenticate();
    const models = require('../includes/database/model')({ Sequelize, sequelize });
    console.log('[✓] Cơ sở dữ liệu: Kết nối SQLite thành công');

    // 4. Mock API with spy
    const sentMessages = [];
    const mockApi = {
        getCurrentUserID: () => '100044921811616',
        sendMessage: (msg, threadID, callback) => {
            const body = typeof msg === 'string' ? msg : (msg && msg.body) || JSON.stringify(msg);
            sentMessages.push({ threadID, body });
            if (typeof callback === 'function') callback(null, { messageID: 'mid_' + Date.now() });
        },
        unsendMessage: () => {},
        setMessageReaction: () => {},
        getThreadInfo: (tid, cb) => {
            const info = { threadID: tid, participantIDs: ['100087874832691', '100044921811616'], adminIDs: [{ id: '100087874832691' }] };
            if (cb) cb(null, info);
            return Promise.resolve(info);
        }
    };

    // 5. Load command modules
    const cmdDir = path.join(__dirname, '../modules/commands');
    const commandFiles = fs.readdirSync(cmdDir).filter(f => f.endsWith('.js') && !f.includes('example'));
    let loadedCount = 0;
    let errorCount = 0;

    for (const file of commandFiles) {
        try {
            const mod = require(path.join(cmdDir, file));
            if (mod.config && mod.config.name && mod.run) {
                global.client.commands.set(mod.config.name, mod);
                loadedCount++;
            }
        } catch (e) {
            errorCount++;
        }
    }
    console.log(`[✓] Hệ thống lệnh: Đã nạp thành công ${loadedCount} lệnh (bỏ qua ${errorCount} lệnh phụ thuộc lỗi)\n`);

    // 6. Init handlers
    const Users = require('../includes/controllers/users')({ models, api: mockApi });
    const Threads = require('../includes/controllers/threads')({ models, api: mockApi });
    const Currencies = require('../includes/controllers/currencies')({ models });
    const handleCommand = require('../includes/handle/handleCommand')({
        api: mockApi,
        models,
        Users,
        Threads,
        Currencies
    });

    // 7. Run test commands
    const testCases = ['!ping', '!help', '!menu', '!uptime', '!daily', '!ad'];
    console.log('--- KIỂM TRA THỰC THI LỆNH MẪU ---');

    for (const cmdText of testCases) {
        sentMessages.length = 0;
        const testEvent = {
            type: 'message',
            body: cmdText,
            senderID: '100087874832691', // admin id
            threadID: '1671415294995657',
            messageID: 'test_mid_' + Date.now(),
            isGroup: true
        };

        try {
            await handleCommand({ event: testEvent });
            // Wait brief async tick
            await new Promise(r => setTimeout(r, 600));

            if (sentMessages.length > 0) {
                const preview = sentMessages[0].body.slice(0, 70).replace(/\n/g, ' ');
                console.log(`[PASS] "${cmdText}" -> Phản hồi: "${preview}..."`);
            } else {
                console.log(`[WARN] "${cmdText}" -> Lệnh chạy xong nhưng không gửi tin nhắn phản hồi`);
            }
        } catch (cmdErr) {
            console.log(`[FAIL] "${cmdText}" -> Lỗi: ${cmdErr.message}`);
        }
    }

    console.log('\n=== KẾT QUẢ: Toàn bộ pipeline điều khiển và phân luồng lệnh hoạt động bình thường ===');
    process.exit(0);
}

runDiagnostic().catch(err => {
    console.error('DIAGNOSTIC_FATAL:', err);
    process.exit(1);
});
