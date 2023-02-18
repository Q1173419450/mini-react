export type Callback = (...args: any) => void;
let syncQueue: Callback[] | null = null;
let isFlushingSync = false;

export function scheduleSyncCallback(callback: Callback) {
	if (syncQueue === null) {
		syncQueue = [callback];
	} else {
		syncQueue.push(callback);
	}
}

export function flushSyncCallbacks() {
	if (!isFlushingSync && syncQueue) {
		isFlushingSync = true;
		try {
			syncQueue.forEach((callback) => callback());
		} catch (error) {
			if (__DEV__) {
				console.error('flushSyncCallbacks 报错', error);
			}
		} finally {
			isFlushingSync = false;
		}
	}
}
