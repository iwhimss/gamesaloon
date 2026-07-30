import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

export const tablesRouter = Router();

tablesRouter.get('/tables', requireAuth, async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT t.code, t.game_type, t.status, t.max_players, (t.password_hash IS NOT NULL) AS password_protected,
           COUNT(tp.user_id) FILTER (WHERE tp.left_at IS NULL) AS player_count
    FROM tables t
    LEFT JOIN table_players tp ON tp.table_id = t.id
    WHERE t.status <> 'kapandı'
    GROUP BY t.id
    ORDER BY t.created_at DESC
  `);

  res.json(rows.map((row) => ({
    code: row.code,
    gameType: row.game_type,
    status: row.status,
    maxPlayers: row.max_players,
    passwordProtected: row.password_protected,
    playerCount: Number(row.player_count),
  })));
});
