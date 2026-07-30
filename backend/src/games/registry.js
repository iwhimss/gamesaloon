export const GAME_REGISTRY = {
  okey: { id: 'okey', label: 'Okey', minPlayers: 4, maxPlayers: 4 },
};

export function isSupportedGameType(id) {
  return Object.prototype.hasOwnProperty.call(GAME_REGISTRY, id);
}

export function getGameDefinition(id) {
  return GAME_REGISTRY[id];
}

export function listGames() {
  return Object.values(GAME_REGISTRY);
}
