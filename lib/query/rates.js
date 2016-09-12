var db = require('../../db.js');

var insertRate = exports.insertRate = function(source, currency, rate, callback) {
    db.runQuery(
        "INSERT INTO exchange_rate (date, source, currency, rate, created_at) " +
        "VALUES (CURRENT_DATE(), ?, ?, ?, CURRENT_TIMESTAMP());",
        [source, currency, rate],
    callback);
};