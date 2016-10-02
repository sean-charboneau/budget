var db = require('../../db.js');

var getCategoriesForUser = exports.getCategoriesForUser = function(userId, callback) {
    db.runQuery(
        "SELECT c.id, c.category, c.icon " + 
        "FROM category c " +
        "INNER JOIN user_category uc ON uc.user_id = ? AND c.id = uc.category_id " +
        "ORDER BY uc.id ASC;",
        [userId],
    callback);
};