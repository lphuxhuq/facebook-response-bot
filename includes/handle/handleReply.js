module.exports = function ({ api, models, Users, Threads, Currencies }) {
    return function ({ event }) {
        if (!event) return;
        if (event.senderID && String(event.senderID) === String(api.getCurrentUserID())) return;
        const { handleReply, commands } = global.client;
        const { messageID, threadID, messageReply, body } = event;
        if (!handleReply || handleReply.length === 0) return;

        // Chỉ xử lý reply nếu người dùng quote tin nhắn hoặc gõ trực tiếp một con số lựa chọn
        const isQuoting = Boolean(messageReply && (messageReply.messageID || messageReply.body));
        const isPureNumber = Boolean(body && /^\s*\d+\s*$/.test(body));
        if (!isQuoting && !isPureNumber) return;

        let indexOfHandle = -1;
        if (messageReply) {
            // 1. Khớp chính xác theo messageID nếu có
            if (messageReply.messageID) {
                indexOfHandle = handleReply.findIndex(e => e.messageID && String(e.messageID) === String(messageReply.messageID));
            }
            // 2. Khớp theo nội dung tin nhắn được quote (rất chính xác trên Facebook Messenger)
            if (indexOfHandle < 0 && messageReply.body) {
                const quoteLower = messageReply.body.toLowerCase();
                for (let i = handleReply.length - 1; i >= 0; i--) {
                    const item = handleReply[i];
                    if (item.threadID != threadID) continue;
                    // Nếu quote tin nhắn danh sách chuyên mục tổng (Menu chính):
                    if (item.type === "category_list" && (quoteLower.includes("danh sách lệnh hiện có") || quoteLower.includes("theo phân loại"))) {
                        indexOfHandle = i;
                        break;
                    }
                    // Nếu quote tin nhắn danh sách lệnh của một nhóm cụ thể (vd: » CÔNG CỤ «):
                    if (item.type === "cmd_info" && item.groupName) {
                        const groupTag = `» ${item.groupName.toLowerCase()} «`;
                        if (quoteLower.includes(groupTag) || quoteLower.includes(item.groupName.toLowerCase())) {
                            indexOfHandle = i;
                            break;
                        }
                    }
                }
            }
        }
        // 3. Fallback nếu không quote hoặc quote không tìm thấy: lấy reply mới nhất của nhóm
        if (indexOfHandle < 0) {
            for (let i = handleReply.length - 1; i >= 0; i--) {
                if (handleReply[i].threadID == threadID) {
                    indexOfHandle = i;
                    break;
                }
            }
        }
        if (indexOfHandle < 0) return;

        const indexOfMessage = handleReply[indexOfHandle];
        const handleNeedExec = commands.get(indexOfMessage.name);
        if (!handleNeedExec) return;

        try {
            var getText2;
            if (handleNeedExec.languages && typeof handleNeedExec.languages == 'object') 
                getText2 = (...value) => {
                const reply = handleNeedExec.languages || {};
                if (!reply.hasOwnProperty(global.config.language)) 
                    return api.sendMessage(global.getText('handleCommand', 'notFoundLanguage', handleNeedExec.config.name), threadID, messageID);
                var lang = handleNeedExec.languages[global.config.language][value[0]] || '';
                for (var i = value.length; i > -0x4 * 0x4db + 0x6d * 0x55 + -0x597 * 0x3; i--) {
                    const expReg = RegExp('%' + i, 'g');
                    lang = lang.replace(expReg, value[i]);
                }
                return lang;
            };
            else getText2 = () => {};
            const Obj = {};
            Obj.api = api;
            Obj.event = event;
            Obj.models = models;
            Obj.Users = Users;
            Obj.Threads = Threads;
            Obj.Currencies = Currencies;
            Obj.handleReply = indexOfMessage;
            Obj.getText = getText2;
            console.log(`[HANDLE REPLY]: Executing ${indexOfMessage.name} for thread ${threadID}`);
            handleNeedExec.handleReply(Obj);
            return;
        } catch (error) {
            console.error('[HANDLE REPLY ERROR]:', error);
            return api.sendMessage(global.getText('handleReply', 'executeError', error), threadID, messageID);
        }
    };
};