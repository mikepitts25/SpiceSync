// Recovery-phrase generation for local-data backups.
//
// Backups are only as strong as the passphrase behind them, and human-chosen
// passphrases are low-entropy enough to brute-force offline once someone holds
// the ciphertext. SpiceSync therefore generates the phrase instead of letting
// the user type one.
//
// The wordlist is a small, deliberately neutral set: phrases can be read aloud
// or written down without disclosing anything about what the app is used for.

import { randomBytes } from '../sync/crypto';

/** Words per generated phrase. */
export const RECOVERY_PHRASE_WORDS = 12;

// 256 words => exactly 8 bits of entropy per word, so a 12-word phrase carries
// 96 bits. Keeping the length a power of two lets us reject modulo bias with a
// simple mask rather than rejection sampling.
export const RECOVERY_WORDLIST: readonly string[] = [
  'anchor', 'apple', 'amber', 'arrow', 'atlas', 'autumn', 'bamboo', 'banjo',
  'basil', 'beacon', 'bison', 'blossom', 'bramble', 'branch', 'breeze', 'bridge',
  'bronze', 'brook', 'butter', 'cabin', 'cactus', 'canvas', 'canyon', 'carbon',
  'cedar', 'cello', 'chalk', 'cherry', 'chimney', 'cinder', 'circle', 'citrus',
  'clay', 'clever', 'cliff', 'clover', 'cobalt', 'cocoa', 'comet', 'compass',
  'copper', 'coral', 'cotton', 'crater', 'crimson', 'crystal', 'cypress', 'daisy',
  'dawn', 'delta', 'denim', 'desert', 'dune', 'dusk', 'eagle', 'earth',
  'ember', 'emerald', 'engine', 'fable', 'falcon', 'fathom', 'feather', 'fennel',
  'fern', 'fiddle', 'flint', 'flute', 'forest', 'fossil', 'fountain', 'foxglove',
  'galaxy', 'garden', 'garnet', 'gentle', 'geyser', 'ginger', 'glacier', 'glass',
  'granite', 'gravel', 'grove', 'guitar', 'gully', 'gypsum', 'harbor', 'harvest',
  'hazel', 'heather', 'hollow', 'honey', 'horizon', 'ivory', 'jasmine', 'jetty',
  'juniper', 'kettle', 'lagoon', 'lantern', 'lattice', 'laurel', 'lemon', 'lever',
  'lichen', 'lilac', 'linen', 'lumber', 'lunar', 'lyric', 'magnet', 'mahogany',
  'maple', 'marble', 'marigold', 'marsh', 'meadow', 'medley', 'mesa', 'meteor',
  'mineral', 'mint', 'mirror', 'mist', 'mitten', 'monsoon', 'moss', 'mountain',
  'mulberry', 'nectar', 'needle', 'nickel', 'noble', 'north', 'nutmeg', 'oasis',
  'obsidian', 'ocean', 'olive', 'onyx', 'opal', 'orbit', 'orchard', 'oregano',
  'otter', 'oxide', 'paddle', 'palace', 'papaya', 'parsley', 'pastel', 'pebble',
  'pelican', 'pepper', 'petal', 'pewter', 'pigment', 'pillar', 'pine', 'pioneer',
  'piston', 'plateau', 'plum', 'pollen', 'poplar', 'porcelain', 'prairie', 'prism',
  'pumpkin', 'quarry', 'quartz', 'quill', 'quilt', 'radish', 'rafter', 'rainbow',
  'rapid', 'raven', 'reed', 'reef', 'relay', 'ribbon', 'ridge', 'river',
  'rosemary', 'rudder', 'rune', 'saffron', 'sage', 'sandal', 'sapphire', 'satin',
  'scarlet', 'sequoia', 'shale', 'shelter', 'shore', 'signal', 'silver', 'slate',
  'smoke', 'snowdrop', 'solar', 'sorrel', 'spark', 'sparrow', 'spindle', 'spiral',
  'spruce', 'stellar', 'stone', 'storm', 'stream', 'sugar', 'summit', 'sunset',
  'sycamore', 'syrup', 'tangerine', 'tapestry', 'teak', 'tempo', 'thicket', 'thistle',
  'thunder', 'tidal', 'timber', 'tinder', 'topaz', 'torch', 'tower', 'trellis',
  'tulip', 'tundra', 'turquoise', 'twilight', 'umber', 'valley', 'vanilla', 'velvet',
  'vessel', 'violet', 'vista', 'walnut', 'wander', 'watershed', 'wheat', 'whistle',
  'willow', 'window', 'winter', 'wisteria', 'woven', 'yarrow', 'yellow', 'zephyr',
];

const WORDLIST_SIZE = 256;
const BITS_PER_WORD = 8;

/** Total entropy of a generated phrase, in bits. */
export const RECOVERY_PHRASE_ENTROPY_BITS =
  RECOVERY_PHRASE_WORDS * BITS_PER_WORD;

if (RECOVERY_WORDLIST.length !== WORDLIST_SIZE) {
  throw new Error(
    `Recovery wordlist must hold exactly ${WORDLIST_SIZE} words to stay bias-free`
  );
}

/**
 * Generates a fresh recovery phrase. Each byte indexes the wordlist directly,
 * which is uniform because the list length is exactly 2^8.
 */
export function generateRecoveryPhrase(
  words: number = RECOVERY_PHRASE_WORDS
): string {
  if (!Number.isInteger(words) || words <= 0) {
    throw new Error('Recovery phrase length must be a positive integer');
  }
  const bytes = randomBytes(words);
  const picked: string[] = [];
  for (let i = 0; i < words; i += 1) {
    picked.push(RECOVERY_WORDLIST[bytes[i]]);
  }
  return picked.join(' ');
}

/**
 * Canonical form used for key derivation and comparison: lowercase, single
 * spaces, no surrounding whitespace. Users re-typing a phrase should not be
 * defeated by capitalization or extra spaces.
 */
export function normalizeRecoveryPhrase(phrase: string): string {
  return phrase.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}

export type RecoveryPhraseValidation =
  | { valid: true; normalized: string }
  | { valid: false; reason: 'empty' | 'length' | 'unknown-word'; words: string[] };

/**
 * Validates a user-entered phrase against the wordlist. Returns the unknown
 * words so the UI can point at the specific typo instead of failing opaquely.
 */
export function validateRecoveryPhrase(
  phrase: string,
  expectedWords: number = RECOVERY_PHRASE_WORDS
): RecoveryPhraseValidation {
  const normalized = normalizeRecoveryPhrase(phrase);
  if (!normalized) return { valid: false, reason: 'empty', words: [] };

  const parts = normalized.split(' ');
  if (parts.length !== expectedWords) {
    return { valid: false, reason: 'length', words: parts };
  }

  const unknown = parts.filter((word) => !RECOVERY_WORDLIST.includes(word));
  if (unknown.length > 0) {
    return { valid: false, reason: 'unknown-word', words: unknown };
  }

  return { valid: true, normalized };
}
