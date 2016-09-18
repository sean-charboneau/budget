var async = require('async');

exports.up = function (db, callback) {
    async.series([
        function(cb) {
            db.runSql(
                'ALTER TABLE exchange_rate ' + 
                'MODIFY source ENUM ("USD","CAD","EUR","AED","AFN","ALL","AMD","ARS","AUD","AZN","BAM","BDT","BGN","BHD","BIF","BND","BOB","BRL","BWP","BYR","BZD","CDF","CHF","CLP","CNY","COP","CRC","CVE","CZK","DJF","DKK","DOP","DZD","EEK","EGP","ERN","ETB","GBP","GEL","GHS","GNF","GTQ","HKD","HNL","HRK","HUF","IDR","ILS","INR","IQD","IRR","ISK","JMD","JOD","JPY","KES","KHR","KMF","KRW","KWD","KZT","LBP","LKR","LTL","LVL","LYD","MAD","MDL","MGA","MKD","MMK","MOP","MUR","MXN","MYR","MZN","NAD","NGN","NIO","NOK","NPR","NZD","OMR","PAB","PEN","PHP","PKR","PLN","PYG","QAR","RON","RSD","RUB","RWF","SAR","SDG","SEK","SGD","SOS","SYP","THB","TND","TOP","TRY","TTD","TWD","TZS","UAH","UGX","UYU","UZS","VEF","VND","XAF","XOF","YER","ZAR","ZMK");',
            cb);
        },
        function(cb) {
            db.runSql(
                'ALTER TABLE exchange_rate ' + 
                'MODIFY currency ENUM ("USD","CAD","EUR","AED","AFN","ALL","AMD","ARS","AUD","AZN","BAM","BDT","BGN","BHD","BIF","BND","BOB","BRL","BWP","BYR","BZD","CDF","CHF","CLP","CNY","COP","CRC","CVE","CZK","DJF","DKK","DOP","DZD","EEK","EGP","ERN","ETB","GBP","GEL","GHS","GNF","GTQ","HKD","HNL","HRK","HUF","IDR","ILS","INR","IQD","IRR","ISK","JMD","JOD","JPY","KES","KHR","KMF","KRW","KWD","KZT","LBP","LKR","LTL","LVL","LYD","MAD","MDL","MGA","MKD","MMK","MOP","MUR","MXN","MYR","MZN","NAD","NGN","NIO","NOK","NPR","NZD","OMR","PAB","PEN","PHP","PKR","PLN","PYG","QAR","RON","RSD","RUB","RWF","SAR","SDG","SEK","SGD","SOS","SYP","THB","TND","TOP","TRY","TTD","TWD","TZS","UAH","UGX","UYU","UZS","VEF","VND","XAF","XOF","YER","ZAR","ZMK");',
            cb);
        },
        function(cb) {
            db.runSql(
                'ALTER TABLE user ' + 
                'MODIFY base_currency ENUM ("USD","CAD","EUR","AED","AFN","ALL","AMD","ARS","AUD","AZN","BAM","BDT","BGN","BHD","BIF","BND","BOB","BRL","BWP","BYR","BZD","CDF","CHF","CLP","CNY","COP","CRC","CVE","CZK","DJF","DKK","DOP","DZD","EEK","EGP","ERN","ETB","GBP","GEL","GHS","GNF","GTQ","HKD","HNL","HRK","HUF","IDR","ILS","INR","IQD","IRR","ISK","JMD","JOD","JPY","KES","KHR","KMF","KRW","KWD","KZT","LBP","LKR","LTL","LVL","LYD","MAD","MDL","MGA","MKD","MMK","MOP","MUR","MXN","MYR","MZN","NAD","NGN","NIO","NOK","NPR","NZD","OMR","PAB","PEN","PHP","PKR","PLN","PYG","QAR","RON","RSD","RUB","RWF","SAR","SDG","SEK","SGD","SOS","SYP","THB","TND","TOP","TRY","TTD","TWD","TZS","UAH","UGX","UYU","UZS","VEF","VND","XAF","XOF","YER","ZAR","ZMK");',
            cb);
        },
        function(cb) {
            db.runSql(
                'CREATE TABLE IF NOT EXISTS withdrawal ' +
                '(' +
                '   id int NOT NULL AUTO_INCREMENT PRIMARY KEY, ' +
                '   user_id int NOT NULL, ' +
                '   currency ENUM ("USD","CAD","EUR","AED","AFN","ALL","AMD","ARS","AUD","AZN","BAM","BDT","BGN","BHD","BIF","BND","BOB","BRL","BWP","BYR","BZD","CDF","CHF","CLP","CNY","COP","CRC","CVE","CZK","DJF","DKK","DOP","DZD","EEK","EGP","ERN","ETB","GBP","GEL","GHS","GNF","GTQ","HKD","HNL","HRK","HUF","IDR","ILS","INR","IQD","IRR","ISK","JMD","JOD","JPY","KES","KHR","KMF","KRW","KWD","KZT","LBP","LKR","LTL","LVL","LYD","MAD","MDL","MGA","MKD","MMK","MOP","MUR","MXN","MYR","MZN","NAD","NGN","NIO","NOK","NPR","NZD","OMR","PAB","PEN","PHP","PKR","PLN","PYG","QAR","RON","RSD","RUB","RWF","SAR","SDG","SEK","SGD","SOS","SYP","THB","TND","TOP","TRY","TTD","TWD","TZS","UAH","UGX","UYU","UZS","VEF","VND","XAF","XOF","YER","ZAR","ZMK"), ' +
                '   amount DECIMAL(16, 2), ' +
                '   date DATE NOT NULL, ' +
                '   created_at TIMESTAMP DEFAULT "0000-00-00 00:00:00", ' +
                '   updated_at TIMESTAMP DEFAULT now() ON UPDATE now(), ' +
                '   FOREIGN KEY (user_id) REFERENCES user(id)' +
                ');',
            cb);
        }
    ], callback);
};

exports.down = function (db, callback) {
    async.series([
        function(cb) {
            db.runSql(
                'ALTER TABLE exchange_rate ' + 
                'MODIFY source VARCHAR(3) NOT NULL;',
            cb);
        },
        function(cb) {
            db.runSql(
                'ALTER TABLE exchange_rate ' + 
                'MODIFY currency VARCHAR(3) NOT NULL;',
            cb);
        },
        function(cb) {
            db.runSql(
                'ALTER TABLE user ' + 
                'MODIFY base_currency VARCHAR(3) NOT NULL;',
            cb);
        },
        function(cb) {
            db.runSql("DROP TABLE IF EXISTS withdrawal;", callback);
        }
    ], callback);
};