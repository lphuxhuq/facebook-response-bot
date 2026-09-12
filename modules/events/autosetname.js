module.exports.config = {
	name: "autosetname",
	eventType: ["log:subscribe"],
	version: "1.0.3",
	credits: "D-Jukie",
	description: "Tự động set biệt danh thành viên mới"
};

module.exports.run = async function({ api, event, Users }) {
    const fs = require("fs-extra");
    const path = require("path");
    const { threadID } = event;
    if (!event.logMessageData || !Array.isArray(event.logMessageData.addedParticipants)) return;
    const pathData = path.resolve(__dirname, "../../modules/commands/cache/autosetname.json");
    if (!fs.existsSync(pathData)) return;
    let dataJson = [];
    try {
        dataJson = JSON.parse(fs.readFileSync(pathData, "utf-8"));
    } catch (e) {
        return;
    }
    const thisThread = dataJson.find(item => item && item.threadID == threadID);
    if (!thisThread || !Array.isArray(thisThread.nameUser) || thisThread.nameUser.length === 0) return;
    const setName = thisThread.nameUser[0];

    const memJoin = event.logMessageData.addedParticipants.map(info => info.userFbId);
    let changed = false;
    for (const idUser of memJoin) {
        if (idUser == api.getCurrentUserID()) continue;
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const namee1 = await api.getUserInfo(idUser);
            const namee = (namee1 && namee1[idUser]) ? namee1[idUser].name : "";
            await api.changeNickname(`${setName} ${namee}`.trim(), threadID, idUser);
            changed = true;
        } catch (err) {}
    }
    if (changed) {
        return api.sendMessage(`Đã set biệt danh tạm thời cho thành viên mới`, threadID, event.messageID);
    }
}