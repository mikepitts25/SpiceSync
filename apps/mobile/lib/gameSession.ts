export const MIN_GAME_PLAYERS = 1;
export const MAX_GAME_PLAYERS = 4;
export const SOLO_PLAYER_COUNT = 1;

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
  textEs: string;
  includesDrink: boolean;
};

export type GameRoundOutcome = {
  nextTurnIndex: number;
  consequence: GameConsequence | null;
  requiresAcknowledgement: boolean;
};

type GameConsequenceTemplate = {
  id: string;
  includesDrink: boolean;
  build: (turn: GameTurn) => string;
  buildEs: (turn: GameTurn) => string;
};

// Consequences shared by both modes: playful, low-stakes forfeits.
const BASE_GAME_CONSEQUENCES: GameConsequenceTemplate[] = [
  {
    id: 'no-passes',
    includesDrink: false,
    build: (turn) => `${turn.player} cannot pass for the next 2 turns.`,
    buildEs: (turn) =>
      `${turn.player} no puede pasar durante los próximos 2 turnos.`,
  },
  {
    id: 'embarrassing-truth',
    includesDrink: false,
    build: (turn) =>
      `${turn.player} tells ${turn.target} one embarrassing secret.`,
    buildEs: (turn) =>
      `${turn.player} le cuenta a ${turn.target} un secreto vergonzoso.`,
  },
  {
    id: 'target-command',
    includesDrink: false,
    build: (turn) => `${turn.target} gives ${turn.player} a harmless command.`,
    buildEs: (turn) =>
      `${turn.target} le da a ${turn.player} una orden inofensiva.`,
  },
  {
    id: 'compliment-round',
    includesDrink: false,
    build: (turn) =>
      `${turn.player} gives ${turn.target} two sincere compliments, no repeats.`,
    buildEs: (turn) =>
      `${turn.player} le da a ${turn.target} dos cumplidos sinceros, sin repetir.`,
  },
  {
    id: 'silly-serenade',
    includesDrink: false,
    build: (turn) =>
      `${turn.player} sings their next answer instead of saying it.`,
    buildEs: (turn) =>
      `${turn.player} canta su próxima respuesta en vez de decirla.`,
  },
  {
    id: 'pose-hold',
    includesDrink: false,
    build: (turn) =>
      `${turn.player} holds a dramatic pose chosen by ${turn.target} for 15 seconds.`,
    buildEs: (turn) =>
      `${turn.player} mantiene una pose dramática elegida por ${turn.target} durante 15 segundos.`,
  },
  {
    id: 'accent-round',
    includesDrink: false,
    build: (turn) =>
      `${turn.player} speaks in an accent chosen by ${turn.target} until their next turn.`,
    buildEs: (turn) =>
      `${turn.player} habla con un acento elegido por ${turn.target} hasta su próximo turno.`,
  },
  {
    id: 'truth-double',
    includesDrink: false,
    build: (turn) =>
      `${turn.player} answers one extra truth question from ${turn.target}.`,
    buildEs: (turn) =>
      `${turn.player} responde una pregunta extra de verdad de ${turn.target}.`,
  },
  {
    id: 'target-invents',
    includesDrink: false,
    build: (turn) =>
      `${turn.target} invents the consequence. ${turn.player} may ask for one redo.`,
    buildEs: (turn) =>
      `${turn.target} inventa la consecuencia. ${turn.player} puede pedir un solo cambio.`,
  },
];

// Spicier forfeits, only dealt in intense mode.
const INTENSE_GAME_CONSEQUENCES: GameConsequenceTemplate[] = [
  {
    id: 'clothing',
    includesDrink: false,
    build: (turn) => `${turn.player} removes one piece of clothing.`,
    buildEs: (turn) => `${turn.player} se quita una prenda.`,
  },
  {
    id: 'pet-role',
    includesDrink: false,
    build: (turn) =>
      `${turn.player} is ${turn.target}'s pet for the next 5 minutes.`,
    buildEs: (turn) =>
      `${turn.player} es la mascota de ${turn.target} durante los próximos 5 minutos.`,
  },
  {
    id: 'whisper-wish',
    includesDrink: false,
    build: (turn) =>
      `${turn.player} whispers to ${turn.target} one thing they want more of.`,
    buildEs: (turn) =>
      `${turn.player} le susurra a ${turn.target} algo de lo que quiere más.`,
  },
  {
    id: 'blindfold-turn',
    includesDrink: false,
    build: (turn) => `${turn.player} takes their next turn blindfolded.`,
    buildEs: (turn) =>
      `${turn.player} juega su próximo turno con los ojos vendados.`,
  },
  {
    id: 'slow-dance',
    includesDrink: false,
    build: (turn) =>
      `${turn.player} slow dances with ${turn.target} for 30 seconds, no music allowed.`,
    buildEs: (turn) =>
      `${turn.player} baila lento con ${turn.target} durante 30 segundos, sin música.`,
  },
];

