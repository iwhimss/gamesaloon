import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';
import { generateUniqueRoomCode } from './codeGenerator.js';
import { createRoomState, deleteRoom, getRoom, publicRoomState, saveRoom } from './roomStore.js';

const SUPPORTED_GAME_TYPES = ['okey'];

function fail(callback, message) {
  callback?.({ ok: false, error: message });
}

async function broadcastRoomState(io, room) {
  io.to(room.code).emit('room:state', publicRoomState(room));
}

async function closeTable(code) {
  await pool.query('UPDATE tables SET status = $1, closed_at = now() WHERE code = $2', ['kapandı', code]);
  await deleteRoom(code);
}

export function registerRoomHandlers(io, socket) {
  const user = socket.data.user;

  socket.on('room:create', async ({ gameType, password, maxPlayers } = {}, callback) => {
    if (!SUPPORTED_GAME_TYPES.includes(gameType)) {
      return fail(callback, 'Desteklenmeyen oyun tipi');
    }

    const players = gameType === 'okey' ? 4 : maxPlayers;

    try {
      const code = await generateUniqueRoomCode();
      const passwordHash = password ? await bcrypt.hash(password, 10) : null;

      const { rows } = await pool.query(
        `INSERT INTO tables (code, password_hash, host_user_id, game_type, status, max_players)
         VALUES ($1, $2, $3, $4, 'bekleniyor', $5) RETURNING id`,
        [code, passwordHash, user.sub, gameType, players],
      );
      await pool.query(
        `INSERT INTO table_players (table_id, user_id, seat_no) VALUES ($1, $2, 1)
         ON CONFLICT (table_id, user_id) DO UPDATE SET seat_no = 1, left_at = NULL, joined_at = now()`,
        [rows[0].id, user.sub],
      );

      const room = createRoomState({
        code,
        gameType,
        maxPlayers: players,
        hostUserId: user.sub,
        hostName: user.name,
        passwordProtected: Boolean(passwordHash),
      });
      await saveRoom(room);

      socket.data.currentRoom = code;
      socket.join(code);
      callback?.({ ok: true, room: publicRoomState(room) });
    } catch (err) {
      console.error('[room:create]', err);
      fail(callback, 'Masa oluşturulamadı');
    }
  });

  socket.on('room:join', async ({ code, password } = {}, callback) => {
    try {
      const normalizedCode = String(code ?? '').toUpperCase();
      const room = await getRoom(normalizedCode);

      if (!room) return fail(callback, 'Masa bulunamadı');
      if (room.status !== 'bekleniyor') return fail(callback, 'Masa artık katılıma kapalı');

      if (room.players.some((p) => p.userId === user.sub)) {
        socket.data.currentRoom = normalizedCode;
        socket.join(normalizedCode);
        return callback?.({ ok: true, room: publicRoomState(room) });
      }

      if (room.players.length >= room.maxPlayers) return fail(callback, 'Masa dolu');

      if (room.passwordProtected) {
        const { rows } = await pool.query('SELECT password_hash FROM tables WHERE code = $1', [normalizedCode]);
        const match = rows[0] && (await bcrypt.compare(password ?? '', rows[0].password_hash ?? ''));
        if (!match) return fail(callback, 'Şifre hatalı');
      }

      const seatNo = room.players.length + 1;
      room.players.push({ userId: user.sub, name: user.name, seatNo, connected: true });

      await pool.query(
        `INSERT INTO table_players (table_id, user_id, seat_no)
         SELECT id, $2, $3 FROM tables WHERE code = $1
         ON CONFLICT (table_id, user_id) DO UPDATE SET seat_no = EXCLUDED.seat_no, left_at = NULL, joined_at = now()`,
        [normalizedCode, user.sub, seatNo],
      );
      await saveRoom(room);

      socket.data.currentRoom = normalizedCode;
      socket.join(normalizedCode);
      callback?.({ ok: true, room: publicRoomState(room) });
      await broadcastRoomState(io, room);
    } catch (err) {
      console.error('[room:join]', err);
      fail(callback, 'Masaya katılınamadı');
    }
  });

  async function leaveCurrentRoom() {
    const code = socket.data.currentRoom;
    if (!code) return;

    socket.leave(code);
    socket.data.currentRoom = null;

    try {
      const room = await getRoom(code);
      if (!room) return;

      room.players = room.players.filter((p) => p.userId !== user.sub);

      await pool.query(
        `UPDATE table_players SET left_at = now()
         WHERE user_id = $1 AND table_id = (SELECT id FROM tables WHERE code = $2)`,
        [user.sub, code],
      );

      if (room.players.length === 0) {
        await closeTable(code);
        return;
      }

      if (room.hostUserId === user.sub) {
        room.hostUserId = room.players[0].userId;
        await pool.query('UPDATE tables SET host_user_id = $1 WHERE code = $2', [room.hostUserId, code]);
      }

      await saveRoom(room);
      await broadcastRoomState(io, room);
    } catch (err) {
      console.error('[room:leave]', err);
    }
  }

  socket.on('room:leave', async (_payload, callback) => {
    await leaveCurrentRoom();
    callback?.({ ok: true });
  });

  socket.on('disconnect', async () => {
    await leaveCurrentRoom();
  });
}
