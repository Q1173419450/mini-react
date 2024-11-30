import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFiber } from './childFibers';
import { FiberNode } from './fiber';
import { renderWithHooks } from './fiberHooks';
import { Lane } from './fiberLanes';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import {
	Fragment,
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';

// 递归中的递
/* 
	1、根据 reactElement 创建 fiber
	2、update 时，给已变化的 fiber 打上 flag
	3、执行 diff
*/
export const beginWork = (wip: FiberNode, renderLane: Lane) => {
	if (__DEV__) {
		console.warn('%c begin work 的开始', 'color:#7FFFD4;', wip);
	}
	// 比较，返回子 fiberNode
	switch (wip.tag) {
		case HostRoot:
			return updateHostRoot(wip, renderLane);
		case HostComponent:
			return updateHostComponent(wip);
		case HostText:
			return null;
		case FunctionComponent:
			return updateFunctionComponent(wip, renderLane);
		case Fragment:
			return updateFragment(wip);
		default:
			if (__DEV__) {
				console.warn('beginWork 未实现的类型');
			}
			break;
	}
	return null;
};

function updateHostRoot(wip: FiberNode, renderLane: Lane) {
	const baseState = wip.memoizeState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;

	const { memoizedState } = processUpdateQueue(baseState, pending, renderLane);
	wip.memoizeState = memoizedState;
	const nextChildren = wip.memoizeState;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateHostComponent(wip: FiberNode) {
	// <div><span></span></div>
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateFunctionComponent(wip: FiberNode, renderLane: Lane) {
	const nextChildren = renderWithHooks(wip, renderLane);
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateFragment(wip: FiberNode) {
	const nextChildren = wip.pendingProps;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
	const current = wip.alternate;
	if (current !== null) {
		// update
		// 比较的双方
		wip.child = reconcileChildFiber(wip, current.child, children);
	} else {
		// mount
		// 插入大量节点
		wip.child = mountChildFibers(wip, null, children);
	}
}
