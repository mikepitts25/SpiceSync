import fs from 'fs';
import path from 'path';

import { appendCustomGameCards } from '../lib/gameDeck';
import { useCustomGameCardsStore } from '../src/stores/customGameCards';
import type { GameCard } from '../data/gameCards';

const appRoot = path.join(__dirname, '..', 'app');

const baseCard: GameCard = {
  id: 'base-card',
  type: 'truth',
  content: 'Base card',
  intensity: 2,
  category: 'playful',
  isPremium: false,
  estimatedTime: 'N/A',
};

describe('custom game cards', () => {
  beforeEach(() => {
    useCustomGameCardsStore.setState({ cards: [] });
  });

  it('creates and deletes persistent game-card shaped custom cards', () => {
    const added = useCustomGameCardsStore.getState().addCard({
      type: 'dare',
      content: 'Make up a custom dare',
      intensity: 4,
    });

    expect(added).toMatchObject({
      type: 'dare',
      content: 'Make up a custom dare',
      intensity: 4,
      category: 'playful',
      isPremium: false,
      estimatedTime: '1 min',
    });
    expect(added.id).toMatch(/^custom-game-/);
    expect(useCustomGameCardsStore.getState().cards).toEqual([added]);

    useCustomGameCardsStore.getState().deleteCard(added.id);

    expect(useCustomGameCardsStore.getState().cards).toEqual([]);
  });

  it('appends custom cards to the playable game deck', () => {
    const customCard = useCustomGameCardsStore.getState().addCard({
      type: 'truth',
      content: 'A custom truth',
      intensity: 2,
    });

    const cards = appendCustomGameCards([baseCard], [customCard]);

    expect(cards.map((card) => card.id)).toEqual([
      'base-card',
      customCard.id,
    ]);
  });

  it('mounts and links the custom deck builder from the game flow', () => {
    const gameLayout = fs.readFileSync(
      path.join(appRoot, '(game)', '_layout.tsx'),
      'utf8'
    );
    const gameScreen = fs.readFileSync(
      path.join(appRoot, '(game)', 'index.tsx'),
      'utf8'
    );

    expect(gameLayout).toContain('<Stack.Screen name="custom-deck" />');
    expect(gameScreen).toContain("router.push('/(game)/custom-deck')");
  });

  it('lets users exit the custom deck builder back to the game menu', () => {
    const customDeckScreen = fs.readFileSync(
      path.join(appRoot, '(game)', 'custom-deck.tsx'),
      'utf8'
    );

    expect(customDeckScreen).toContain('handleExitCustomDeck');
    expect(customDeckScreen).toContain('router.canGoBack()');
    expect(customDeckScreen).toContain('router.back()');
    expect(customDeckScreen).toContain("router.replace('/(game)')");
    expect(customDeckScreen).toContain('accessibilityLabel="Back to game menu"');
  });
});
