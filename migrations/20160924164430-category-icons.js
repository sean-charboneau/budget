var async = require('async');

exports.up = function (db, callback) {
    async.series([
        function(cb) {
            db.runSql(
                'ALTER TABLE category ' +
                'DROP COLUMN is_default;',
            cb);
        },
        function(cb) {
            db.runSql(
                'ALTER TABLE category ' +
                'ADD COLUMN icon VARCHAR(255) AFTER category;',
            cb);
        }
    ], callback);
};

exports.down = function (db, callback) {
    async.series([
        function(cb) {
            db.runSql(
                'ALTER TABLE category ' +
                'DROP COLUMN icon;',
            cb);
        },
        function(cb) {
            db.runSql(
                'ALTER TABLE category ' +
                'ADD COLUMN is_default TINYINT(1) AFTER category;',
            cb);
        }
    ], callback)
};