var userQuery = require('../query/users');

var createUser = exports.createUser = function(user, callback) {
    /* user object should contain:
        - username
        - email
        - password
        - firstName (optional)
        - lastName (optional)
    */
    userQuery.createUser(user, callback);
};

var getUserById = exports.getUserById = function(userId, callback) {
    userQuery.getUserById(userId, callback);
};

var getUserByEmail = exports.getUserByEmail = function(email, callback) {
    userQuery.getUserByEmail(email, callback);
};

var getUserByUsername = exports.getUserByUsername = function(username, callback) {
    userQuery.getUserByUsername(username, callback);
};

var updateUser = exports.updateUser = function(userId, firstName, lastName, email, callback) {
    userQuery.updateUser(userId, firstName, lastName, email, callback);
};