var async = require('async');

exports.up = function (db, callback) {
    db.runSql(
        "ALTER TABLE transaction " +
        "ADD COLUMN type ENUM ('CASH', 'CREDIT') AFTER user_id;",
    callback);
};

exports.down = function (db, callback) {
    db.runSql("ALTER TABLE transaction DROP COLUMN type;", callback);
};