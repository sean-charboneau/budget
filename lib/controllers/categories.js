var categoryQuery = require('../query/categories');

var getCategoriesForUser = exports.getCategoriesForUser = function(userId, callback) {
    categoryQuery.getCategoriesForUser(userId, callback);
};