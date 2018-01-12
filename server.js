require('./config/config');

var express = require('express');
var cors = require('cors');
const hbs = require('hbs');
var bodyParser = require('body-parser');
const _ = require('lodash');
const axios = require('axios');
var {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Clip} = require('./models/Clip');
var {User} = require('./models/User');
var {authenticate} = require('./middleware/authenticate');

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

hbs.registerPartials(__dirname + '/views/partials');
app.use('/public', express.static(__dirname + '/public'));
app.set('view engine', 'hbs');

// URL stuff
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
    Clip.find({}).then((mongoClips) => {
        var clips = createClipsObject(mongoClips);
        res.render('page.hbs', {clips});
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get('/clips', (req, res) => {
    Clip.find({}).then((mongoClips) => {
        var clips = createClipsObject(mongoClips);
        res.send({clips});
    });
});

app.get('/clips/:queries', (req, res) => {
    var queries = req.params.queries;
    var clipJSON = JSON.parse(decodeURIComponent(queries));
    
    // Stringify to remove undefined values
    var query = JSON.stringify({
        title: clipJSON.titleQuery != undefined ? {$regex : clipJSON.titleQuery, $options: 'i' } : undefined,
        familyMembers: clipJSON.familyMembers != undefined ? { $all : clipJSON.familyMembers } : undefined,
        year: clipJSON.year,
        location: clipJSON.location,
        tags: clipJSON.tags != undefined ? { $all : clipJSON.tags } : undefined,
        entertainmentRating: clipJSON.entertainmentRatings != undefined ? { $in : clipJSON.entertainmentRatings } : undefined,
    });
    Clip.find(JSON.parse(query)).then((mongoClips) => {
        var clips = createClipsObject(mongoClips);
        res.send({clips});
    });
});

app.patch('/clips', (req, res) => {
    var id = req.body.clipId;
    var youtubeId = req.body.videoId;
    console.log(`Updating ${id} with YouTube ID ${youtubeId}`);

    if (!ObjectID.isValid(id))
    {
        return res.status(404).send();
    }

    Clip.findByIdAndUpdate(id, { $set: {youtubeId: youtubeId}}).then((clip) => {
        if (!clip)
        {
            return res.status(404).send();
        }

        res.status(200).send();
    }).catch((e) => {
        res.status(400).send();
    });
});

app.post('/clips', (req, res) => {
    
    var clip = new Clip({
        tapeId: req.body.tapeId,
        clipId: req.body.clipId,
        title: req.body.title,
        year: req.body.year,
        location: req.body.location,
        filmedBy: req.body.filmedBy,
        familyMembers: req.body.familyMembers,
        entertainmentRating: req.body.entertainmentRating,
        youtubeId: req.body.youtubeId,
        tags: req.body.tags,
        fileName: req.body.fileName
    });

    clip.save().then((doc) => {
        var newId = doc._id;
        console.log('New document of clip saved successfully', newId);
        res.status(200).send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

app.delete('/clips/:id', (req, res) => {
    var id = req.params.id;

    if (!ObjectID.isValid(id))
    {
        return res.status(404).send();
    }

    Clip.findByIdAndRemove(id).then((clip) => {
        if (!clip) {
            return res.status(404).send();
        }

        res.send({clip});
    }).catch((e) => {
        res.status(400).send(e);
    });
});

app.post('/users', (req, res) => {
    var body = _.pick(req.body, ['email', 'password']);
    var user = new User(body);

    // TODO: check that creation code is right

    user.save().then(() => {
        return user.generateAuthToken();
    }).then((token) => {
        res.header('x-auth', token).send(user);
    }).catch((err) => {
        res.status(400).send(err);
    });
});

app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
});

app.post('/users/login', (req, res) => {
    var body = _.pick(req.body, ['email', 'password']);

    User.findByCredentials(body.email, body.password).then((user) => {
        return user.generateAuthToken().then((token) => {
            res.header('x-auth', token).send(user);
        })
        res.send(user);
    }).catch((e) => {
        res.status(400).send();
    });
});

app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send();
    }).catch((e) => {
        res.status(400).send(e);
    });
});

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
        for (var i = 0; i < clip.familyMembers.length; i++)
        {
            clip.familyMembers[i] = ' ' + familyNamesKey[clip.familyMembers[i]];
        }

        for (var j = 0; j < clip.tags.length; j++)
        {
            clip.tags[j] = ' ' + tagsKey[clip.tags[j]];
        }
    });

    return clips;
};

module.exports = {
    app
}