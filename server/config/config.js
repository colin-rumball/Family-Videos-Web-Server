const env = process.env.node_env || 'development';
const config = require('./config.json');

if (env === 'development' || env === 'test') {
	const envConfig = config[env];

	Object.keys(envConfig).forEach((key) => {
		process.env[key] = envConfig[key];
	});
}

process.env.node_env = env;
