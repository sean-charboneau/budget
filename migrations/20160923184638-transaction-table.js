var async = require('async');

exports.up = function (db, callback) {
    async.series([
        function(cb) {
            db.runSql(
                'CREATE TABLE IF NOT EXISTS category ' +
                '(' +
                '   id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, ' +
                '   category VARCHAR(255), ' +
                '   created_at TIMESTAMP DEFAULT "0000-00-00 00:00:00", ' +
                '   updated_at TIMESTAMP DEFAULT now() ON UPDATE now()' +
                ');',
            cb);
        },
        function(cb) {
            db.runSql(
                'CREATE TABLE IF NOT EXISTS user_category ' +
                '(' +
                '   id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, ' +
                '   user_id INT NOT NULL, ' +
                '   category_id INT NOT NULL, ' +
                '   created_at TIMESTAMP DEFAULT "0000-00-00 00:00:00", ' +
                '   updated_at TIMESTAMP DEFAULT now() ON UPDATE now(), ' +
                '   FOREIGN KEY (user_id) REFERENCES user(id), ' +
                '   FOREIGN KEY (category_id) REFERENCES category(id)' +
                ');',
            cb);
        },
        function(cb) {
            db.runSql(
                'CREATE TABLE IF NOT EXISTS transaction ' +
                '(' +
                '   id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, ' +
                '   user_id INT NOT NULL, ' +
                '   currency ENUM ("USD","CAD","EUR","AED","AFN","ALL","AMD","ARS","AUD","AZN","BAM","BDT","BGN","BHD","BIF","BND","BOB","BRL","BWP","BYR","BZD","CDF","CHF","CLP","CNY","COP","CRC","CVE","CZK","DJF","DKK","DOP","DZD","EEK","EGP","ERN","ETB","GBP","GEL","GHS","GNF","GTQ","HKD","HNL","HRK","HUF","IDR","ILS","INR","IQD","IRR","ISK","JMD","JOD","JPY","KES","KHR","KMF","KRW","KWD","KZT","LBP","LKR","LTL","LVL","LYD","MAD","MDL","MGA","MKD","MMK","MOP","MUR","MXN","MYR","MZN","NAD","NGN","NIO","NOK","NPR","NZD","OMR","PAB","PEN","PHP","PKR","PLN","PYG","QAR","RON","RSD","RUB","RWF","SAR","SDG","SEK","SGD","SOS","SYP","THB","TND","TOP","TRY","TTD","TWD","TZS","UAH","UGX","UYU","UZS","VEF","VND","XAF","XOF","YER","ZAR","ZMK"), ' +
                '   amount DECIMAL(16, 2), ' +
                '   base_currency ENUM ("USD","CAD","EUR","AED","AFN","ALL","AMD","ARS","AUD","AZN","BAM","BDT","BGN","BHD","BIF","BND","BOB","BRL","BWP","BYR","BZD","CDF","CHF","CLP","CNY","COP","CRC","CVE","CZK","DJF","DKK","DOP","DZD","EEK","EGP","ERN","ETB","GBP","GEL","GHS","GNF","GTQ","HKD","HNL","HRK","HUF","IDR","ILS","INR","IQD","IRR","ISK","JMD","JOD","JPY","KES","KHR","KMF","KRW","KWD","KZT","LBP","LKR","LTL","LVL","LYD","MAD","MDL","MGA","MKD","MMK","MOP","MUR","MXN","MYR","MZN","NAD","NGN","NIO","NOK","NPR","NZD","OMR","PAB","PEN","PHP","PKR","PLN","PYG","QAR","RON","RSD","RUB","RWF","SAR","SDG","SEK","SGD","SOS","SYP","THB","TND","TOP","TRY","TTD","TWD","TZS","UAH","UGX","UYU","UZS","VEF","VND","XAF","XOF","YER","ZAR","ZMK"), ' +
                '   base_amount DECIMAL(16, 2), ' +
                '   date DATE NOT NULL, ' +
                '   category VARCHAR(255), ' +
                '   country ENUM ("AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI", "VN", "VU", "WF", "WS", "XK", "YE", "YT", "ZA", "ZM", "ZW"), ' +
                '   description VARCHAR(255), ' +
                '   created_at TIMESTAMP DEFAULT "0000-00-00 00:00:00", ' +
                '   updated_at TIMESTAMP DEFAULT now() ON UPDATE now(), ' +
                '   FOREIGN KEY (user_id) REFERENCES user(id)' +
                ');',
            cb);
        }
    ], callback);
};

exports.down = function (db, callback) {
    db.runSql("DROP TABLE IF EXISTS transaction, user_category, category;", callback);
};