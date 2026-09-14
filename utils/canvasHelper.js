const { createCanvas, GlobalFonts, loadImage } = require('@napi-rs/canvas');
const fs = require('fs-extra');
const path = require('path');

// Đăng ký font hệ thống hỗ trợ 100% tiếng Việt Unicode (Segoe UI / Arial)
if (process.platform === 'win32') {
    if (fs.existsSync('C:/Windows/Fonts/segoeui.ttf')) {
        GlobalFonts.registerFromPath('C:/Windows/Fonts/segoeui.ttf', 'AppFont');
    }
    if (fs.existsSync('C:/Windows/Fonts/segoeuib.ttf')) {
        GlobalFonts.registerFromPath('C:/Windows/Fonts/segoeuib.ttf', 'AppFontBold');
    }
    if (fs.existsSync('C:/Windows/Fonts/arial.ttf')) {
        GlobalFonts.registerFromPath('C:/Windows/Fonts/arial.ttf', 'AppArial');
    }
    if (fs.existsSync('C:/Windows/Fonts/arialbd.ttf')) {
        GlobalFonts.registerFromPath('C:/Windows/Fonts/arialbd.ttf', 'AppArialBold');
    }
}

// Fallback font strings cho canvas
const FONT_REGULAR = 'AppFont, AppArial, "Segoe UI", Arial, sans-serif';
const FONT_BOLD = 'AppFontBold, AppArialBold, "Segoe UI", Arial, sans-serif';

const cacheDir = path.join(__dirname, '../modules/commands/cache');
if (!fs.existsSync(cacheDir)) {
    fs.mkdirpSync(cacheDir);
}

// Dọn dẹp các file ảnh canvas tạm cũ hơn 5 phút khi nạp helper
try {
    const oldFiles = fs.readdirSync(cacheDir);
    const nowTs = Date.now();
    for (const f of oldFiles) {
        if (f.startsWith('canvas_')) {
            const fp = path.join(cacheDir, f);
            const stat = fs.statSync(fp);
            if (nowTs - stat.mtimeMs > 5 * 60 * 1000) {
                fs.unlinkSync(fp);
            }
        }
    }
} catch (_) {}

/**
 * Tải avatar người dùng Facebook chất lượng cao
 */
async function fetchAvatarImage(uid, api) {
    if (!uid) return null;
    const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
    const graphUrl = `https://graph.facebook.com/${uid}/picture?height=720&width=720&access_token=${token}`;

    try {
        return await loadImage(graphUrl);
    } catch (_) {
        if (api && typeof api.getUserInfo === 'function') {
            try {
                const info = await api.getUserInfo(uid);
                if (info && info[uid] && info[uid].thumbSrc) {
                    return await loadImage(info[uid].thumbSrc);
                }
            } catch (_) {}
        }
        return null;
    }
}

/**
 * Vẽ avatar hình tròn kèm viền phát sáng
 */
function drawAvatar(ctx, img, x, y, size, fallbackText = '👤', borderColor = '#38bdf8') {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (img) {
        ctx.drawImage(img, x, y, size, size);
    } else {
        ctx.fillStyle = '#334155';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.floor(size * 0.45)}px ${FONT_BOLD}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fallbackText, x + size / 2, y + size / 2);
    }
    ctx.restore();

    // Viền bao quanh avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
}

/**
 * Lưu canvas ra file tạm và trả về stream cùng hàm dọn dẹp an toàn
 */
async function canvasToStream(canvas) {
    const fileName = `canvas_${Date.now()}_${Math.floor(Math.random() * 100000)}.png`;
    const filePath = path.join(cacheDir, fileName);
    const buffer = await canvas.encode('png');
    await fs.writeFile(filePath, buffer);

    const stream = fs.createReadStream(filePath);

    // Giữ file trên đĩa 30 giây để uploadAttachment đọc và gửi xong mà không bị lỗi ENOENT
    const cleanup = () => {
        setTimeout(() => {
            try {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch (_) {}
        }, 30000);
    };

    return { stream, filePath, cleanup };
}

/**
 * Vẽ hình chữ nhật bo góc
 */
function roundRect(ctx, x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

/**
 * Vẽ thanh tiến trình (progress bar)
 */
function drawProgressBar(ctx, x, y, w, h, percent, color, bgColor = 'rgba(255, 255, 255, 0.1)', label = '') {
    ctx.save();
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = bgColor;
    ctx.fill();

    const fillWidth = Math.max(h, (w * Math.min(Math.max(percent, 0), 100)) / 100);
    roundRect(ctx, x, y, fillWidth, h, h / 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();

    if (label) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 14px ${FONT_BOLD}`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + w, y - 10);
        ctx.restore();
    }
}

/**
 * Vẽ con dấu mộc đỏ kiểu thẩm quyền
 */
function drawRedStamp(ctx, x, y, text1 = 'ĐÃ KIỂM ĐỊNH', text2 = 'HẾT CỨU', angle = -0.15) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 65, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 58, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = `bold 11px ${FONT_BOLD}`;
    ctx.fillText(text1, 0, -22);

    ctx.font = `bold 16px ${FONT_BOLD}`;
    ctx.fillText(text2, 0, 4);

    ctx.font = `bold 10px ${FONT_BOLD}`;
    ctx.fillText('★ ★ ★ ★ ★', 0, 26);

    ctx.restore();
}

module.exports = {
    createCanvas,
    canvasToStream,
    roundRect,
    drawProgressBar,
    drawRedStamp,
    fetchAvatarImage,
    drawAvatar,
    FONT_REGULAR,
    FONT_BOLD
};
