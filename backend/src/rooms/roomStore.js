import { redis } from '../db/redis.js';

const ROOM_TTL_SECONDS = 60 * 60 * 12;

function key(code) {
  return `room:${code}`;
}

export async function getRoom(code) {
  const raw = await redis.get(key(code));
  return raw ? JSON.parse(raw) : null;
}

export async function saveRoom(room) {
  await redis.set(key(room.code), JSON.stringify(room), 'EX', ROOM_TTL_SECONDS);
}

export async function deleteRoom(code) {
  await redis.del(key(code));
}

export function createRoomState({ code, gameType, maxPlayers, hostUserId, hostName, passwordProtected }) {
  return {
    code,
    gameType,
    status: 'bekleniyor',
    maxPlayers,
    hostUserId,
    passwordProtected,
    players: [
      { userId: hostUserId, name: hostName, seatNo: 1, connected: true },
    ],
    game: null,
    sessionScores: {},
    handCount: 0,
    createdAt: new Date().toISOString(),
  };
}

export function publicRoomState(room) {
  return {
    code: room.code,
    gameType: room.gameType,
    status: room.status,
    maxPlayers: room.maxPlayers,
    hostUserId: room.hostUserId,
    passwordProtected: room.passwordProtected,
    players: room.players.map(({ userId, name, seatNo, connected }) => ({ userId, name, seatNo, connected })),
    sessionScores: room.sessionScores ?? {},
    handCount: room.handCount ?? 0,
  };
}
