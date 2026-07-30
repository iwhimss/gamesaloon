import { pool } from '../db/pool.js';
import { calculateScore, createGame, getStateForPlayer, handleAction, isGameOver } from '../games/okey/index.js';
import { getRoom, publicRoomState, saveRoom } from './roomStore.js';

function fail(callback, message) {
  callback?.({ ok: false, error: message });
}

function socketsInRoom(io, code) {
  const ids = io.sockets.adapter.rooms.get(code) ?? new Set();
  return [...ids].map((id) => io.sockets.sockets.get(id)).filter(Boolean);
}

async function broadcastRoomState(io, room) {
  io.to(room.code).emit('room:state', publicRoomState(room));
}

function broadcastPrivateGameState(io, room) {
  for (const s of socketsInRoom(io, room.code)) {
    s.emit('game:state', getStateForPlayer(room.game, s.data.user.sub));
  }
}

async function persistHandResult(room, scores) {
  const { rows } = await pool.query('SELECT id FROM tables WHERE code = $1', [room.code]);
  const tableId = rows[0]?.id;
  if (!tableId) return;

  const { rows: sessionRows } = await pool.query(
    `INSERT INTO game_sessions (table_id, game_type, started_at, ended_at, result_json)
     VALUES ($1, $2, now(), now(), $3) RETURNING id`,
    [tableId, room.gameType, JSON.stringify({ winnerId: room.game.winnerId, scores })],
  );
  const sessionId = sessionRows[0].id;

  for (const [userId, score] of Object.entries(scores)) {
    await pool.query(
      'INSERT INTO score_history (game_session_id, user_id, score) VALUES ($1, $2, $3)',
      [sessionId, Number(userId), score],
    );
  }
}

export function registerGameHandlers(io, socket) {
  const user = socket.data.user;

  async function loadOwnRoom() {
    const code = socket.data.currentRoom;
    if (!code) return null;
    return getRoom(code);
  }

  socket.on('game:start', async (_payload, callback) => {
    try {
      const room = await loadOwnRoom();
      if (!room) return fail(callback, 'Bir masada değilsiniz');
      if (room.hostUserId !== user.sub) return fail(callback, 'Sadece host oyunu başlatabilir');
      if (room.status !== 'bekleniyor') return fail(callback, 'Oyun zaten başladı');
      if (room.players.length !== room.maxPlayers) return fail(callback, 'Masa dolu değil, oyun başlayamaz');

      room.status = 'oynanıyor';
      room.game = createGame(room.players.map((p) => p.userId));
      await saveRoom(room);
      await pool.query('UPDATE tables SET status = $1 WHERE code = $2', ['oynanıyor', room.code]);

      callback?.({ ok: true });
      await broadcastRoomState(io, room);
      broadcastPrivateGameState(io, room);
    } catch (err) {
      console.error('[game:start]', err);
      fail(callback, 'Oyun başlatılamadı');
    }
  });

  socket.on('game:action', async ({ type, payload } = {}, callback) => {
    try {
      const room = await loadOwnRoom();
      if (!room || !room.game) return fail(callback, 'Aktif bir oyun yok');

      const result = handleAction(room.game, user.sub, { type, payload });
      if (!result.ok) return fail(callback, result.error);

      await saveRoom(room);
      callback?.({ ok: true });

      if (isGameOver(room.game)) {
        const scores = room.game.winnerId ? calculateScore(room.game) : {};
        await persistHandResult(room, scores).catch((err) => console.error('[persistHandResult]', err));

        room.sessionScores = room.sessionScores ?? {};
        for (const [userId, score] of Object.entries(scores)) {
          room.sessionScores[userId] = (room.sessionScores[userId] ?? 0) + score;
        }
        room.handCount = (room.handCount ?? 0) + 1;

        io.to(room.code).emit('game:handEnded', {
          winnerId: room.game.winnerId,
          scores,
          draw: !room.game.winnerId,
          sessionScores: room.sessionScores,
        });

        room.status = 'bekleniyor';
        room.game = null;
        await pool.query('UPDATE tables SET status = $1 WHERE code = $2', ['bekleniyor', room.code]);
        await saveRoom(room);
        await broadcastRoomState(io, room);
      } else {
        broadcastPrivateGameState(io, room);
      }
    } catch (err) {
      console.error('[game:action]', err);
      fail(callback, 'İşlem başarısız');
    }
  });
}
