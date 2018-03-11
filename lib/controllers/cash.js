var async = require('async');
var moment = require('moment');

var redis = require('../../redis');

var rateController = require('./rates');
var tripController = require('./trips');
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
                    var remainingWorth;
                    if(row.type == 'ATM' || exchangeRateToday[row.currency]) {
                        if(row.type == 'ATM') {
                            // Regular withdrawal
                            var percentageRemaining = remainingAmount / row.amount;
                            remainingWorth = row.base_amount * percentageRemaining;
                        }
                        else {
                            // Earned cash, use exchange rate
                            remainingWorth = remainingAmount / exchangeRateToday[row.currency];
                            console.log('Cash transaction, exchange rate known.  Worth ' + remainingWorth);
                        }

                        if(!currencies[row.currency]) {
                            currencies[row.currency] = {
                                currency: row.currency,
                                base: row.base_currency || baseCurrency,
                                amount: 0,
                                worth: 0
                            }
                        }

                        currencies[row.currency].amount += remainingAmount;
                        currencies[row.currency].worth += remainingWorth;
                        return innerCb();
                    }
                    else {
                        rateController.getRateForDate(baseCurrency, row.currency, moment().format('YYYY-MM-DD'), true, function(err, exchangeRate) {
                            if(err) {
                                return innerCb(err);
                            }
                            exchangeRateToday[row.currency] = exchangeRate;
                            var remainingWorth = remainingAmount / exchangeRateToday[row.currency];
                            console.log('Cash transaction, looked up rate.  Worth ' + remainingWorth);

                            if(!currencies[row.currency]) {
                                currencies[row.currency] = {
                                    currency: row.currency,
                                    base: row.base_currency || baseCurrency,
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

var getCashReservesForCurrency = exports.getCashReservesForCurrency = function(userId, currency, callback) {
    cashQuery.getAvailableCashForCurrency(userId, currency, function(err, results) {
        if(err) {
            return callback(err);
        }
        var totalLeft = 0;
        for(var i = 0; i < results.length; i++) {
            var row = results[i];
            var remainingAmount = row.amount - row.used;
            totalLeft += remainingAmount;
        }
        return callback(null, totalLeft);
    });
};

var getTransactions = exports.getTransactions = function(userId, limit, page, sort, filters, callback) {
    cashQuery.getTransactions(userId, limit, page, sort, filters, callback);
};

var getWithdrawals = exports.getWithdrawals = function(userId, limit, page, sort, filters, callback) {
    var baseCurrency;
    var withdrawals = { results: [], count: 0 };
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
            cashQuery.getWithdrawals(userId, limit, page, sort, filters, function(err, results) {
                if(err) {
                    return cb(err);
                }
                withdrawals.count = results.count;
                async.eachSeries(results.results, function(wd, innerCb) {
                    if(wd.base_currency) {
                        wd.estimate = false;
                        withdrawals.results.push(wd);
                        return innerCb();
                    }
                    getExchangeRate(baseCurrency, wd.currency, moment().format('YYYY-MM-DD'), function(err, rate) {
                        if(err) {
                            return innerCb(err);
                        }

                        wd.estimate = true;
                        wd.base_currency = baseCurrency;
                        wd.base_amount = wd.amount / rate;
                        withdrawals.results.push(wd);
                        return innerCb();
                    });
                }, cb);
            });
        }
    ], function(err, results) {
        if(err) {
            return callback(err);
        }
        return callback(null, withdrawals);
    });
};

var recordCreditTransaction = function(userId, tripId, amount, categoryId, country, currency, date, description, endDate, callback) {
    var baseCurrency;
    var exchangeRate;
    var type = 'credit';
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
            if(!baseCurrency) {
                return cb('No base currency found for user: ' + userId);
            }
            rateController.getRateForDate(baseCurrency, currency, date, true, function(err, results) {
                if(err) {
                    return cb(err);
                }
                exchangeRate = results;
                return cb();
            });
        },
        function(cb) {
            if(!baseCurrency || !exchangeRate) {
                return cb('Could not find base currency or exchange rate for user: ' + userId);
            }
            if(endDate) {
                // Need to split transaction
                return cb();
            }
            var baseAmount = amount / exchangeRate;
            cashQuery.recordTransaction(userId, tripId, type, currency, amount, baseCurrency, baseAmount, date, categoryId, country, description, cb);
        },
        function(cb) {
            if(!baseCurrency || !exchangeRate) {
                return cb('Could not find base currency or exchange rate for user: ' + userId);
            }
            if(!endDate) {
                // Already recorded
                return cb();
            }
            var baseAmount = amount / exchangeRate;
            var rangeStart = moment(date, 'YYYY-MM-DD');
            var rangeEnd = moment(endDate, 'YYYY-MM-DD');
            var days = Math.abs(rangeEnd.diff(rangeStart, 'days')) + 1;
            var amountPerDay = amount / days;
            var baseAmountPerDay = baseAmount / days;

            async.whilst(
                function() { return rangeStart <= rangeEnd },
                function(innerCb) {
                    cashQuery.recordTransaction(userId, tripId, type, currency, amountPerDay, baseCurrency, baseAmountPerDay, rangeStart.format('YYYY-MM-DD'), categoryId, country, description, function(err, results) {
                        if(err) {
                            return innerCb(err);
                        }
                        rangeStart.add(1, 'd');
                        return innerCb(null, results);
                    });
                },
            cb);
        }
    ], callback);
};

