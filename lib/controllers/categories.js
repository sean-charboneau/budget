var async = require('async');

var tripController = require('./trips');

var categoryQuery = require('../query/categories');

var getAllCategoriesForTrip = exports.getAllCategoriesForTrip = function(userId, tripId, callback) {
    tripController.getUserIdForTrip(tripId, function(err, userIdForTrip) {
        if(userId !== userIdForTrip) {
            return callback('User mismatch');
        }
        // TODO: Change to trip
        return getCategoriesForUser(userId, true, callback);
    });
};

var getCategoriesForUser = exports.getCategoriesForUser = function(userId, includeOneOff, callback) {
    categoryQuery.getCategoriesForUser(userId, includeOneOff, callback);
};

var getCategoryIdByName = exports.getCategoryIdByName = function(name, callback) {
    categoryQuery.getCategoryIdByName(name, callback);
};

var setDefaultCategoriesForUser = exports.setDefaultCategoriesForUser = function(userId, callback) {
    var defaultCategories = ["food and drink", "accommodation", "transportation", "sightseeing", "alcohol", "miscellaneous"];
    async.series([
        function(cb) {
            categoryQuery.clearCategoriesForUser(userId, cb);
        },
        function(cb) {
            categoryQuery.addCategoriesForUser(userId, defaultCategories, cb);
        }
    ], callback);
};