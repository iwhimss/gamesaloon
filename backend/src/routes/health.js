import { createRequire } from 'node:module';
import { Router } from 'express';
import { checkDbConnection } from '../db/pool.js';
import { checkRedisConnection } from '../db/redis.js';

const require = createRequire(import.meta.url);
const { version: packageVersion } = require('../../package.json');

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  const status = { status: 'ok', version: packageVersion, uptime: process.uptime() };

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
