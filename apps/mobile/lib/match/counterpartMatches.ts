import counterpartMatches from './counterpartMatches.json';

export const CROSS_CARD_MATCHES =
  counterpartMatches as Record<string, string[]>;

export function getCounterpartIds(
  id: string,
  explicitMatches: readonly string[] = []
): string[] {
  return Array.from(
    new Set([...(CROSS_CARD_MATCHES[id] ?? []), ...explicitMatches])
  );
}
