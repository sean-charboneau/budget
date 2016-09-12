var async = require('async');

exports.up = function (db, callback) {
    db.runSql(
        "CREATE TABLE IF NOT EXISTS exchange_rate " +
        "(" +
        "   id int NOT NULL AUTO_INCREMENT PRIMARY KEY, " +
        "   date DATE NOT NULL, " +
        "   source VARCHAR(3), " +
        "   currency VARCHAR(3), " +
        "   rate DECIMAL(15,6) UNSIGNED, " +
        "   created_at TIMESTAMP DEFAULT '0000-00-00 00:00:00', " +
        "   updated_at TIMESTAMP DEFAULT now() ON UPDATE now(), " +
        "   UNIQUE KEY unq_exchange_rate (date, source, currency)" +
        ");",
    callback);
};

exports.down = function (db, callback) {
    db.runSql("DROP TABLE IF EXISTS exchange_rate;", callback);
};