// Starter pack: a curated set of broadly-popular, low-intensity kinks served
// to brand-new profiles so a couple's first session ends in matches instead
// of decision fatigue across the full 330-item catalog.
//
// All ids are soft-tier, intensity-1 entries from data/kinks.en.json (ids are
// shared with the ES catalog), spanning several categories.
export const STARTER_PACK_KINK_IDS: readonly string[] = [
  '0001', // Sensual Massage
  '0002', // Deep Kissing Session
  '0003', // Naked Cuddling
  '0005', // Intense Eye Contact
  '0006', // Slow Undressing
  '0009', // Light Teasing
  '0010', // Sexy Texting
  '0012', // Shared Bath
  '0013', // Candlelight Intimacy
  '0015', // Silk Scarf Sensation
  '0017', // Full Body Kissing Tour
  '0018', // Erotic Storytelling
  '0021', // Blindfolded Touch
  '0024', // Naked Slow Dancing
  '0201', // Praise Kink
];

const STARTER_PACK_SET = new Set(STARTER_PACK_KINK_IDS);

export function isStarterPackKink(kinkId: string): boolean {
  return STARTER_PACK_SET.has(kinkId);
}

export function filterToStarterPack<T extends { id: string }>(
  kinks: readonly T[]
): T[] {
  return kinks.filter((kink) => STARTER_PACK_SET.has(kink.id));
}

// The starter pack stays active until the profile has cast as many votes as
// the pack holds (however they were cast) or explicitly skipped it. Existing
// profiles with vote history therefore never see starter mode.
export function isStarterPackActive({
  votedCount,
  dismissed,
}: {
  votedCount: number;
  dismissed: boolean;
}): boolean {
  if (dismissed) return false;
  return votedCount < STARTER_PACK_KINK_IDS.length;
}
