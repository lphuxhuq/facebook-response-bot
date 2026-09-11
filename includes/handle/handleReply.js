module.exports = function ({ api, models, Users, Threads, Currencies }) {
    return function ({ event }) {
        const { handleReply, commands } = global.client;
        const { messageID, threadID, messageReply } = event;
        if (!handleReply || handleReply.length === 0) return;

        let indexOfHandle = -1;
        if (messageReply && messageReply.messageID) {
            indexOfHandle = handleReply.findIndex(e => e.messageID == messageReply.messageID);
        }
        // Fallback: nếu không khớp messageID trực tiếp hoặc người dùng không quote, lấy reply gần nhất của nhóm
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