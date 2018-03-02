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
	path = require('path');

var {ObjectID} = require('mongodb');
var {mongoose} = require('./db/mongoose');
var {Clip} = require('./models/Clip');
var {User} = require('./models/User');
var {isLoggedIn} = require('./middleware/middleware');

const SERVER_PORT = process.env.PORT;

var familyNamesKey = {
    'Kenneth Rumball': 'Papa',
    'Catherine Rumball': 'Grandma',
    'John Rumball': 'John',
    'Valerie Rumball': 'Valerie',
    'Colin Rumball': 'Colin',
    'Kelsey Rumball': 'Kelsey',
    'Rick Lean': 'Rick',
    'Lauralyn Lean': 'Lauralyn',
    'Alicia Lean': 'Alicia',
    'Olivia Lean': 'Olivia',
    'David Rumball': 'Dave',
    'Kimberley Rumball': 'Kim'
};

var tagsKey = {
    'Cute': 'Cute',
    'Funny': 'Funny',
    'Heart Warming': 'Heartwarming',
    'Holidays': 'Holidays',
    'Birthdays': 'Birthdays',
    'Sports and Activities': 'Sports'
};

var app = express();
// if this isn't working then it's likely a naming issue
hbs.registerPartials(__dirname + '/../views/partials');
hbs.registerHelper('createYear', function (year, currentYear, options) {
	var out = "<ul>";

	for (var i = 0, l = items.length; i < l; i++) {
		out = out + "<li>" + options.fn(items[i]) + "</li>";
	}

	return out + "</ul>";
});

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

const pathToClips = path.join(__dirname, '..', 'clips');

// ------ GET

app.get('/', (req, res) => {
    Clip.find({}).then((mongoClips) => {
		var clips = createClipsObject(mongoClips);
		var isAuth = req.isAuthenticated();
		res.render('pages/home', {clips, isAuth});
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/clips', (req, res) => {
	var queries = req.query;

	// Stringify to remove undefined values
	var mongoQuery = JSON.stringify({
		title: queries.title != undefined ? { $regex: queries.title, $options: 'i' } : undefined,
		familyMembers: queries.familyMembers != undefined ? { $all: queries.familyMembers } : undefined,
		year: queries.year,
		location: queries.location,
		tags: queries.tags != undefined ? { $all: queries.tags } : undefined,
		entertainmentRating: queries.entertainmentRatings != undefined ? { $in: queries.entertainmentRatings } : undefined,
	});

	Clip.find(JSON.parse(mongoQuery)).then((mongoClips) => {
		var clips = createClipsObject(mongoClips);
		var isAuth = req.isAuthenticated();
		res.render('pages/home', { clips, isAuth });
	}, (e) => {
		res.status(400).send(e);
	});
});

app.get('/video/:id', (req, res) => {
	var youtubeId = req.params.id;
	var isAuth = req.isAuthenticated();
	Clip.findOne({ youtubeId: youtubeId}).then((clip) => {
		res.render('pages/video', {clip, isAuth});
	}).catch((e) => {
		res.redirect('/');
	});
});

app.get('/register', (req, res) => {
	res.render('pages/register');
});

app.get('/sign-in', (req, res) => {
	res.render('pages/sign-in');
});

app.get('/upload', isLoggedIn, (req, res) => {
	fse.readdir(pathToClips).then((contents) => {
		var justFiles = contents.filter((file) => {
			let filePath = path.join(pathToClips, file);
			let stats = fse.statSync(filePath);
			return !stats.isDirectory();
		});
		res.render('pages/upload', { files: justFiles });
	});
});

// ------ POST

app.post('/register', (req, res) => {
	User.register(new User({ username: req.body.username }), req.body.password, (err, user) => {
		if (err) {
			console.error(err);
			return res.render('pages/register');
		}

		passport.authenticate('local')(req, res, () => {
			res.redirect('/');
		})
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
					tapeId: tapeId,
					clipId: clipId,
					title: files[i],
					year: 9999,
					location: 'unset',
					filmedBy: 'unset',
					familyMembers: [],
					entertainmentRating: 0,
					youtubeId: undefined,
					tags: [],
					fileName: files[i],
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
							callbackUrl: 'http://localhost:3000/clips/' + newId.toString()
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

app.listen(SERVER_PORT, () => {
	console.log('Started Main Server on port', SERVER_PORT);
});

var clipSort_year = function(a, b) {
    return a.year - b.year;
};

var createClipsObject = function(clips) {
    if (clips.length > 40)
    {
        clips = clips.slice(0, 40);
    }

    clips.sort(clipSort_year);

    clips.forEach(function(clip) {
		if (clip.familyMembers) {
       		for (var i = 0; i < clip.familyMembers.length; i++)
			{
				clip.familyMembers[i] = ' ' + familyNamesKey[clip.familyMembers[i]];
			}
		}

		if (clip.tags) {
			for (var j = 0; j < clip.tags.length; j++)
			{
				clip.tags[j] = ' ' + tagsKey[clip.tags[j]];
			}
		}
    });

    return clips;
};