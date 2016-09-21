var db = require('../../db.js');

var getAvailableCash = exports.getAvailableCash = function(userId, callback) {
    db.runQuery(
        "SELECT currency, amount, base_currency, base_amount, used " +
        "FROM withdrawal " +
        "WHERE user_id = ? AND used < amount;",
        [userId],
    callback);
};

var recordWithdrawal = exports.recordWithdrawal = function(userId, currency, amount, baseCurrency, baseAmount, date, callback) {
    db.runQuery(
        "INSERT INTO withdrawal (user_id, currency, amount, base_currency, base_amount, date, created_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP());",
        [userId, currency, amount, baseCurrency, baseAmount, date],
    callback);
};