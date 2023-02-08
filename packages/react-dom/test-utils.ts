import { ReactElementType } from 'shared/ReactTypes';
import { createRoot } from './src/root';

export function renderIntoDocument(element: ReactElementType) {
	const div = document.createElement('div');
	return createRoot(div).render(element);
}
