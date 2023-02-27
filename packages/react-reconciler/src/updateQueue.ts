import { Dispatch } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';
import { isSubsetOfLanes, Lane, NoLane } from './fiberLanes';

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
): {
	memoizedState: State;
	baseState: State;
	baseQueue: Update<State> | null;
} => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memoizedState: baseState,
		baseState: baseState,
		baseQueue: null
	};

	if (pendingUpdate !== null) {
		const first = pendingUpdate.next;
		let pending = pendingUpdate.next;

		let newBaseState = baseState;
		let newBaseQueueFirst: Update<State> | null = null;
		let newBaseQueueLast: Update<State> | null = null;
		let newState = baseState;

		do {
			const updateLane = pending?.lane ?? NoLane;
			if (!isSubsetOfLanes(renderLane, updateLane)) {
				// 优先级不够
				const clone = createUpdate<State>(
					pending?.action,
					pending?.lane ?? NoLane
				);
				if (newBaseQueueFirst === null) {
					newBaseQueueFirst = clone;
					newBaseQueueLast = clone;
					newBaseState = newState;
				} else {
					(newBaseQueueLast as Update<State>).next = clone;
					newBaseQueueFirst = clone;
				}
			} else {
				// 优先级足够
				if (newBaseQueueLast !== null) {
					const clone = createUpdate<State>(pending?.action, NoLane);
					newBaseQueueLast.next = clone;
					newBaseQueueLast = clone;
				}

				const action = pending?.action;
				if (action instanceof Function) {
					// baseState 1 update (x) => 4x -> memoizedState 4
					newState = action(baseState);
				} else {
					// baseState 1 update 2 -> memoizedState 2
					newState = action;
				}
			}
			pending = pending?.next ?? null;
		} while (first !== pending);

		if (newBaseQueueLast === null) {
			newBaseState = newState;
		} else {
			// 环状链表
			newBaseQueueLast.next = newBaseQueueFirst;
		}
		result.memoizedState = newState;
		result.baseState = newBaseState;
		result.baseQueue = newBaseQueueLast;
	}
	return result;
};
