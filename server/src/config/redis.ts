import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Default client: key-value operations (rate limiting, cache)
const redis = new Redis(redisUrl);

// Publisher client: for publishing messages to channels
const redisPub = new Redis(redisUrl);

// Subscriber client: for subscribing to channels (dedicated connection)
// NOTE: A Redis connection in subscriber mode can ONLY use SUBSCRIBE/UNSUBSCRIBE/PING
const redisSub = new Redis(redisUrl);

redis.on('connect', () => {
  console.log('Redis connected (default)');
});

redisPub.on('connect', () => {
  console.log('Redis connected (pub)');
});

redisSub.on('connect', () => {
  console.log('Redis connected (sub)');
});

redis.on('error', (err) => {
  console.error('Redis connection error (default):', err);
});

redisPub.on('error', (err) => {
  console.error('Redis connection error (pub):', err);
});

redisSub.on('error', (err) => {
  console.error('Redis connection error (sub):', err);
});

export { redisPub, redisSub };
export default redis;
