module.exports.config = {
    name: "solo",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Kilo",
    description: "Thách đấu 1v1 so trình đấm nhau giật tiền cực bựa",
    commandCategory: "Trò Chơi",
    usages: "!solo @tag [tiền cược]",
    cooldowns: 10
};

module.exports.run = async function ({ api, event, args, Users, Currencies }) {
    const { threadID, senderID, messageID, mentions } = event;
    const botID = api.getCurrentUserID();

    const mentionIDs = Object.keys(mentions || {});
    if (mentionIDs.length === 0) {
        return api.sendMessage("🥊 Bạn phải tag một đối thủ vào để thách đấu 1v1 chứ! (Ví dụ: !solo @tên 5000)", threadID, messageID);
    }

    const opponentID = mentionIDs[0];
    const senderData = await Currencies.getData(senderID);
    const senderMoney = senderData.money || 0;

    let bet = parseInt(args[args.length - 1]);
    if (isNaN(bet) || bet <= 0) bet = 1000;

    if (senderMoney < bet) {
        return api.sendMessage(`💸 Bạn không đủ tiền để cá cược trận này! Số dư của bạn: ${senderMoney.toLocaleString()}$`, threadID, messageID);
    }

    const senderName = (await Users.getData(senderID)).name || "Chiến thần";
    const opponentName = mentions[opponentID].replace("@", "") || "Đối thủ";

    if (opponentID == botID) {
        return api.sendMessage(`🤖 [BOT PHẢN DÒNG]:\n\nBạn dám to gan thách đấu cả Bot à?!\nBot tung tuyệt chiêu: 『 BAN NICK BẤT DIỆT CUỚC 』 đấm bạn văng khỏi khí quyển Trái Đất!\n\n💸 Phạt nóng bạn ${bet.toLocaleString()}$ nộp vào ngân quỹ bảo trì!`, threadID, async () => {
            await Currencies.decreaseMoney(senderID, bet);
        }, messageID);
    }

    if (opponentID == senderID) {
        return api.sendMessage("🤦 Bạn bị đa nhân cách hay sao mà tự đấm chính mình thế?", threadID, messageID);
    }

    const opponentData = await Currencies.getData(opponentID);
    const opponentMoney = opponentData.money || 0;
    if (opponentMoney < bet) {
        return api.sendMessage(`⚠️ Đối thủ ${opponentName} quá nghèo (chỉ còn ${opponentMoney.toLocaleString()}$), không đủ ${bet.toLocaleString()}$ để nhận kèo đấm nhau!`, threadID, messageID);
    }

    const moves = [
        "tung một cú đá xoáy vào háng đối thủ làm đối phương thốn tận rốn",
        "rút dép tổ ong ném thẳng vào mồm đối thủ với vận tốc âm thanh",
        "dùng thế võ cắn trộm vào mông khiến đối phương la oai oái",
        "hét lớn tung chưởng làm đối thủ giật mình trượt chân ngã đập mặt xuống đất",
        "gọi hội anh em xách gậy ra trợ chiến nhưng bị công an phường giải tán",
        "thực hiện đòn quét trụ điêu luyện tiễn đối thủ đo ván",
        "đang định đấm thì đau bụng té re phải xin đối thủ dừng trận",
        "tung cú đấm móc hàm chuẩn chỉ phong cách Mike Tyson"
    ];

    const isSenderWin = Math.random() < 0.5;
    const winnerID = isSenderWin ? senderID : opponentID;
    const loserID = isSenderWin ? opponentID : senderID;
    const winnerName = isSenderWin ? senderName : opponentName;
    const loserName = isSenderWin ? opponentName : senderName;

    const round1 = moves[Math.floor(Math.random() * moves.length)];
    const round2 = moves[Math.floor(Math.random() * moves.length)];

    await Currencies.decreaseMoney(loserID, bet);
    await Currencies.increaseMoney(winnerID, bet);

    const msg = `⚔️ ───『 ĐẤM NHAU 1V1 TỔ DÂN PHỐ 』─── ⚔️\n\n` +
        `🥊 Đấu sĩ: ${senderName} 🆚 ${opponentName}\n` +
        `💰 Tiền cược kèo: ${bet.toLocaleString()}$\n\n` +
        `⚡ Diễn biến trận đấu:\n` +
        `▪️ Hiệp 1: ${senderName} ${round1}!\n` +
        `▪️ Hiệp 2: ${opponentName} phản công, ${round2}!\n\n` +
        `🏆 KẾT QUẢ CHUNG CUỘC:\n` +
        `🎉 ${winnerName} đã giành chiến thắng ngoạn mục, cướp đoạt trọn vẹn ${bet.toLocaleString()}$ của ${loserName}!\n` +
        `🚑 ${loserName} đang được chuyển viện cấp cứu bằng xe bò vì chấn thương vùng kín!`;

    const tagMentions = [
        { id: senderID, tag: senderName },
        { id: opponentID, tag: opponentName }
    ];

    return api.sendMessage({ body: msg, mentions: tagMentions }, threadID, messageID);
};
