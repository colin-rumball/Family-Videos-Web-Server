require('./config/config');

const express = require('express'),
	passport = require('passport'),
	bodyParser = require('body-parser'),
	LocalStrategy = require('passport-local'),
	passportLocalMongoose = require('passport-local-mongoose'),
	hbs = require('hbs'),
	_ = require('lodash'),
	request = require('request-promise-native'),
	fse = require('fs-extra'),
	favicon = require('serve-favicon'),
	path = require('path'),
	https = require('https');

var {ObjectID} = require('mongodb');
var {mongoose} = require('./db/mongoose');
var {Clip} = require('./models/Clip');
var {User} = require('./models/User');
var {isLoggedIn} = require('./middleware/middleware');

const SERVER_PORT = process.env.PORT;
const pathToClips = path.join(__dirname, '..', 'clips');

const MAX_PER_PAGE = 9;

var app = express();
// if this isn't working then it's likely a naming issue
hbs.registerPartials(__dirname + '/../views/partials');

app.use(require('express-session')({
	secret: "colin",
	resave: false,
	saveUninitialized: false
}));
app.use('/public', express.static(__dirname + '/../public'));
app.use(favicon(path.join(__dirname, 'favicon', 'favicon.ico')));
app.set('views', __dirname + '/../views');
app.set('view engine', 'hbs');
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// app.use(cors());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

hbs.registerHelper('ifCond', (v1, v2, options) => {
	if (v1 === v2) {
		return options.fn(this);
	}
	return options.inverse(this);
});

// ------ GET

app.get('/', (req, res) => {
	var queries = req.query;
	var mongoQuery = {};

	var test = parseInt(queries.year);

	if (!_.isEmpty(queries)) {
		// Stringify to remove undefined values
		mongoQuery = JSON.stringify({
			title: queries.title != undefined ? { $regex: queries.title, $options: 'i' } : undefined,
			members: queries.familyMembers != undefined ? { $all: queries.familyMembers } : undefined,
			year: queries.year === 'Any Year' ? undefined : parseInt(queries.year),
			location: queries.location === 'Any Place' ? undefined : queries.location,
			tags: queries.tags != undefined ? { $all: queries.tags } : undefined,
			rating: queries.ratings != undefined ? { $in: queries.ratings } : undefined,
			state: req.isAuthenticated() ? queries.state != undefined ? 'unlisted' : 'listed' : 'listed'
		});
	}

	Clip.find(_.isEmpty(mongoQuery) ? {state: 'listed'} : JSON.parse(mongoQuery)).then((mongoClips) => {
		var obj = createHomeParameters(queries, mongoClips);
		renderTemplateToResponse(req, res, 'pages/home', obj);
	}, (e) => {
		res.status(400).send(e);
	});

	// If we got to here something went wrong (most likely with the database)
	// renderTemplateToResponse(req, res, 'pages/home', { numResults: 0 });
});

app.get('/video/:id', (req, res) => {
	var youtubeId = req.params.id;
	Clip.findOne({ youtubeId: youtubeId}).then((clip) => {
		renderTemplateToResponse(req, res, 'pages/video', { clip })
	}).catch((e) => {
		res.redirect('/');
	});
});

app.get('/sign-in', (req, res) => {
	renderTemplateToResponse(req, res, 'pages/sign-in', {});
});

app.get('/register', isLoggedIn, (req, res) => {
	renderTemplateToResponse(req, res, 'pages/register', {});
});

app.get('/upload', isLoggedIn, (req, res) => {
	fse.readdir(pathToClips).then((contents) => {
		var justFiles = contents.filter((file) => {
			let filePath = path.join(pathToClips, file);
			let stats = fse.statSync(filePath);
			return !stats.isDirectory();
		});
		renderTemplateToResponse(req, res, 'pages/upload', { files: justFiles });
	});
});

// ------ POST

app.post('/register', isLoggedIn, (req, res) => {
	User.register(new User({ username: req.body.username }), req.body.password, (err, user) => {
		if (err) {
			console.error(err);
			return renderTemplateToResponse(req, res, 'pages/register', {});
		}

		passport.authenticate('local')(req, res, () => {
			res.redirect('/');
		});
	});
});

app.post('/sign-in', passport.authenticate('local', {
	successReturnToOrRedirect: '/',
	failureRedirect: '/register'
}), (req, res) => {

});