var recordDebit = function(withdrawalId, transactionId, amount, amountUsed, callback) {
    async.series([
        function(cb) {
            cashQuery.updateUsedAmount(withdrawalId, amountUsed, cb);
        },
        function(cb) {
            cashQuery.createDebit(withdrawalId, transactionId, amount, cb);
        }
    ], callback);
};

var recordDebitsForTransaction = function(userId, transactionId, amount, currency, baseCurrency, exchangeRate, callback) {
    var withdrawal;
    var totalBaseAmount = 0;
    async.series([
        function(cb) {
            cashQuery.getOldestOpenWithdrawalForUser(userId, currency, function(err, results) {
                if(err) {
                    return cb(err);
                }
                withdrawal = (!results || !results.length) ? null : results[0];
                return cb();
            });
        },
        function(cb) {
            if(!withdrawal) {
                // Need debit
                return cb();
            }
            var remaining = withdrawal.amount - withdrawal.used;
            if(remaining > amount) {
                // This withdrawal can contain the full amount
                var updatedUsed = withdrawal.used + amount;
                if(withdrawal.base_currency) {
                    var percentUsed = amount / withdrawal.amount;
                    totalBaseAmount = withdrawal.base_amount * percentUsed;
                }
                else {
                    // Earned cash, use today's rate
                    totalBaseAmount = amount / exchangeRate;
                }
                console.log('contained transaction: ' + totalBaseAmount);
                recordDebit(withdrawal.id, transactionId, amount, updatedUsed, cb);
            }
            else {
                // The amount overruns the remaining withdrawal
                amount -= remaining;
                if(withdrawal.base_currency) {
                    var percentUsed = remaining / withdrawal.amount;
                    totalBaseAmount = withdrawal.base_amount * percentUsed;
                }
                else {
                    // Earned cash, use today's rate
                    totalBaseAmount = remaining / exchangeRate;
                }
                recordDebit(withdrawal.id, transactionId, remaining, withdrawal.amount, function(err, results) {
                    if(err) {
                        return cb(err);
                    }
                    console.log('uncontained, starting: ' + totalBaseAmount);
                    recordDebitsForTransaction(userId, transactionId, amount, currency, baseCurrency, exchangeRate, function(err, newBaseAmount) {
                        if(err) {
                            return cb(err);
                        }
                        totalBaseAmount += newBaseAmount;
                        console.log('added ' + newBaseAmount + ', total ' + totalBaseAmount);
                        return cb();
                    });
                });
            }
        },
        function(cb) {
            if(withdrawal) {
                // Don't need debit
                return cb();
            }
            totalBaseAmount = amount / exchangeRate;
            // Record debit transaction
            recordEmptyWithdrawal(userId, amount, currency, moment().format('YYYY-MM-DD'), function(err, withdrawalId) {
                if(err) {
                    return cb(err);
                }
                recordDebit(withdrawalId, transactionId, amount, amount, cb);
            });
        }
    ], function(err, results) {
        if(err) {
            return callback(err);
        }
        return callback(null, totalBaseAmount);
    });
};

