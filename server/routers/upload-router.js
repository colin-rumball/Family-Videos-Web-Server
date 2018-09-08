const express = require('express'),
    path = require('path'),
    request = require('request-promise-native'),
    Clip = require('./../models/Clip'),
    Utils = require('./../utils/utils'),
    {uploadParser, isLoggedIn} = require('./../middleware/middleware');

const router = express.Router();

router.use(isLoggedIn);

router.get('/uploads-stream', (req, res) => {
    res.redirect(path.join(process.env.YOUTUBE_URL, 'uploads-stream'));
});

router.route('/*')
    .get(async (req, res) => {
        Utils.renderTemplateToResponse(req, res, 'pages/upload', { });
    })
    .post(uploadParser.any(), async (req, res) => {
        req.files.forEach(async (uploadedFile) => {
            const fileName = uploadedFile.originalname;
            const tapeId = parseInt(fileName.substr(fileName.indexOf('Tape') + 5, 1));
            const clipId = parseInt(fileName.substr(fileName.indexOf('Sub') + 4, 2));
            const clipBody = {
                tape_id: tapeId,
                clip_id: clipId,
                title: fileName,
                year: 9999,
                location: 'unset',
                filmedBy: 'unset',
                members: [],
                rating: 0,
                youtube_id: undefined,
                tags: [],
                file_name: fileName,
                state: 'uploading'
            };
            const newClip = new Clip(clipBody);
            const doc = await newClip.save();
            // Request the upload to youtube
            request({
                headers: {
                    'x-auth': process.env.MASTER_AUTH_TOKEN
                },
                method: 'POST',
                url: process.env.YOUTUBE_URL + '/uploads',
                json: {
                    filename: uploadedFile.filename,
                    callbackUrl: req.headers.origin + '/video/' + doc._id.toString()
                }
            });
        });
    });

module.exports = router;