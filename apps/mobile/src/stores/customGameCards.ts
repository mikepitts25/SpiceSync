import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { GameCard, GameCardCategory, GameCardType } from '../../data/gameCards';

export type CreateCustomGameCardInput = {
  type: GameCardType;
  content: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  category?: GameCardCategory;
  estimatedTime?: string;
};

type CustomGameCardsState = {
  cards: GameCard[];
  addCard: (input: CreateCustomGameCardInput) => GameCard;
  deleteCard: (id: string) => void;
  reset: () => void;
};

function createCustomCardId(): string {
  return `custom-game-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export const useCustomGameCardsStore = create<CustomGameCardsState>()(
  persist(
    (set) => ({
      cards: [],
      addCard: (input) => {
        const content = input.content.trim();
        if (!content) {
          throw new Error('Card content is required');
        }

        const card: GameCard = {
          id: createCustomCardId(),
          type: input.type,
          content,
          intensity: input.intensity,
          category: input.category ?? 'playful',
          isPremium: false,
          estimatedTime: input.estimatedTime ?? '1 min',
        };

        set((state) => ({ cards: [card, ...state.cards] }));
        return card;
      },
      deleteCard: (id) => {
        set((state) => ({
          cards: state.cards.filter((card) => card.id !== id),
        }));
      },
      reset: () => set({ cards: [] }),
    }),
    {
      name: 'spicesync-custom-game-cards',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
