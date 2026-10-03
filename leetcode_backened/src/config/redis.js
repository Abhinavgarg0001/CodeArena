const redis = require("redis");

let redisClient = null;

if (process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD !== 'your_redis_password') {
  redisClient = redis.createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
      host: process.env.REDIS_HOST || 'ultralight-microsmart-aunt-28338.db.redis.io',
      port: process.env.REDIS_PORT || 28338
    }
  });
  
  redisClient.on('error', (err) => {
    console.log('Redis Client Error:', err.message);
  });
} else {
  // Mock Redis client for development without Redis
  redisClient = {
    connect: async () => console.log('Redis: Using mock client (no Redis configured)'),
    quit: async () => {},
    on: () => {},
    exists: async () => 0,
    set: async () => {},
    expireAt: async () => {},
  };
}

module.exports = redisClient;