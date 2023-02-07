import reactDomConfig from './react-dom.config';
import reactConfig from './react.config';

const config = [...reactConfig, ...reactDomConfig];

export default () => {
	return config;
};
