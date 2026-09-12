const { spawn } = require("child_process");
const { readFileSync } = require("fs-extra");
const http = require("http");
const axios = require("axios");
const semver = require("semver");
const logger = require("./utils/log");

/////////////////////////////////////////////
//========= Check node.js version =========//
/////////////////////////////////////////////

// const nodeVersion = semver.parse(process.version);
// if (nodeVersion.major < 13) {
//     logger(`Your Node.js ${process.version} is not supported, it required Node.js 13 to run bot!`, "error");
//     return process.exit(0);
// };

///////////////////////////////////////////////////////////
//========= Create website for dashboard/uptime =========//
///////////////////////////////////////////////////////////

const dashboard = http.createServer(function (_req, res) {
    res.writeHead(200, "OK", { "Content-Type": "text/plain" });
    res.write("HI! IM BOT SUPER CUTEE UwU ><");
    res.end();
});

dashboard.listen(process.env.PORT || process.env.port || 8080);

logger("Opened server site...", "[ Starting ]");

/////////////////////////////////////////////////////////
//========= Create start bot and make it loop =========//
/////////////////////////////////////////////////////////

function startBot(message) {
    (message) ? logger(message, "[ Starting ]") : "";

    const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "mirai.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    global.countRestart = global.countRestart || 0;
    child.on("close", (codeExit) => {
        if (codeExit === 0) {
            logger("Bot đã dừng hoạt động theo yêu cầu (exit code 0).", "[ Stopping ]");
            return;
        }
        if (codeExit === 1) {
            // Lệnh restart chủ động từ admin bot
            global.countRestart = 0;
            startBot("Restarting bot...");
            return;
        }
        if (global.countRestart < 10) {
            global.countRestart += 1;
            logger(`Bot crash bất thường (code: ${codeExit}). Đang khởi động lại (${global.countRestart}/10)...`, "[ Crash Recovery ]");
            setTimeout(() => startBot(), 2000);
            return;
        }
        logger("Bot đã crash liên tục quá 10 lần. Dừng để kiểm tra lỗi.", "[ Stopped ]");
    });

    child.on("error", function (error) {
        logger("An error occurred: " + JSON.stringify(error), "[ Starting ]");
    });
};
////////////////////////////////////////////////
//========= Check update from Github =========//
////////////////////////////////////////////////


axios.get("https://raw.githubusercontent.com/d-jukie/miraiv2/main/package.json").then((res) => {
    if (res && res.data) {
        logger(res['data']['name'] || "Mirai", "[ NAME ]");
        logger("Version: " + (res['data']['version'] || "1.0.0"), "[ VERSION ]");
    }
}).catch(() => {});
startBot();
/*axios.get("https://raw.githubusercontent.com/d-jukie/miraiv2_fix/main/package.json").then((res) => {
    const local = JSON.parse(readFileSync('./package.json'));
    if (semver['lt'](local.version, res['data']['version'])) {
        if (local.autoUpdate == !![]) {
            logger('A new update is available, start update processing...', '[ UPDATE ]');
            const updateBot = {};
            updateBot.cwd = __dirname
            updateBot.stdio = 'inherit' 
            updateBot.shell = !![];
            const child = spawn('node', ['update.js'], updateBot);
            child.on('exit', function () {
                return process.exit(0);
            })
            child.on('error', function (error) {
                logger('Unable to update:' + JSON.stringify(error), '[ CHECK UPDATE ]');
            });
        } else logger('A new update is available! Open terminal/cmd and type "node update" to update!', '[ UPDATE ]'), 
        startBot();
    } else logger('You are using the latest version!', '[ CHECK UPDATE ]'), startBot();
}).catch(err => logger("Unable to check update.", "[ CHECK UPDATE ]"));*/
// THIZ BOT WAS MADE BY ME(CATALIZCS) AND MY BROTHER SPERMLORD - DO NOT STEAL MY CODE (つ ͡ ° ͜ʖ ͡° )つ ✄ ╰⋃╯
