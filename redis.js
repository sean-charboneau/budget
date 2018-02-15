var config = require('config');
var redis = require('redis');

var client = redis.createClient(
    process.env.REDIS_PORT || config.get('redis.port'),
    process.env.REDIS_HOST || config.get('redis.hostname')
);

client.on('connect', function() {
    console.log('Redis client connected at ' + config.get('redis.hostname') + ':' + config.get('redis.port'));
});

module.exports = client;