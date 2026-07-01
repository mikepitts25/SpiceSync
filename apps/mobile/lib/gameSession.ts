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

export type GameConsequence = {
  id: string;
  text: string;
  includesDrink: boolean;
};

type GameConsequenceTemplate = {
  id: string;
  includesDrink: boolean;
  build: (turn: GameTurn) => string;
};

const BASE_GAME_CONSEQUENCES: GameConsequenceTemplate[] = [
  {
    id: 'no-passes',
    includesDrink: false,
    build: (turn) => `${turn.player} cannot pass for the next 2 turns.`,
  },
  {
    id: 'clothing',
    includesDrink: false,
    build: (turn) => `${turn.player} removes one piece of clothing.`,
  },
  {
    id: 'embarrassing-truth',
    includesDrink: false,
    build: (turn) =>
      `${turn.player} tells ${turn.target} one embarrassing secret.`,
  },
  {
    id: 'pet-role',
    includesDrink: false,
    build: (turn) =>
      `${turn.player} is ${turn.target}'s pet for the next 5 minutes.`,
  },
  {
    id: 'target-command',
    includesDrink: false,
    build: (turn) => `${turn.target} gives ${turn.player} a harmless command.`,
  },
];

const DRINKING_GAME_CONSEQUENCES: GameConsequenceTemplate[] = [
  {
    id: 'drink',
    includesDrink: true,
    build: (turn) => `${turn.player} takes a drink.`,
  },
  {
    id: 'target-picks-drink',
    includesDrink: true,
    build: (turn) => `${turn.target} chooses a drink for ${turn.player}.`,
  },
  {
    id: 'shot',
    includesDrink: true,
    build: (turn) => `${turn.player} takes a shot.`,
  },
];

export function normalizeGamePlayerCount(count: number): number {
  if (!Number.isFinite(count)) return MIN_GAME_PLAYERS;
  return Math.min(
    MAX_GAME_PLAYERS,
    Math.max(MIN_GAME_PLAYERS, Math.floor(count))
  );
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

export function buildGameConsequence(
  turn: GameTurn,
  drinkingMode: boolean,
  random: () => number = Math.random
): GameConsequence {
  const pool = drinkingMode
    ? [...BASE_GAME_CONSEQUENCES, ...DRINKING_GAME_CONSEQUENCES]
    : BASE_GAME_CONSEQUENCES;
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  const consequence = pool[index];

  return {
    id: consequence.id,
    text: consequence.build(turn),
    includesDrink: consequence.includesDrink,
  };
}

export function buildGameShareMessage(
  template: string,
  content: string,
  turn: GameTurn
): string {
  const assignment = `${turn.player} → ${turn.target}`;
  return template.replace('{{content}}', `${assignment}\n${content}`);
}