var recordSingleCashTransaction = function(userId, tripId, amount, categoryId, country, currency, date, description, baseCurrency, exchangeRate, callback) {
    var baseAmount = amount / exchangeRate;//TODO: Fix (should use rate from withdrawals)
    var type = 'cash';
    var transactionId;
    var updatedBaseAmount;
    console.log('single');
    async.series([
        function(cb) {
            console.log('---');
            console.log(userId);
            console.log(tripId);
            console.log(type);
            console.log(currency);
            console.log(amount);
            console.log(baseCurrency);
            console.log(baseAmount);
            console.log(date);
            console.log(categoryId);
            console.log(country);
            console.log(description);
            console.log('---');
            cashQuery.recordTransaction(userId, tripId, type, currency, amount, baseCurrency, baseAmount, date, categoryId, country, description, function(err, results) {
                if(err) {
                    return cb(err);
                }
                transactionId = results.insertId;
                return cb();
            });
        },
        function(cb) {
            recordDebitsForTransaction(userId, transactionId, amount, currency, baseCurrency, exchangeRate, function(err, totalBaseAmount) {
                if(err) {
                    return cb(err);
                }
                updatedBaseAmount = totalBaseAmount;
                return cb();
            });
        },
        function(cb) {
            cashQuery.updateBaseAmount(transactionId, updatedBaseAmount, cb);
        }
    ], callback);
};

var recalculateCashTransactionValue = function(transactionId, callback) {
    var debits;
    var totalWorth = 0;
    var transaction;
    async.series([
        function(cb) {
            cashQuery.getTransactionById(transactionId, function(err, tran) {
                if(err) {
                    return cb(err);
                }
                transaction = tran;
                if(transaction.type !== 'CASH') {
                    return cb('Transaction: ' + transactionId + ' is not a cash transaction');
                }
                return cb();
            });
        },
        function(cb) {
            cashQuery.getDebitDetailsForTransaction(transactionId, function(err, results) {
                if(err) {
                    return cb(err);
                }
                if(!results || !results.length) {
                    return cb('No debits found for transaction: ' + transactionId);
                }
                debits = results;
                return cb();
            });
        },
        function(cb) {
            async.eachSeries(debits, function(debit, innerCb) {
                getDebitValue(debit.withdrawal_type, debit.debit_amount, debit.withdrawal_amount, debit.base_amount, 
                transaction.date, transaction.currency, transaction.base_currency, function(err, value) {
                    if(err) {
                        return innerCb(err);
                    }
                    totalWorth += value;
                    return innerCb();
                });
            }, cb);
        },
        function(cb) {
            cashQuery.updateBaseAmount(transactionId, totalWorth, cb);
        }
    ], callback);
};

var getDebitValue = function(withdrawalType, debitAmount, withdrawalAmount, withdrawalBaseAmount, transactionDate, transactionCurrency, userBaseCurrency, callback) {
    if(['ATM', 'EARNED', 'NEGATIVE'].indexOf(withdrawalType) == -1) {
        return callback('Invalid withdrawal type: ' + withdrawalType);
    }
    if(withdrawalType == 'ATM') {
        var percentUsed = debitAmount / withdrawalAmount;
        var totalValue = percentUsed * withdrawalBaseAmount;
        return callback(null, totalValue);
    }
    else {
        getExchangeRate(userBaseCurrency, transactionCurrency, transactionDate, function(err, rate) {
            if(err) {
                return callback(err);
            }
            var totalValue = debitAmount / rate;
            return callback(null, totalValue);
        });
    }
};

