var config = require('config');
var express = require('express');
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');
var moment = require('moment');

var cashController = require('../lib/controllers/cash');
var categoryController = require('../lib/controllers/categories');
var tripController = require('../lib/controllers/trips');
var userController = require('../lib/controllers/users');

var authenticate = expressJwt({secret: config.get('apikey')});
var router = express.Router();

var defaultTransactionSort = { field: 'date', order: 'desc' };
var defaultTransactionLimit = 10;
var defaultTransactionFilters = [];

var generateToken = function(req, res, next) {
	req.token = jwt.sign({
		id: req.user.id
	}, config.get('apikey'), {
		expiresIn: "14d"
	});
    res.token = req.token;
    res.cookie(config.get('tokenCookie'), req.token, { path: '/', maxAge: 900000, httpOnly: false });
	next();
};

var respond = function(req, res) {
	res.status(200).json({
		user: req.user,
		token: req.token
	});
};

var scrubFilters = function(filters) {
	if(!filters) {
		return {};
	}

	var cleanFilters = {};
	if(filters.tripId) {
		try {
			cleanFilters.tripId = parseInt(filters.tripId);
		} catch(e) {}
	}
	if(filters.withdrawalId) {
		try {
			cleanFilters.withdrawalId = parseInt(filters.withdrawalId);
		} catch(e) {}
	}
	if(filters.dateStart) {
		try {
			cleanFilters.dateStart = moment(filters.dateStart).format('YYYY-MM-DD');
		} catch(e) {}
	}
	if(filters.dateEnd) {
		try {
			cleanFilters.dateEnd = moment(filters.dateEnd).format('YYYY-MM-DD');
		} catch(e) {}
	}
	if(filters.country) {
		cleanFilters.country = filters.country;
	}
	if(filters.categoryName) {
		cleanFilters.categoryName = filters.categoryName;
	}

	return cleanFilters;
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
			delete user.password_hash;
		    res.status(200).json(user);
        });
	});

	router.get('/cashReserves', authenticate, function(req, res) {
		cashController.getCashReserves(req.user.id, function(err, results) {
			if(err) {
				return res.status(400).json({error: err});
			}
			return res.status(200).json(results);
		});
	});

	router.get('/categories', authenticate, function(req, res) {
		categoryController.getCategoriesForUser(req.user.id, false, function(err, results) {
			if(err) {
				return res.status(400).json({error: err});
			}
			return res.status(200).json(results);
		});
	});

	router.get('/tripOverview', authenticate, function(req, res) {
		tripController.getTripOverview(req.user.id, function(err, results) {
			if(err) {
				return res.status(400).json({error: err});
			}
			return res.status(200).json(results);
		});
	});

	router.get('/transaction', authenticate, function(req, res) {
		var limit = req.query.limit ? parseInt(req.query.limit) : defaultTransactionLimit;
		var page = req.query.page ? parseInt(req.query.page) : 1;
		var sort = defaultTransactionSort;
		var filters = defaultTransactionFilters;

		if(req.query.sort) {
			try {
				sort = JSON.parse(decodeURIComponent(req.query.sort));
			} catch(e) {}
		}
		if(req.query.filters) {
			try {
				filters = scrubFilters(JSON.parse(decodeURIComponent(req.query.filters)));
			} catch(e) {}
		}

		cashController.getTransactions(req.user.id, limit, page, sort, filters, function(err, results) {
			if(err) {
				return res.status(400).json({error: err});
			}
			return res.status(200).json(results);
		});
	});

	router.get('/spendingData', authenticate, function(req, res) {
		var range = req.query.range;
		var tripId = req.query.tripId;
		var categories = req.query.categories || '[]';
		var graphType = req.query.graphType;

		try {
			categories = JSON.parse(categories);
		} catch(e) {
			return res.status(400).json({error: 'Invalid JSON - categories'});
		}

		cashController.getSpendingForGraph(req.user.id, tripId, graphType, range, categories, function(err, results) {
			if(err) {
				return res.status(400).json({error: err});
			}
			return res.status(200).json(results);
		});
	});

	router.get('/trips', authenticate, function(req, res) {
		tripController.getAllTripsForUser(req.user.id, function(err, results) {
			if(err) {
				return res.status(400).json({error: err});
			}
			return res.status(200).json(results);
		});
	});

	router.get('/categoriesForTrip', authenticate, function(req, res) {
		var tripId = req.query.tripId;
		categoryController.getAllCategoriesForTrip(req.user.id, tripId, function(err, results) {
			if(err) {
				return res.status(400).json({error: err});
			}
			return res.status(200).json(results);
		});
	});

	router.post('/profile', authenticate, function(req, res) {
		var firstName = req.body.firstName;
		var lastName = req.body.lastName;
		var email = req.body.email;

		userController.updateUser(req.user.id, firstName, lastName, email, function(err, results) {
			if(err) {
				return res.status(400).json({error: err});
			}
			return res.status(200).json(results);
		});
	});

	router.post('/trip', authenticate, function(req, res) {
		var currency = req.body.currency;
		var name = req.body.name;
		var startDate = req.body.startDate;
		var segments = req.body.segments;
		var oneOffExpenses = req.body.oneOffExpenses;
		
		try {
			startDate = moment(startDate).format('YYYY-MM-DD');
		} catch(e) {
			return res.status(400).json({error: 'Invalid date format'});
		}
		try {
			segments = JSON.parse(segments);
		} catch(e) {
			return res.status(400).json({error: 'Invalid JSON - segments'});
		}
		try {
			oneOffExpenses = JSON.parse(oneOffExpenses);
		} catch(e) {
			return res.status(400).json({error: 'Invalid JSON - oneOffExpenses'});
		}

		tripController.saveTrip(req.user.id, name, startDate, segments, oneOffExpenses, currency, function(err, results) {
			if(err) {
				console.log(err);
				return res.status(400).json({error: err});
			}
			return res.status(200).json(results);
		});
	});

	router.post('/transaction', authenticate, function(req, res) {
		var amount = req.body.amount;
		var categoryId = req.body.categoryId;
		var country = req.body.country;
		var currency = req.body.currency;
		var date = req.body.date;
		var description = req.body.description;
		var endDate = req.body.endDate;
		var type = req.body.type;

		try {
			date = moment(date).format('YYYY-MM-DD');
		} catch(e) {
			return res.status(400).json({error: 'Invalid date format'});
		}
		if(endDate) {
			try {
				endDate = moment(endDate).format('YYYY-MM-DD');
			} catch(e) {
				return res.status(400).json({error: 'Invalid date format'});
			}
		}
		try {
			amount = parseFloat(amount);
		} catch(e) {
			return res.status(400).json({error: 'Invalid amount format'});
		}

		if(!amount) {
			return res.status(400).json({error: 'Amount is required'});
		}
		if(!type) {
			return res.status(400).json({error: 'Type is required'});
		}
		if(!categoryId) {
			return res.status(400).json({error: 'Category is required'});
		}
		if(!currency) {
			return res.status(400).json({error: 'Currency is required'});
		}
		if(!date) {
			return res.status(400).json({error: 'Date is required'});
		}
		cashController.recordTransaction(req.user.id, amount, categoryId, country, currency, date, description, endDate, type, function(err, results) {
			if(err) {
				return res.status(400).json({error: err});
			}
			cashController.getTransactions(req.user.id, defaultTransactionLimit, 1, defaultTransactionSort, defaultTransactionFilters, function(err, results) {
				if(err) {
					return res.status(400).json({error: err});
				}
				return res.status(200).json(results);
			});
		});
	});

	router.get('/withdrawal', authenticate, function(req, res) {
		var limit = req.query.limit ? parseInt(req.query.limit) : defaultTransactionLimit;
		var page = req.query.page ? parseInt(req.query.page) : 1;
		var sort = defaultTransactionSort;
		var filters = defaultTransactionFilters;

		if(req.query.sort) {
			try {
				sort = JSON.parse(decodeURIComponent(req.query.sort));
			} catch(e) {}
		}
		if(req.query.filters) {
			try {
				filters = scrubFilters(JSON.parse(decodeURIComponent(req.query.filters)));
			} catch(e) {}
		}
		if(filters.country && filters.country.length !== 2) {
			return res.status(400).json({error: 'Invalid country code'});
		}

		cashController.getWithdrawals(req.user.id, limit, page, sort, filters, function(err, results) {
			if(err) {
				return res.status(400).json({error: err});
			}
			return res.status(200).json(results);
		});
	});

	router.post('/withdrawal', authenticate, function(req, res) {
		var amount = req.body.amount;
		var currency = req.body.currency;
		var date = req.body.date;
		var isEarnedCash = (req.body.isEarnedCash == 'true');
		var isFee = (req.body.isFee == 'true');
		var feeAmount = req.body.feeAmount;

		try {
			date = moment(date).format('YYYY-MM-DD');
		} catch(e) {
			return res.status(400).json({error: 'Invalid date format'});
		}
		try {
			amount = parseFloat(amount);
		} catch(e) {
			return res.status(400).json({error: 'Invalid amount format'});
		}
		if(isFee) {
			try {
				feeAmount = parseFloat(feeAmount);
			} catch(e) {
				return res.status(400).json({error: 'Invalid fee amount format'});
			}
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
		
		cashController.recordWithdrawalAndCheckForNegatives(req.user.id, amount, currency, date, isEarnedCash, isFee, feeAmount, function(err, results) {
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




