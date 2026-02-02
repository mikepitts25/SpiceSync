import truthDareEn from '../data/truthDare.en.json';

export type TruthDareType = 'truth' | 'dare';
export type TruthDareLevel = 'romantic' | 'flirty' | 'spicy' | 'kinky';

export type TruthDareCard = {
  id: string;
  type: TruthDareType;
  level: TruthDareLevel;
  prompt: string;
};

export function getTruthDareDeck(): TruthDareCard[] {
  // For now, EN only. (Easy to add ES by mirroring the JSON file.)
  return truthDareEn as unknown as TruthDareCard[];
}

export function filterTruthDareDeck(
  cards: TruthDareCard[],
  opts: { type?: TruthDareType | 'both'; level?: TruthDareLevel | 'all' }
): TruthDareCard[] {
  const type = opts.type ?? 'both';
  const level = opts.level ?? 'all';
  return cards.filter((c) => {
    if (type !== 'both' && c.type !== type) return false;
    if (level !== 'all' && c.level !== level) return false;
    return true;
  });
}

export function pickRandomCard(cards: TruthDareCard[]): TruthDareCard | null {
  if (!cards.length) return null;
  return cards[Math.floor(Math.random() * cards.length)] ?? null;
}
