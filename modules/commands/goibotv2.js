const fs = require("fs-extra");
module.exports.config = {
  name: "goibot2",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "JRT",
  description: "goibot",
  commandCategory: "Không xài lệnh",
  usages: "noprefix",
  cooldowns: 5,
};
module.exports.handleEvent = function({ api, event }) {
  if (!event || !event.body) return;
  var { threadID, messageID } = event;


  if ((event.body.toLowerCase() == "bot out")) {
    return api.sendMessage("Tạm biệt mng ><", threadID, () =>
      api.removeUserFromGroup(api.getCurrentUserID(), threadID));
  };

   if ((event.body.toLowerCase() == "bot cút")) {
    return api.sendMessage("em đuổi anh đấy à, vậy thôi...anh sẽ cút cho em vừa lòng☺️", threadID, () =>
      api.removeUserFromGroup(api.getCurrentUserID(), threadID));
  };

  if ((event.body.toLowerCase() == "bot lon")) {
    return api.sendMessage("🔔Thành viên đã cố ý chửi bot, do đó đã vi phạm luật bot nên bot sẽ out và muốn add lại thì xin liên hệ qua admin qua Fb:  để được hỗ trợ\nLink fb nè: https://www.facebook.com/nguyenthanhmai.info1", threadID, () =>
      api.removeUserFromGroup(api.getCurrentUserID(), threadID));
  };

  if ((event.body.toLowerCase() == "bot óc chó")) {
    return api.sendMessage("🔔Thành viên đã cố ý chửi bot, do đó đã vi phạm luật bot nên bot sẽ out và muốn add lại thì xin liên hệ qua admin qua Fb: BLACKBLACK để được hỗ trợ\nLink fb nè: https://www.facebook.com/nguyenthanhmai.info1", threadID, () =>
      api.removeUserFromGroup(api.getCurrentUserID(), threadID));
  };
  
  if ((event.body.toLowerCase() == "bot chó") || (event.body.toLowerCase() == "bot chó")) {
    return api.sendMessage("ẳng ẳng, vừa lòng mày chưa 😔", threadID);
  };

  if ((event.body.toLowerCase() == "ôi") || (event.body.toLowerCase() == "oi")) {
    return api.sendMessage("ôi gì thế? cháy nhà hả em", threadID);
  };

  if ((event.body.toLowerCase() == "ối") || (event.body.toLowerCase() == "ối")) {
    return api.sendMessage("Ối gì thế? cháy nhà hả em", threadID);
  };

  if ((event.body.toLowerCase() == "ơi") || (event.body.toLowerCase() == "oi")) {
    return api.sendMessage("Ngoan đấy tặng cậu nụ hôn. Moaahh:>", threadID);
  };

  if ((event.body.toLowerCase() == "ừ") || (event.body.toLowerCase() == "u")) {
    return api.sendMessage("dạ chứ ai cho ừ:>", threadID);
  };

  if ((event.body.toLowerCase() == "ừa") || (event.body.toLowerCase() == "ua")) {
    return api.sendMessage("dạ đi cho lịch sử tí bae", threadID);
  };

  if ((event.body.toLowerCase() == "uk") || (event.body.toLowerCase() == "uk")) {
    return api.sendMessage("dạ đi cho lịch sử tí bae", threadID);
  };

  if ((event.body.toLowerCase() == "dạ") || (event.body.toLowerCase() == "da")) {
    return api.sendMessage("Em ngoan đấy xứng đáng có được chủ bot của anh :>", threadID);
  };

  if ((event.body.toLowerCase() == "yêu") || (event.body.toLowerCase() == "yeu")) {
    return api.sendMessage("Yêu cc, tiền, xe, nhà thì đéo có mà yêu với đương, lo học hành và đi làm kiếm tiền đê yêu sau", threadID);
  };

  if ((event.body.toLowerCase() == "đmm") || (event.body.toLowerCase() == "dm")) {
    return api.sendMessage("sao lại chửi nhau thế kia, phải yêu thương nhau chứ", threadID);
  };

  if ((event.body.toLowerCase() == "đmm bot") || (event.body.toLowerCase() == "dmm bot")) {
    return api.sendMessage("sao em lại chửi bot🥺", threadID);
  };

  if ((event.body.toLowerCase() == "há há") || (event.body.toLowerCase() == "há há")) {
    return api.sendMessage("cười dọc à em ;:))", threadID);
  };

  if ((event.body.toLowerCase() == "cmm bot") || (event.body.toLowerCase() == "cmm bot")) {
    return api.sendMessage("bot có làm gì âu mà sao em lại chửi bot🥺", threadID);
  };

  if ((event.body.toLowerCase() == "địt") || (event.body.toLowerCase() == "dit")) {
    return api.sendMessage("nói chuyện văn minh tý đê em ơiiii :)", threadID);
  };

  if ((event.body.toLowerCase() == "uk") || (event.body.toLowerCase() == "uk")) {
    return api.sendMessage("okkk", threadID);
  };

  if ((event.body.toLowerCase() == ":))") || (event.body.toLowerCase() == ":))")) {
    return api.sendMessage("cười dọc ak em:>>", threadID);
  };

  if ((event.body.toLowerCase() == "=))") || (event.body.toLowerCase() == "=))")) {
    return api.sendMessage(": )", threadID);
  };

  if ((event.body.toLowerCase() == "._.") || (event.body.toLowerCase() == "._.")) {
    return api.sendMessage("(￣▽￣)", threadID);
  };

  if ((event.body.toLowerCase() == ";-;") || (event.body.toLowerCase() == ";-;")) {
    return api.sendMessage(".--.", threadID);
  };

  if ((event.body.toLowerCase() == "=)))") || (event.body.toLowerCase() == "=)))")) {
    return api.sendMessage("(￣^￣)", threadID);
  };

  if ((event.body.toLowerCase() == "bot ơi") ||  (event.body.toLowerCase() == "bot ơi")) {
    return api.sendMessage("Anh bận lắm có gì ib admin anh đi :3", threadID);
  };

  if ((event.body.toLowerCase() == "yêu bot") || (event.body.toLowerCase() == "yeu bot")) {
    return api.sendMessage("Hmm... Bot ngại lắm bot cũng yêu em moazzzz :3", threadID);
  };

   if ((event.body.toLowerCase() == "yêu anh") || (event.body.toLowerCase() == "yeu anh")) {
    return api.sendMessage("Anh cũng yêu em <3", threadID);
  };

  if ((event.body.toLowerCase() == "chào cậu") || (event.body.toLowerCase() == "chao cau")) {
    return api.sendMessage("Hí chào em 💙", threadID);
  };

  if ((event.body.toLowerCase() == "chửi cc") || (event.body.toLowerCase() == "chui cc")) {
    return api.sendMessage("️Lo mà học đi em chửi gì tầm này :)", threadID);
  };

  if ((event.body.toLowerCase() == "hentai") || (event.body.toLowerCase() == "hentai")) {
    return api.sendMessage("Hả 😋, anh thích coi lắm", threadID);
  };

  if ((event.body.toLowerCase() == "cc cút") || (event.body.toLowerCase() == "cc cút")) {
    return api.sendMessage("em đuổi anh cút 🥺?", threadID);
  };

  if ((event.body.toLowerCase() == "vãi") || (event.body.toLowerCase() == "vai")) {
    return api.sendMessage("vãi, nhãn, nho, chôm chôm gì ở đây thế em", threadID);
  };

  if ((event.body.toLowerCase() == "link") || (event.body.toLowerCase() == "link")) {
    return api.sendMessage("Link bao nhiêu phút á cho a xem với nào 🤤", threadID);
  };

  if ((event.body.toLowerCase() == "cứu") || (event.body.toLowerCase() == "cuu")) {
    return api.sendMessage("Cúu cc ngu thì chết khôn thì sống cô chủ bảo tao thế <3", threadID);
  };

  if ((event.body.toLowerCase() == ":<") || (event.body.toLowerCase() == ":<")) {
    return api.sendMessage(":>", threadID);
  };

  if ((event.body.toLowerCase() == "...") || (event.body.toLowerCase() == "....")) {
    return api.sendMessage("hmmmmm...hmmmm.hmmmm", threadID);
  };

  if ((event.body.toLowerCase() == "MàiMài") || (event.body.toLowerCase() == "Mài")) {
    return api.sendMessage("🐳Sao? Nhắc Tên Chủ Tao Có Việc Gì ?🐸","Ai Nhắc Tên Chủ Tao Á 🐸", "Chủ Tao Là Số 1 OK 🍀💗", threadID);
  };

  if ((event.body.toLowerCase() == "kaka") || (event.body.toLowerCase() == "kakaaa")) {
    return api.sendMessage("cười kiểu gì đấy em -.-", threadID);
  };  

  if ((event.body.toLowerCase() == "hát đi mng") || (event.body.toLowerCase() == "hat di mng")) {
    return api.sendMessage("Thôi để bot hát trước cho dzo alaba trap zo, Walking in the Sun in around and around\nI can believe love at is a round\nWalking in the Sun in around and around and around\nLook at try for me......<3", threadID);
  };

  if ((event.body.toLowerCase() == "hát đi") || (event.body.toLowerCase() == "hat di")) {
    return api.sendMessage("Thôi để bot hát trước cho dzo alaba trap zo, Walking in the Sun in around and around\nI can believe love at is a round\nWalking in the Sun in around and around and around\nLook at try for me......<3", threadID);
  };  

  if ((event.body.toLowerCase() == "-.-") || (event.body.toLowerCase() == "-.-")) {
    return api.sendMessage(":>", threadID);
  };

  if ((event.body.toLowerCase() == "hát đi nào") || (event.body.toLowerCase() == "hát đi nào")) {
    return api.sendMessage("Thôi để bot hát trước cho dzo alaba trap zo, Walking in the Sun in around and around\nI can believe love at is a round\nWalking in the Sun in around and around and around\nLook at try for me......<3", threadID);
  };

  if ((event.body.toLowerCase() == "hát đi bot") || (event.body.toLowerCase() == "hat di bot")) {
    return api.sendMessage("Thôi để bot hát trước cho dzo alaba trap zo, Walking in the Sun in around and around\nI can believe love at is a round\nWalking in the Sun in around and around and around\nLook at try for me......<3", threadID);
  };

  if ((event.body.toLowerCase() == "vcl") || (event.body.toLowerCase() == "vcl")) {
    return api.sendMessage("️sủa cc gì đấy thằng nhóc :>", threadID);
  };

  if ((event.body.toLowerCase() == "tt đi nào mng") || (event.body.toLowerCase() == "tt di nao mng")) {
    return api.sendMessage("️1 là tương tác, 2 là ăn kick, 3 là ăn đấm, 4 là ăng nhăng nhăng nhăng :))))", threadID);
  };

  if ((event.body.toLowerCase() == "tt mng ơi") || (event.body.toLowerCase() == "tt mng oi")) {
    return api.sendMessage("️1 là tương tác, 2 là ăn kick, 3 là ăn đấm, 4 là ăng nhăng nhăng nhăng :))))", threadID);
  };

  if ((event.body.toLowerCase() == "nn nha mng") || (event.body.toLowerCase() == "nn nha mng")) {
    return api.sendMessage("️Ngủ ngon 💙 Chúc mọi người mơ siêu đẹp 💙", threadID);
  };

  if ((event.body.toLowerCase() == "admin m là ai v bot") || (event.body.toLowerCase() == "admin m la ai v bot")) {
    return api.sendMessage("️Admin tớ tên Granger có gì dùng lệnh ?adbot admin để biết thêm chi tiết", threadID);
  };

  if ((event.body.toLowerCase() == "admin m là ai vậy bot") || (event.body.toLowerCase() == "admin m la ai vậy bot")) {
    return api.sendMessage("️Admin tớ Tên Granger có gì dùng lệnh ?adbot admin để biết thêm chi tiết", threadID);
  };

  if ((event.body.toLowerCase() == "tt đi mn") || (event.body.toLowerCase() == "tt đi mn")) {
    return api.sendMessage("️1 là tương tác, 2 là ăn kick, 3 là ăn đấm, 4 là ăng nhăng nhăng nhăng :))))", threadID);
  };

  if ((event.body.toLowerCase() == "flop quá") || (event.body.toLowerCase() == "flop qua")) {
    return api.sendMessage("️1 là tương tác, 2 là ăn kick, 3 là ăn đấm, 4 là ăng nhăng nhăng nhăng :))))", threadID);
  };

  if ((event.body.toLowerCase() == "🐸🚬") || (event.body.toLowerCase() == "🐸🚬")) {
    return api.sendMessage("️ộp ộp 🚬🐸", threadID);
  };

  if ((event.body.toLowerCase() == "🚬🐸") || (event.body.toLowerCase() == "🚬🐸")) {
    return api.sendMessage("️ộp ộp 🚬🐸", threadID);
  };

  if ((event.body.toLowerCase() == "🐸") || (event.body.toLowerCase() == "🐸")) {
    return api.sendMessage("️ộp ộp 🚬🐸", threadID);
  };

  if ((event.body.toLowerCase() == "con cac") || (event.body.toLowerCase() == "con cac")) {
    return api.sendMessage("️tục quá cậu", threadID);
  };

  if ((event.body.toLowerCase() == "cai lon") || (event.body.toLowerCase() == "cai lon")) {
    return api.sendMessage("️tục quá cậu", threadID);
  };

  if ((event.body.toLowerCase() == "clozz") || (event.body.toLowerCase() == "clozz")) {
    return api.sendMessage("️tục quá cậu :<", threadID);
  };

  if ((event.body.toLowerCase() == "clmm bot") || (event.body.toLowerCase() == "clmm bot")) {
    return api.sendMessage("️em chửi anh đấy à? anh dỗi đấy", threadID);
  };

  if ((event.body.toLowerCase() == "bot cc") || (event.body.toLowerCase() == "bot cc")) {
    return api.sendMessage("️sao em lại chửi anh :<", threadID);
  };

  if ((event.body.toLowerCase() == "cc bot") || (event.body.toLowerCase() == "cc bot")) {
    return api.sendMessage("️sao em lại chửi anh:<", threadID);
  };

  if ((event.body.toLowerCase() == "cặc") || (event.body.toLowerCase() == "cặc")) {
    return api.sendMessage("️văn minh lên tí đi cậu, tớ hong thích tục tiễu", threadID);
  };

  if ((event.body.toLowerCase() == "@Guision") || (event.body.toLowerCase() == "@Guision")) {
    return api.sendMessage("️cậu tag admin tớ có việc gì hong :>","admin tớ bận rồi ạ :3","admim tớ ngủ rồi đừng tag nữa","Dzạ admin bot bận rồi có bot đây được hemm :>",threadID);
  };

  if ((event.body.toLowerCase() == "Mài") || (event.body.toLowerCase() == "MàiMài")) {
    return api.sendMessage("I only fight for myself, no one else.", threadID);
  };

  if ((event.body.toLowerCase() == "Ê") || (event.body.toLowerCase() == "ê")) {
    return api.sendMessage("️anh đây, có việc gì không em", threadID);
  };

  if ((event.body.toLowerCase() == "êyy") || (event.body.toLowerCase() == "eyyy")) {
    return api.sendMessage("️anh đây, có việc gì không em", threadID);
  };

  if ((event.body.toLowerCase() == "bot dthw quá") || (event.body.toLowerCase() == "bot dthw qua")) {
    return api.sendMessage("️ quá khen hihi :>", threadID);
  };

  if ((event.body.toLowerCase() == "haha") || (event.body.toLowerCase() == "haha")) {
    return api.sendMessage("️dui quá haha (￣^￣)", threadID);
  };

  if ((event.body.toLowerCase() == "kkk") || (event.body.toLowerCase() == "kkk")) {
    return api.sendMessage("️dui quá kkk (￣▽￣)", threadID);
  };

  if ((event.body.toLowerCase() == "con cặc") || (event.body.toLowerCase() == "con cặc")) {
    return api.sendMessage("️cậu tục tiễu quá nha", threadID);
  };

  if ((event.body.toLowerCase() == "cái lồn") || (event.body.toLowerCase() == "cai lon")) {
    return api.sendMessage("️cậu tục tiễu quá", threadID);
  };

  if ((event.body.toLowerCase() == "lồn") || (event.body.toLowerCase() == "lồn")) {
    return api.sendMessage("️cậu tục tiễu quá", threadID);
  };

  if ((event.body.toLowerCase() == "đm") || (event.body.toLowerCase() == "dm")) {
    return api.sendMessage("️văn minh lên đi cậu ơi", threadID);
  };

  if ((event.body.toLowerCase() == "đm bot") || (event.body.toLowerCase() == "dm bot")) {
    return api.sendMessage("️sao em lại chửi anh:< anh có làm cái gì âu", threadID);
  };

  if ((event.body.toLowerCase() == "lozz") || (event.body.toLowerCase() == "lozz")) {
    return api.sendMessage("️tục tiễu quá cậu", threadID);
  };

  if ((event.body.toLowerCase() == "clmm") || (event.body.toLowerCase() == "clmm")) {
    return api.sendMessage("️đừng chửi thề nữa cậu, văn minh lên đi:>", threadID);
  };

  if ((event.body.toLowerCase() == "ko ai thương t hết") || (event.body.toLowerCase() == "ko ai thuong t het")) {
    return api.sendMessage("️Thôi ngoan nào bot thương em mà 💙 ", threadID);
  };

  if ((event.body.toLowerCase() == "bot có yêu em không") || (event.body.toLowerCase() == "bot yeu em khong")) {
    return api.sendMessage("Hi, không nka", threadID);
  };

  if ((event.body.toLowerCase() == "bot có yêu admin bot không") || (event.body.toLowerCase() == "bot co yeu admin bot khong")) {
    return api.sendMessage("Có, yêu admin ấy nhất đừng hòng cướp của anh", threadID);
  };

  if ((event.body.toLowerCase() == "bot có người yêu chưa") || (event.body.toLowerCase() == "bot co nguoi yeu chua")) {
    return api.sendMessage("Rồi, là admin đấy <3", threadID);
  };

  if ((event.body.toLowerCase() == "bot im đi") || (event.body.toLowerCase() == "bot im di")) {
    return api.sendMessage("Sao em bắt anh im :<", threadID);
  };

  if ((event.body.toLowerCase() == "bot cút đi") || (event.body.toLowerCase() == "bot cut di")) {
    return api.sendMessage("sao em lại đuổi anh :<", threadID);
  };

  if ((event.body.toLowerCase() == "bot chửi cái lon gì") || (event.body.toLowerCase() == "bot chui cai lon gi")) {
    return api.sendMessage("Chửi mày đấy, nhục vãi hahaha :>>, còn hỏi", threadID);
  };

  if ((event.body.toLowerCase() == "bot có buồn ko") || (event.body.toLowerCase() == "bot co buon ko")) {
    return api.sendMessage("Có mọi người sao anh buồn đc 💙 yêu lắm 💙", threadID);
  };

  if ((event.body.toLowerCase() == "bot có yêu t ko") || (event.body.toLowerCase() == "bot co yeu t ko")) {
    return api.sendMessage("có yêu em và mọi người nhiều lắm", threadID);
  };

  if ((event.body.toLowerCase() == "bot đi ngủ đi") || (event.body.toLowerCase() == "bot di ngu di")) {
    return api.sendMessage("Anh là bot, em là người nên cần đi ngủ nè 💙", threadID);
  };

  if ((event.body.toLowerCase() == "bot ăn cơm chưa") || (event.body.toLowerCase() == "bot an com chua")) {
    return api.sendMessage("Anh nhìn em ăn là thấy no rồi 💙", threadID);
  };

  if ((event.body.toLowerCase() == "bot có thương tui ko") || (event.body.toLowerCase() == "bot co thuong tui ko")) {
    return api.sendMessage("Có 💙", threadID);
  };

  if ((event.body.toLowerCase() == "bot có thương t ko") || (event.body.toLowerCase() == "bot co thuong t ko")) {
    return api.sendMessage("Có 💙", threadID);
  };

  if ((event.body.toLowerCase() == "Sủa lẹ") || (event.body.toLowerCase() == "sủa lẹ")) {
    return api.sendMessage("Lớn hết rồi văn minh tý đi cậu êyyyyy", threadID);
  };

  if ((event.body.toLowerCase() == "bot làm thơ đi") ||  (event.body.toLowerCase() == "bot lam tho di")) {
    return api.sendMessage("Yêu cậu như một cực hình\nNhấp lên nhấp xuống hai mình cùng rên", threadID);
  };

  if ((event.body.toLowerCase() == "clmm bot lon") ||  (event.body.toLowerCase() == "clmm bot lon")) {
    return api.sendMessage("bạn chửi gì đấy nói rõ lên mình nghe lại xem nào :))", threadID);
  };

  if ((event.body.toLowerCase() == "cc") ||  (event.body.toLowerCase() == "cc")) {
    return api.sendMessage("gì cơ? Ai là cục cưng của cậu vậy:>", threadID);
  };

  if ((event.body.toLowerCase() == "bot yêu em không") ||  (event.body.toLowerCase() == "bot yeu em khong")) {
    return api.sendMessage("Bot không biết yêu hãy yêu admin Bot :>", threadID);
  };

  if ((event.body.toLowerCase() == "bot yêu em khum") ||  (event.body.toLowerCase() == "bot yêu em ko")) {
    return api.sendMessage("Bot không biết yêu hãy yêu admin Bot :>", threadID);
  };

  if ((event.body.toLowerCase() == "bot yêu em k") ||  (event.body.toLowerCase() == "bot yeu em k")) {
    return api.sendMessage("Bot không biết yêu hãy yêu admin Bot :>", threadID);
  };

  if ((event.body.toLowerCase() == "bot iu em k") ||  (event.body.toLowerCase() == "bot iu em ko")) {
    return api.sendMessage("Bot không biết yêu hãy yêu admin Bot :>", threadID);
  };

  if ((event.body.toLowerCase() == "bot iu bé khum") ||  (event.body.toLowerCase() == "bot iu bé không")) {
    return api.sendMessage("Bot không biết yêu hãy yêu admin Bot :>", threadID);
  };

  if ((event.body.toLowerCase() == "bot iu bé k") ||  (event.body.toLowerCase() == "bot iu bé ko")) {
    return api.sendMessage("Bot không biết yêu hãy yêu admin Bot :>", threadID);
  };

  if ((event.body.toLowerCase() == "ny admin bot là ai vậy") || (event.body.toLowerCase() == "ny admin bot la ai vay")) {
    return api.sendMessage("là chị Nhii cute nhất hệ mặt trời uwu", threadID);
  };
  
    if ((event.body.toLowerCase() == "cắt cho cháu quả đầu tomi xiaomi") || (event.body.toLowerCase() == "cat cho chau qua dau tom xiaomi")) {
    return api.sendMessage("Xong rồi! dậy đi ông cháu ơi.", threadID);
  };
  
  if ((event.body.toLowerCase() == "2345678") || (event.body.toLowerCase() == "2345678")) {
    return api.sendMessage("Hi chào cậu! chúc bạn ️một ngày mới tuyệt vời. Luôn mỉm cười bạn nhé ❤", threadID);
  };
  
  if ((event.body.toLowerCase() == "chao") || (event.body.toLowerCase() == "chao")) {
    return api.sendMessage("Hi chào cậu! chúc bạn ️một ngày mới tuyệt vời. Luôn mỉm cười bạn nhé ❤", threadID);
  };

  if (event.body.indexOf("bot") == 0 || (event.body.indexOf("Bot") == 0)) {
    const answers = [
      "Dạ bot nghe nè!",
      "Kêu bot có việc gì thế bạn ơi?",
      "Em đây anh/chị ơi <3",
      "Bot đây, gọi gì thế?",
      "Chào bạn, bot có thể giúp gì cho bạn? Gõ !menu để xem danh sách lệnh nhé!"
    ];
    const rand = answers[Math.floor(Math.random() * answers.length)];
    var msg = {
      body: rand
    };
    return api.sendMessage(msg, threadID, messageID);
  };

}

module.exports.run = function({ api, event, client, __GLOBAL }) { }