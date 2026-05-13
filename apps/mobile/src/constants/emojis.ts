export const PROFILE_AVATAR_OPTIONS = [
  {
    id: 'flame',
    label: 'Flame',
    background: '#35111F',
    secondary: '#FFD166',
    legacy: ['🔥'],
  },
  {
    id: 'cherries',
    label: 'Cherries',
    background: '#2B1020',
    secondary: '#34D399',
    legacy: ['🍒', '🍓'],
  },
  {
    id: 'peach',
    label: 'Peach',
    background: '#341911',
    secondary: '#FDBA74',
    legacy: ['🍑'],
  },
  {
    id: 'thong',
    label: 'Thong',
    background: '#32101A',
    secondary: '#FB7185',
    legacy: [],
  },
  {
    id: 'handcuffs',
    label: 'Handcuffs',
    background: '#1D2433',
    secondary: '#E5E7EB',
    legacy: [],
  },
  {
    id: 'high-heels',
    label: 'High Heels',
    background: '#310F1B',
    secondary: '#F87171',
    legacy: [],
  },
  {
    id: 'chastity-cage',
    label: 'Heart Cage',
    background: '#171421',
    secondary: '#FBBF24',
    legacy: ['🍆'],
  },
  {
    id: 'masquerade-mask',
    label: 'Masquerade Mask',
    background: '#21182F',
    secondary: '#F472B6',
    legacy: ['😈', '🎭'],
  },
  {
    id: 'lipstick',
    label: 'Lipstick',
    background: '#3A0F23',
    secondary: '#FDA4AF',
    legacy: ['💋', '🫦'],
  },
  {
    id: 'feather',
    label: 'Feather',
    background: '#171827',
    secondary: '#A78BFA',
    legacy: ['👅'],
  },
  {
    id: 'ribbon',
    label: 'Ribbon',
    background: '#331020',
    secondary: '#FB7185',
    legacy: [],
  },
  {
    id: 'candle',
    label: 'Candle',
    background: '#31210D',
    secondary: '#F97316',
    legacy: ['🕯️', '🕯'],
  },
  {
    id: 'dice',
    label: 'Dice',
    background: '#13251D',
    secondary: '#22C55E',
    legacy: ['🎲'],
  },
  {
    id: 'champagne',
    label: 'Champagne',
    background: '#2A1E0F',
    secondary: '#FDE68A',
    legacy: ['🪩'],
  },
  {
    id: 'key',
    label: 'Heart Key',
    background: '#2F1A0F',
    secondary: '#FBBF24',
    legacy: ['💞', '❤️', '💕', '💗', '💑'],
  },
  {
    id: 'rose',
    label: 'Rose',
    background: '#2B111A',
    secondary: '#86EFAC',
    legacy: [],
  },
  {
    id: 'blindfold',
    label: 'Blindfold',
    background: '#10131F',
    secondary: '#94A3B8',
    legacy: ['🖤'],
  },
  {
    id: 'perfume',
    label: 'Perfume',
    background: '#351324',
    secondary: '#F9A8D4',
    legacy: ['🛁'],
  },
  {
    id: 'riding-crop',
    label: 'Riding Crop',
    background: '#171421',
    secondary: '#FBBF24',
    legacy: [],
  },
  {
    id: 'collar',
    label: 'Collar',
    background: '#2B121A',
    secondary: '#FBBF24',
    legacy: [],
  },
] as const;

export type ProfileAvatarOption = (typeof PROFILE_AVATAR_OPTIONS)[number];
export type ProfileAvatarId = ProfileAvatarOption['id'];

export const PROFILE_AVATAR_CHOICES = PROFILE_AVATAR_OPTIONS.map(
  (option) => option.id
) as ProfileAvatarId[];

export const DEFAULT_PROFILE_AVATAR: ProfileAvatarId = 'flame';

const PROFILE_AVATAR_ID_SET = new Set<string>(PROFILE_AVATAR_CHOICES);
const PROFILE_AVATAR_BY_ID = new Map<ProfileAvatarId, ProfileAvatarOption>(
  PROFILE_AVATAR_OPTIONS.map((option) => [option.id, option])
);
const LEGACY_AVATAR_BY_EMOJI = new Map<string, ProfileAvatarId>(
  PROFILE_AVATAR_OPTIONS.flatMap((option) =>
    option.legacy.map((emoji) => [emoji, option.id] as const)
  )
);
const LEGACY_AVATAR_BY_ID = new Map<string, ProfileAvatarId>([
  ['mischief', 'masquerade-mask'],
  ['kiss', 'lipstick'],
  ['hearts', 'key'],
  ['strawberry', 'cherries'],
  ['velvet', 'chastity-cage'],
  ['tease', 'feather'],
  ['bite', 'lipstick'],
  ['midnight', 'blindfold'],
  ['mask', 'masquerade-mask'],
  ['bath', 'perfume'],
  ['disco', 'champagne'],
]);

export function isProfileAvatarId(
  input: string | null | undefined
): input is ProfileAvatarId {
  return typeof input === 'string' && PROFILE_AVATAR_ID_SET.has(input);
}

export function isRecognizedProfileAvatar(
  input: string | null | undefined
): boolean {
  return (
    isProfileAvatarId(input) ||
    (typeof input === 'string' &&
      (LEGACY_AVATAR_BY_ID.has(input) || LEGACY_AVATAR_BY_EMOJI.has(input)))
  );
}

export function normalizeProfileAvatar(
  input: string | null | undefined
): ProfileAvatarId {
  if (isProfileAvatarId(input)) {
    return input;
  }

  if (typeof input === 'string') {
    return (
      LEGACY_AVATAR_BY_ID.get(input) ??
      LEGACY_AVATAR_BY_EMOJI.get(input) ??
      DEFAULT_PROFILE_AVATAR
    );
  }

  return DEFAULT_PROFILE_AVATAR;
}

export function getProfileAvatarOption(
  input: string | null | undefined
): ProfileAvatarOption {
  const id = normalizeProfileAvatar(input);
  return (
    PROFILE_AVATAR_BY_ID.get(id) ??
    PROFILE_AVATAR_BY_ID.get(DEFAULT_PROFILE_AVATAR)!
  );
}

export const EMOJI_CHOICES = PROFILE_AVATAR_CHOICES;
export type EmojiChoice = ProfileAvatarId;
