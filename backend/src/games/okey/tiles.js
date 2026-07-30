export const COLORS = ['kirmizi', 'sari', 'mavi', 'siyah'];
export const MIN_NUMBER = 1;
export const MAX_NUMBER = 13;

export function createDeck() {
  const tiles = [];

  for (const color of COLORS) {
    for (let number = MIN_NUMBER; number <= MAX_NUMBER; number += 1) {
      for (let copy = 0; copy < 2; copy += 1) {
        tiles.push({ id: `${color}-${number}-${copy}`, color, number, isFakeOkey: false });
      }
    }
  }

  tiles.push({ id: 'sahte-okey-0', color: null, number: null, isFakeOkey: true });
  tiles.push({ id: 'sahte-okey-1', color: null, number: null, isFakeOkey: true });

  return tiles;
}

export function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function nextNumber(number) {
  return number === MAX_NUMBER ? MIN_NUMBER : number + 1;
}
