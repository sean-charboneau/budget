var db = require('../../db.js');

var createUser = exports.createUser = function(user, callback) {
    db.runQuery(
        "INSERT INTO user (username, email, password_hash, first_name, last_name, base_currency, created_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);",
        [user.username, user.email, user.password, user.firstName, user.lastName, user.baseCurrency],
    callback);
};

var getUserByEmail = exports.getUserByEmail = function(email, callback) {
    db.runQuery(
        "SELECT id, username, first_name, last_name, email, password_hash, created_at, updated_at " +
        "FROM user " +
        "WHERE email = ?;",
        [email],
    function(err, rows) {
        if(err) { return callback(err); }
        if(!rows || rows.length === 0) {
            return callback();
        }
        return callback(null, rows[0]);
    });
};

var getUserById = exports.getUserById = function(id, callback) {
    db.runQuery(
        "SELECT id, username, first_name, last_name, email, password_hash, created_at, updated_at " +
        "FROM user " +
        "WHERE id = ?;",
        [id],
    function(err, rows) {
        if(err) { return callback(err); }
        if(!rows || rows.length === 0) {
            return callback();
        }
        return callback(null, rows[0]);
    });
};

var getUserByUsername = exports.getUserByUsername = function(username, callback) {
    db.runQuery(
        "SELECT id, username, first_name, last_name, email, password_hash, created_at, updated_at " +
        "FROM user " +
        "WHERE username = ?;",
        [username],
    function(err, rows) {
        if(err) { return callback(err); }
        if(!rows || rows.length === 0) {
            return callback();
        }
        return callback(null, rows[0]);
    });
};