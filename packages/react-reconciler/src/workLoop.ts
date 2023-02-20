import { scheduleMicroTask } from 'hostConfig';
import {
	commitHookEffectListCreate,
	commitHookEffectListDestroy,
	commitHookEffectListUnmount,
	commitMutationEffect
} from './commitWork';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import {
	createWorkInProgress,
	FiberNode,
	FiberRootNode,
	PendingPassiveEffects
} from './fiber';
import { MutationMask, NoFlags, PassiveMask } from './fiberFlags';
import {
	getHighestPriorityLane,
	Lane,
	markRootFinished,
	mergeLanes,
	NoLane,
	SyncLane
} from './fiberLanes';
import { flushSyncCallbacks, scheduleSyncCallback } from './syncTaskQueue';
import { HostRoot } from './workTags';
import {
	unstable_scheduleCallback as scheduleCallback,
	unstable_NormalPriority as NormalPriority
} from 'scheduler';
import { HookHasEffect, Passive } from './hookEffectTags';
import { Effect } from './fiberHooks';

let workInProgress: FiberNode | null = null;
let wipRenderLane: Lane = NoLane;
let rootDoesHasPassiveEffects = false;

export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
	const root = markUpdateFromFiberToRoot(fiber);
	markRootUpdate(root, lane);
	// renderRoot(root, lane);
	ensureRootIsScheduled(root);
}

function ensureRootIsScheduled(root: FiberRootNode) {
	//选出一个 优先级最高的lane
	const updateLane = getHighestPriorityLane(root.pendingLanes);
	if (updateLane === NoLane) return;
	if (updateLane === SyncLane) {
		if (__DEV__) {
			console.warn('微任务中调度', updateLane);
		}
		scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root, updateLane));
		scheduleMicroTask(flushSyncCallbacks);
	} else {
		// TODO: 其他优先级方式
	}
}

function markRootUpdate(root: FiberRootNode, lane: Lane) {
	root.pendingLanes = mergeLanes(root.pendingLanes, lane);
}

// 将更新传到 fiberRootNode
function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber;
	let parent = node.return;
	while (parent !== null) {
		node = parent;
		parent = node.return;
	}
	if (node.tag === HostRoot) {
		return node.stateNode;
	}
	return null;
}

function performSyncWorkOnRoot(root: FiberRootNode, lane: Lane) {
	const nextLane = getHighestPriorityLane(root.pendingLanes);

	if (nextLane !== SyncLane) {
		// ensureRootIsScheduled(root);
		return;
	}

	// 创建 wip
	prepareFreshStack(root, lane);

	do {
		try {
			workLoop();
			break;
		} catch (error) {
			if (__DEV__) {
				console.warn('workLoop 发生错误', error);
			}
			workInProgress = null;
		}
	} while (true);

	const finishedWork = root.current.alternate;
	root.finishedWork = finishedWork;
	root.finishedLane = lane;
	wipRenderLane = NoLane;

	commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
	const finishedWork = root.finishedWork;
	const lane = root.finishedLane;

	if (finishedWork === null) return;
	if (lane === NoLane && __DEV__) {
		console.warn('commit 阶段 finishedLane 不应该是 NoLane');
	}

	if (__DEV__) {
		console.warn('commit 阶段开始', finishedWork);
	}

	root.finishedWork = null;
	root.finishedLane = NoLane;

	markRootFinished(root, lane);

	// effect
	const subtreeHasEffect =
		(finishedWork.subtreeFlags & PassiveMask) !== NoFlags;
	const rootHasEffect = (finishedWork.flags & PassiveMask) !== NoFlags;

	if (subtreeHasEffect || rootHasEffect) {
		if (!rootDoesHasPassiveEffects) {
			rootDoesHasPassiveEffects = true;
			// 根据优先级调度 effect
			scheduleCallback(NormalPriority, () => {
				flushPassiveEffects(root.pendingPassiveEffects);
				return;
			});
		}
	}

	// 子树有副作用
	const subtreeHasMutation =
		(finishedWork.subtreeFlags & MutationMask) !== NoFlags;
	const rootHasMutation = (finishedWork.flags & MutationMask) !== NoFlags;

	if (subtreeHasMutation || rootHasMutation) {
		// beforeMutation
		// mutation Placement
		commitMutationEffect(finishedWork, root);
		root.current = finishedWork;
		// layout
	} else {
		root.current = finishedWork;
	}

	rootDoesHasPassiveEffects = false;
	ensureRootIsScheduled(root);
}

function flushPassiveEffects(pendingPassiveEffects: PendingPassiveEffects) {
	if (__DEV__) {
		console.log(pendingPassiveEffects);
	}
	pendingPassiveEffects.unmount.forEach((effect: Effect) => {
		commitHookEffectListUnmount(Passive, effect);
	});
	pendingPassiveEffects.unmount = [];

	pendingPassiveEffects.update.forEach((effect: Effect) => {
		commitHookEffectListDestroy(Passive | HookHasEffect, effect);
	});

	pendingPassiveEffects.update.forEach((effect: Effect) => {
		commitHookEffectListCreate(Passive | HookHasEffect, effect);
	});

	pendingPassiveEffects.update = [];
	flushSyncCallbacks();
}

function prepareFreshStack(root: FiberRootNode, lane: Lane) {
	workInProgress = createWorkInProgress(root.current, {});
	wipRenderLane = lane;
}

function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

function performUnitOfWork(fiber: FiberNode) {
	// 递
	const next = beginWork(fiber, wipRenderLane);
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
