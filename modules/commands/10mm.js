module.exports.config = {
  name: "10mm",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "BLACK",
  description: "lấy mail ở 10mm thôi",
  commandCategory: "Công Cụ",
  usages: "",
  cooldowns: 2,
  dependencies: {"axios" : ""}
};
module.exports.run = async({api, event, args}) => {
	const axios = require('axios');
	if (args[0] == "new") {
		const res = await axios.get(`https://10minutemail.net/address.api.php?new=1`);
	var user = res.data.mail_get_user;
	var host = res.data.mail_get_host;
	var time = res.data.mail_get_time;
	var stime = res.data.mail_server_time;
	var kmail = res.data.mail_get_key;
	var ltime = res.data.mail_left_time;
	var mid = res.data.mail_list[0].mail_id;
var sub = res.data.mail_list[0].subject;
var date = res.data.mail_list[0].datetime2;
	return api.sendMessage(`» Tên mail: ${user}\n» Host: ${host}\n» Mail ${user}@${host} (.)com\n» Thời gian: ${time}\n» Thời gian ở server: ${stime}\n» Key: ${kmail}\n» Thời gian còn lại: ${ltime}s\n» Mail id: ${mid}\n» Nội dung ${sub}\n» Date: ${date}`, event.threadID, event.messageID)
}
else if (args[0] == "more") {
 const res = await axios.get(`https://10minutemail.net/address.api.php?more=1`);
	var user = res.data.mail_get_user;
	var host = res.data.mail_get_host;
	var time = res.data.mail_get_time;
	var stime = res.data.mail_server_time;
	var kmail = res.data.mail_get_key;
	var ltime = res.data.mail_left_time;
	var mid = res.data.mail_list[0].mail_id;
var sub = res.data.mail_list[0].subject;
var date = res.data.mail_list[0].datetime2;
	return api.sendMessage(`» 𝐓𝐞̂𝐧 𝐦𝐚𝐢𝐥: ${user}\n» 𝐇𝐨𝐬𝐭: ${host}\n» 𝐌𝐚𝐢𝐥 ${user}@${host} (.)com\n» 𝐓𝐡𝐨̛̀𝐢 𝐠𝐢𝐚𝐧: ${time}\n» 𝐓𝐡𝐨̛̀𝐢 𝐠𝐢𝐚𝐧 𝐨̛̉ 𝐬𝐞𝐫𝐯𝐞𝐫: ${stime}\n» Key: ${kmail}\n» 𝐓𝐡𝐨̛̀𝐢 𝐠𝐢𝐚𝐧 𝐜𝐨̀𝐧 𝐥𝐚̣𝐢: ${ltime}s\n» 𝐌𝐚𝐢𝐥 𝐢𝐝: ${mid}\n» 𝐍𝐨̣̂𝐢 𝐝𝐮𝐧𝐠 ${sub}\n» Date: ${date}`, event.threadID, event.messageID)
}
else if (args[0] == "get") {
	 var get = await  axios.get(`https://10minutemail.net/address.api.php`)
      var data = get.data
      var mail = data.mail_get_mail,
        id = data.session_id,
        url = data.permalink.url,
        key_mail = data.permalink.key
      let urlMail = url.replace(/\./g,' . ')
      let maill = mail.replace(/\./g,' . ')
      return api.sendMessage(`» 𝐄𝐦𝐚𝐢𝐥: ${maill}\n» 𝐈𝐃 𝐌𝐚𝐢𝐥: ${id}\n» 𝐔𝐫𝐥 𝐌𝐚𝐢𝐥: ${urlMail}\n» 𝐊𝐞𝐲 𝐌𝐚𝐢l: ${key_mail}`, event.threadID, event.messageID)}
else if (args[0] == "check") {
	var get = await  axios.get(`https://10minutemail.net/address.api.php`)
      var data = get.data.mail_list[0]
      var email = get.data.mail_get_mail
      var id = data.mail_id,
        from = data.from,
        subject = data.subject,
        time = data.datetime2
      let formMail = from.replace(/\./g,' . ')
      let maill = email.replace(/\./g,' . ')
      return api.sendMessage(`» 𝐄𝐦𝐚𝐢𝐥: ${maill}\n» 𝐈𝐃 𝐌𝐚𝐢𝐥: ${id}\n» 𝐅𝐫𝐨𝐦: ${formMail}\n» 𝐓𝐢𝐞̂𝐮 đ𝐞̂̀: ${subject}\n» ${time}`, event.threadID, event.messageID)}
else if (args.join() == "") { 
	  return api.sendMessage(`𝐍𝐄𝐖 - 𝐓𝐚̣𝐨 𝐦𝐚𝐢𝐥 𝐦𝐨̛́𝐢 \n
𝐂𝐇𝐄𝐂𝐊 - 𝐂𝐡𝐞𝐜𝐤 𝐡𝐨̣̂𝐩 𝐭𝐡𝐮̛ đ𝐞̂́𝐧 \n
𝐆𝐄𝐓 - 𝐋𝐚̂́𝐲 𝐦𝐚𝐢𝐥 𝐡𝐢𝐞̣̂𝐧 𝐭𝐚̣𝐢 \n
𝐋𝐈𝐒𝐓 - 𝐗𝐞𝐦 𝐥𝐢𝐬𝐭 𝐦𝐚𝐢𝐥 \n
𝐌𝐎𝐑𝐄 - 𝐓𝐡𝐞̂𝐦 𝐦𝐚𝐢𝐥 𝐦𝐨̛́𝐢 \n
-------------------------\n\n
𝐁𝐚̣𝐧 𝐜𝐨́ 𝐭𝐡𝐞̂̉ 𝐜𝐥𝐢𝐜𝐤 𝐯𝐚̀𝐨 𝐮𝐫𝐥 𝐦𝐚𝐢𝐥 𝐯𝐚̀ 𝐧𝐡𝐚̣̂𝐩 𝐊𝐞𝐲 𝐌𝐚𝐢𝐥 đ𝐞̂̉ 𝐱𝐞𝐦 𝐧𝐨̣̂𝐢 𝐝𝐮𝐧𝐠 𝐦𝐚𝐢𝐥. `, event.threadID, event.messageID)} 
    }