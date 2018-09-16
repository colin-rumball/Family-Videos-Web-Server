require('./config/config');

// External Packages
const express = require('express'),
	passport = require('passport'),
	bodyParser = require('body-parser'),
	LocalStrategy = require('passport-local'),
	hbs = require('hbs'),
	_ = require('lodash'),
	favicon = require('serve-favicon'),
	path = require('path');

const {mongoose} = require('./db/mongoose');
const Clip = require('./models/Clip');
const {User} = require('./models/User');
const Utils = require('./utils/utils');

// ROUTERS
const uploadRouter = require('./routers/upload-router');
const videoRouter = require('./routers/video-router');
const authRouter = require('./routers/auth-router');

const app = express();
// if this isn't working then it's likely a naming issue
hbs.registerPartials(path.join(__dirname, '..', 'views', 'partials'), () => {
	console.log('HBS Partials registered!');
	app.listen(process.env.PORT, () => {
		console.log(`Started Family Video Server on port: ${process.env.PORT} with env: ${process.env.node_env}`);
	});
});

app.use(require('express-session')({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false
}));

// Files
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// Favicon
app.use(favicon(path.join(__dirname, 'favicon', 'favicon.ico')));

// Templating
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'hbs');

// User Auth
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Templating Helper Functions
hbs.registerHelper('ifCond', (v1, v2, options) => {
	if (v1 === v2) {
		return options.fn(this);
	}
	return options.inverse(this);
});

hbs.registerHelper('ifContains', (v1, v2, options) => {
	if (v1.includes(v2)) {
		return options.fn(this);
	}
	return options.inverse(this);
});

// =======================================================================
// ------ ROUTERS

app.use('/', authRouter);
app.use('/video', videoRouter);
app.use('/upload', uploadRouter);

// ------ GET

app.get('/', (req, res) => {
	const queries = req.query;
	let mongoQuery = {};

	if (!_.isEmpty(queries)) {
		const clipState = req.isAuthenticated() && queries.state !== undefined ? 'unlisted' : 'listed';
		// Stringify to remove undefined values
		mongoQuery = JSON.stringify({
			title: queries.title !== undefined ? { $regex: queries.title, $options: 'i' } : undefined,
			members: queries.familyMembers !== undefined ? { $all: queries.familyMembers } : undefined,
			year: queries.year === 'Any Year' ? undefined : parseInt(queries.year),
			location: queries.location === 'Any Place' ? undefined : queries.location,
			tags: queries.tags !== undefined ? { $all: queries.tags } : undefined,
			rating: queries.ratings !== undefined ? { $in: queries.ratings } : undefined,
			state: clipState
		});
	}
	// Check database connection
	if (mongoose.connection._readyState === 1) {
		Clip.find(_.isEmpty(mongoQuery) ? {state: 'listed'} : JSON.parse(mongoQuery)).then((mongoClips) => {
			const obj = Utils.createHomeParameters(queries, mongoClips);
			return Utils.renderTemplateToResponse(req, res, 'pages/home', obj);
		}).catch((e) => {
			Utils.renderMessageToResponse(req, res, 'NO_DATABASE_RESPONSE');
		});
	}
	else {
		Utils.renderMessageToResponse(req, res, 'NO_DATABASE_RESPONSE');
	}
});

app.get('/youtube-url', (req, res) => {
	res.send({youtube_url: process.env.YOUTUBE_URL});
});

app.get('/*', (req, res) => {
	Utils.renderMessageToResponse(req, res, 'PAGE_NOT_FOUND');
});
