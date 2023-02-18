import { FiberRootNode } from './fiber';

export type Lane = number;
export type Lanes = number;

// 为什么不用 1、2、3、4 表示优先级？首先我们会选出一批优先级进行计算，1234 需要用更大的空间去存储，用位运算方便优化
// 优先级越小越高
export const SyncLane = /*---*/ 0b0001;
export const NoLane = /*-----*/ 0b0000;
export const NoLanes = /*----*/ 0b0000;

export function mergeLanes(laneA: Lane, laneB: Lane): Lanes {
	return laneA | laneB;
}

/* 根据不同上下文环境，返回不同优先级 */
export function requestUpdateLanes() {
	return SyncLane;
}

// 获取最高优先级
export function getHighestPriorityLane(lanes: Lanes): Lane {
	return lanes & -lanes;
}

// 清理使用过的 lane
export function markRootFinished(root: FiberRootNode, lane: Lane) {
	root.pendingLanes &= ~lane;
}
