import generatePackageJson from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';
import { getBaseRollupPlugin, getPackageJSON, resolvePkgPath } from './utils';

const { name, module } = getPackageJSON('react-dom');
const pkgPath = resolvePkgPath(name);
const pkgDistPath = resolvePkgPath(name, true);

export default [
	// react-dom
	{
		input: `${pkgPath}/${module}`,
		output: [
			{
				name: 'index.js',
				file: `${pkgDistPath}/index.js`,
				format: 'umd'
			},
			{
				name: 'client.js',
				file: `${pkgDistPath}/client.js`,
				format: 'umd'
			}
		],
		plugins: [
			...getBaseRollupPlugin(),
			// 打包指向
			alias({
				entries: {
					hostConfig: `${pkgPath}/src/hostConfig.ts`
				}
			}),
			generatePackageJson({
				inputFolder: pkgPath,
				outputFolder: pkgDistPath,
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version,
					peerDependencies: {
						react: version
					},
					main: 'index.js'
				})
			})
		]
	}
];
