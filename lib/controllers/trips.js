var async = require('async');
var moment = require('moment');

var cashController = require('./cash');
var categoryController = require('./categories');
var userController = require('./users');

var tripQuery = require('../query/trips');

var getActiveTripForUser = exports.getActiveTripForUser = function(userId, callback) {
    tripQuery.getActiveTripForUser(userId, callback);
};

var getAllTripsForUser = exports.getAllTripsForUser = function(userId, callback) {
    tripQuery.getAllTripsForUser(userId, callback);
};

var getBudgetForCountry = exports.getBudgetForCountry = function(tripId, country, callback) {
    tripQuery.getBudgetForCountry(tripId, country, callback);
};

var getBudgetForTrip = exports.getBudgetForTrip = function(tripId, country, callback) {
    tripQuery.getBudgetForTrip(tripId, country, callback);
};

var getCurrentCountryForTrip = exports.getCurrentCountryForTrip = function(tripId, callback) {
    tripQuery.getCurrentCountryForTrip(tripId, callback);
};

var getSpendDataForCountryAndTrip = exports.getSpendDataForCountryAndTrip = function(tripId, country, callback) {
    tripQuery.getSpendDataForCountryAndTrip(tripId, country, callback);
};

var getNewestTransactionForTrip = exports.getNewestTransactionForTrip = function(tripId, callback) {
    tripQuery.getNewestTransactionForTrip(tripId, callback);
};

var getOldestTransactionForTrip = exports.getOldestTransactionForTrip = function(tripId, callback) {
    tripQuery.getOldestTransactionForTrip(tripId, callback);
};

var getVisitedCountriesForTrip = exports.getVisitedCountriesForTrip = function(tripId, callback) {
    tripQuery.getVisitedCountriesForTrip(tripId, callback);
};

var getUserIdForTrip = exports.getUserIdForTrip = function(tripId, callback) {
    tripQuery.getUserIdForTrip(tripId, callback);
};

