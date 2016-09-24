var async = require('async');
var moment = require('moment');

var rateController = require('./rates');
var userController = require('./users');

var cashQuery = require('../query/cash');

var getCashReserves = exports.getCashReserves = function(userId, callback) {
    // return callback(null, [{currency: 'USD', amount: 230.50, worth: 230.50, base: 'USD'}, {currency: 'COP', amount: 420000, worth: 123.45, base: 'USD'}]);
    var baseCurrency;
    var exchangeRateToday = {};
    var currencyArr = [];
    async.series([
        function(cb) {
            userController.getUserById(userId, function(err, user) {
                if(err) {
                    return cb(err);
                }
                baseCurrency = user.base_currency;
                return cb();
            });
        },
        function(cb) {
            var currencies = {};
            cashQuery.getAvailableCash(userId, function(err, results) {
                if(err) {
                    return cb(err);
                }
                if(!results || !results.length) {
                    return cb(null, []);
                }
                async.eachSeries(results, function(row, innerCb) {
                    var remainingAmount = row.amount - row.used;
                    var percentageRemaining = remainingAmount / row.amount;
                    var remainingWorth;
                    if(row.base_currency || exchangeRateToday[row.currency]) {
                        if(row.base_currency) {
                            remainingWorth = row.base_amount * percentageRemaining;
                        }
                        else {
                            remainingWorth = remainingAmount / exchangeRateToday[row.currency];
                            console.log('Cash transaction, exchange rate known.  Worth ' + remainingWorth);
                        }

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
                        return innerCb();
                    }
                    else {
                        rateController.getRateForDate(baseCurrency, row.currency, moment().format('YYYY-MM-DD'), function(err, exchangeRate) {
                            if(err) {
                                return innerCb(err);
                            }
                            exchangeRateToday[row.currency] = exchangeRate;
                            var remainingWorth = remainingAmount / exchangeRateToday[row.currency];
                            console.log('Cash transaction, looked up rate.  Worth ' + remainingWorth);

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
                            return innerCb();
                        });
                    }
                }, function(err, results) {
                    if(err) {
                        return cb(err);
                    }
                    for(var key in currencies) {
                        if(currencies.hasOwnProperty(key)) {
                            currencyArr.push(currencies[key]);
                        }
                    }
                    return cb();
                });
            });
        }
    ], function(err, results) {
        if(err) {
            return callback(err);
        }
        return callback(null, currencyArr);
    });
};

var recordWithdrawal = exports.recordWithdrawal = function(userId, amount, currency, date, isEarnedCash, isFee, feeAmount, callback) {
    var baseCurrency = null;
    var exchangeRate;
    async.series([
        function(cb) {
            if(isEarnedCash) {
                // Don't need base currency
                return cb();
            }
            userController.getUserById(userId, function(err, user) {
                if(err) {
                    return cb(err);
                }
                baseCurrency = user.base_currency;
                return cb();
            });
        },
        function(cb) {
            if(isEarnedCash) {
                // Don't need base currency
                return cb();
            }
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
            var baseAmount = 0;
            if(!isEarnedCash) {
                var totalAmount = parseFloat(amount) + (isFee ? parseFloat(feeAmount) : 0);
                baseAmount = totalAmount / exchangeRate;
            }
            cashQuery.recordWithdrawal(userId, currency, amount, baseCurrency, baseAmount, date, cb);
        }
    ], callback);
};