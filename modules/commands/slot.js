module.exports.config = {
    name: "slot",
    version: "1.0.1",
    hasPermssion: 0,
    credits: "Mirai Team",
    description: "Đánh bạc bằng hình thức hoa quả",
    commandCategory: "Trò Chơi",
    usages: "[số coin cần đặt]",
    cooldowns: 5,
};

module.exports.languages = {
    "vi": {
        "missingInput": "[ SLOT ] Số tiền đặt cược không được để trống hoặc là số âm",
        "moneyBetNotEnough": "[ SLOT ] Số tiền bạn đặt lớn hơn hoặc bằng số dư của bạn!",
        "limitBet": "[ SLOT ] Số coin đặt không được dưới 50$!",
        "returnWin": "╭────────╮\nㅤ🎰 %1 | %2 | %3 🎰ㅤ💰💰💰\n╰────────╯\n𝐁𝐚̣𝐧 𝐯𝐮̛̀𝐚 𝐭𝐡𝐚̆́𝐧𝐠 𝐯𝐚̀ 𝐧𝐡𝐚̣̂𝐧 %4$ 💸",
        "returnLose": "╭────────╮\nㅤ🎰 %1 | %2 | %3 🎰ㅤ💰💰💰\n╰────────╯\n𝐁𝐚̣𝐧 𝐯𝐮̛̀𝐚 𝐭𝐡𝐮𝐚 𝐯𝐚̀ 𝐛𝐚𝐲 %4$ 💸"
    },
    "en": {
        "missingInput": "[ SLOT ] The bet money must not be blank or a negative number",
        "moneyBetNotEnough": "[ SLOT ] The money you betted is bigger than your balance!",
        "limitBet": "[ SLOT ] Your bet is too low, the minimum is 50$",
        "returnWin": "╭───╮\n🎰 %1 | %2 | %3 🎰\n╰───╯\nYou won with %4$",
        "returnLose": "╭───╮\n🎰 %1 | %2 | %3 🎰\n╰───╯\nYou lost and loss %4$"
    }
}

module.exports.run = async function({ api, event, args, Currencies, getText }) {
    const { threadID, messageID, senderID } = event;
    const { getData, increaseMoney, decreaseMoney } = Currencies;
    const slotItems = ["🍇", "🍉", "🍊", "🍏", "7⃣", "🍓", "🍒", "🍌", "🥝", "🥑", "🌽"];
    const moneyUser = (await getData(senderID)).money;

    var moneyBet = parseInt(args[0]);
    if (isNaN(moneyBet) || moneyBet <= 0) return api.sendMessage(getText("missingInput"), threadID, messageID);
	if (moneyBet > moneyUser) return api.sendMessage(getText("moneyBetNotEnough"), threadID, messageID);
	if (moneyBet < 50) return api.sendMessage(getText("limitBet"), threadID, messageID);
    var number = [], win = false;
    for (i = 0; i < 3; i++) number[i] = Math.floor(Math.random() * slotItems.length);
    if (number[0] == number[1] && number[1] == number[2]) {
        moneyBet *= 9;
        win = true;
    }
    else if (number[0] == number[1] || number[0] == number[2] || number[1] == number[2]) {
        moneyBet *= 2;
        win = true;
    }
    switch (win) {
        case true: {
            api.sendMessage(getText("returnWin", slotItems[number[0]], slotItems[number[1]], slotItems[number[2]], moneyBet), threadID, messageID);
            await increaseMoney(senderID, moneyBet);
            break;
        }
        case false: {
            api.sendMessage(getText("returnLose", slotItems[number[0]], slotItems[number[1]], slotItems[number[2]], moneyBet), threadID, messageID);
            await decreaseMoney(senderID, moneyBet);
            break;
        }
    }
}