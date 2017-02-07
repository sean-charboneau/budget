var async = require('async');

exports.up = function (db, callback) {
    db.runSql(
        "ALTER TABLE transaction " +
        "   ADD COLUMN trip_id INT AFTER user_id, " +
        "   ADD FOREIGN KEY (trip_id) REFERENCES trip(id);",
    callback);
};

exports.down = function (db, callback) {
    db.runSql(
        "ALTER TABLE transaction " +
        "   DROP FOREIGN KEY transaction_ibfk_2, " +
        "   DROP COLUMN trip_id;",
    callback);
};