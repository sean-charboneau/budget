var db = require('../../db.js');

var insertRate = exports.insertRate = function(source, currency, rate, callback) {
    db.runQuery(
        "INSERT INTO exchange_rate (date, source, currency, rate, created_at) " +
        "VALUES (CURRENT_DATE(), ?, ?, ?, CURRENT_TIMESTAMP());",
        [source, currency, rate],
    callback);
};

var getMostRecentExchangeRate = exports.getMostRecentExchangeRate = function(source, currency, callback) {
    db.runQuery(
        "SELECT rate FROM exchange_rate WHERE source = ? AND currency = ? ORDER BY date DESC LIMIT 1;",
        [source, currency],
    function(err, results) {
        if(err) {
            return callback(err);
        }
        if(!results.length) {
            return callback('No exchange rate found');
        }
        return callback(null, results[0].rate);
    });
};

var getRateForDate = exports.getRateForDate = function(source, currency, date, fallback, callback) {
    db.runQuery(
        "SELECT rate FROM exchange_rate WHERE source = ? AND currency = ? AND date = ?;",
        [source, currency, date],
    function(err, results) {
        if(err) {
            return callback(err);
        }
        if(!results.length) {
            if(fallback) {
                return getMostRecentExchangeRate(source, currency, callback);
            }
            return callback();
        }
        return callback(null, results[0].rate);
    });
};