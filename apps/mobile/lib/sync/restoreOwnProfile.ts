import { useProfilesStore } from '../state/profiles';
import {
  isRecognizedProfileAvatar,
  normalizeProfileAvatar,
} from '../../src/constants/emojis';
import type { CoupleResponse } from './relayTypes';

/**
 * Rebuild this device's own profile from the couple record.
 *
 * A restore on a fresh install recovers the partner link but not the profile,
 * because profiles are device-local and never left this device — so the user
 * was sent back through name-and-avatar creation for an identity the app
 * already knew. The relay does hold it: the name and avatar are uploaded when
 * an invite is created or accepted, and `restoreCoupleLink` already reads the
 * partner's half of exactly these fields. This reads the user's own half.
 *
 * Only the display identity is restored. The PIN is deliberately not carried
 * here — it is never uploaded, is stripped from encrypted backups too, and is
 * re-set by the user after restoring.
 */
export async function restoreOwnProfileFromCouple(
  couple: CoupleResponse,
  myDeviceId: string
): Promise<boolean> {
  // Read stored profiles before deciding anything. `hydrate()` overwrites the
  // in-memory list from disk, so seeding first would let a later hydrate
  // discard the profile we just created — and an unhydrated store looks
  // (wrongly) like a device with no profiles at all.
  await useProfilesStore.getState().hydrate();

  // A user who already has profiles on this device is not missing an identity;
  // seeding another would silently add a duplicate beside their real one.
  if (useProfilesStore.getState().getProfiles().length > 0) return false;

  const isMemberA = couple.memberADeviceId === myDeviceId;
  if (!isMemberA && couple.memberBDeviceId !== myDeviceId) return false;

  const ownName = isMemberA
    ? couple.memberAProfileName
    : couple.memberBProfileName;
  const ownAvatar = isMemberA
    ? couple.memberAProfileAvatar
    : couple.memberBProfileAvatar;

  // A couple created before profile metadata was sent, or by a client that
  // sent none, has nothing to restore. Fall through to profile creation rather
  // than inventing a placeholder name the user never chose.
  const name = typeof ownName === 'string' ? ownName.trim() : '';
  if (!name) return false;

  try {
    useProfilesStore.getState().createProfile({
      name,
      // `createProfile` rejects an unrecognized avatar outright. The relay
      // value is remote input and may predate the current avatar set, so it is
      // normalized to a known id instead of failing the whole restore.
      emoji: isRecognizedProfileAvatar(ownAvatar)
        ? normalizeProfileAvatar(ownAvatar)
        : normalizeProfileAvatar(null),
    });
    return true;
  } catch {
    // Profile creation is a convenience here, not the point of the restore.
    // Falling back to the creation screen is strictly better than failing the
    // account recovery that already succeeded.
    return false;
  }
}
