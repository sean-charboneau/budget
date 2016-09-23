var config = require('config');
var express = require('express');
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');
var moment = require('moment');

var cashController = require('../lib/controllers/cash');
var userController = require('../lib/controllers/users');

var authenticate = expressJwt({secret: config.get('apikey')});
var router = express.Router();

var generateToken = function(req, res, next) {
	req.token = jwt.sign({
		id: req.user.id
	}, config.get('apikey'), {
		expiresIn: "14d"
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
        session: false,
		failWithError: true
    }), generateToken, respond);

	/* Handle Registration POST */
	router.post('/register', passport.authenticate('register', {
		session: false,
		failWithError: true
	}), generateToken, respond);

	router.get('/me', authenticate, function(req, res) {
        userController.getUserById(req.user.id, function(err, user) {
            if(err) {
                return res.status(400).json({error: err});
            }
		    res.status(200).json(user);
        });
	});

	router.get('/cashReserves', authenticate, function(req, res) {
		cashController.getCashReserves(req.user.id, function(err, results) {
			if(err) {
				res.status(400).json({error: err});
			}
			res.status(200).json(results);
		});
	});

	router.post('/withdrawal', authenticate, function(req, res) {
		var amount = req.body.amount;
		var currency = req.body.currency;
		var date = req.body.date;
		var isFee = req.body.isFee;
		var feeAmount = req.body.feeAmount;

		try {
			date = moment(date).format('YYYY-MM-DD');
		} catch(e) {
			return res.status(400).json({error: 'Invalid date format'});
		}
		if(!amount) {
			return res.status(400).json({error: 'Amount is required'});
		}
		if(!date) {
			return res.status(400).json({error: 'Date is required'});
		}
		if(!currency) {
			return res.status(400).json({error: 'Currency is required'});
		}
		

		cashController.recordWithdrawal(req.user.id, amount, currency, date, isFee, feeAmount, function(err, results) {
			if(err) {
				return res.status(400).json({error: err});
			}
			cashController.getCashReserves(req.user.id, function(err, results) {
				if(err) {
					return res.status(400).json({error: err});
				}
				return res.status(200).json(results);
			});
		});
	});

	/* Handle Logout */
	router.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	return router;
}




