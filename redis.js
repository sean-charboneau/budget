var config = require('config');
var redis = require('redis');

var redisPort = process.env.REDIS_PORT || config.get('redis.port');
var redisHost = process.env.REDIS_HOST || config.get('redis.hostname');

var client = redis.createClient(redisPort, redisHost);

if(process.env.REDIS_PASSWORD) {
    client.auth(process.env.REDIS_PASSWORD, function() {
        console.log('Redis authentication complete');
    });
}

client.on('connect', function() {
    console.log('Redis client connected at ' + redisHost + ':' + redisPort);
});

module.exports = client;