app.post('/upload', isLoggedIn, (req, res) => {
	fse.readdir(pathToClips).then((files) => {
		for (let i = 0; i < files.length; i++) {
			var filePath = path.join(pathToClips, files[i]);
			let stats = fse.statSync(filePath);
			if (!stats.isDirectory()) {
				let tapeId = parseInt(files[i].substr(files[i].indexOf('Tape') + 5, 1)),
					clipId = parseInt(files[i].substr(files[i].indexOf('Sub') + 4, 2));
				var clipBody = {
					tape_id: tapeId,
					clip_id: clipId,
					title: files[i],
					year: 9999,
					location: 'unset',
					filmedBy: 'unset',
					members: [],
					rating: 0,
					youtube_id: undefined,
					tags: [],
					file_name: files[i],
					state: 'uploading'
				};

				var newClip = new Clip(clipBody);

				newClip.save().then((doc) => {
					var newId = doc._id;
					request({
						method: 'POST',
						url: 'http://localhost:5000/uploads',
						json: {
							filename: files[i],
							callbackUrl: 'http://localhost:3000/video/' + newId.toString()
						}
					});
				}, (e) => {
					console.error(e);
				});
			}
		}
		res.sendStatus(200);
	});
});

// ------ PATCH

app.patch('/clips', (req, res) => {
	Clip.findOneAndUpdate({ youtubeId: req.body.youtubeId }, req.body, (err, clip) => {

	});
});

app.patch('/clips/:Id', (req, res) => {
	var id = req.params.Id;
	var youtubeId = req.body.youtubeId;

	if (!ObjectID.isValid(id)) {
		return res.sendStatus(404);
	}

	Clip.findByIdAndUpdate(id, { $set: { youtubeId: youtubeId, state: 'unlisted' } }).then((clip) => {
		if (!clip) {
			return res.sendStatus(404);
		}
		fse.move(path.join(pathToClips, clip.fileName), path.join(pathToClips, 'uploaded', clip.fileName));
		res.sendStatus(200);
	}).catch((e) => {
		res.sendStatus(400);
	});
});

app.patch('/video/:Id', (req, res) => {
	var id = req.params.Id;
	var body = req.body;

	if (!ObjectID.isValid(id)) {
		return res.sendStatus(404); // TODO
	}

	Clip.findByIdAndUpdate(id, body).then((clip) => {
		if (!clip) {
			return res.sendStatus(404);
		}

		if (clip.state === 'uploading')
		{
			fse.move(path.join(pathToClips, clip.fileName), path.join(pathToClips, 'uploaded', clip.fileName));
		}
		res.sendStatus(200);
	}).catch((e) => {
		res.sendStatus(400);
	});
});

// =======================================================================

// app.delete('/clips/:id', authenticate, (req, res) => {
//     var id = req.params.id;

//     if (!ObjectID.isValid(id))
//     {
//         return res.status(404).send();
//     }

//     Clip.findByIdAndRemove(id).then((clip) => {
//         if (!clip) {
//             return res.status(404).send();
//         }

//         res.send({clip});
//     }).catch((e) => {
//         res.status(400).send(e);
//     });
// });

// var key = fse.readFileSync(__dirname + '/certificates/private.key');
// var cert = fse.readFileSync(__dirname + '/certificates/certificate.crt');
// var ca = fse.readFileSync(__dirname + '/certificates/ca_bundle.crt');

// var options = {
// 	key: key,
// 	cert: cert,
// 	ca: ca
// };

// https.createServer(options, app).listen(SERVER_PORT, () => {
// 	console.log('Started Main Server on port', SERVER_PORT);
// });

app.listen(SERVER_PORT, () => {
	console.log('Started Family Video Server on port:', SERVER_PORT);
});

function renderTemplateToResponse(req, res, page, obj) {
	obj.isAuth = req.isAuthenticated();
	res.render(page, obj);
}

var clipSort_year = function(a, b) {
    return a.year - b.year;
};

