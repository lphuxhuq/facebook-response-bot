const FAIL_TTL = 60 * 1000;

module.exports = function ({ Threads }) {
	const inflight = new Map();
	const failedAt = new Map();

	return function getThreadInfo(threadID) {
		threadID = String(threadID);
		const cached = global.data.threadInfo.get(threadID);
		if (cached && Object.keys(cached).length > 0) return Promise.resolve(cached);

		const lastFail = failedAt.get(threadID);
		if (lastFail && Date.now() - lastFail < FAIL_TTL) return Promise.resolve(cached || null);

		if (inflight.has(threadID)) return inflight.get(threadID);

		const task = Threads.getInfo(threadID)
			.then(info => {
				if (info && Object.keys(info).length > 0) {
					global.data.threadInfo.set(threadID, info);
					if (!global.data.allThreadID.includes(threadID)) global.data.allThreadID.push(threadID);
				} else {
					failedAt.set(threadID, Date.now());
				}
				return info || null;
			})
			.catch(() => {
				failedAt.set(threadID, Date.now());
				return cached || null;
			})
			.finally(() => inflight.delete(threadID));

		inflight.set(threadID, task);
		return task;
	};
};
