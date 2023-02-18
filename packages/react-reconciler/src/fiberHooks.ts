import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue,
	UpdateQueue
} from './updateQueue';
import { scheduleUpdateOnFiber } from './workLoop';
import internals from 'shared/internals';
import { Lane, NoLane, requestUpdateLanes } from './fiberLanes';

const { currentDispatcher } = internals;

let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;
let renderLane: Lane = NoLane;

interface Hook {
	memoizedState: any;
	updateQueue: any;
	next: Hook | null;
}

export function renderWithHooks(wip: FiberNode, lane: Lane) {
	// 赋值
	currentlyRenderingFiber = wip;
	// 重置 hook
	wip.memoizeState = null;
	renderLane = lane;

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
	useState: mountState
};

const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState
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

function mountWorkInProgressHook(): Hook {
	const hook: Hook = {
		memoizedState: null,
		updateQueue: null,
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
	const pendingUpdate = queue.shared.pending;
	queue.shared.pending = null;

	if (pendingUpdate !== null) {
		const { memoizedState } = processUpdateQueue(
			hook.memoizedState,
			pendingUpdate,
			renderLane
		);
		hook.memoizedState = memoizedState;
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
