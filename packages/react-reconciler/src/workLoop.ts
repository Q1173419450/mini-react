import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { FiberNode } from './fiber';

let workInProgress: FiberNode | null = null;

function renderRoot(root: FiberNode) {
	prepareFreshStack(root);

	do {
		try {
			workLoop();
			break;
		} catch (error) {
			console.warn('workLoop 发生错误', error);
			workInProgress = null;
		}
	} while (true);
}

function prepareFreshStack(fiber: FiberNode) {
	workInProgress = fiber;
}

function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

function performUnitOfWork(fiber: FiberNode) {
	// 递
	const next = beginWork(fiber);
	fiber.memoizeProps = fiber.pendingProps;

	// 归
	if (next === null) {
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
}

function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;

	do {
		completeWork(node);
		const sibling = node.sibling;

		// 是否有兄弟节点
		if (sibling !== null) {
			workInProgress = sibling;
			return;
		}
		// 没有则访问父亲节点
		node = node.return;
		workInProgress = node;
	} while (node !== null);
}
