import { redis } from '../db/redis.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

export async function generateUniqueRoomCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = randomCode();
    const exists = await redis.exists(`room:${code}`);
    if (!exists) return code;
  }
  throw new Error('Benzersiz masa kodu üretilemedi, tekrar deneyin');
}
