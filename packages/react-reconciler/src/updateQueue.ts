import { Dispatch } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';
import { Lane } from './fiberLanes';

export interface Update<State> {
	action: Action<State>;
	lane: Lane;
	next: Update<any> | null;
}

export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null;
	};
	dispatch: Dispatch<State> | null;
}

export const createUpdate = <State>(
	action: Action<State>,
	lane: Lane
): Update<State> => {
	return {
		action,
		lane,
		next: null
	};
};

export const createUpdateQueue = <State>() => {
	return {
		shared: {
			pending: null
		},
		dispatch: null
	} as UpdateQueue<State>;
};

// 插入 update
export const enqueueUpdate = <State>(
	updateQueue: UpdateQueue<State>,
	update: Update<State>
) => {
	const pending = updateQueue.shared.pending;
	if (pending === null) {
		// a -> a
		update.next = update;
	} else {
		// b.next = a.next
		update.next = pending.next;
		// a.next = b
		pending.next = update;
	}

	// pending: b -> a -> b
	// update 顺序固定
	updateQueue.shared.pending = update;
};

// 更新 任务队列、消费 update 就是消费 lane 的过程
export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null,
	renderLane: Lane
): { memoizedState: State } => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memoizedState: baseState
	};

	if (pendingUpdate !== null) {
		const first = pendingUpdate.next;
		let pending = pendingUpdate.next;
		do {
			const updateLane = pending?.lane;
			if (updateLane === renderLane) {
				const action = pending?.action;
				if (action instanceof Function) {
					// baseState 1 update (x) => 4x -> memoizedState 4
					baseState = action(baseState);
				} else {
					// baseState 1 update 2 -> memoizedState 2
					baseState = action;
				}
			} else {
				if (__DEV__) {
					console.warn('没处理的 lane 优先级');
				}
			}
			pending = pending?.next ?? null;
		} while (first !== pending);
	}
	result.memoizedState = baseState;

	return result;
};
