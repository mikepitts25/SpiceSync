import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GameCard } from '../data/gameCards';
import type { GameCustomDeckMode } from './gameDeck';

export const ACTIVE_GAME_SESSION_STORAGE_KEY =
  'spicesync-active-game-session-v1';

export type PersistedGameMode = 'normal' | 'intense';

export type PersistedGameSession = {
  version: 1;
  selectedMode: PersistedGameMode;
  customDeckMode: GameCustomDeckMode;
  playerCount: number;
  playerNames: string[];
  activePlayers: string[];
  turnIndex: number;
  lastConsequence: string | null;
  deckOrder: GameCard[];
  deckIndex: number;
  currentCard: GameCard | null;
  timerSeconds: number;
  isTimerRunning: boolean;
  drinkingMode: boolean;
  // Optional setup filters (added later; absent in older sessions).
  customLevels?: number[] | null;
  enabledTypes?: string[] | null;
  savedAt: number;
};

export type PersistedGameSessionInput = Omit<
  PersistedGameSession,
  'version' | 'savedAt'
> & {
  savedAt?: number;
};

type GameSessionStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

function isGameMode(value: unknown): value is PersistedGameMode {
  return value === 'normal' || value === 'intense';
}

function isCustomDeckMode(value: unknown): value is GameCustomDeckMode {
  return value === 'include' || value === 'customOnly';
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function isGameCard(value: unknown): value is GameCard {
  if (!value || typeof value !== 'object') return false;
  const card = value as Partial<GameCard>;
  return (
    typeof card.id === 'string' &&
    typeof card.type === 'string' &&
    typeof card.content === 'string' &&
    typeof card.intensity === 'number' &&
    typeof card.category === 'string' &&
    typeof card.isPremium === 'boolean'
  );
}

function isGameCardArray(value: unknown): value is GameCard[] {
  return Array.isArray(value) && value.every(isGameCard);
}

function isPersistedGameSession(value: unknown): value is PersistedGameSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<PersistedGameSession>;
  return (
    session.version === 1 &&
    isGameMode(session.selectedMode) &&
    isCustomDeckMode(session.customDeckMode) &&
    typeof session.playerCount === 'number' &&
    isStringArray(session.playerNames) &&
    isStringArray(session.activePlayers) &&
    typeof session.turnIndex === 'number' &&
    (typeof session.lastConsequence === 'string' ||
      session.lastConsequence === null) &&
    isGameCardArray(session.deckOrder) &&
    typeof session.deckIndex === 'number' &&
    (isGameCard(session.currentCard) || session.currentCard === null) &&
    typeof session.timerSeconds === 'number' &&
    typeof session.isTimerRunning === 'boolean' &&
    typeof session.drinkingMode === 'boolean' &&
    (session.customLevels === undefined ||
      session.customLevels === null ||
      (Array.isArray(session.customLevels) &&
        session.customLevels.every((level) => typeof level === 'number'))) &&
    (session.enabledTypes === undefined ||
      session.enabledTypes === null ||
      isStringArray(session.enabledTypes)) &&
    typeof session.savedAt === 'number'
  );
}

export function createPersistedGameSession(
  input: PersistedGameSessionInput
): PersistedGameSession {
  return {
    ...input,
    version: 1,
    savedAt: input.savedAt ?? Date.now(),
  };
}

export async function savePersistedGameSession(
  session: PersistedGameSession,
  storage: GameSessionStorage = AsyncStorage
): Promise<void> {
  await storage.setItem(
    ACTIVE_GAME_SESSION_STORAGE_KEY,
    JSON.stringify(session)
  );
}

export async function loadPersistedGameSession(
  storage: GameSessionStorage = AsyncStorage
): Promise<PersistedGameSession | null> {
  const raw = await storage.getItem(ACTIVE_GAME_SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return isPersistedGameSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function clearPersistedGameSession(
  storage: GameSessionStorage = AsyncStorage
): Promise<void> {
  await storage.removeItem(ACTIVE_GAME_SESSION_STORAGE_KEY);
}
