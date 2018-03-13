var db = require("../../db.js");

var deactivateTripsForUser = exports.deactivateTripsForUser = function(userId, callback) {
    db.runQuery("UPDATE trip SET is_active = 0 WHERE user_id = ?;", [userId], callback);
};

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

var getAllTripsForUser = exports.getAllTripsForUser = function(userId, callback) {
    db.runQuery(
        "SELECT id, trip_name, is_active " +
        "FROM trip " +
        "WHERE user_id = ? " +
        "ORDER BY is_active DESC;",
        [userId],
    callback);
};

var getBudgetForCountry = exports.getBudgetForCountry = function(tripId, country, callback) {
    db.runQuery(
        "SELECT budget, country, days, budget/days AS daily_budget " +
        "FROM segment " +
        "WHERE trip_id = ? AND country = ?;",
        [tripId, country],
    callback)
};

var getBudgetForTrip = exports.getBudgetForTrip = function(tripId, callback) {
    db.runQuery(
        "SELECT budget, days " +
        "FROM trip " +
        "WHERE id = ?;",
        [tripId],
    callback);
};

var getCurrentCountryForTrip = exports.getCurrentCountryForTrip = function(tripId, callback) {
    db.runQuery(
        "SELECT country " +
        "FROM transaction " +
        "WHERE trip_id = ? AND country IS NOT NULL " +
        "  AND country IN (SELECT country FROM segment WHERE trip_id = ? AND country IS NOT NULL) " +
        "ORDER BY created_at DESC LIMIT 1;",
        [tripId, tripId],
    function(err, results) {
        if(err) {
            return callback(err);
        }
        if(!results || !results.length) {
            // No transactions yet, default to first segment created
            db.runQuery(
                "SELECT country " +
                "FROM segment " +
                "WHERE trip_id = ? AND country IS NOT NULL " +
                "ORDER BY created_at ASC LIMIT 1;",
                [tripId],
            function(err, results) {
                if(err) {
                    return callback(err);
                }
                return callback(null, results[0].country);
            });
        }
        else {
            return callback(null, results[0].country);
        }
    });
};

var getNewestTransactionForTrip = exports.getNewestTransactionForTrip = function(tripId, callback) {
    db.runQuery(
        "SELECT date " +
        "FROM transaction " +
        "WHERE trip_id = ? " +
        "ORDER BY date DESC LIMIT 1",
        [tripId],
    function(err, results) {
        if(err || !results || !results.length) {
            return callback("Error: " + err);
        }
        return callback(null, results[0].date);
    })
};

var getOldestTransactionForTrip = exports.getOldestTransactionForTrip = function(tripId, callback) {
    db.runQuery(
        "SELECT date " +
        "FROM transaction " +
        "WHERE trip_id = ? " +
        "ORDER BY date ASC LIMIT 1",
        [tripId],
    function(err, results) {
        if(err || !results || !results.length) {
            return callback("Error: " + err);
        }
        return callback(null, results[0].date);
    })
};

var getSpendDataForCountryAndTrip = exports.getSpendDataForCountryAndTrip = function(tripId, country, callback) {
    var tripQuery = "WHERE t.trip_id = ? AND t.country = ?;";
    var joinQuery = "ON t.country = s.country AND t.trip_id = s.trip_id ";
    var tripParams = [tripId, country];
    if(!country) {
        tripQuery = "WHERE t.trip_id = ? AND t.country IS NULL;";
        joinQuery = "ON s.country IS NULL and t.trip_id = s.trip_id ";
        tripParams = [tripId];
    }
    db.runQuery(
        "SELECT COUNT(DISTINCT t.date) AS days_spent, SUM(t.base_amount) AS amount_spent, " +
        "    s.days AS days_planned, s.budget AS budget_planned " +
        "FROM transaction t " +
        "LEFT JOIN segment s " +
        joinQuery +        
        tripQuery,
        tripParams,
    callback);
};

var getUserIdForTrip = exports.getUserIdForTrip = function(tripId, callback) {
    db.runQuery(
        "SELECT user_id " +
        "FROM trip " +
        "WHERE id = ?;",
        [tripId],
    function(err, results) {
        if(err) {
            return callback(err);
        }
        if(!results || !results.length) {
            return callback("No trip with id " + tripId);
        }
        return callback(null, results[0].user_id);
    });
};

var getVisitedCountriesForTrip = exports.getVisitedCountriesForTrip = function(tripId, callback) {
    db.runQuery(
        "SELECT DISTINCT country " +
        "FROM transaction " +
        "WHERE trip_id = ?;",
        [tripId],
    function(err, results) {
        if(err) {
            return callback(err);
        }
        var countries = [];
        for(var i = 0; i < results.length; i++) {
            countries[i] = results[i].country;
        }
        return callback(null, countries);
    });
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