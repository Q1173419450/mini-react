export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText
	| typeof Fragment;

export const FunctionComponent = 0;
// rootElement
export const HostRoot = 3;
// <div>
export const HostComponent = 5;
// <div>132</div>
export const HostText = 6;
export const Fragment = 7;
