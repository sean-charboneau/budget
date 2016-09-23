var async = require('async');

var rateController = require('./rates');
var userController = require('./users');

var cashQuery = require('../query/cash');

var getCashReserves = exports.getCashReserves = function(userId, callback) {
    // return callback(null, [{currency: 'USD', amount: 230.50, worth: 230.50, base: 'USD'}, {currency: 'COP', amount: 420000, worth: 123.45, base: 'USD'}]);
    var currencies = {};
    cashQuery.getAvailableCash(userId, function(err, results) {
        if(err) {
            return callback(err);
        }
        if(!results || !results.length) {
            return callback(null, []);
        }
        for(var i = 0; i < results.length; i++) {
            var row = results[i];
            var remainingAmount = row.amount - row.used;
            var percentageRemaining = remainingAmount / row.amount;
            var remainingWorth = row.base_amount * percentageRemaining;

            if(!currencies[row.currency]) {
                currencies[row.currency] = {
                    currency: row.currency,
                    base: row.base_currency,
                    amount: 0,
                    worth: 0
                }
            }

            currencies[row.currency].amount += remainingAmount;
            currencies[row.currency].worth += remainingWorth;
        }
        var ret = [];
        for(var key in currencies) {
            if(currencies.hasOwnProperty(key)) {
                ret.push(currencies[key]);
            }
        }
        console.log(ret);
        return callback(null, ret);
    });
};

var recordWithdrawal = exports.recordWithdrawal = function(userId, amount, currency, date, isFee, feeAmount, callback) {
    var baseCurrency;
    var exchangeRate;
    async.series([
        function(cb) {
            userController.getUserById(userId, function(err, results) {
                if(err) {
                    return cb(err);
                }
                baseCurrency = results.base_currency;
                return cb();
            });
        },
        function(cb) {
            console.log(baseCurrency);
            if(!baseCurrency) {
                return cb('No base currency found for user: ' + userId);
            }
            rateController.getRateForDate(baseCurrency, currency, date, function(err, results) {
                if(err) {
                    return cb(err);
                }
                exchangeRate = results;
                return cb();
            });
        },
        function(cb) {
            var totalAmount = parseFloat(amount) + (isFee ? parseFloat(feeAmount) : 0);
            var baseAmount = totalAmount / exchangeRate;
            cashQuery.recordWithdrawal(userId, currency, amount, baseCurrency, baseAmount, date, cb);
        }
    ], callback);
};