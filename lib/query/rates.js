var db = require('../../db.js');

var insertRate = exports.insertRate = function(source, currency, rate, callback) {
    db.runQuery(
        "INSERT INTO exchange_rate (date, source, currency, rate, created_at) " +
        "VALUES (CURRENT_DATE(), ?, ?, ?, CURRENT_TIMESTAMP());",
        [source, currency, rate],
    callback);
};

var getRateForDate = exports.getRateForDate = function(source, currency, date, callback) {
    db.runQuery(
        "SELECT rate FROM exchange_rate WHERE source = ? AND currency = ? AND date = ?;",
        [source, currency, date],
    function(err, results) {
        if(err) {
            return callback(err);
        }
        if(!results.length || results.length > 1) {
            return callback('Invalid exchange rate results');
        }
        return callback(null, results[0].rate);
    });
};