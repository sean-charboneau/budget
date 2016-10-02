var db = require('../../db.js');

var createDebit = exports.createDebit = function(withdrawalId, transactionId, amount, callback) {
    db.runQuery(
        "INSERT INTO debit (withdrawal_id, transaction_id, amount, created_at) " +
        "VALUES (?, ?, ?, CURRENT_TIMESTAMP());",
        [withdrawalId, transactionId, amount],
    callback);
};

var getAvailableCash = exports.getAvailableCash = function(userId, callback) {
    db.runQuery(
        "SELECT id, type, currency, amount, base_currency, base_amount, used " +
        "FROM withdrawal " +
        "WHERE user_id = ? AND used != amount;",
        [userId],
    callback);
};

var getDebitDetailsForTransaction = exports.getDebitDetailsForTransaction = function(transactionId, callback) {
    db.runQuery(
        "SELECT d.id AS debit_id, d.withdrawal_id, d.amount AS debit_amount, " +
        "w.type AS withdrawal_type, w.currency, w.amount AS withdrawal_amount, w.base_amount " +
        "FROM debit d " +
        "INNER JOIN withdrawal w ON d.withdrawal_id = w.id " +
        "WHERE d.transaction_id = ?;",
        [transactionId],
    callback);
};

var getOldestOpenWithdrawalForUser = exports.getOldestOpenWithdrawalForUser = function(userId, currency, callback) {
    db.runQuery(
        "SELECT id, amount, currency, used, base_amount, base_currency, date, created_at, updated_at " +
        "FROM withdrawal " +
        "WHERE user_id = ? AND currency = ? AND used < amount " +
        "ORDER BY date, created_at ASC " +
        "LIMIT 1;",
        [userId, currency],
    callback);
};

var getTransactionById = exports.getTransactionById = function(transactionId, callback) {
    db.runQuery(
        "SELECT id, user_id, type, currency, amount, base_currency, base_amount, " +
        "  date, category_id, country, description, created_at, updated_at " +
        "FROM transaction " +
        "WHERE id = ?;",
        [transactionId],
    callback);
};

var recordTransaction = exports.recordTransaction = function(userId, type, currency, amount, baseCurrency, baseAmount, date, categoryId, country, description, callback) {
    db.runQuery(
        "INSERT INTO transaction (user_id, type, currency, amount, base_currency, base_amount, date, category_id, country, description, created_at) " +
        "VALUE(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP());",
        [userId, type.toUpperCase(), currency, amount, baseCurrency, baseAmount, date, categoryId, country, description],
    callback);
};

var recordWithdrawal = exports.recordWithdrawal = function(userId, currency, amount, baseCurrency, baseAmount, date, callback) {
    db.runQuery(
        "INSERT INTO withdrawal (user_id, currency, amount, base_currency, base_amount, date, created_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP());",
        [userId, currency, amount, baseCurrency, baseAmount, date],
    callback);
};

var updateBaseAmount = exports.updateBaseAmount = function(transactionId, baseAmount, callback) {
    db.runQuery(
        "UPDATE transaction SET base_amount = ? WHERE id = ?;",
        [baseAmount, transactionId],
    callback);
};

var updateUsedAmount = exports.updateUsedAmount = function(withdrawalId, used, callback) {
    db.runQuery(
        "UPDATE withdrawal SET used = ? WHERE id = ?;",
        [used, withdrawalId],
    callback);
};