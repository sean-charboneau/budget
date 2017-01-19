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