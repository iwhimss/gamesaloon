import { pool } from '../db/pool.js';
import { closeRoom } from './roomStore.js';

const CHECK_INTERVAL_MS = 60 * 1000;
const IDLE_THRESHOLD_MINUTES = 15;

async function sweepOnce(io) {
  const { rows } = await pool.query(
    `SELECT code FROM tables
     WHERE status = 'bekleniyor' AND last_activity_at < now() - make_interval(mins => $1)`,
    [IDLE_THRESHOLD_MINUTES],
  );

  for (const { code } of rows) {
    await closeRoom(code);
    io.to(code).emit('room:closed', { reason: 'inaktivite' });

    const socketIds = io.sockets.adapter.rooms.get(code);
    if (socketIds) {
      for (const id of [...socketIds]) {
        const s = io.sockets.sockets.get(id);
        if (s) {
          s.leave(code);
          s.data.currentRoom = null;
        }
      }
    }

    console.log(`[idleSweeper] masa kapatıldı (inaktivite): ${code}`);
  }
}

export function startIdleSweeper(io) {
  setInterval(() => {
    sweepOnce(io).catch((err) => console.error('[idleSweeper]', err));
  }, CHECK_INTERVAL_MS);
}
