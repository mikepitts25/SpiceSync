import React from 'react';
import { Image } from 'react-native';

import ProfileAvatarIcon from '../components/ProfileAvatarIcon';
import {
  DEFAULT_PROFILE_AVATAR,
  PROFILE_AVATAR_CHOICES,
  getProfileAvatarOption,
  isProfileAvatarId,
  normalizeProfileAvatar,
} from '../src/constants/emojis';

function findImageSource(node: React.ReactNode): unknown {
  if (!React.isValidElement(node)) {
    return null;
  }

  if (node.type === Image) {
    return (node.props as { source?: unknown }).source;
  }

  const children = (node.props as { children?: React.ReactNode }).children;
  if (Array.isArray(children)) {
    for (const child of children) {
      const source = findImageSource(child);
      if (source) {
        return source;
      }
    }
  }

  return findImageSource(children);
}

describe('profile avatars', () => {
  it('uses app-owned avatar ids instead of platform emoji glyphs', () => {
    expect(PROFILE_AVATAR_CHOICES).toContain('cherries');
    expect(PROFILE_AVATAR_CHOICES).toEqual(
      expect.arrayContaining([
        'flame',
        'cherries',
        'peach',
        'thong',
        'handcuffs',
        'high-heels',
        'chastity-cage',
        'collar',
      ])
    );
    expect(PROFILE_AVATAR_CHOICES).not.toEqual(
      expect.arrayContaining(['🔥', '😈', '💋', '🍒'])
    );

    PROFILE_AVATAR_CHOICES.forEach((id) => {
      expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
    });
  });

  it('normalizes legacy profile emoji strings to replacement avatar ids', () => {
    expect(normalizeProfileAvatar('🔥')).toBe('flame');
    expect(normalizeProfileAvatar('😈')).toBe('masquerade-mask');
    expect(normalizeProfileAvatar('💋')).toBe('lipstick');
    expect(normalizeProfileAvatar('🍒')).toBe('cherries');
    expect(normalizeProfileAvatar('mischief')).toBe('masquerade-mask');
    expect(normalizeProfileAvatar('kiss')).toBe('lipstick');
    expect(normalizeProfileAvatar('unknown')).toBe(DEFAULT_PROFILE_AVATAR);
    expect(normalizeProfileAvatar(null)).toBe(DEFAULT_PROFILE_AVATAR);
  });

  it('exposes picker metadata for custom avatar rendering', () => {
    const cherries = getProfileAvatarOption('cherries');

    expect(cherries).toMatchObject({
      id: 'cherries',
      label: 'Cherries',
    });
    expect(isProfileAvatarId('cherries')).toBe(true);
    expect(isProfileAvatarId('🍒')).toBe(false);
  });

  it('renders a PNG asset for every configured avatar id', () => {
    PROFILE_AVATAR_CHOICES.forEach((avatar) => {
      expect(
        findImageSource(ProfileAvatarIcon({ avatar, size: 64 }))
      ).toBeTruthy();
    });
  });
});
