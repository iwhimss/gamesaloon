import { Router } from 'express';
import { pool } from '../db/pool.js';
import { signGuestToken } from '../middleware/auth.js';

export const guestRouter = Router();

guestRouter.post('/guest-login', async (req, res) => {
  const name = String(req.body?.name ?? '').trim();

  if (!name || name.length > 32) {
    return res.status(400).json({ error: 'Geçerli bir isim girin (1-32 karakter)' });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO users (username, is_guest) VALUES ($1, true) RETURNING id, username',
      [name],
    );
    const user = rows[0];
    const token = signGuestToken(user);

    res.status(201).json({ token, user: { id: user.id, name: user.username, guest: true } });
  } catch (err) {
    console.error('[guest-login]', err);
    res.status(503).json({ error: 'Veritabanına şu an ulaşılamıyor, daha sonra tekrar deneyin' });
  }
});
