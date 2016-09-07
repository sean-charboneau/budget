var config = require('config');
var express = require('express');
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');

var userController = require('../lib/controllers/users');

var authenticate = expressJwt({secret: config.get('apikey')});
var router = express.Router();

var generateToken = function(req, res, next) {
	req.token = jwt.sign({
		id: req.user.id
	}, config.get('apikey'), {
		expiresIn: "2h"
	});
    res.token = req.token;
    res.cookie(config.get('tokenCookie'), req.token, { path: '/', maxAge: 900000, httpOnly: false });
    console.log('Token: ' + req.token);
	next();
};

var respond = function(req, res) {
    console.log('Token2: ' + req.token);
	res.status(200).json({
		user: req.user,
		token: req.token
	});
};

module.exports = function(passport) {

	/* Handle Login POST */
    router.post('/login', passport.authenticate('login', {
        session: false
    }), generateToken, respond);

	/* Handle Registration POST */
	router.post('/register', passport.authenticate('register', {
		session: false
	}), generateToken, respond);

	router.get('/me', authenticate, function(req, res) {
        userController.getUserById(req.user.id, function(err, user) {
            if(err) {
                return res.status(400).json({error: err});
            }
		    res.status(200).json(user);
        });
	});

	/* Handle Logout */
	router.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	return router;
}