var getTripOverview = exports.getTripOverview = function(userId, callback) {
    var baseCurrency;
    var budget = {};
    var currentCountry;
    var spending = {};
    var tripId;
    async.series([
        function(cb) {
            getActiveTripForUser(userId, function(err, id) {
                if(err) {
                    return cb(err);
                }
                tripId = id;
                return cb();
            });
        },
        function(cb) {
            if(!tripId) {
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
            if(!tripId || !baseCurrency) {
                return cb();
            }
            getCurrentCountryForTrip(tripId, function(err, country) {
                currentCountry = country;
                return cb();
            })
        },
        function(cb) {
            if(!tripId || !baseCurrency) {
                return cb();
            }
            async.parallel({
                budgetCountry: function(innerCb) {
                    if(!currentCountry) {
                        budget.country = null;
                        budget.today = null;
                        return innerCb();
                    }
                    getBudgetForCountry(tripId, currentCountry, function(err, results) {
                        if(err) {
                            return innerCb(err);
                        }
                        if(!results || !results.length) {
                            return innerCb('Error finding country budget');
                        }
                        var b = results[0];
                        budget.country = {
                            amount: b.budget,
                            country: b.country,
                            days: b.days
                        };
                        budget.today = {
                            amount: b.daily_budget,
                            country: b.country
                        };
                        return innerCb();
                    });
                },
                budgetTrip: function(innerCb) {
                    getBudgetForTrip(tripId, function(err, results) {
                        if(err) {
                            return innerCb(err);
                        }
                        var b = {
                            days: results[0].days,
                            amount: results[0].budget
                        };
                        budget.trip = b;
                        return innerCb();
                    });
                },
                spendingToday: function(innerCb) {
                    cashController.getSpendingForDate(tripId, moment().format('YYYY-MM-DD'), function(err, results) {
                        if(err) {
                            return innerCb(err);
                        }
                        if(!results || !results.length) {
                            return innerCb('Error finding daily spending');
                        }
                        var s = results[0]
                        spending.today = {
                            amount: s.base_amount || 0,
                            numTransactions: s.num_transactions   
                        };
                        return innerCb();
                    });
                },
                spendingCountry: function(innerCb) {
                    if(!currentCountry) {
                        spending.country = {
                            amount: 0,
                            numTransaction: 0   
                        };
                        return innerCb();
                    }
                    cashController.getSpendingForCountry(tripId, currentCountry, function(err, results) {
                        if(err) {
                            return innerCb(err);
                        }
                        if(!results || !results.length) {
                            return innerCb('Error finding country spending');
                        }
                        var s = results[0]
                        spending.country = {
                            amount: s.base_amount || 0,
                            numTransactions: s.num_transactions,
                            country: currentCountry
                        };
                        return innerCb();
                    });
                },
                spendingTrip: function(innerCb) {
                    cashController.getSpendingForTrip(tripId, function(err, results) {
                        if(err) {
                            return innerCb(err);
                        }
                        if(!results || !results.length) {
                            return innerCb('Error finding trip spending');
                        }
                        var s = results[0]
                        spending.trip = {
                            amount: s.base_amount || 0,
                            numTransactions: s.num_transactions
                        };
                        return innerCb();
                    });
                }
            }, cb);
        },
        function(cb) {
            if(!tripId || !baseCurrency || !currentCountry) {
                return cb();
            }
            console.log('gettin visited');
            getVisitedCountriesForTrip(tripId, function(err, countries) {
                if(err) {
                    console.log(err);
                    return cb(err);
                }

                var overallBudget = 0;
                var overallSurplus = 0;
                async.eachSeries(countries, function(country, innerCb) {
                    getSpendDataForCountryAndTrip(tripId, country, function(err, results) {
                        if(err) {
                            return innerCb(err);
                        }

                        var data = results[0];
                        var amountSpent = data.amount_spent;
                        // If they overstay, the budget doesn't grow
                        data.days_planned = (data.days_planned ? data.days_planned : 1);
                        data.budget_planned = (data.budget_planned ? data.budget_planned : 0);
                        var daysSpent = Math.min(data.days_spent, data.days_planned);
                        var expectedPerDay = data.budget_planned / data.days_planned;

                        if(!country) {
                            // Oneoff expenses
                            daysSpent = 1;
                            expectedPerDay = data.budget_planned;
                        }

                        var surplus = (daysSpent * expectedPerDay) - amountSpent;
                        overallSurplus += surplus;
                        
                        overallBudget += daysSpent * expectedPerDay;

                        if(country == currentCountry) {
                            spending.country.daysSpent = daysSpent;
                        }

                        // console.log('Spent ' + amountSpent + ' in ' + country + ' over ' + daysSpent + ' days, should have spent ' + (daysSpent * expectedPerDay));

                        return innerCb();
                    })
                }, function(err, results) {
                    if(err) {
                        return cb(err);
                    }
                    budget.trip.toNow = overallBudget;
                    budget.trip.surplus = overallSurplus;

                    return cb();
                });
            });
        }
    ], function(err, results) {
        if(err) {
            return callback(err);
        }
        return callback(null, {
            budget: budget,
            spending: spending,
            currentCountry: currentCountry,
            tripId: tripId
        });
    });
};

var saveTrip = exports.saveTrip = function(userId, tripName, startDate, segments, oneOffExpenses, currency, callback) {
    var oneoffCategoryId;
    var tripId;
    
    var totalBudget = 0;
    var totalDays = 0;
    for(var i = 0; i < segments.length; i++) {
        totalBudget += parseFloat(segments[i].budget || 0);
        totalDays += parseInt(segments[i].days || 0);
    }
    for(var i = 0; i < oneOffExpenses.length; i++) {
        totalBudget += parseFloat(oneOffExpenses[i].amount || 0);
    }

    async.series([
        function(cb) {
            tripQuery.deactivateTripsForUser(userId, cb);
        },
        function(cb) {
            tripQuery.insertTrip(userId, tripName, startDate, totalDays, totalBudget, function(err, results) {
                if(err) {
                    return cb(err);
                }
                tripId = results.insertId;
                return cb();
            });
        },
        function(cb) {
            if(!tripId) {
                return cb('No trip id');
            }
            async.eachSeries(segments, function(segment, innerCb) {
                tripQuery.insertSegment(tripId, segment.days, segment.budget, segment.country, innerCb);
            }, cb);
        },
        function(cb) {
            if(!tripId) {
                return cb('No trip id');
            }
            var oneOffTotal = 0;
            for(var i = 0; i < oneOffExpenses.length; i++) {
                oneOffTotal += oneOffExpenses[i].amount;
            }
            if(oneOffTotal == 0) {
                return cb();
            }
            tripQuery.insertSegment(tripId, 0, oneOffTotal, null, cb);
        },
        function(cb) {
            categoryController.getCategoryIdByName('one-off expense', function(err, categoryId) {
                if(err) {
                    return cb(err);
                }
                oneoffCategoryId = categoryId;
                return cb();
            })
        },
        function(cb) {
            if(!tripId) {
                return cb('No trip id');
            }
            if(!oneoffCategoryId) {
                return cb('No category id');
            }
            async.eachSeries(oneOffExpenses, function(expense, innerCb) {
                cashController.recordTransaction(userId, parseFloat(expense.amount), oneoffCategoryId,
                    expense.country, currency, startDate, 'Initial trip expense', null, 'credit', innerCb);
            }, cb);
        }
    ], callback);
};