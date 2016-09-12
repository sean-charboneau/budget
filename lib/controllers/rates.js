var rateQuery = require('../query/rates');

var insertRate = exports.insertRate = function(source, currency, rate, callback) {
    rateQuery.insertRate(source, currency, rate, callback);
};