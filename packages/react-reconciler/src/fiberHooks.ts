import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue,
	Update,
	UpdateQueue
} from './updateQueue';
import { scheduleUpdateOnFiber } from './workLoop';
import internals from 'shared/internals';
import { Lane, NoLane, requestUpdateLanes } from './fiberLanes';
import { Flags, PassiveEffect } from './fiberFlags';
import { HookHasEffect, Passive } from './hookEffectTags';

const { currentDispatcher } = internals;

let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;
let renderLane: Lane = NoLane;

interface Hook {
	memoizedState: any;
	updateQueue: any;
	baseState: any;
	baseQueue: Update<any> | null;
	next: Hook | null;
}

export interface Effect {
	tag: Flags;
	create: EffectCallback | void;
	destroy: EffectCallback | void;
	deps: EffectDeps;
	next: Effect | null;
}

export interface FCUpdateQueue<State> extends UpdateQueue<State> {
	lastEffect: Effect | null;
}

type EffectCallback = () => void;
type EffectDeps = any[] | null;

export function renderWithHooks(wip: FiberNode, lane: Lane) {
	// 赋值
	currentlyRenderingFiber = wip;
	// 重置 hook
	wip.memoizeState = null;
	renderLane = lane;
	wip.updateQueue = null;

	const current = wip.alternate;

	if (current !== null) {
		// update
		currentDispatcher.current = HooksDispatcherOnUpdate;
	} else {
		// mount
		currentDispatcher.current = HooksDispatcherOnMount;
	}

	const Component = wip.type;
	const props = wip.pendingProps;
	const children = Component(props);

	// 重置操作，全局变量，使用完要重置
	currentlyRenderingFiber = null;
	workInProgressHook = null;
	currentHook = null;
	renderLane = NoLane;

	return children;
}

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState,
	useEffect: mountEffect
};

const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState,
	useEffect: updateEffect
};

function mountState<State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] {
	const hook = mountWorkInProgressHook();
	let memoizeState;
	if (initialState instanceof Function) {
		memoizeState = initialState();
	} else {
		memoizeState = initialState;
	}

	const queue = createUpdateQueue<State>();
	hook.updateQueue = queue;
	hook.memoizedState = memoizeState;

	// 触发更新 bind 为了兼容
	/* 
		const [state, setState] = useState(0);
		window.setState = setState
	*/
	// @ts-ignore
	const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
	queue.dispatch = dispatch;

	return [memoizeState, dispatch];
}

function mountEffect(create: EffectCallback | void, deps: EffectDeps | void) {
	const hook = mountWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;
	(currentlyRenderingFiber as FiberNode).flags |= PassiveEffect;

	hook.memoizedState = pushEffect(
		Passive | HookHasEffect,
		create,
		undefined,
		nextDeps
	);
}

function updateEffect(create: EffectCallback | void, deps: EffectDeps | void) {
	const hook = updateWorkInProgress();
	const nextDeps = deps === undefined ? null : deps;
	let destroy: EffectCallback | void;

	if (currentHook !== null) {
		const prevEffect = currentHook.memoizedState;
		destroy = prevEffect.destroy;

		if (nextDeps !== null) {
			// 浅比较依赖
			const prevDeps = prevEffect.deps;
			if (arrHookInputsEqual(nextDeps, prevDeps)) {
				hook.memoizedState = pushEffect(Passive, create, destroy, nextDeps);
				return;
			}
		}

		(currentlyRenderingFiber as FiberNode).flags |= PassiveEffect;
		// 不相等
		hook.memoizedState = pushEffect(
			Passive | HookHasEffect,
			create,
			destroy,
			nextDeps
		);
	}
}

function arrHookInputsEqual(nextDeps: EffectDeps, prevDeps: EffectDeps) {
	if (nextDeps === null || prevDeps === null) return;
	for (let i = 0; i < nextDeps.length; i++) {
		if (Object.is(nextDeps[i], prevDeps[i])) {
			continue;
		}
		return false;
	}
	return true;
}

