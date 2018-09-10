const express = require('express');
// const {ObjectID} = require('mongodb');
const path = require('path');
const fse = require('fs-extra');
const request = require('request-promise-native');
const Clip = require('./../models/Clip');
const Utils = require('./../utils/utils');
const {checkAuthToken, isLoggedIn} = require('./../middleware/middleware');

const router = express.Router();

router.route('/:id')
    .get(async (req, res) => {
        const mongoId = req.params.id;
        /*if (!ObjectID.isValid(mongoId)) {
            return Utils.renderMessageToResponse(req, res, 'INVALID_VIDEO_ID', [mongoId]);
        }*/
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

        if (body.members) {
            body.members = body.members.length > 0 ? body.members : undefined;
        }
        if (body.tags) {
            body.tags = body.tags.length > 0 ? body.tags : undefined;
        }

        // Remove undefined values
        body = JSON.parse(JSON.stringify(body));

        Clip.findByIdAndUpdate(id, body).then((clip) => {
            if (!clip) {
                return res.sendStatus(404);
            }

            if (clip.state === 'uploading')
            {
            } else {
                request({
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
                })
                .then(() => {
                })
                .catch((err) => {
                    
                });
            }
            res.sendStatus(200);
        }).catch((err) => {
            res.sendStatus(500);
        });
    });

router.get('.json', isLoggedIn, (req, res) => {
    Clip.find({}).then((mongoClips) => {
        res.send({ videos: mongoClips });
    }, (err) => {
        Utils.renderMessageToResponse(req, res, 'NO_DATABASE_RESPONSE');
    });
});

module.exports = router;