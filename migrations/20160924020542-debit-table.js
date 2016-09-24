var async = require('async');

exports.up = function (db, callback) {
    db.runSql(
        'CREATE TABLE IF NOT EXISTS debit ' +
        '(' +
        '   id int NOT NULL AUTO_INCREMENT PRIMARY KEY, ' +
        '   transaction_id int NOT NULL, ' +
        '   withdrawal_id int NOT NULL, ' +
        '   amount DECIMAL(16, 2), ' +
        '   created_at TIMESTAMP DEFAULT "0000-00-00 00:00:00", ' +
        '   updated_at TIMESTAMP DEFAULT now() ON UPDATE now(), ' +
        '   FOREIGN KEY (transaction_id) REFERENCES transaction(id), ' +
        '   FOREIGN KEY (withdrawal_id) REFERENCES withdrawal(id)' +
        ');',
    callback);
};

exports.down = function (db, callback) {
    db.runSql("DROP TABLE IF EXISTS debit;", callback);
};