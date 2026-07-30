/**
 * Oyuncuları masa etrafına dizer: kendin her zaman "self" (alt/ön) konumda,
 * diğerleri sıradaki oyunculardan başlayarak sol/üst/sağ konumlara yerleşir.
 * Şu an sadece 4 oyunculu oyunlar (Okey) için kullanılıyor; ileride farklı
 * oyuncu sayılı oyunlar eklenirse burada genişletilir.
 */
export function assignSeats(players, selfUserId) {
  const selfIndex = players.findIndex((p) => p.userId === selfUserId);
  if (selfIndex === -1) {
    return { self: null, left: players[0] ?? null, top: players[1] ?? null, right: players[2] ?? null };
  }

  const rotated = [...players.slice(selfIndex), ...players.slice(0, selfIndex)];

  return {
    self: rotated[0] ?? null,
    left: rotated[1] ?? null,
    top: rotated[2] ?? null,
    right: rotated[3] ?? null,
  };
}

export const MASCOT_COLORS = ['#f97316', '#22c55e', '#3b82f6', '#ec4899', '#eab308', '#14b8a6', '#a855f7', '#ef4444'];

export function mascotColorFor(userId) {
  const str = String(userId);
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return MASCOT_COLORS[hash % MASCOT_COLORS.length];
}
