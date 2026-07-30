import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';
import { getRoom, publicRoomState, saveRoom } from './roomStore.js';

function fail(callback, message) {
  callback?.({ ok: false, error: message });
}

async function broadcastRoomState(io, room) {
  io.to(room.code).emit('room:state', publicRoomState(room));
}

export function registerHostHandlers(io, socket) {
  const user = socket.data.user;

  async function loadOwnRoom() {
    const code = socket.data.currentRoom;
    if (!code) return null;
    return getRoom(code);
  }

  socket.on('host:kick', async ({ targetUserId } = {}, callback) => {
    try {
      const room = await loadOwnRoom();
      if (!room) return fail(callback, 'Bir masada değilsiniz');
      if (room.hostUserId !== user.sub) return fail(callback, 'Sadece host bu işlemi yapabilir');
      if (targetUserId === user.sub) return fail(callback, 'Kendinizi atamazsınız');

      const target = room.players.find((p) => p.userId === targetUserId);
      if (!target) return fail(callback, 'Oyuncu bulunamadı');

      room.players = room.players.filter((p) => p.userId !== targetUserId);
      await pool.query(
        `UPDATE table_players SET left_at = now()
         WHERE user_id = $1 AND table_id = (SELECT id FROM tables WHERE code = $2)`,
        [targetUserId, room.code],
      );
      await saveRoom(room);

      const targetSocket = [...io.sockets.sockets.values()].find(
        (s) => s.data.user?.sub === targetUserId && s.data.currentRoom === room.code,
      );
      if (targetSocket) {
        targetSocket.leave(room.code);
        targetSocket.data.currentRoom = null;
        targetSocket.emit('room:kicked', { code: room.code });
      }

      callback?.({ ok: true });
      await broadcastRoomState(io, room);
    } catch (err) {
      console.error('[host:kick]', err);
      fail(callback, 'İşlem başarısız');
    }
  });

  socket.on('host:changePassword', async ({ password } = {}, callback) => {
    try {
      const room = await loadOwnRoom();
      if (!room) return fail(callback, 'Bir masada değilsiniz');
      if (room.hostUserId !== user.sub) return fail(callback, 'Sadece host bu işlemi yapabilir');
      if (room.status !== 'bekleniyor') return fail(callback, 'Oyun başladıktan sonra ayar değiştirilemez');

      const passwordHash = password ? await bcrypt.hash(password, 10) : null;
      await pool.query('UPDATE tables SET password_hash = $1 WHERE code = $2', [passwordHash, room.code]);

      room.passwordProtected = Boolean(passwordHash);
      await saveRoom(room);

      callback?.({ ok: true });
      await broadcastRoomState(io, room);
    } catch (err) {
      console.error('[host:changePassword]', err);
      fail(callback, 'İşlem başarısız');
    }
  });

  socket.on('host:rename', async ({ name } = {}, callback) => {
    try {
      const room = await loadOwnRoom();
      if (!room) return fail(callback, 'Bir masada değilsiniz');
      if (room.hostUserId !== user.sub) return fail(callback, 'Sadece host bu işlemi yapabilir');

      const tableName = String(name ?? '').trim().slice(0, 64) || `Masa #${room.code}`;
      await pool.query('UPDATE tables SET name = $1 WHERE code = $2', [tableName, room.code]);

      room.name = tableName;
      await saveRoom(room);

      callback?.({ ok: true });
      await broadcastRoomState(io, room);
    } catch (err) {
      console.error('[host:rename]', err);
      fail(callback, 'İşlem başarısız');
    }
  });

  socket.on('host:transfer', async ({ targetUserId } = {}, callback) => {
    try {
      const room = await loadOwnRoom();
      if (!room) return fail(callback, 'Bir masada değilsiniz');
      if (room.hostUserId !== user.sub) return fail(callback, 'Sadece host bu işlemi yapabilir');

      const target = room.players.find((p) => p.userId === targetUserId);
      if (!target) return fail(callback, 'Oyuncu bulunamadı');

      room.hostUserId = targetUserId;
      await pool.query('UPDATE tables SET host_user_id = $1 WHERE code = $2', [targetUserId, room.code]);
      await saveRoom(room);

      callback?.({ ok: true });
      await broadcastRoomState(io, room);
    } catch (err) {
      console.error('[host:transfer]', err);
      fail(callback, 'İşlem başarısız');
    }
  });
}
