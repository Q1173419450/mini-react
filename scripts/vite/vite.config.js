import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import replace from '@rollup/plugin-replace';
import { resolvePkgPath } from '../rollup/utils.js';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	server: { host: '127.0.0.1', port: 3000 },
	plugins: [react(), replace({ __DEV__: true, preventAssignment: true })],
	resolve: {
		alias: [
			{
				find: 'react',
				replacement: resolvePkgPath('react')
			},
			{
				find: 'react-dom',
				replacement: resolvePkgPath('react-dom')
			},
			{
				find: 'hostConfig',
				replacement: path.resolve(
					resolvePkgPath('react-dom'),
					'./src/hostConfig.ts',
					''
				)
			}
		]
	}
});
