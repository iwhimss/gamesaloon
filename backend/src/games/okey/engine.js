import { createDeck, shuffle } from './tiles.js';
import { computeOkeyTile, isWinningHand } from './rules.js';

const HAND_SIZE = 14;
const POINTS_PER_LOSER = 10;

export function createGame(playerIds) {
  const deck = shuffle(createDeck());

  let indicatorTile = deck.pop();
  while (indicatorTile.isFakeOkey) {
    deck.unshift(indicatorTile);
    indicatorTile = deck.pop();
  }

  const okeyTile = computeOkeyTile(indicatorTile);

  const hands = {};
  for (const playerId of playerIds) {
    hands[playerId] = deck.splice(0, HAND_SIZE);
  }

  return {
    status: 'oynanıyor',
    playerOrder: [...playerIds],
    currentPlayerIndex: 0,
    turnPhase: 'draw',
    indicatorTile,
    okeyTile,
    drawPile: deck,
    discardPile: [],
    hands,
    winnerId: null,
    finishedAt: null,
  };
}

function currentPlayerId(state) {
  return state.playerOrder[state.currentPlayerIndex];
}

function findTileIndex(hand, tileId) {
  return hand.findIndex((t) => t.id === tileId);
}

export function handleAction(state, playerId, action) {
  if (state.status !== 'oynanıyor') {
    return { ok: false, error: 'Oyun sürmüyor' };
  }
  if (currentPlayerId(state) !== playerId) {
    return { ok: false, error: 'Sıra sizde değil' };
  }

  if (action.type === 'draw') {
    if (state.turnPhase !== 'draw') {
      return { ok: false, error: 'Önce taş atmalısınız' };
    }

    const source = action.payload?.source === 'discard' ? 'discard' : 'pile';
    const hand = state.hands[playerId];

    if (source === 'discard') {
      if (state.discardPile.length === 0) return { ok: false, error: 'Atılan taş yığını boş' };
      hand.push(state.discardPile.pop().tile);
    } else {
      if (state.drawPile.length === 0) {
        state.status = 'bitti';
        state.finishedAt = new Date().toISOString();
        return { ok: true, drawGame: true };
      }
      hand.push(state.drawPile.pop());
    }

    state.turnPhase = 'discard';
    return { ok: true };
  }

  if (action.type === 'discard') {
    if (state.turnPhase !== 'discard') {
      return { ok: false, error: 'Önce taş çekmelisiniz' };
    }

    const hand = state.hands[playerId];
    const index = findTileIndex(hand, action.payload?.tileId);
    if (index === -1) return { ok: false, error: 'Bu taş elinizde yok' };

    const [tile] = hand.splice(index, 1);
    state.discardPile.push({ tile, by: playerId });

    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.playerOrder.length;
    state.turnPhase = 'draw';
    return { ok: true };
  }

  if (action.type === 'finishHand') {
    if (state.turnPhase !== 'discard') {
      return { ok: false, error: 'Bitirmek için önce taş çekmelisiniz' };
    }

    const hand = state.hands[playerId];
    if (!isWinningHand(hand, state.okeyTile)) {
      return { ok: false, error: 'Elinizdeki taşlar geçerli bir kombinasyon oluşturmuyor' };
    }

    state.status = 'bitti';
    state.winnerId = playerId;
    state.finishedAt = new Date().toISOString();
    return { ok: true };
  }

  return { ok: false, error: 'Bilinmeyen aksiyon' };
}

export function isGameOver(state) {
  return state.status === 'bitti';
}

export function calculateScore(state) {
  const scores = {};

  if (!state.winnerId) {
    for (const playerId of state.playerOrder) scores[playerId] = 0;
    return scores;
  }

  const losers = state.playerOrder.filter((id) => id !== state.winnerId);
  scores[state.winnerId] = losers.length * POINTS_PER_LOSER;
  for (const loserId of losers) scores[loserId] = -POINTS_PER_LOSER;

  return scores;
}

export function getStateForPlayer(state, playerId) {
  const lastDiscard = state.discardPile[state.discardPile.length - 1] ?? null;

  return {
    status: state.status,
    currentPlayerId: currentPlayerId(state),
    turnPhase: state.turnPhase,
    indicatorTile: state.indicatorTile,
    okeyTile: state.okeyTile,
    drawPileCount: state.drawPile.length,
    topDiscard: lastDiscard?.tile ?? null,
    lastDiscardBy: lastDiscard?.by ?? null,
    discardCount: state.discardPile.length,
    players: state.playerOrder.map((id) => ({ userId: id, tileCount: state.hands[id].length })),
    hand: state.hands[playerId] ?? [],
    winnerId: state.winnerId,
  };
}
