var async = require('async');

exports.up = function (db, callback) {
    db.runSql(
        "ALTER TABLE user_category " +
        "ADD UNIQUE unq_user_category (user_id, category_id);",
    callback);
};

exports.down = function (db, callback) {
    db.runSql("ALTER TABLE user_category DROP INDEX unq_user_category;", callback);
};