function pushEffect(
	hooksFlags: Flags,
	create: EffectCallback | void,
	destroy: EffectCallback | void,
	deps: EffectDeps
): Effect {
	const effect: Effect = {
		tag: hooksFlags,
		create,
		destroy,
		deps,
		next: null
	};

	const fiber = currentlyRenderingFiber as FiberNode;
	const updateQueue = fiber.updateQueue as FCUpdateQueue<any>;
	if (updateQueue === null) {
		const updateQueue = createFCUpdateQueue();
		fiber.updateQueue = updateQueue;
		effect.next = effect;
		updateQueue.lastEffect = effect;
	} else {
		const lastEffect = updateQueue.lastEffect;
		// 有必要再判断一次么？
		if (lastEffect === null) {
			effect.next = effect;
			updateQueue.lastEffect = effect;
		} else {
			const firstEffect = lastEffect.next;
			lastEffect.next = effect;
			effect.next = firstEffect;
			updateQueue.lastEffect = effect;
		}
	}
	return effect;
}

function createFCUpdateQueue<State>() {
	const updateQueue = createUpdateQueue<State>() as FCUpdateQueue<State>;
	updateQueue.lastEffect = null;
	return updateQueue;
}

function mountWorkInProgressHook(): Hook {
	const hook: Hook = {
		memoizedState: null,
		updateQueue: null,
		baseQueue: null,
		baseState: null,
		next: null
	};

	if (workInProgressHook === null) {
		// mount 第一个 hook 时
		if (currentlyRenderingFiber == null) {
			throw new Error('请在函数组件内调用hook');
		} else {
			workInProgressHook = hook;
			currentlyRenderingFiber.memoizeState = workInProgressHook;
		}
	} else {
		// mount 后续的hook
		workInProgressHook.next = hook;
		workInProgressHook = hook;
	}

	return workInProgressHook;
}

function dispatchSetState<State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) {
	const lane = requestUpdateLanes();
	const update = createUpdate(action, lane);
	enqueueUpdate(updateQueue, update);
	scheduleUpdateOnFiber(fiber, lane);
}

function updateState<State>(): [State, Dispatch<State>] {
	// 找到当前组件对应的 hook 数据
	const hook = updateWorkInProgress();
	// 计算新 state 的逻辑
	const queue = hook.updateQueue as UpdateQueue<State>;
	const baseState = hook.baseState;
	const current = currentHook as Hook;
	let baseQueue = current.baseQueue;
	const pendingUpdate = queue.shared.pending;

	if (pendingUpdate !== null) {
		if (baseQueue !== null) {
			const baseFirst = baseQueue.next;
			const pendingFirst = pendingUpdate.next;
			baseQueue.next = pendingFirst;
			pendingUpdate.next = baseFirst;
		}
		baseQueue = pendingUpdate;
		current.baseQueue = pendingUpdate;
		queue.shared.pending = null;
		if (baseQueue !== null) {
			const {
				memoizedState,
				baseQueue: newBaseQueue,
				baseState: newBaseState
			} = processUpdateQueue(baseState, baseQueue, renderLane);
			hook.memoizedState = memoizedState;
			hook.baseQueue = newBaseQueue;
			hook.baseState = newBaseState;
		}
	}
	return [hook.memoizedState, queue.dispatch as Dispatch<State>];
}

/* 
	hook 数据从哪来呢
	1、交互阶段触发的更新。onClick
	2、render 阶段触发更新
*/
function updateWorkInProgress(): Hook {
	// TODO: render 阶段触发更新
	let nextCurrentHook: Hook | null;
	// 这个组件的第一个 hook
	if (currentHook === null) {
		// 正在 render 的 fiber 的 alt
		const current = currentlyRenderingFiber?.alternate;
		if (current !== null) {
			nextCurrentHook = current?.memoizeState;
		} else {
			// 错误的边界
			nextCurrentHook = null;
		}
	} else {
		// 这个组件后续的 hook
		nextCurrentHook = currentHook.next;
	}

	if (nextCurrentHook === null) {
		throw new Error(
			`组件${currentlyRenderingFiber?.type} 本次执行时的 Hook 比上次执行时多`
		);
	}

	currentHook = nextCurrentHook as Hook;
	const newHook: Hook = {
		memoizedState: currentHook.memoizedState,
		updateQueue: currentHook.updateQueue,
		baseState: currentHook.baseState,
		baseQueue: currentHook.baseQueue,
		next: null
	};
	if (workInProgressHook === null) {
		// mount 第一个 hook
		if (currentlyRenderingFiber === null) {
			throw new Error('请在函数组件内调用 hook');
		} else {
			workInProgressHook = newHook;
			currentlyRenderingFiber.memoizeState = workInProgressHook;
		}
	} else {
		// mount 后续的 hook
		workInProgressHook.next = newHook;
		workInProgressHook = newHook;
	}
	return workInProgressHook;
}
