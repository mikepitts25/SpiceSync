import type { GameCard } from '../data/gameCards';
import {
  clearPersistedGameSession,
  createPersistedGameSession,
  loadPersistedGameSession,
  savePersistedGameSession,
} from '../lib/gameSessionPersistence';

const card = (id: string): GameCard => ({
  id,
  type: 'truth',
  content: id,
  intensity: 2,
  category: 'playful',
  isPremium: false,
  estimatedTime: 'N/A',
});

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      values.delete(key);
    }),
  };
}

describe('game session persistence', () => {
  it('stores and restores the active game session state', async () => {
    const storage = memoryStorage();
    const session = createPersistedGameSession({
      selectedMode: 'intense',
      customDeckMode: 'customOnly',
      playerCount: 2,
      playerNames: ['Alex', 'Jordan', 'Player 3', 'Player 4'],
      activePlayers: ['Alex', 'Jordan'],
      turnIndex: 1,
      lastConsequence: 'Alex takes a shot.',
      deckOrder: [card('a'), card('b')],
      deckIndex: 1,
      currentCard: card('a'),
      timerSeconds: 30,
      isTimerRunning: true,
      drinkingMode: true,
    });

    await savePersistedGameSession(session, storage);

    expect(await loadPersistedGameSession(storage)).toEqual(session);
  });

  it('ignores invalid saved session payloads', async () => {
    const storage = memoryStorage();

    await storage.setItem('spicesync-active-game-session-v1', '{"bad":true}');

    expect(await loadPersistedGameSession(storage)).toBeNull();
  });

  it('clears the persisted active game session', async () => {
    const storage = memoryStorage();

    await clearPersistedGameSession(storage);

    expect(storage.removeItem).toHaveBeenCalledWith(
      'spicesync-active-game-session-v1'
    );
  });
});
