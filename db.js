var mysql = require('mysql');

var dbConfig = require('./database.json');

var pool = mysql.createPool(dbConfig.dev); // TODO: envs

var getConnection = function(callback) {
    pool.getConnection(function(err, connection) {
        callback(err, connection);
    });
};

var runQuery = exports.runQuery = function(str, args, callback) {
    getConnection(function(err, conn) {
        conn.query(str, args, function(err, rows) {
            conn.release();
            return callback(err, rows);
        })
    })
};