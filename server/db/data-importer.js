// **************************
// Keeping in case I have to use the old data input tool again
// **************************

const fse = require('fs-extra');
var { Clip } = require('./../models/Clip');

function ImportData(fileName) {
	fse.readJSON(__dirname + `/${fileName}`).then((data) => {
		for (var i = 0; i < data.videos.length; i++) {
			var clipData = data.videos[i];
			var newClip = new Clip(clipData);
			newClip.save();
		}
	});
}

module.exports = {
	ImportData
}