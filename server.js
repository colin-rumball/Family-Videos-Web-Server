var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
const axios = require('axios');

var {mongoose} = require('./db/mongoose');
var {Clip} = require('./models/Clip');
var {ObjectID} = require('mongodb');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

const SERVER_PORT = process.env.PORT || 3000;

app.get('/clips/:queries', (req, res) => {
    var queries = req.params.queries;
    var clipJSON = JSON.parse(decodeURIComponent(queries));
    
    var query = JSON.stringify({
        title: clipJSON.titleQuery != undefined ? {$regex : clipJSON.titleQuery, $options: 'i' } : undefined,
        familyMembers: clipJSON.familyMembers != undefined ? { $all : clipJSON.familyMembers } : undefined,
        year: clipJSON.year,
        location: clipJSON.location,
        tags: clipJSON.tags != undefined ? { $all : clipJSON.tags } : undefined,
        entertainmentRating: clipJSON.entertainmentRatings != undefined ? { $in : clipJSON.entertainmentRatings } : undefined,
    });
    Clip.find(JSON.parse(query)).then((clips) => {
        res.send({clips});
    });
});

app.get('/clips', (req, res) => {
    Clip.find({}).then((clips) => {
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

app.listen(SERVER_PORT, () => {
    console.log('Started Main Server on port', SERVER_PORT);
});