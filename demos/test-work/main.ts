/* 
	可能阻塞
	work.count 数量太多
	单个 work.count工作量太大
*/

import {
	unstable_IdlePriority as IdlePriority,
	unstable_UserBlockingPriority as UserBlockingPriority,
	unstable_NormalPriority as NormalPriority,
	unstable_LowPriority as LowPriority,
	unstable_ImmediatePriority as ImmediatePriority,
	CallbackNode,
	unstable_scheduleCallback as scheduleCallback,
	unstable_shouldYield as shouldYield,
	unstable_getFirstCallbackNode as getFirstCallbackNode,
	unstable_cancelCallback as cancelCallback
} from 'scheduler';

type Priority =
	| typeof IdlePriority
	| typeof LowPriority
	| typeof NormalPriority
	| typeof UserBlockingPriority
	| typeof ImmediatePriority;

const root = document.querySelector('#root');

interface Work {
	count: number;
	priority: Priority;
}

const workList: Work[] = [];

let prevPriority: Priority = IdlePriority;
let curCallback: CallbackNode | null = null;

// 交互
[LowPriority, NormalPriority, UserBlockingPriority, ImmediatePriority].forEach(
	(priority) => {
		const btn = document.createElement('button');
		root?.appendChild(btn);
		btn.innerText = [
			'',
			'ImmediatePriority',
			'UserBlockingPriority',
			'NormalPriority',
			'LowPriority'
		][priority];

		// 增加 work
		btn.onclick = () => {
			workList.unshift({
				count: 100,
				priority: priority as Priority
			});

			schedule();
		};
	}
);

// 调度
function schedule() {
	const cbNode = getFirstCallbackNode();
	const curWork = workList.sort((w1, w2) => w1.priority - w2.priority)[0];

	// 无任务
	if (!curWork) {
		curCallback = null;
		cbNode && cancelCallback(cbNode);
		return;
	}

	const { priority: curPriority } = curWork;
	// 优先级相同
	if (curPriority === prevPriority) {
		return;
	}

	// 中断当前任务、更高优先级任务的 work
	cbNode && cancelCallback(cbNode);

	curCallback = scheduleCallback(curPriority, perform.bind(null, curWork));
}

function perform(work: Work, didTimeout?: boolean) {
	/* 
		1.work.priority 优先级
		2. 饥饿问题 太久没执行的任务
		3. 时间切片 将任务切分的关键
	*/
	// 当是立即执行优先级、didTimeout 为 true （饥饿了）
	const needSync = work.priority === ImmediatePriority || didTimeout;
	// 执行任务
	while ((needSync || !shouldYield()) && work.count) {
		work.count--;
		insertSpan(work.priority + '');
	}

	// 执行完 | 中断执行
	// 中断执行、新任务
	prevPriority = work.priority;
	// 执行完毕
	if (!work.count) {
		const workIndex = workList.indexOf(work);
		workList.splice(workIndex, 1);
		prevPriority = IdlePriority;
	}

	const prevCallback = curCallback;
	// 继续调度
	schedule();

	// 调度来了新任务
	const newCallback = curCallback;

	// 优化路径：仅有一个任务：单个任务、则在时间切片一直执行到完成
	if (newCallback && prevCallback === newCallback) {
		return perform.bind(null, work);
	}
}

/* 工具函数 */
function insertSpan(content) {
	const span = document.createElement('span');
	span.innerText = content;
	span.className = `pri-${content}`;
	doSomeBusyWork(10000000);
	root?.appendChild(span);
}

function doSomeBusyWork(len: number) {
	let res = 0;
	while (len) {
		res += len;
		len--;
	}
}
