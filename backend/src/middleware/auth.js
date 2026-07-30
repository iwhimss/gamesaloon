import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export function signGuestToken(user) {
  return jwt.sign(
    { sub: user.id, name: user.username, guest: true },
    config.jwtSecret,
    { expiresIn: '7d' },
  );
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Yetkilendirme gerekli' });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum' });
  }
}
