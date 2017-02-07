var async = require('async');

var categoryQuery = require('../query/categories');

var getCategoriesForUser = exports.getCategoriesForUser = function(userId, callback) {
    categoryQuery.getCategoriesForUser(userId, callback);
};

var getCategoryIdByName = exports.getCategoryIdByName = function(name, callback) {
    categoryQuery.getCategoryIdByName(name, callback);
};

var setDefaultCategoriesForUser = exports.setDefaultCategoriesForUser = function(userId, callback) {
    var defaultCategories = [1, 2, 3, 4, 5, 6];
    async.series([
        function(cb) {
            categoryQuery.clearCategoriesForUser(userId, cb);
        },
        function(cb) {
            categoryQuery.addCategoriesForUser(userId, defaultCategories, cb);
        }
    ], callback);
};