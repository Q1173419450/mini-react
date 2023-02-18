import { Callback } from 'react-reconciler/src/syncTaskQueue';
import { Props } from 'shared/ReactTypes';
import { DOMElement, updateFiberProps } from './SyntheticEvent';

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

export const createInstance = (type: string, props: Props): Instance => {
	// TODO: 处理 props
	const element = document.createElement(type) as unknown;
	updateFiberProps(element as DOMElement, props);
	return element as DOMElement;
};

export const appendInitialChild = (parent: Instance, child: Instance) => {
	parent.appendChild(child);
};

export const insertChildToContainer = (
	parent: Container,
	child: Instance,
	before: Instance
) => {
	parent.insertBefore(child, before);
};

export const createTextInstance = (content: string) => {
	return document.createTextNode(content);
};

export function commitTextUpdate(textInstance: TextInstance, content: string) {
	textInstance.textContent = content;
}

export function removeChild(child: Instance, container: Container) {
	container.removeChild(child);
}

export const appendChildToContainer = appendInitialChild;

// 微任务执行方式
export const scheduleMicroTask =
	typeof queueMicrotask === 'function'
		? queueMicrotask
		: typeof Promise === 'function'
		? (callback: Callback) => Promise.resolve(null).then(callback)
		: setTimeout;