var getExchangeRate = function(baseCurrency, currency, date, callback) {
    var key = baseCurrency + '_' + currency + '_' + date;
    redis.get(key, function(err, reply) {
        if(!err && reply) {
            return callback(null, reply);
        }
        rateController.getRateForDate(baseCurrency, currency, date, false, function(err, rate) {
            if(err) {
                return callback(err);
            }
            if(rate) {
                redis.set(key, rate);
                return callback(null, rate);
            }
            // If we can't find an exact date, don't store it in redis
            rateController.getRateForDate(baseCurrency, currency, date, true, callback);
        })
    });
};

var getSpendingForCountry = exports.getSpendingForCountry = function(tripId, country, callback) {
    cashQuery.getSpendingForCountry(tripId, country, callback);
};

var getSpendingForDate = exports.getSpendingForDate = function(tripId, date, callback) {
    cashQuery.getSpendingForDate(tripId, date, callback);
};

var getSpendingForTrip = exports.getSpendingForTrip = function(tripId, callback) {
    cashQuery.getSpendingForTrip(tripId, callback);
};

var getSpendingForGraph = exports.getSpendingForGraph = function(userId, tripId, graphType, range, categories, callback) {
    var baseCurrency;
    var startDate;
    var endDate;
    var data;

    if(['trip', 'thisMonth', 'thisWeek', 'last30', 'last14', 'last7'].indexOf(range) == -1) {
        return callback('Invalid range');
    }
    if(['overTime', 'byCountry', 'byCategory'].indexOf(graphType) == -1) {
        return callback('Invalid graph type');
    }
    var ranges = {
        'start': {
            'thisMonth': moment().startOf('month').format('YYYY-MM-DD'),
            'thisWeek': moment().startOf('week').format('YYYY-MM-DD'),
            'last30': moment().subtract(30, 'days').format('YYYY-MM-DD'),
            'last14': moment().subtract(14, 'days').format('YYYY-MM-DD'),
            'last7': moment().subtract(7, 'days').format('YYYY-MM-DD')
        },
        'end': {
            'thisMonth': moment().endOf('month').format('YYYY-MM-DD'),
            'thisWeek': moment().endOf('week').format('YYYY-MM-DD'),
            'last30': moment().format('YYYY-MM-DD'),
            'last14': moment().format('YYYY-MM-DD'),
            'last7': moment().format('YYYY-MM-DD')
        }
    };

    tripController.getUserIdForTrip(tripId, function(err, userIdForTrip) {
        if(userId !== userIdForTrip) {
            return callback('User mismatch');
        }

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
                // Get start date
                if(range !== 'trip') {
                    startDate = ranges['start'][range];
                    return cb();
                }
                tripController.getOldestTransactionForTrip(tripId, function(err, date) {
                    if(err) {
                        return cb(err);
                    }
                    startDate = date;
                    return cb();
                });
            },
            function(cb) {
                // Get end date
                if(range !== 'trip') {
                    endDate = ranges['end'][range];
                    return cb();
                }
                tripController.getNewestTransactionForTrip(tripId, function(err, date) {
                    if(err) {
                        return cb(err);
                    }
                    endDate = date;
                    return cb();
                });
            },
            function(cb) {
                if(!startDate || !endDate) {
                    return cb('Error getting date range');
                }
                if(graphType != 'overTime') {
                    return cb();
                }
                cashQuery.getSpendingForGraph(tripId, startDate, endDate, categories, function(err, results) {
                    if(err) {
                        return cb(err);
                    }
                    data = results;
                    return cb();
                });
            },
            function(cb) {
                if(!startDate || !endDate) {
                    return cb('Error getting date range');
                }
                if(graphType != 'byCountry') {
                    return cb();
                }
                cashQuery.getSpendingForGraphByCountry(tripId, startDate, endDate, function(err, results) {
                    if(err) {
                        return cb(err);
                    }
                    data = results;
                    return cb();
                });
            },
            function(cb) {
                if(!startDate || !endDate) {
                    return cb('Error getting date range');
                }
                if(graphType != 'byCategory') {
                    return cb();
                }
                cashQuery.getSpendingForGraphByCategory(tripId, startDate, endDate, function(err, results) {
                    if(err) {
                        return cb(err);
                    }
                    data = results;
                    return cb();
                });
            }
        ], function(err, results) {
            if(err) {
                return callback(err);
            }
            return callback(null, data);
        });
    })
};

