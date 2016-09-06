var async = require('async');

exports.up = function (db, callback) {
    db.runSql(
        "CREATE TABLE IF NOT EXISTS user " +
        "(" +
        "   user_id int NOT NULL AUTO_INCREMENT PRIMARY KEY, " +
        "   email varchar(255), " +
        "   username varchar(255), " +
        "   password_hash varchar(255), " +
        "   first_name varchar(255), " +
        "   last_name varchar(255), " +
        "   created_at TIMESTAMP DEFAULT '0000-00-00 00:00:00', " +
        "   updated_at TIMESTAMP DEFAULT now() ON UPDATE now(), " +
        "   CONSTRAINT unq_email UNIQUE (email), " +
        "   CONSTRAINT unq_username UNIQUE (username)" +
        ");",
    callback);
};

exports.down = function (db, callback) {
    db.runSql("DROP TABLE IF EXISTS user;", callback);
};