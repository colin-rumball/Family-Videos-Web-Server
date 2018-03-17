function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	req.session.returnTo = req.url;
	res.redirect('/sign-in');
};

function checkAuthToken(req, res, next) {
	if (req.headers['x-auth'] === process.env.MASTER_AUTH_TOKEN || req.isAuthenticated()) {
		return next();
	}
	res.sendStatus(401);
}

module.exports = {
	isLoggedIn,
	checkAuthToken
}