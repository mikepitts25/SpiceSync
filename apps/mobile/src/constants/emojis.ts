export const EMOJI_CHOICES = [
  '🔥',
  '😈',
  '💋',
  '💞',
  '🍓',
  '🍑',
  '🍆',
  '👅',
  '🫦',
  '🖤',
  '🎭',
  '🛁',
  '🕯️',
  '🎲',
  '🪩',
] as const;

export type EmojiChoice = (typeof EMOJI_CHOICES)[number];
