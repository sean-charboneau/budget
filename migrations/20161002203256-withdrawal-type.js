var async = require('async');

exports.up = function (db, callback) {
    db.runSql(
        "ALTER TABLE withdrawal " +
        "ADD COLUMN type ENUM ('ATM', 'EARNED', 'NEGATIVE') AFTER user_id;",
    callback);
};

exports.down = function (db, callback) {
    db.runSql("ALTER TABLE withdrawal DROP COLUMN type;", callback);
};