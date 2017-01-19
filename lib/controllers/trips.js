var async = require('async');

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
            cashQuery.getWeeklyAverageSpending(userId, baseCurrency, function(err, results) {
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