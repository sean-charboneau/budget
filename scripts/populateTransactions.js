var async = require('async');
var config = require('config');
var moment = require('moment');
var request = require('request');

var db = require('../db.js');
var cashController = require('../lib/controllers/cash');

var tripId = 1;
var userId = 1;
var setup = [
    {
        country: 'MY',
        currency: 'MYR',
        startDate: '2017-07-15',
        endDate: '2017-07-20',
        perDay: 6,
        plusMinusPerDay: 2,
        minAmount: 5,
        maxAmount: 150
    // },
    // {
    //     country: 'TH',
    //     currency: 'THB',
    //     startDate: '2017-08-15',
    //     endDate: '2017-08-23',
    //     perDay: 6,
    //     plusMinusPerDay: 2,
    //     minAmount: 20,
    //     maxAmount: 500
    }
];

async.eachSeries(setup, function(options, callback) {
    var curDate = moment(options.startDate);
    var endDate = moment(options.endDate);
    async.whilst(function() {
        return curDate < endDate;
    }, function(cb) {
        var numTransactions = options.perDay + Math.floor(Math.random() * (options.plusMinusPerDay * 2 + 1)) - options.plusMinusPerDay;;
        console.log('Adding ' + numTransactions + ' transactions for ' + curDate.format('YYYY-MM-DD'));
        curDate = curDate.add(1, 'days');

        async.timesSeries(numTransactions, function(n, innerCb) {
            var amount = Math.floor(Math.random() * (options.maxAmount - options.minAmount + 1) + options.minAmount);
            var categoryId = Math.floor(Math.random() * 6) + 1;
            var type = (Math.random() < 0.9 ? 'cash' : 'credit');

            cashController.getCashReservesForCurrency(userId, options.currency, function(err, remaining) {
                if(amount < remaining || type == 'credit') {
                    cashController.recordTransaction(userId, amount, categoryId, options.country, options.currency, curDate.format('YYYY-MM-DD'), '', null, type, innerCb);
                }
                else {
                    var withdrawalAmount = Math.ceil(amount / 10) * 100;

                    cashController.recordWithdrawalAndCheckForNegatives(userId, withdrawalAmount, options.currency, curDate.format('YYYY-MM-DD'), false, false, null, function(err, results) {
                        if(err) {
                            return innerCb(err);
                        }
                        cashController.recordTransaction(userId, amount, categoryId, options.country, options.currency, curDate.format('YYYY-MM-DD'), '', null, type, innerCb);
                    });
                }
            });
        }, cb);
    }, callback);
}, function(err, results) {
    if(err) {
        console.error(err);
        process.exit(0);
    }
    console.log('DONE');
    process.exit(0);
});