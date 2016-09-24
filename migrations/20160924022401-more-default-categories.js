var async = require('async');

exports.up = function (db, callback) {
    db.runSql(
        'INSERT INTO category (category, is_default, created_at) ' +
        'VALUES ' +
        '("alcohol", 1, CURRENT_TIMESTAMP()), ' +
        '("miscellaneous", 1, CURRENT_TIMESTAMP());',
    callback);
};

exports.down = function (db, callback) {
    db.runSql('DELETE FROM category WHERE category IN ("alcohol", "miscellaneous")', callback);
};