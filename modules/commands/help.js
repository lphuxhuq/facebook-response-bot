module.exports.config = {
  name: "help",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "Mirai Team",
  description: "Hướng dẫn xem danh sách lệnh của bot",
  commandCategory: "Trợ Giúp",
  usages: "[Tên lệnh / all / số trang]",
  cooldowns: 2,
  envConfig: {
    autoUnsend: false,
    delayUnsend: 60
  }
};

module.exports.run = function({ api, event, args }) {
  const { commands } = global.client;
  const { threadID, messageID } = event;
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const prefix = (threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : (global.config.PREFIX || "!");

  if (args[0] == "all") {
    const group = {};
    let allMsg = "";
    for (const [name, commandConfig] of commands) {
      const category = (commandConfig.config && commandConfig.config.commandCategory) ? commandConfig.config.commandCategory : "Khác";
      if (!group[category]) group[category] = [];
      group[category].push(name);
    }
    for (const cat in group) {
      allMsg += `🌸 ${cat.toUpperCase()} 🌸\n${group[cat].join(' • ')}\n\n`;
    }
    return api.sendMessage(
      `❤️ 𝐃𝐀𝐍𝐇 𝐒𝐀́𝐂𝐇 𝐓𝐎̂̉𝐍𝐆 𝐋𝐄̣̂𝐍𝐇 💜\n\n` + allMsg +
      `≻───── •❤️‍🔥• ─────≺\n` +
      `💓 Hiện tại có ${commands.size} lệnh có thể sử dụng!\n` +
      `🌟 Dùng: "${prefix}help + tên lệnh" để xem chi tiết cách dùng\n` +
      `💝 Bot chạy trên Railway`,
      threadID,
      messageID
    );
  }

  const command = commands.get((args[0] || "").toLowerCase());
  if (command && command.config) {
    const permText = (command.config.hasPermssion == 0) ? "Người dùng" : (command.config.hasPermssion == 1) ? "Quản trị viên nhóm" : "Quản trị viên BOT";
    return api.sendMessage(
      `╭───╮\n   ${command.config.name.toUpperCase()}\n╰───╯\n` +
      `» 📜 Mô tả: ${command.config.description || "Không có mô tả"}\n` +
      `» 💓 Cách dùng: ${prefix}${command.config.name} ${(command.config.usages) ? command.config.usages : ""}\n` +
      `» ⏱ Thời gian chờ: ${command.config.cooldowns || 1}s\n` +
      `» 🗂 Thuộc nhóm: ${command.config.commandCategory || "Khác"}\n` +
      `» 👥 Quyền hạn: ${permText}\n` +
      `» 👻 Tác giả: ${command.config.credits || "Ẩn danh"}`,
      threadID,
      messageID
    );
  }

  // Danh sách phân trang
  const commandsPush = [];
  const page = parseInt(args[0]) || 1;
  const pageView = 20;

  for (var [name, value] of commands) {
    if (value.config && value.config.name) {
      commandsPush.push(`» ${prefix}${value.config.name}: ${value.config.description || ""}`);
    }
  }

  const totalPage = Math.ceil(commandsPush.length / pageView) || 1;
  const safePage = Math.max(1, Math.min(page, totalPage));
  const first = (safePage - 1) * pageView;
  const helpView = commandsPush.slice(first, first + pageView);

  let msg = `🔱 𝐃𝐀𝐍𝐇 𝐒𝐀́𝐂𝐇 𝐋𝐄̣̂𝐍𝐇 (Trang ${safePage}/${totalPage}) 🔱\n\n`;
  msg += helpView.join('\n');
  msg += `\n\n≻───── •❤️‍🔥• ─────≺\n` +
    `💓 Tổng cộng: ${commandsPush.length} lệnh\n` +
    `🌟 Xem trang tiếp: ${prefix}help ${safePage + 1}\n` +
    `🌟 Xem chi tiết: ${prefix}help <tên lệnh>\n` +
    `🌟 Xem tất cả: ${prefix}help all`;

  return api.sendMessage(msg, threadID, messageID);
};
