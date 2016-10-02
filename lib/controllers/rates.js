var rateQuery = require('../query/rates');

var insertRate = exports.insertRate = function(source, currency, rate, callback) {
    rateQuery.insertRate(source, currency, rate, callback);
};

var getRateForDate = exports.getRateForDate = function(source, currency, date, fallback, callback) {
    rateQuery.getRateForDate(source, currency, date, fallback, callback);
};