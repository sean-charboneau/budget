var async = require('async');
var config = require('config');
var request = require('request');

var db = require('../db.js');
var rateController = require('../lib/controllers/rates');

var buildUrl = function(source) {
    var accessKey = config.get('currencyLayer.key');
    var baseUrl = config.get('currencyLayer.baseUrl')
    var codes = config.get('currencyLayer.currencyCodes');
    var url = baseUrl + '?access_key=' + accessKey + '&currencies=' + codes + '&source=' + source + '&format=1';
    return url; 
};

var getExchangeRates = function(source, callback) {
    var url = buildUrl(source);
    request(url, function(error, response, body) {
        body = JSON.parse(body);
        if(error || !body.success) {
            var err = 'Error getting exchange rates: ' + error + ', ' + body;
            return callback(err);
        }
        var rates = body.quotes;
        async.eachSeries(Object.keys(rates), function(item, innerCb) {
            if(rates.hasOwnProperty(item)) {
                var rate = rates[item];
                var currency = item.substring(3);
                rateController.insertRate(source, currency, rate, function(err, results) {
                    if(err) {
                        // Just log, don't short circuit
                        console.error(err);
                    }
                    return innerCb();
                });
            }
        }, callback);
    });
};

getExchangeRates('USD', function(err, results) {
    if(err) {
        console.error(err);
        process.exit(0);
    }
    console.log('DONE');
    process.exit(0);
});