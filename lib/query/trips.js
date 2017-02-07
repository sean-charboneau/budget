var db = require('../../db.js');

var getActiveTripForUser = exports.getActiveTripForUser = function(userId, callback) {
    db.runQuery(
        "SELECT id FROM trip WHERE user_id = ? AND is_active = 1;",
        [userId],
    function(err, results) {
        if(err) {
            return callback(err);
        }
        if(!results || results.length == 0) {
            return callback();
        }
        if(results.length > 1) {
            return callback("Invalid number of active trips");
        }
        return callback(err, results[0].id);
    });
};

var deactivateTripsForUser = exports.deactivateTripsForUser = function(userId, callback) {
    db.runQuery("UPDATE trip SET is_active = 0 WHERE user_id = ?;", [userId], callback);
};

var insertSegment = exports.insertSegment = function(tripId, days, budget, country, callback) {
    db.runQuery(
        "INSERT INTO segment (trip_id, days, budget, country, created_at) " +
        "VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP());",
        [tripId, days, budget, country],
    callback);
};

var insertTrip = exports.insertTrip = function(userId, tripName, startDate, days, budget, callback) {
    db.runQuery(
        "INSERT INTO trip (user_id, trip_name, start_date, days, budget, is_active, created_at) " +
        "VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP());",
        [userId, tripName, startDate, days, budget],
    callback);
};