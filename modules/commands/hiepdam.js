module.exports.config = {
	name: "hiepdam",
	version: "1.0.1",
	hasPermssion: 0,
	credits: "DinhPhuc",
	description: "Hiếp Dâm",
	commandCategory: "Lệnh 18+",
	usages: "Tag",
	cooldowns: 5,
	dependencies: {
	  "fs-extra": "",
	  "axios": "",
	  "canvas" :"",
	  "jimp": "",
	  "node-superfetch": ""
	}
};

module.exports.circle = async (image) => {
	  const jimp = global.nodemodule['jimp'];
  	image = await jimp.read(image);
  	image.circle();
  	return await image.getBufferAsync("image/png");
};

module.exports.run = async ({ event, api, args, Users }) => {
try {
  const Canvas = global.nodemodule['canvas'];
  const request = global.nodemodule["node-superfetch"];
  const jimp = global.nodemodule["jimp"];
  const fs = global.nodemodule["fs-extra"];
  var path_hiepdam = __dirname + "/cache/" + ((typeof event !== 'undefined' && event) ? (event._tempId || (event._tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 6))) : Date.now()) + "_hiepdam.png"; 
  var id = Object.keys(event.mentions)[0] || event.senderID;
  const canvas = Canvas.createCanvas(500, 500);
	const ctx = canvas.getContext('2d');
	const background = await Canvas.loadImage('https://i.imgur.com/VrkcjC7.jpg');
  
	var avatar = await request.get(`https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
	avatar = await this.circle(avatar.body);
	ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
	ctx.drawImage(await Canvas.loadImage(avatar), 88, 50, 95, 95);
	const imageBuffer = canvas.toBuffer();
	fs.writeFileSync(path_hiepdam,imageBuffer);
	 api.sendMessage({attachment: fs.createReadStream(path_hiepdam, {'highWaterMark': 128 * 1024}), body: "𝗦𝘂̛𝗼̛́𝗻𝗴 𝗾𝘂𝗮́ 𝗮𝗵 𝗮𝗵 𝗮𝗵..."}, event.threadID, () => fs.unlinkSync(path_toilet), event.messageID);
}
catch(e) {api.sendMessage(e.stack, event.threadID )}
}