var getWeeklyAverageSpending = exports.getWeeklyAverageSpending = function(userId, baseCurrency, callback) {
    cashQuery.getWeeklyAverageSpending(userId, baseCurrency, callback);
};

var recordCashTransaction = function(userId, tripId, amount, categoryId, country, currency, date, description, endDate, callback) {
    var baseCurrency;
    var exchangeRate;
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
            if(!baseCurrency) {
                return cb('No base currency found for user: ' + userId);
            }
            rateController.getRateForDate(baseCurrency, currency, date, true, function(err, results) {
                if(err) {
                    return cb(err);
                }
                exchangeRate = results;
                return cb();
            });
        },
        function(cb) {
            if(endDate) {
                // Need to split
                return cb();
            }
            recordSingleCashTransaction(userId, tripId, amount, categoryId, country, currency, date, description, baseCurrency, exchangeRate, cb);
        },
        function(cb) {
            if(!baseCurrency || !exchangeRate) {
                return cb('Could not find base currency or exchange rate for user: ' + userId);
            }
            if(!endDate) {
                // Already recorded
                return cb();
            }
            var rangeStart = moment(date, 'YYYY-MM-DD');
            var rangeEnd = moment(endDate, 'YYYY-MM-DD');
            var days = Math.abs(rangeEnd.diff(rangeStart, 'days')) + 1;
            var amountPerDay = amount / days;

            var baseAmount = amount / exchangeRate;
            var baseAmountPerDay = baseAmount / days;

            async.whilst(
                function() { return rangeStart <= rangeEnd },
                function(innerCb) {
                    recordSingleCashTransaction(userId, tripId, amountPerDay, categoryId, country, currency, rangeStart.format('YYYY-MM-DD'), description, baseCurrency, exchangeRate, function(err, results) {
                        if(err) {
                            return innerCb(err);
                        }
                        rangeStart.add(1, 'd');
                        return innerCb(null, results);
                    });
                },
            cb);
        }
    ], callback);
};

var recordTransaction = exports.recordTransaction = function(userId, amount, categoryId, country, currency, date, description, endDate, type, callback) {
    if(['cash', 'credit'].indexOf(type) == -1) {
        return callback('Invalid type');
    }
    tripController.getActiveTripForUser(userId, function(err, tripId) {
        if(err) {
            return callback(err);
        }
        if(type == 'credit') {
            return recordCreditTransaction(userId, tripId, amount, categoryId, country, currency, date, description, endDate, callback);
        }
        else if(type == 'cash') {
            return recordCashTransaction(userId, tripId, amount, categoryId, country, currency, date, description, endDate, callback);
        }
    });
};

var recordEmptyWithdrawal = exports.recordEmptyWithdrawal = function(userId, amount, currency, date, callback) {
    cashQuery.recordWithdrawal(userId, 'NEGATIVE', currency, 0, null, 0, date, function(err, results) {
        if(err) {
            return callback(err);
        }
        if(!results) {
            return callback('No insert id found for withdrawal');
        }
        return callback(null, results.insertId);
    });
};

