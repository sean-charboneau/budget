var async = require('async');
var moment = require('moment');

var cashController = require('./cash');
var categoryController = require('./categories');
var userController = require('./users');

var tripQuery = require('../query/trips');

var getActiveTripForUser = exports.getActiveTripForUser = function(userId, callback) {
    tripQuery.getActiveTripForUser(userId, callback);
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
                            budget: b.budget,
                            country: b.country,
                            days: b.days
                        };
                        budget.today = {
                            budget: b.daily_budget,
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
                        budget.trip = results[0];
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
                            amount: s.base_amount,
                            numTransactions: s.num_transactions   
                        };
                        return innerCb();
                    });
                },
                spendingCountry: function(innerCb) {
                    if(!currentCountry) {
                        spending.country = null;
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
                            amount: s.base_amount,
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
                            amount: s.base_amount,
                            numTransactions: s.num_transactions
                        };
                        return innerCb();
                    });
                }
            }, cb);
        }
    ], function(err, results) {
        if(err) {
            return callback(err);
        }
        return callback(null, {
            budget: budget,
            spending: spending,
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