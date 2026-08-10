import { LEVEL1_CARDS, getCardsByLanguage } from '../data/gameCards';
import { ALL_PACK_CARDS } from '../lib/packActivities';
import {
  FREE_PROFILE_LIMIT,
  canCreateProfile,
  isPremiumGameMode,
} from '../lib/purchases/premiumPolicy';

describe('launch premium policy', () => {
  it('keeps two profiles free and requires premium for the third', () => {
    expect(FREE_PROFILE_LIMIT).toBe(2);
    expect(canCreateProfile(0, false)).toBe(true);
    expect(canCreateProfile(1, false)).toBe(true);
    expect(canCreateProfile(2, false)).toBe(false);
    expect(canCreateProfile(8, true)).toBe(true);
  });

  it('paywalls the three premium game modes but not Spice Deck', () => {
    expect(isPremiumGameMode('spice-deck')).toBe(false);
    expect(isPremiumGameMode('match-missions')).toBe(true);
    expect(isPremiumGameMode('know-me-better')).toBe(true);
    expect(isPremiumGameMode('couple-dice')).toBe(true);
  });

  it('keeps every Level 1 starter card free in both supported languages', () => {
    const englishFreeIds = new Set(
      getCardsByLanguage('en', false).map((card) => card.id)
    );
    const spanishFreeIds = new Set(
      getCardsByLanguage('es', false).map((card) => card.id)
    );

    for (const card of LEVEL1_CARDS) {
      expect(englishFreeIds.has(card.id)).toBe(true);
      expect(spanishFreeIds.has(card.id)).toBe(true);
    }
  });

  it('offers the same full premium catalog in English and Spanish', () => {
    const englishIds = getCardsByLanguage('en', true).map((card) => card.id);
    const spanishIds = getCardsByLanguage('es', true).map((card) => card.id);

    expect(spanishIds).toEqual(englishIds);
    expect(
      getCardsByLanguage('es', true).find((card) => card.id === 'lvl4-c-014')
        ?.content
    ).toContain('Toque misterioso');
  });

  it('bundles every themed pack card into the premium game pool only', () => {
    const freeIds = new Set(
      getCardsByLanguage('en', false).map((card) => card.id)
    );
    const premiumIds = new Set(
      getCardsByLanguage('en', true).map((card) => card.id)
    );

    for (const card of ALL_PACK_CARDS) {
      expect(freeIds.has(card.id)).toBe(false);
      expect(premiumIds.has(card.id)).toBe(true);
    }
  });

  it('keeps premium pack prompts immediate and within the card safety policy', () => {
    const discussionTypes = new Set(['truth', 'fantasy']);
    const highRiskAction =
      /\b(chok(?:e|ing)?|strangl(?:e|ing)|breath\s*play)\b/i;

    for (const card of ALL_PACK_CARDS) {
      if (discussionTypes.has(card.type)) {
        expect(card.estimatedTime).toBe('N/A');
      }
      expect(card.content).not.toMatch(highRiskAction);
      expect(card.requires ?? []).not.toContain('necktie');
    }
  });
});
