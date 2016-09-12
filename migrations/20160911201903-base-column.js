var async = require('async');

exports.up = function (db, callback) {
    db.runSql(
        "ALTER TABLE user " +
        "ADD COLUMN base_currency VARCHAR(3) NOT NULL DEFAULT 'USD' AFTER last_name",
    callback);
};

exports.down = function (db, callback) {
    db.runSql("ALTER TABLE user DROP COLUMN base_currency;", callback);
};