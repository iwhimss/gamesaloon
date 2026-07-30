import { Router } from 'express';
import { checkDbConnection } from '../db/pool.js';
import { checkRedisConnection } from '../db/redis.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  const status = { status: 'ok', version: process.env.npm_package_version ?? '0.0.1', uptime: process.uptime() };

  try {
    await checkDbConnection();
    status.postgres = 'ok';
  } catch (err) {
    status.postgres = 'error';
    status.status = 'degraded';
  }

  try {
    await checkRedisConnection();
    status.redis = 'ok';
  } catch (err) {
    status.redis = 'error';
    status.status = 'degraded';
  }

  res.json(status);
});
