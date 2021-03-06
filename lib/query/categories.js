var db = require('../../db.js');

var clearCategoriesForUser = exports.clearCategoriesForUser = function(userId, callback) {
    db.runQuery(
        "DELETE FROM user_category WHERE user_id = ?;",
        [userId],
    callback);
};

var getCategoryIdByName = exports.getCategoryIdByName = function(name, callback) {
    db.runQuery(
        "SELECT id FROM category WHERE category = ?;",
        [name],
        function(err, results) {
            if(err) {
                return callback(err);
            }
            return callback(null, results[0].id); // TODO make name field unique (?)
        }
    );
};

var getCategoriesForUser = exports.getCategoriesForUser = function(userId, includeOneOff, callback) {
    var query = "SELECT c.id, c.category, c.icon " + 
        "FROM category c " +
        "INNER JOIN user_category uc ON uc.user_id = ? AND c.id = uc.category_id ";
    if(includeOneOff) {
        query += "UNION " +
                    "SELECT c.id, c.category, c.icon " +
	                "FROM category c " +
	                "WHERE c.category = 'one-off expense'";
    }
    query += ";";
    db.runQuery(
        query,
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
        query = query.concat("(?, (SELECT id FROM category WHERE category = ? LIMIT 1), CURRENT_TIMESTAMP())");
        query = query.concat((i == (categoryIdArr.length - 1)) ? ";" : ",");
        params.push(userId);
        params.push(categoryId);
    }
    db.runQuery(query, params, callback);
};