import { Router } from 'express';
import { listGames } from '../games/registry.js';

export const gamesRouter = Router();

gamesRouter.get('/games', (_req, res) => {
  res.json(listGames());
});
