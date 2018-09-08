const multer = require('multer'),
    fs = require('fs-extra'),
    path = require('path');

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const dir = path.join(process.env.PATH_TO_CLIPS);
        await fs.ensureDir(dir);
        cb(null, dir);
    },
    filename: async (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const uploadParser = multer({storage});

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated() || process.env.node_env === 'development') {
		return next();
	}
	req.session.returnTo = req.url;
	return res.redirect('/sign-in');
}

function checkAuthToken(req, res, next) {
	if (req.headers['x-auth'] === process.env.MASTER_AUTH_TOKEN || req.isAuthenticated()) {
		return next();
	}
	return res.sendStatus(401);
}

module.exports = {
	uploadParser,
	isLoggedIn,
	checkAuthToken
};