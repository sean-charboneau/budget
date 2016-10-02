var async = require('async');

exports.up = function (db, callback) {
    async.series([
        function(cb) {
            db.runSql(
                "ALTER TABLE transaction " +
                "CHANGE category category_id INT;",
            cb);
        },
        function(cb) {
            db.runSql(
                "ALTER TABLE transaction " +
                "ADD CONSTRAINT fk_category_id FOREIGN KEY (category_id) REFERENCES category(id);",
            cb);
        }
    ], callback);
};

exports.down = function (db, callback) {
    async.series([
        function(cb) {
            db.runSql("ALTER TABLE user_category DROP INDEX fk_category_id;", cb);
        },
        function(cb) {
            db.runSql(
                "ALTER TABLE transaction " +
                "CHANGE category_id category VARCHAR(255);",
            cb);
        }
    ], callback);
};