module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const ENTRY_TTL = 7 * 24 * 60 * 60 * 1000;
    const MAX_ENTRIES = 2000;
    return function ({ event }) {
        const { handleReaction, commands } = global.client;
        if (!handleReaction || handleReaction.length === 0) return;
        const { messageID, threadID } = event;

        const nowTs = Date.now();
        for (let i = handleReaction.length - 1; i >= 0; i--) {
            const item = handleReaction[i];
            if (!item._registeredAt) item._registeredAt = nowTs;
            if (nowTs - item._registeredAt > ENTRY_TTL) handleReaction.splice(i, 1);
        }
        if (handleReaction.length > MAX_ENTRIES) handleReaction.splice(0, handleReaction.length - MAX_ENTRIES);

        const indexOfHandle = handleReaction.findIndex(e => e.messageID == messageID);
        if (indexOfHandle < 0) return;
        const indexOfMessage = handleReaction[indexOfHandle];
        const handleNeedExec = commands.get(indexOfMessage.name);

        if (!handleNeedExec) return api.sendMessage(global.getText('handleReaction', 'missingValue'), threadID, messageID);
        try {
            var getText2;
            if (handleNeedExec.languages && typeof handleNeedExec.languages == 'object') 
            	getText2 = (...value) => {
                const react = handleNeedExec.languages || {};
                if (!react.hasOwnProperty(global.config.language)) 
                	return api.sendMessage(global.getText('handleCommand', 'notFoundLanguage', handleNeedExec.config.name), threadID, messageID);
                var lang = handleNeedExec.languages[global.config.language][value[0]] || '';
                for (var i = value.length; i > 0x2 * -0xb7d + 0x2111 * 0x1 + -0xa17; i--) {
                    const expReg = RegExp('%' + i, 'g');
                    lang = lang.replace(expReg, value[i]);
                }
                return lang;
            };
            else getText2 = () => {};
            const Obj = {};
            Obj.api= api 
            Obj.event = event 
            Obj.models = models
            Obj.Users = Users
            Obj.Threads = Threads
            Obj.Currencies = Currencies
            Obj.handleReaction = indexOfMessage
            Obj.getText = getText2
            if (typeof handleNeedExec.handleReaction === 'function') {
                handleNeedExec.handleReaction(Obj);
            }
            return;
        } catch (error) {
            return api.sendMessage(global.getText('handleReaction', 'executeError', error), threadID, messageID);
        }
    };
};