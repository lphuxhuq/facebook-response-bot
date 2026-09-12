const fs = require("fs");
const path = require("path");

const registry = new Map();
const FLUSH_DELAY = 3000;

class JsonStore {
	constructor(file) {
		this.file = path.resolve(file);
		this.data = this.#read();
		this._dirty = false;
		this._timer = null;
	}

	#read() {
		try {
			if (fs.existsSync(this.file)) {
				const raw = fs.readFileSync(this.file, "utf8").trim();
				if (raw) return JSON.parse(raw);
				return {};
			}
			fs.mkdirSync(path.dirname(this.file), { recursive: true });
			fs.writeFileSync(this.file, "{}");
			return {};
		} catch (e) {
			console.error(`[STORES] Không đọc được ${this.file}:`, e.message);
			return {};
		}
	}

	touch() {
		this._dirty = true;
		if (this._timer) return;
		this._timer = setTimeout(() => {
			this._timer = null;
			this.flush();
		}, FLUSH_DELAY);
		if (this._timer.unref) this._timer.unref();
	}

	flush() {
		if (!this._dirty) return;
		this._dirty = false;
		try {
			fs.writeFileSync(this.file, JSON.stringify(this.data, null, 4));
		} catch (e) {
			console.error(`[STORES] Không ghi được ${this.file}:`, e.message);
		}
	}
}

function use(name, file) {
	const resolved = path.resolve(file);
	if (!registry.has(resolved)) registry.set(resolved, new JsonStore(resolved));
	return registry.get(resolved);
}

function flushAll() {
	for (const store of registry.values()) {
		try { store.flush(); } catch (e) { console.error('[STORES] flush error:', e.message); }
	}
}

process.on("exit", flushAll);

module.exports = { use, flushAll };
