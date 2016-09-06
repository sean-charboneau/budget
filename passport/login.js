var bCrypt = require('bcrypt-nodejs');
var LocalStrategy = require('passport-local').Strategy;

var userController = require('../lib/controllers/users');

module.exports = function(passport) {
	passport.use('login', new LocalStrategy({
            passReqToCallback : true
        },
        function(req, username, password, callback) { 
            // check if a user with the specified username exists or not
            userController.getUserByUsername(username, function(err, user) {
                if (err) {
                    return callback(err);
                }

                // Username does not exist, log the error and redirect back
                if (!user) {
                    console.log('User Not Found with username: ' + username);
                    return callback(null, false, req.flash('message', 'User Not found.'));                 
                }

                // User exists but wrong password, log the error 
                if (!isValidPassword(user, password)) {
                    console.log('Invalid Password');
                    return callback(null, false, req.flash('message', 'Invalid Password')); // redirect back to login page
                }

                // User and password both match, return user from done method
                // which will be treated like success
                return callback(null, user);
            });
        })
    );

    var isValidPassword = function(user, password) {
        return bCrypt.compareSync(password, user.password_hash);
    };
};