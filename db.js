var mysql = require('mysql');

var dbConfig = require('./database.json');

dbConfig.user = process.env.CLEARDB_DATABASE_USER || dbConfig.user;
dbConfig.password = process.env.CLEARDB_DATABASE_PASSWORD || dbConfig.password;
dbConfig.host = process.env.CLEARDB_DATABASE_HOST || dbConfig.host;
dbConfig.database = process.env.CLEARDB_DATABASE_NAME || dbConfig.database;

console.log('Initializing database connection with ' + dbConfig.host);

var pool = mysql.createPool(dbConfig); // TODO: envs

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