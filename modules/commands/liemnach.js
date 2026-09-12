module.exports.config = {
    name: "liemnach",
    version: "2.0.0",
    hasPermssion: 1,
    credits: "Pro",
    description: "",
    commandCategory: "Edit-IMG",
    usages: "[tag]",
    cooldowns: 5,
    dependencies: {
        "axios": "",
        "fs-extra": "",
        "path": "",
        "jimp": ""
    }
}

module.exports.onLoad = () => {
    const fs = require("fs-extra");
    const request = require("request");
    const dirMaterial = __dirname + `/cache/canvas/`;
    if (!fs.existsSync(dirMaterial + "canvas")) fs.mkdirSync(dirMaterial, { recursive: true });
    if (!fs.existsSync(dirMaterial + "liemnach.png")) request("https://i.imgur.com/dgg7t4Q.jpg").pipe(fs.createWriteStream(dirMaterial + "liemnach.png"));
}

async function makeImage({ one, two }) {    
    const axios = require("axios");
    const fs = require("fs-extra");
    const path = require("path");
    const jimp = require("jimp");
    const __root = path.resolve(__dirname, "cache", "canvas");

    let liemnach_image = await jimp.read(__root + "/liemnach.png");
    let pathImg = __root + `/liemnach_${one}_${two}.png`;
    let avatarOne = __root + `/avt_${two}.png`;
    let avatarTwo = __root + `/avt_${one}.png`;
    
    let getAvatarOne = (await axios.get(`https://graph.facebook.com/${one}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })).data;
    fs.writeFileSync(avatarOne, Buffer.from(getAvatarOne, 'utf-8'));
    
    let getAvatarTwo = (await axios.get(`https://graph.facebook.com/${two}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })).data;
    fs.writeFileSync(avatarTwo, Buffer.from(getAvatarTwo, 'utf-8'));
    
    let circleOne = await jimp.read(await circle(avatarOne));
    let circleTwo = await jimp.read(await circle(avatarTwo));
    liemnach_image.composite(circleOne.resize(220, 220), 316, 204).composite(circleTwo.resize(170, 170), 46, 584);
    
    let raw = await liemnach_image.getBufferAsync("image/png");
    
    fs.writeFileSync(pathImg, raw);
    fs.unlinkSync(avatarOne);
    fs.unlinkSync(avatarTwo);
    
    return pathImg;
}
async function circle(image) {
    const jimp = require("jimp");
    image = await jimp.read(image);
    image.circle();
    return await image.getBufferAsync("image/png");
}

module.exports.run = async function ({ event, api, args }) {
    const fs = global.nodemodule["fs-extra"];
    const { threadID, messageID, senderID } = event;
    const mention = Object.keys(event.mentions);
    if (!mention[0]) return api.sendMessage("𝗩𝘂𝗶 𝗹𝗼̀𝗻𝗴 𝘁𝗮𝗴 𝟭 𝗻𝗴𝘂̛𝗼̛̀𝗶.", threadID, messageID);
    else {
        var one = senderID, two = mention[0];
        return makeImage({ one, two }).then(path => api.sendMessage({ body: "𝗧𝗵𝗼̛𝗺 𝘃𝗮̀ 𝗻𝗴𝗼𝗻 𝗹𝗮̆́𝗺 𝗵𝗮𝘆 𝘀𝗮𝗼 𝗺𝗮̀ 𝗹𝗶𝗲̂́𝗺 😏", attachment: fs.createReadStream(path) }, threadID, () => fs.unlinkSync(path), messageID));
    }
}

