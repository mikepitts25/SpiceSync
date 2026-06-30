export const MIN_GAME_PLAYERS = 2;
export const MAX_GAME_PLAYERS = 4;

export const DEFAULT_GAME_PLAYER_NAMES = [
  'Player 1',
  'Player 2',
  'Player 3',
  'Player 4',
] as const;

export type GameTurn = {
  player: string;
  target: string;
  turnNumber: number;
};

export function normalizeGamePlayerCount(count: number): number {
  if (!Number.isFinite(count)) return MIN_GAME_PLAYERS;
  return Math.min(MAX_GAME_PLAYERS, Math.max(MIN_GAME_PLAYERS, Math.floor(count)));
}

export function normalizeGamePlayers(
  names: readonly string[],
  count: number
): string[] {
  const normalizedCount = normalizeGamePlayerCount(count);
  return DEFAULT_GAME_PLAYER_NAMES.slice(0, normalizedCount).map(
    (defaultName, index) => names[index]?.trim() || defaultName
  );
}

export function getGameTurn(
  players: readonly string[],
  turnIndex: number
): GameTurn {
  const normalizedPlayers = normalizeGamePlayers(players, players.length);
  const safeIndex =
    ((Math.floor(turnIndex) % normalizedPlayers.length) +
      normalizedPlayers.length) %
    normalizedPlayers.length;
  const targetIndex = (safeIndex + 1) % normalizedPlayers.length;

  return {
    player: normalizedPlayers[safeIndex],
    target: normalizedPlayers[targetIndex],
    turnNumber: safeIndex + 1,
  };
}

export function advanceGameTurnIndex(
  turnIndex: number,
  playerCount: number
): number {
  const normalizedCount = normalizeGamePlayerCount(playerCount);
  return (Math.floor(turnIndex) + 1) % normalizedCount;
}

export function buildDrinkConsequence(playerName: string): string {
  const player = playerName.trim() || DEFAULT_GAME_PLAYER_NAMES[0];
  return `${player} takes a drink.`;
}
