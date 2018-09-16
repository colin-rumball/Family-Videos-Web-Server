const express = require('express');
const request = require('request-promise-native');
const Clip = require('./../models/Clip');
const Utils = require('./../utils/utils');
const {isLoggedIn} = require('./../middleware/middleware');

const router = express.Router();

router.route('/:id')
    .get(async (req, res) => {
        const mongoId = req.params.id;
        return Clip.findById(mongoId).then((clip) => {
            if (clip.members) {
                clip.membersString = clip.members.join(', ');
            }
            if (clip.tags) {
                clip.tagsString = clip.tags.join(', ');
            }
            Utils.renderTemplateToResponse(req, res, 'pages/video', { clip });
        }).catch((err) => {
            Utils.renderMessageToResponse(req, res, 'VIDEO_NOT_FOUND', [mongoId]);
        });
    })
    .patch(async (req, res) => {
        const {id} = req.params;
        let {body} = req;

        // Clear empty arrays
        if (body.members) {
            body.members = body.members.length > 0 ? body.members : undefined;
        }
        if (body.tags) {
            body.tags = body.tags.length > 0 ? body.tags : undefined;
        }

        // Remove undefined values
        body = JSON.parse(JSON.stringify(body));

        try {
            // Update the DB with the new info
            const clip = await Clip.findByIdAndUpdate(id, body);
            if (!clip) {
                return res.sendStatus(404);
            }

            // Update the info on YouTube as well if it was a user change.
            // (Only for consistency, not required for the service to work)
            if (clip.state !== 'uploading')
            {
                const requestOptions = {
                    headers: {
                        'x-auth': process.env.MASTER_AUTH_TOKEN
                    },
                    method: 'PATCH',
                    url: process.env.YOUTUBE_URL + '/videos',
                    json: {
                        videoId: body.youtube_id,
                        title: body.title,
                        description: body.members.toString() || clip.members.toString(),
                        tags: body.tags.toString() || clip.tags.toString()
                    }
                };
                request(requestOptions);
            }

            return res.sendStatus(200);
        } catch (err) {
            return res.sendStatus(500);
        }
    });

// Returns a json representation of the entire DB
router.get('.json', isLoggedIn, async (req, res) => {
    try {
        const mongoClips = await Clip.find({});
        res.send({ videos: mongoClips });
    }
    catch (err) {
        Utils.renderMessageToResponse(req, res, 'NO_DATABASE_RESPONSE');
    }
});

module.exports = router;