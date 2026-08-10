import type { GameHubModeId } from '../gameHubModes';

export const FREE_PROFILE_LIMIT = 2;

export function canCreateProfile(
  existingProfileCount: number,
  isPremium: boolean
): boolean {
  return isPremium || existingProfileCount < FREE_PROFILE_LIMIT;
}

export function isPremiumGameMode(modeId: GameHubModeId): boolean {
  return modeId !== 'spice-deck';
}
