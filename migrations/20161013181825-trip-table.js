var async = require('async');

exports.up = function (db, callback) {
    async.series([
        function(cb) {
            db.runSql(
                'CREATE TABLE IF NOT EXISTS trip ' +
                '(' +
                '   id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, ' +
                '   user_id INT NOT NULL, ' +
                '   trip_name VARCHAR(255), ' +
                '   start_date DATE NOT NULL, ' +
                '   days INT UNSIGNED, ' +
                '   budget INT UNSIGNED, ' +
                '   is_active TINYINT(1), ' +
                '   created_at TIMESTAMP DEFAULT "0000-00-00 00:00:00", ' +
                '   updated_at TIMESTAMP DEFAULT now() ON UPDATE now(), ' +
                '   FOREIGN KEY (user_id) REFERENCES user(id)' +
                ');',
            cb);
        },
        function(cb) {
            db.runSql(
                'CREATE TABLE IF NOT EXISTS segment ' +
                '(' +
                '   id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, ' +
                '   trip_id INT NOT NULL, ' +
                '   days INT NOT NULL, ' +
                '   budget INT NOT NULL, ' +
                '   sequence INT NOT NULL, ' +
                '   created_at TIMESTAMP DEFAULT "0000-00-00 00:00:00", ' +
                '   updated_at TIMESTAMP DEFAULT now() ON UPDATE now(), ' +
                '   FOREIGN KEY (trip_id) REFERENCES trip(id)' +
                ');',
            cb);
        }
    ], callback);
};

exports.down = function (db, callback) {
    db.runSql("DROP TABLE IF EXISTS segment, trip;", callback);
};