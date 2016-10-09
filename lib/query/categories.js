var db = require('../../db.js');

var clearCategoriesForUser = exports.clearCategoriesForUser = function(userId, callback) {
    db.runQuery(
        "DELETE FROM user_category WHERE user_id = ?;",
        [userId],
    callback);
};

var getCategoriesForUser = exports.getCategoriesForUser = function(userId, callback) {
    db.runQuery(
        "SELECT c.id, c.category, c.icon " + 
        "FROM category c " +
        "INNER JOIN user_category uc ON uc.user_id = ? AND c.id = uc.category_id " +
        "ORDER BY uc.id ASC;",
        [userId],
    callback);
};

var addCategoriesForUser = exports.addCategoriesForUser = function(userId, categoryIdArr, callback) {
    if(!categoryIdArr || !categoryIdArr.length) {
        return callback('Invalid category array');
    }
    if(!Array.isArray(categoryIdArr)) {
        categoryIdArr = [categoryIdArr];
    }
    var query = "INSERT INTO user_category (user_id, category_id, created_at) VALUES ";
    var params = [];
    for(var i = 0; i < categoryIdArr.length; i++) {
        var categoryId = categoryIdArr[i];
        query = query.concat("(?, ?, CURRENT_TIMESTAMP())");
        query = query.concat((i == (categoryIdArr.length - 1)) ? ";" : ",");
        params.push(userId);
        params.push(categoryId);
    }
    db.runQuery(query, params, callback);
};