function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	req.session.returnTo = req.url;
	res.redirect('/sign-in');
};

module.exports = {
	isLoggedIn
}