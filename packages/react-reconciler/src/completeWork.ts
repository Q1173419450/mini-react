import {
	createInstance,
	createTextInstance,
	appendInitialChild,
	Instance
} from 'hostConfig';
import { FiberNode } from './fiber';
import { NoFlags, Update } from './fiberFlags';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText,
	Fragment
} from './workTags';

function markUpdate(fiber: FiberNode) {
	fiber.flags |= Update;
}

// 递归中的归
// 执行更新的冒泡、元素的创建
export const completeWork = (wip: FiberNode) => {
	if (__DEV__) {
		console.warn('%c completeWork 开始：', 'color:#00BFFF;', wip);
	}
	const newProps = wip.pendingProps;
	const current = wip.alternate;

	switch (wip.tag) {
		case HostComponent:
			if (current !== null && wip.stateNode) {
				// update
				/* 
				1.判断 props 是否改变
				2.变了标记 update flage
				*/
				markUpdate(wip);
				//逻辑收敛、reconciler 是与环境无关的包
				// updateFiberProps(wip.stateNode, newProps);

				// className、style
			} else {
				// mount
				const instance = createInstance(wip.type, newProps);
				// const instance = createInstance(wip.type);
				// 将 dom 插入到 dom 树中
				appendAllChildren(instance, wip);
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			return null;
		case HostText:
			if (current !== null && wip.stateNode) {
				// update
				const oldText = current.memoizeProps.content;
				const newText = newProps.content;
				if (oldText !== newText) {
					markUpdate(wip);
				}
			} else {
				// 1. 构建 dom
				const instance = createTextInstance(newProps.content);
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			return null;
		case HostRoot:
		case FunctionComponent:
		case Fragment:
			bubbleProperties(wip);
			return null;
		default:
			if (__DEV__) {
				console.warn('未处理的 completeWork 的情况', wip);
			}
			break;
	}
};

function appendAllChildren(parent: Instance, wip: FiberNode) {
	let node = wip.child;
	while (node !== null) {
		if (node.tag === HostComponent || node.tag === HostText) {
			appendInitialChild(parent, node?.stateNode);
		} else if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}

		if (node === wip) return;

		while (node.sibling === null) {
			if (node.return === null || node.return === wip) return;
			node = node?.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

// 冒泡 flags 到顶层
function bubbleProperties(wip: FiberNode) {
	let subtreeFlags = NoFlags;
	let child = wip.child;

	while (child !== null) {
		subtreeFlags |= child.subtreeFlags;
		subtreeFlags |= child.flags;

		child.return = wip;
		child = child.sibling;
	}
	wip.subtreeFlags |= subtreeFlags;
}
