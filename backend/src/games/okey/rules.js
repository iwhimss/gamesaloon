import { COLORS } from './tiles.js';

export function isJokerTile(tile, okeyTile) {
  if (tile.isFakeOkey) return true;
  if (!okeyTile) return false;
  return tile.color === okeyTile.color && tile.number === okeyTile.number;
}

export function computeOkeyTile(indicatorTile) {
  const nextNumber = indicatorTile.number === 13 ? 1 : indicatorTile.number + 1;
  return { color: indicatorTile.color, number: nextNumber };
}

function splitJokers(tiles, okeyTile) {
  const jokers = [];
  const concrete = [];
  for (const tile of tiles) {
    if (isJokerTile(tile, okeyTile)) jokers.push(tile);
    else concrete.push(tile);
  }
  return { jokerCount: jokers.length, concrete };
}

function isPairHand(tiles, okeyTile) {
  if (tiles.length !== 15) return false;
  const { jokerCount, concrete } = splitJokers(tiles, okeyTile);

  const counts = new Map();
  for (const tile of concrete) {
    const key = `${tile.color}:${tile.number}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let pairs = 0;
  let singles = 0;
  for (const count of counts.values()) {
    pairs += Math.floor(count / 2);
    if (count % 2 === 1) singles += 1;
  }

  let jokersLeft = jokerCount;
  const jokerPairsWithSingles = Math.min(jokersLeft, singles);
  pairs += jokerPairsWithSingles;
  singles -= jokerPairsWithSingles;
  jokersLeft -= jokerPairsWithSingles;

  pairs += Math.floor(jokersLeft / 2);
  jokersLeft %= 2;

  const leftover = singles + jokersLeft;
  return pairs === 7 && leftover === 1;
}

function removeFirst(list, predicate) {
  const index = list.findIndex(predicate);
  if (index === -1) return null;
  return list.splice(index, 1)[0];
}

function combinationsOfTwo(items) {
  const result = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      result.push([items[i], items[j]]);
    }
  }
  return result;
}

function solveGroups(remaining, jokersLeft) {
  if (remaining.length === 0) {
    return jokersLeft % 3 === 0;
  }

  remaining.sort((a, b) => (a.number - b.number) || a.color.localeCompare(b.color));
  const anchor = remaining[0];
  const rest = remaining.slice(1);

  // Set: aynı sayı, farklı renkler.
  const otherColors = COLORS.filter((c) => c !== anchor.color);
  for (const [colorA, colorB] of combinationsOfTwo(otherColors)) {
    for (const useJokerA of [false, true]) {
      for (const useJokerB of [false, true]) {
        const jokersNeeded = (useJokerA ? 1 : 0) + (useJokerB ? 1 : 0);
        if (jokersNeeded > jokersLeft) continue;

        const restCopy = [...rest];
        let ok = true;
        if (!useJokerA && !removeFirst(restCopy, (t) => t.number === anchor.number && t.color === colorA)) ok = false;
        if (ok && !useJokerB && !removeFirst(restCopy, (t) => t.number === anchor.number && t.color === colorB)) ok = false;

        if (ok && solveGroups(restCopy, jokersLeft - jokersNeeded)) return true;
      }
    }
  }

  // Run: aynı renk, ardışık 3 sayı (sarma yok).
  if (anchor.number <= 11) {
    for (const useJoker2 of [false, true]) {
      for (const useJoker3 of [false, true]) {
        const jokersNeeded = (useJoker2 ? 1 : 0) + (useJoker3 ? 1 : 0);
        if (jokersNeeded > jokersLeft) continue;

        const restCopy = [...rest];
        let ok = true;
        if (!useJoker2 && !removeFirst(restCopy, (t) => t.number === anchor.number + 1 && t.color === anchor.color)) ok = false;
        if (ok && !useJoker3 && !removeFirst(restCopy, (t) => t.number === anchor.number + 2 && t.color === anchor.color)) ok = false;

        if (ok && solveGroups(restCopy, jokersLeft - jokersNeeded)) return true;
      }
    }
  }

  return false;
}

function isGroupHand(tiles, okeyTile) {
  if (tiles.length !== 15) return false;
  const { jokerCount, concrete } = splitJokers(tiles, okeyTile);
  return solveGroups([...concrete], jokerCount);
}

export function isWinningHand(tiles, okeyTile) {
  return isPairHand(tiles, okeyTile) || isGroupHand(tiles, okeyTile);
}
