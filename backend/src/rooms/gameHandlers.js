import { pool } from '../db/pool.js';
import {
  calculateScore,
  chooseAutoDiscardTile,
  createGame,
  getStateForPlayer,
  handleAction,
  isGameOver,
} from '../games/okey/index.js';
import { getRoom, publicRoomState, saveRoom } from './roomStore.js';

const turnTimers = new Map();

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

function clearTurnTimer(code) {
  const handle = turnTimers.get(code);
  if (handle) {
    clearTimeout(handle);
    turnTimers.delete(code);
  }
}

function scheduleTurnTimer(io, room) {
  clearTurnTimer(room.code);
  if (!room.game || room.game.status !== 'oynanıyor') return;

  const delay = Math.max(0, room.game.turnDeadline - Date.now());
  const handle = setTimeout(() => {
    handleTurnTimeout(io, room.code).catch((err) => console.error('[turnTimeout]', err));
  }, delay);
  turnTimers.set(room.code, handle);
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

async function finalizeHandEnd(io, room) {
  clearTurnTimer(room.code);

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
}

async function handleTurnTimeout(io, code) {
  const room = await getRoom(code);
  if (!room || !room.game || room.game.status !== 'oynanıyor') return;
  if (room.game.turnDeadline > Date.now()) return;

  const playerId = room.game.playerOrder[room.game.currentPlayerIndex];

  if (room.game.turnPhase === 'draw') {
    const drawResult = handleAction(room.game, playerId, { type: 'draw', payload: { source: 'pile' } });
    if (!drawResult.ok) return;
  }

  if (!isGameOver(room.game) && room.game.turnPhase === 'discard') {
    const tile = chooseAutoDiscardTile(room.game.hands[playerId], room.game.okeyTile);
    if (tile) {
      handleAction(room.game, playerId, { type: 'discard', payload: { tileId: tile.id } });
    }
  }

  await saveRoom(room);

  if (isGameOver(room.game)) {
    await finalizeHandEnd(io, room);
  } else {
    broadcastPrivateGameState(io, room);
    scheduleTurnTimer(io, room);
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
      room.game = createGame(room.players.map((p) => p.userId), room.turnDurationSeconds ?? 30);
      await saveRoom(room);
      await pool.query('UPDATE tables SET status = $1 WHERE code = $2', ['oynanıyor', room.code]);

      callback?.({ ok: true });
      await broadcastRoomState(io, room);
      broadcastPrivateGameState(io, room);
      scheduleTurnTimer(io, room);
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
        await finalizeHandEnd(io, room);
      } else {
        broadcastPrivateGameState(io, room);
        if (type === 'discard') scheduleTurnTimer(io, room);
      }
    } catch (err) {
      console.error('[game:action]', err);
      fail(callback, 'İşlem başarısız');
    }
  });
}