var checkForNegativesForWithdrawal = function(userId, currency, withdrawalId, amount, callback) {
    var negatives;
    async.series([
        function(cb) {
            cashQuery.getNegativeWithdrawalsForUser(userId, currency, function(err, results) {
                if(err) {
                    return cb(err);
                }
                negatives = results;
                return cb();
            });
        },
        function(cb) {
            async.whilst(
                function() { return (negatives && negatives.length) && amount > 0 },
                function(innerCb) {
                    var negative = negatives[0];
                    if(negative.used > amount) {
                        var debit;
                        var transaction;
                        var withdrawal;
                        async.series([
                            function(cb1) {
                                cashQuery.getWithdrawalById(withdrawalId, function(err, results) {
                                    if(err) {
                                        return cb1(err);
                                    }
                                    withdrawal = results;
                                    return cb1();
                                });
                            },
                            function(cb1) {
                                cashQuery.getDebitDetailsForWithdrawal(negative.id, function(err, results) {
                                    if(err) {
                                        return cb1(err);
                                    }
                                    if(!results || results.length !== 1) {
                                        return cb1('Invalid transaction results');
                                    }
                                    debit = results[0];
                                    return cb1();
                                });
                            },
                            function(cb1) {
                                recordDebit(withdrawalId, debit.transaction_id, amount, withdrawal.amount, cb1);
                            },
                            function(cb1) {
                                cashQuery.updateDebitAmount(debit.debit_id, (debit.debit_amount - amount), cb1);
                            },
                            function(cb1) {
                                cashQuery.updateUsedAmount(negative.id, (negative.used - amount), cb1);
                            },
                            function(cb1) {
                                recalculateCashTransactionValue(debit.transaction_id, cb1);
                            },
                            function(cb1) {
                                amount = 0;
                                return cb1();
                            }
                        ], innerCb);
                    }
                    else {
                        var debit;
                        var transaction;
                        var withdrawal;
                        async.series([
                            function(cb1) {
                                cashQuery.getWithdrawalById(withdrawalId, function(err, results) {
                                    if(err) {
                                        return cb1(err);
                                    }
                                    withdrawal = results;
                                    return cb1();
                                });
                            },
                            function(cb1) {
                                cashQuery.getDebitDetailsForWithdrawal(negative.id, function(err, results) {
                                    if(err) {
                                        return cb1(err);
                                    }
                                    if(!results || results.length !== 1) {
                                        return cb1('Invalid transaction results');
                                    }
                                    debit = results[0];
                                    return cb1();
                                });
                            },
                            function(cb1) {
                                cashQuery.updateUsedAmount(withdrawalId, withdrawal.used + negative.used, cb1);
                            },
                            function(cb1) {
                                cashQuery.repointDebitRow(debit.debit_id, withdrawalId, cb1);
                            },
                            function(cb1) {
                                cashQuery.deleteWithdrawal(negative.id, cb1);
                            },
                            function(cb1) {
                                recalculateCashTransactionValue(debit.transaction_id, cb1);
                            },
                            function(cb1) {
                                amount -= debit.debit_amount;
                                negatives.shift();
                                return cb1();
                            }
                        ], innerCb);
                    }
                },
            cb);
        }
    ], callback);
};

var recordWithdrawalAndCheckForNegatives = exports.recordWithdrawalAndCheckForNegatives = function(userId, amount, currency, date, isEarnedCash, isFee, feeAmount, callback) {
    var withdrawalId;
    async.series([
        function(cb) {
            recordWithdrawal(userId, amount, currency, date, isEarnedCash, isFee, feeAmount, function(err, wId) {
                if(err) {
                    return cb(err);
                }
                withdrawalId = wId;
                return cb();
            });
        },
        function(cb) {
            checkForNegativesForWithdrawal(userId, currency, withdrawalId, amount, cb);
        }
    ], callback);
};

var recordWithdrawal = function(userId, amount, currency, date, isEarnedCash, isFee, feeAmount, callback) {
    var baseCurrency = null;
    var exchangeRate;
    var withdrawalId;
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
            rateController.getRateForDate(baseCurrency, currency, date, true, function(err, results) {
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
                var totalAmount = amount + (isFee ? feeAmount : 0);
                baseAmount = totalAmount / exchangeRate;
            }
            var type = isEarnedCash ? 'EARNED' : 'ATM';
            cashQuery.recordWithdrawal(userId, type, currency, amount, baseCurrency, baseAmount, date, function(err, results) {
                if(err) {
                    return cb(err);
                }
                if(!results) {
                    return cb('No insert id found for withdrawal');
                }
                withdrawalId = results.insertId;
                return cb();
            });
        }
    ], function(err, results) {
        if(err) {
            return callback(err);
        }
        return callback(null, withdrawalId);
    });
};