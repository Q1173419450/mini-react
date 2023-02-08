import reactDomConfig from './react-dom.config';
import reactConfig from './react.config';

const config = [...reactDomConfig, ...reactConfig];

export default () => {
	return config;
};
