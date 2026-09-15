const path = require('path');
const fs = require('fs-extra');

const cacheDir = path.join(__dirname, '..', 'modules', 'commands', 'cache');
if (!fs.existsSync(cacheDir)) {
    fs.mkdirpSync(cacheDir);
}

/**
 * Tạo đường dẫn file tạm ngẫu nhiên theo luồng, tránh xung đột ghi đè
 */
function getTempCachePath(ext = 'jpg', prefix = 'media') {
    const cleanExt = (ext || 'jpg').replace(/^\./, '').split('?')[0];
    const rand = Math.random().toString(36).substring(2, 8);
    return path.join(cacheDir, `${prefix}_${Date.now()}_${rand}.${cleanExt}`);
}

/**
 * Xoá file an toàn có độ trễ fallback (tránh lỗi file bị khoá hoặc ENOENT khi FB đang stream)
 */
function safeUnlink(filePath, delay = 20000) {
    if (!filePath) return;
    setTimeout(() => {
        try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (_) {}
    }, delay);
}

module.exports = {
    cacheDir,
    getTempCachePath,
    safeUnlink
};
