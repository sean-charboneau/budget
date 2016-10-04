var db = require('../../db.js');

var createDebit = exports.createDebit = function(withdrawalId, transactionId, amount, callback) {
    db.runQuery(
        "INSERT INTO debit (withdrawal_id, transaction_id, amount, created_at) " +
        "VALUES (?, ?, ?, CURRENT_TIMESTAMP());",
        [withdrawalId, transactionId, amount],
    callback);
};

var deleteWithdrawal = exports.deleteWithdrawal = function(withdrawalId, callback) {
    db.runQuery(
        "DELETE FROM withdrawal WHERE id = ?;",
        [withdrawalId],
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

var getDebitDetailsForWithdrawal = exports.getDebitDetailsForWithdrawal = function(withdrawalId, callback) {
    db.runQuery(
        "SELECT d.id AS debit_id, d.transaction_id, d.amount AS debit_amount, " +
        "t.currency, t.amount AS transaction_amount, t.base_amount " +
        "FROM debit d " +
        "INNER JOIN transaction t ON d.transaction_id = t.id " +
        "WHERE d.withdrawal_id = ?; ",
        [withdrawalId],
    callback);
};

var getNegativeWithdrawalsForUser = exports.getNegativeWithdrawalsForUser = function(userId, currency, callback) {
    db.runQuery(
        "SELECT id, currency, used, date, created_at, updated_at " +
        "FROM withdrawal " +
        "WHERE user_id = ? AND currency = ? AND type = 'NEGATIVE' " +
        "ORDER BY date, created_at ASC;",
        [userId, currency],
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
    function(err, results) {
        if(err) {
            return callback(err);
        }
        if(!results || results.length !== 1) {
            return callback('Invalid number of transaction results');
        }
        return callback(null, results[0]);
    });
};

var getTransactions = exports.getTransactions = function(userId, limit, sort, filters, callback) {
    var fieldMap = {
        'date': 'date'
    };
    var orderMap = {
        'asc': 'ASC',
        'desc': 'DESC'
    };
    var field = fieldMap[sort.field];
    var order = orderMap[sort.order];
    if(!field || !order) {
        return callback('Invalid sort parameters');
    }
    db.runQuery(
        "SELECT t.id, t.type, t.currency, t.amount, t.base_currency, t.base_amount, " +
        "  t.date, c.category, c.icon, t.country, t.description, t.created_at, t.updated_at " +
        "FROM transaction t " +
        "INNER JOIN category c ON t.category_id = c.id " +
        "WHERE user_id = ? " +
        "ORDER BY t." + field + " " + order + ", t.created_at DESC LIMIT ?;",
        [userId, limit],
    function(err, results) {
        console.log(err);
        return callback(err, results);
    });
};

var getWithdrawalById = exports.getWithdrawalById = function(withdrawalId, callback) {
    db.runQuery(
        "SELECT id, user_id, type, currency, amount, used, base_currency, base_amount, date, created_at, updated_at " +
        "FROM withdrawal " +
        "WHERE id = ?;",
        [withdrawalId],
    function(err, results) {
        if(err) {
            return callback(err);
        }
        if(!results || results.length !== 1) {
            return callback('Invalid number of withdrawal results');
        }
        return callback(null, results[0]);
    });
};

var recordTransaction = exports.recordTransaction = function(userId, type, currency, amount, baseCurrency, baseAmount, date, categoryId, country, description, callback) {
    db.runQuery(
        "INSERT INTO transaction (user_id, type, currency, amount, base_currency, base_amount, date, category_id, country, description, created_at) " +
        "VALUE(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP());",
        [userId, type.toUpperCase(), currency, amount, baseCurrency, baseAmount, date, categoryId, country, description],
    callback);
};

var recordWithdrawal = exports.recordWithdrawal = function(userId, type, currency, amount, baseCurrency, baseAmount, date, callback) {
    console.log(type);
    db.runQuery(
        "INSERT INTO withdrawal (user_id, type, currency, amount, base_currency, base_amount, date, created_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP());",
        [userId, type.toUpperCase(), currency, amount, baseCurrency, baseAmount, date],
    callback);
};

var repointDebitRow = exports.repointDebitRow = function(debitId, withdrawalId, callback) {
    db.runQuery(
        "UPDATE debit " +
        "SET withdrawal_id = ? " +
        "WHERE id = ?;",
        [withdrawalId, debitId],
    callback);
};

var updateBaseAmount = exports.updateBaseAmount = function(transactionId, baseAmount, callback) {
    db.runQuery(
        "UPDATE transaction SET base_amount = ? WHERE id = ?;",
        [baseAmount, transactionId],
    callback);
};

var updateDebitAmount = exports.updateDebitAmount = function(debitId, amount, callback) {
    db.runQuery(
        "UPDATE debit SET amount = ? WHERE id = ?;",
        [amount, debitId],
    callback);
};

var updateUsedAmount = exports.updateUsedAmount = function(withdrawalId, used, callback) {
    db.runQuery(
        "UPDATE withdrawal SET used = ? WHERE id = ?;",
        [used, withdrawalId],
    callback);
};