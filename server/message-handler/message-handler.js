const fse = require('fs-extra');

var messages;

messages = fse.readJsonSync(__dirname + '/messages.json', );

function getMessageObject(code, options) {
	var ret = messages[code];
	if (options != undefined && ret != undefined) {
		for (var i = 0; i < options.length; i++) {
			ret.DESCRIPTION = ret.DESCRIPTION.replace(`[${i}]`, options[i]);
		}
	}
	return ret;
}

module.exports = {
	getMessageObject
}