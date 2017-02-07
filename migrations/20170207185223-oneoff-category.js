var async = require('async');

exports.up = function (db, callback) {
    db.runSql(
        'INSERT INTO category (category, created_at) ' +
        'VALUES ' +
        '("one-off expense", CURRENT_TIMESTAMP());',
    callback);
};

exports.down = function (db, callback) {
    db.runSql('DELETE FROM category WHERE category IN ("one-off expense")', callback);
};