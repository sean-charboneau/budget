var async = require('async');

var cashController = require('./cash');
var categoryController = require('./categories');
var userController = require('./users');

var tripQuery = require('../query/trips');

var getActiveTripForUser = exports.getActiveTripForUser = function(userId, callback) {
    tripQuery.getActiveTripForUser(userId, callback);
};

var getTripOverview = exports.getTripOverview = function(userId, callback) {
    var averageWeeklySpending;
    var baseCurrency;
    var tripId;
    async.series([
        function(cb) {
            getActiveTripForUser(userId, function(err, id) {
                if(err) {
                    return cb(err);
                }
                tripId = id;
                return cb();
            });
        },
        function(cb) {
            if(!tripId) {
                return cb();
            }
            userController.getUserById(userId, function(err, user) {
                if(err) {
                    return cb(err);
                }
                baseCurrency = user.base_currency;
                return cb();
            });
        },
        function(cb) {
            if(!tripId || !baseCurrency) {
                return cb();
            }
            cashController.getWeeklyAverageSpending(userId, baseCurrency, function(err, results) {
                if(err) {
                    return cb(err);
                }
                averageWeeklySpending = results[0].average;
                return cb();
            });
        }
    ], function(err, results) {
        if(err) {
            return callback(err);
        }
        return callback(null, {
            averageWeeklySpending: averageWeeklySpending,
            tripId: tripId
        });
    });
};

var saveTrip = exports.saveTrip = function(userId, tripName, startDate, segments, oneOffExpenses, currency, callback) {
    var oneoffCategoryId;
    var tripId;
    
    var totalBudget = 0;
    var totalDays = 0;
    for(var i = 0; i < segments.length; i++) {
        totalBudget += parseFloat(segments[i].budget || 0);
        totalDays += parseInt(segments[i].days || 0);
    }
    for(var i = 0; i < oneOffExpenses.length; i++) {
        totalBudget += parseFloat(oneOffExpenses[i].amount || 0);
    }

    async.series([
        function(cb) {
            tripQuery.deactivateTripsForUser(userId, cb);
        },
        function(cb) {
            tripQuery.insertTrip(userId, tripName, startDate, totalDays, totalBudget, function(err, results) {
                if(err) {
                    return cb(err);
                }
                tripId = results.insertId;
                return cb();
            });
        },
        function(cb) {
            if(!tripId) {
                return cb('No trip id');
            }
            async.eachSeries(segments, function(segment, innerCb) {
                tripQuery.insertSegment(tripId, segment.days, segment.budget, segment.country, innerCb);
            }, cb);
        },
        function(cb) {
            categoryController.getCategoryIdByName('one-off expense', function(err, categoryId) {
                if(err) {
                    return cb(err);
                }
                oneoffCategoryId = categoryId;
                return cb();
            })
        },
        function(cb) {
            if(!tripId) {
                return cb('No trip id');
            }
            if(!oneoffCategoryId) {
                return cb('No category id');
            }
            async.eachSeries(oneOffExpenses, function(expense, innerCb) {
                cashController.recordTransaction(userId, parseFloat(expense.amount), oneoffCategoryId,
                    expense.country, currency, startDate, 'Initial trip expense', null, 'credit', innerCb);
            }, cb);
        }
    ], callback);
};