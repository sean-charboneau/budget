var bCrypt = require('bcrypt-nodejs');
var LocalStrategy = require('passport-local').Strategy;

var categoryController = require('../lib/controllers/categories');
var userController = require('../lib/controllers/users');

module.exports = function(passport) {
	passport.use('register', new LocalStrategy({
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, callback) {
            findOrCreateUser = function() {
                userController.getUserByUsername(username, function(err, user) {
                    if (err) {
                        console.log('Error in Registration: ' + err);
                        return callback(err);
                    }
                    // User already exists
                    if (user) {
                        console.log(user);
                        console.log('User already exists with username: ' + username);
                        return callback(null, false, {'message': 'User Already Exists'});
                    }
                    else {
                        // Create the user
                        var newUser = {};

                        newUser.username = username;
                        newUser.password = createHash(password);
                        newUser.email = req.param('email');
                        newUser.firstName = req.param('firstName');
                        newUser.lastName = req.param('lastName');
                        newUser.baseCurrency = req.param('baseCurrency');

                        // save the user
                        userController.createUser(newUser, function(err, results) {
                            if (err) {
                                console.log('Error creating user: ' + err);  
                                return callback(null, false, {'message': err});
                            }
                            newUser.id = results.insertId;
                            console.log('User Registration successful');
                            categoryController.setDefaultCategoriesForUser(newUser.id, function(err, results) {
                                if(err) {
                                    console.log('Error setting default categories: ' + err);
                                    return callback(err, newUser);
                                }
                                return callback(null, newUser);
                            });
                        });
                    }
                });
            };
            // Delay the execution of findOrCreateUser and execute the method
            // in the next tick of the event loop
            process.nextTick(findOrCreateUser);
        })
    );

    // Generates hash using bCrypt
    var createHash = function(password) {
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    };
};