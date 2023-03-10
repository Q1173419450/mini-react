import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { isObject } from 'shared/utils';
import currentDispatcher, {
	Dispatcher,
	resolveDispatcher
} from './src/currentDispatcher';
import { jsx, jsxDEV } from './src/jsx';

export const useState: Dispatcher['useState'] = (initialState) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initialState);
};

export const useEffect: Dispatcher['useEffect'] = (callback, deps) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useEffect(callback, deps);
};

export function isValidElement(object: any) {
	return isObject(object) && object.$$typeof === REACT_ELEMENT_TYPE;
}

// 内部数据共享层
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispatcher
};

export const version = '0.0.0';
export const createElement = jsx;

// export default {
// 	version: '0.0.0',
// 	createElement: jsx,
// 	createProdElement: jsx
// };
