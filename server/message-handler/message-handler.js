const fse = require('fs-extra'),
	path = require('path');

const messages = fse.readJsonSync(path.join(__dirname, '/messages.json'));

function getMessageObject(code, options) {
	const ret = messages[code];
	if (options !== undefined && ret !== undefined) {
		for (let i = 0; i < options.length; i++) {
			ret.DESCRIPTION = ret.DESCRIPTION.replace(`[${i}]`, options[i]);
		}
	}
	return ret;
}

module.exports = {
	getMessageObject
};
