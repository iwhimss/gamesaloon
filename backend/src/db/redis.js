import Redis from 'ioredis';
import { config } from '../config/index.js';

export const redis = new Redis(config.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

redis.on('error', () => {
  // Bağlantı hataları /health endpoint'i üzerinden raporlanır, burada sessizce yutulur.
});

export async function checkRedisConnection() {
  if (redis.status === 'wait' || redis.status === 'end') {
    await redis.connect();
  }
  await redis.ping();
}