const DRINKING_GAME_CONSEQUENCES: GameConsequenceTemplate[] = [
  {
    id: 'drink',
    includesDrink: true,
    build: (turn) => `${turn.player} takes a drink.`,
    buildEs: (turn) => `${turn.player} toma un trago.`,
  },
  {
    id: 'target-picks-drink',
    includesDrink: true,
    build: (turn) => `${turn.target} chooses a drink for ${turn.player}.`,
    buildEs: (turn) => `${turn.target} elige un trago para ${turn.player}.`,
  },
  {
    id: 'toast-drink',
    includesDrink: true,
    build: (turn) =>
      `${turn.player} makes a toast to ${turn.target}, then takes a drink.`,
    buildEs: (turn) =>
      `${turn.player} hace un brindis por ${turn.target} y luego toma un trago.`,
  },
  {
    id: 'shot',
    includesDrink: true,
    build: (turn) => `${turn.player} takes a shot.`,
    buildEs: (turn) => `${turn.player} toma un shot.`,
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

  // Solo play: the single player is both actor and target every turn.
  if (normalizedPlayers.length === 1) {
    return {
      player: normalizedPlayers[0],
      target: normalizedPlayers[0],
      turnNumber: 1,
    };
  }

  const wholeTurnIndex = Math.floor(turnIndex);
  const safeIndex =
    ((wholeTurnIndex % normalizedPlayers.length) + normalizedPlayers.length) %
    normalizedPlayers.length;
  const completedPasses = Math.floor(
    Math.max(0, wholeTurnIndex) / normalizedPlayers.length
  );
  const targetOffset =
    normalizedPlayers.length === 2
      ? 1
      : (completedPasses % (normalizedPlayers.length - 1)) + 1;
  const targetIndex = (safeIndex + targetOffset) % normalizedPlayers.length;

  return {
    player: normalizedPlayers[safeIndex],
    target: normalizedPlayers[targetIndex],
    turnNumber: safeIndex + 1,
  };
}

export function advanceGameTurnIndex(
  turnIndex: number,
  _playerCount: number
): number {
  return Math.max(0, Math.floor(turnIndex)) + 1;
}

export function buildDrinkConsequence(playerName: string): string {
  const player = playerName.trim() || DEFAULT_GAME_PLAYER_NAMES[0];
  return `${player} takes a drink.`;
}

export function buildGameConsequence(
  turn: GameTurn,
  drinkingMode: boolean,
  random: () => number = Math.random,
  intenseMode = false
): GameConsequence {
  const pool = [
    ...BASE_GAME_CONSEQUENCES,
    ...(intenseMode ? INTENSE_GAME_CONSEQUENCES : []),
    ...(drinkingMode ? DRINKING_GAME_CONSEQUENCES : []),
  ];
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  const consequence = pool[index];

  return {
    id: consequence.id,
    text: consequence.build(turn),
    textEs: consequence.buildEs(turn),
    includesDrink: consequence.includesDrink,
  };
}

export function resolveGameRoundOutcome({
  turnIndex,
  playerCount,
  turn,
  passed,
  drinkingMode,
  intenseMode = false,
  random = Math.random,
}: {
  turnIndex: number;
  playerCount: number;
  turn: GameTurn;
  passed: boolean;
  drinkingMode: boolean;
  intenseMode?: boolean;
  random?: () => number;
}): GameRoundOutcome {
  // Solo sessions have no consequences — passing just moves on.
  const consequence =
    passed && playerCount > SOLO_PLAYER_COUNT
      ? buildGameConsequence(turn, drinkingMode, random, intenseMode)
      : null;

  return {
    nextTurnIndex: advanceGameTurnIndex(turnIndex, playerCount),
    consequence,
    requiresAcknowledgement: consequence !== null,
  };
}

// ─── Heat rounds ────────────────────────────────────────────────────────────
// Every few turns in a 3-4 player game, the whole room plays one prompt at
// once so non-active players stay engaged.

export const HEAT_ROUND_INTERVAL = 6;

export type HeatRoundPrompt = {
  id: string;
  text: string;
  textEs: string;
};

const HEAT_ROUND_PROMPTS: HeatRoundPrompt[] = [
  {
    id: 'toast',
    text: 'Group toast: each player says one thing they love about the night so far. Clink on it.',
    textEs:
      'Brindis grupal: cada jugador dice algo que le encanta de la noche hasta ahora. Brinden por eso.',
  },
  {
    id: 'wink-off',
    text: 'Wink-off: everyone throws their most dramatic wink at once. The group crowns a winner.',
    textEs:
      'Duelo de guiños: todos lanzan su guiño más dramático a la vez. El grupo corona a un ganador.',
  },
  {
    id: 'compliment-circle',
    text: 'Compliment circle: everyone compliments the player on their left, no repeats allowed.',
    textEs:
      'Círculo de cumplidos: cada uno felicita al jugador de su izquierda, sin repetir.',
  },
  {
    id: 'dance-break',
    text: 'Dance break: 20 seconds, everyone dances at once, full commitment.',
    textEs:
      'Pausa de baile: 20 segundos, todos bailan a la vez, con total entrega.',
  },
  {
    id: 'group-pose',
    text: 'Album cover: strike a dramatic group pose together and hold it for 10 seconds.',
    textEs:
      'Portada de disco: hagan juntos una pose grupal dramática y manténganla 10 segundos.',
  },
  {
    id: 'speed-round',
    text: 'Speed round: going clockwise, everyone describes their perfect date in five words or less.',
    textEs:
      'Ronda rápida: en sentido horario, cada uno describe su cita perfecta en cinco palabras o menos.',
  },
];

export function isHeatRound(turnIndex: number, playerCount: number): boolean {
  if (playerCount < 3) return false;
  const wholeTurnIndex = Math.floor(turnIndex);
  return wholeTurnIndex > 0 && wholeTurnIndex % HEAT_ROUND_INTERVAL === 0;
}

export function getHeatRoundPrompt(turnIndex: number): HeatRoundPrompt {
  // Rotate deterministically through the pool so back-to-back heat rounds
  // in one session never repeat a prompt.
  const ordinal = Math.max(
    0,
    Math.floor(Math.floor(turnIndex) / HEAT_ROUND_INTERVAL) - 1
  );
  return HEAT_ROUND_PROMPTS[ordinal % HEAT_ROUND_PROMPTS.length];
}

export function buildGameShareMessage(
  template: string,
  content: string,
  turn: GameTurn
): string {
  const assignment = `${turn.player} → ${turn.target}`;
  return template.replace('{{content}}', `${assignment}\n${content}`);
}