function createHomeParameters(queries, mongoClips) {
	var obj = {};
	obj.listStyle = queries.listStyle ? queries.listStyle : 'grid';
	obj.numResults = mongoClips.length
	obj.years = [
		{ year: 'Any Year', selected: queries.year === 'Any Year' || _.isEmpty(queries) },
		{ year: '1991', selected: queries.year === '1991' },
		{ year: '1992', selected: queries.year === '1992' },
		{ year: '1993', selected: queries.year === '1993' },
		{ year: '1994', selected: queries.year === '1994' },
		{ year: '1995', selected: queries.year === '1995' },
		{ year: '1996', selected: queries.year === '1996' }
	];
	obj.members = [
		{ name: 'Papa', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Papa') },
		{ name: 'Grandma', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Grandma') },
		{ name: 'John', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('John') },
		{ name: 'Valerie', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Valerie') },
		{ name: 'Colin', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Colin') },
		{ name: 'Kelsey', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Kelsey') },
		{ name: 'Rick', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Rick') },
		{ name: 'Lauralyn', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Lauralyn') },
		{ name: 'Alicia', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Alicia') },
		{ name: 'Olivia', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Olivia') },
		{ name: 'Dave', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Dave') },
		{ name: 'Kim', selected: queries.familyMembers === undefined ? false : queries.familyMembers.includes('Kim') },
	];
	obj.tags = [
		{ tag: 'Cute', selected: queries.tags === undefined ? false : queries.tags.includes('Cute') },
		{ tag: 'Funny', selected: queries.tags === undefined ? false : queries.tags.includes('Funny') },
		{ tag: 'Heartwarming', selected: queries.tags === undefined ? false : queries.tags.includes('Heartwarming') },
		{ tag: 'Holidays', selected: queries.tags === undefined ? false : queries.tags.includes('Holidays') },
		{ tag: 'Birthdays', selected: queries.tags === undefined ? false : queries.tags.includes('Birthdays') },
		{ tag: 'Sports', selected: queries.tags === undefined ? false : queries.tags.includes('Sports') }
	];
	obj.locations = [
		{ location: 'Any Place', selected: queries.location === undefined ? _.isEmpty(queries) : queries.location.includes('Any Place') },
		{ location: 'Horseshoe Valley', selected: queries.location === undefined ? false : queries.location.includes('Horseshoe Valley') },
		{ location: "Papa and Grandma's", selected: queries.location === undefined ? false : queries.location.includes("Papa and Grandma's") },
		{ location: 'Rumball House', selected: queries.location === undefined ? false : queries.location.includes('Rumball House') },
		{ location: 'Lean House', selected: queries.location === undefined ? false : queries.location.includes('Lean House') },
		{ location: 'Cobourg', selected: queries.location === undefined ? false : queries.location.includes('Cobourg') }
	];
	obj.ratings = [
		{ rating: '1', selected: queries.ratings === undefined ? false : queries.ratings.includes('1') },
		{ rating: '2', selected: queries.ratings === undefined ? false : queries.ratings.includes('2') },
		{ rating: '3', selected: queries.ratings === undefined ? false : queries.ratings.includes('3') },
		{ rating: '4', selected: queries.ratings === undefined ? false : queries.ratings.includes('4') },
		{ rating: '5', selected: queries.ratings === undefined ? false : queries.ratings.includes('5') }
	];
	obj.currentPage = _.isEmpty(queries) ? 1 : parseInt(queries.page);
	obj.maxPages = Math.max(Math.ceil(mongoClips.length / MAX_PER_PAGE), 1);
	obj.clips = createClipsObject(mongoClips, obj.currentPage, obj.listStyle);
	if (_.isEmpty(queries)) {
		shuffleArray(obj.clips); // randomize if looking for root route
		obj.isRandom = true;
	}
	return obj;
}

var createClipsObject = function(clips, pageNumber, listStyle) {
	let startIndex = (pageNumber - 1) * MAX_PER_PAGE;
	if (clips.length > startIndex)
    {
		let max = clips.length > startIndex + MAX_PER_PAGE ? MAX_PER_PAGE : clips.length - startIndex;
		clips = clips.slice(startIndex, startIndex + max);
    }

    clips.sort(clipSort_year);

    clips.forEach(function(clip) {
		if (clip.members) {
			for (var i = 0; i < clip.members.length; i++)
			{
				clip.members[i] = ' ' + clip.members[i];
			}
		}

		if (clip.tags) {
			for (var j = 0; j < clip.tags.length; j++)
			{
				clip.tags[j] = ' ' + clip.tags[j];
			}
		}

		clip.listStyle = listStyle;
    });

    return clips;
};

function shuffleArray(array) {
	for (var i = array.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
}

// fse.readJSON(__dirname + '/db/old-data.json').then((data) => {
// 	var newJson = {clips: []};

// 	for (var i = 0; i < data.clips.length; i++) {
// 		var oldClipData = data.clips[i];
// 		var newClipData = {};
// 		newClipData.tape_id = oldClipData.tapeId;
// 		newClipData.clip_id = oldClipData.clipId;
// 		newClipData.title = oldClipData.title;
// 		newClipData.year = oldClipData.year;
// 		newClipData.location = oldClipData.location;
// 		newClipData.file_name = oldClipData.fileName;
// 		newClipData.tags = oldClipData.tags;
// 		newClipData.youtube_id = oldClipData.youtubeId;
// 		newClipData.rating = oldClipData.entertainmentRating;
// 		newClipData.members = oldClipData.familyMembers;
// 		newClipData.state = 'listed';

// 		// location
// 		if(newClipData.location === "Papa and Grandma's House") {
// 			newClipData.location = "Papa and Grandma's";
// 		}

// 		// tags
// 		if (newClipData.tags.includes("Heart Warming")) {
// 			newClipData.tags[newClipData.tags.indexOf("Heart Warming")] = "Heartwarming";
// 		}

// 		if (newClipData.tags.includes("Sports and Activities")) {
// 			newClipData.tags[newClipData.tags.indexOf("Sports and Activities")] = "Sports";
// 		}

// 		// members
// 		for (var j = 0; j < newClipData.members.length; j++) {
// 			newClipData.members[j] = familyNamesKey[newClipData.members[j]];
// 		}

// 		newJson.clips.push(newClipData);

// 		var newClip = new Clip(newClipData);
// 		newClip.save();
// 	}

// 	// fse.writeJSON(__dirname + '/db/new-data.json', newJson).then((newData) => {
// 	// 	console.dir(newData);
// 	// });
// });