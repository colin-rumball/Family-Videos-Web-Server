const express = require('express'),
    passport = require('passport'),
    Utils = require('./../utils/utils'),
    {User} = require('./../models/User'),
    {isLoggedIn} = require('./../middleware/middleware');

const router = express.Router();

router.route('/sign-in')
    .get(async (req, res) => {
        Utils.renderTemplateToResponse(req, res, 'pages/sign-in', {});
    })
    .post(passport.authenticate('local', {
        successReturnToOrRedirect: '/',
        failureRedirect: '/sign-in'
    }));

router.route('/register')
    .get(isLoggedIn, async (req, res) => {
        Utils.renderTemplateToResponse(req, res, 'pages/register', {});
    })
    .post(isLoggedIn, async (req, res) => {
        User.register(new User({ username: req.body.username }), req.body.password, (err, user) => {
            if (err) {
                return Utils.renderMessageToResponse(req, res, 'UNKNOWN_ERROR');
            }
            return passport.authenticate('local')(req, res, () => {
                res.redirect('/');
            });
        });
    });

module.exports = router;
