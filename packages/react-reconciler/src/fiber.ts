import { Props, Key, Ref } from 'shared/ReactTypes';
import { Flags, NoFlags } from './fiberFlags';
import { WorkTag } from './workTags';

export class FiberNode {
	tag: WorkTag;
	key: Key;
	type: any;
	stateNode: any;
	return: FiberNode | null;
	child: FiberNode | null;
	sibling: FiberNode | null;
	index: number;
	ref: Ref;
	pendingProps: Props;
	memoizeProps: Props;
	alternate: FiberNode | null;
	flag: Flags;

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		// 实例
		this.tag = tag;
		this.key = key;
		// HostComponent <div> div DOM
		this.stateNode = null;
		// FunctionComponent () => {}
		this.type = null;

		// 树结构
		this.return = null;
		this.child = null;
		this.sibling = null;
		this.index = 0;

		this.ref = null;

		// 工作单元
		this.pendingProps = pendingProps;
		this.memoizeProps = null;

		this.alternate = null;
		// 副作用
		this.flag = NoFlags;
	}
}
