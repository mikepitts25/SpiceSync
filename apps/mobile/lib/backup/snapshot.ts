import AsyncStorage from '@react-native-async-storage/async-storage';

import { BACKUP_FORMAT } from './backupCrypto';

/**
 * The snapshot layer decides *what* leaves the device. `backupCrypto` decides
 * how it is protected. Keeping the two apart means the allowlist below is the
 * single place to audit for accidental disclosure.
 *
 * Design rule: this module is allowlist-only. A key that nobody has classified
 * is never backed up. Adding a store to the app therefore cannot silently add
 * it to backups — a reviewer has to name it here.
 */

/** Storage keys captured in a backup, grouped by why they are safe to carry. */
export const BACKUP_ALLOWLIST: readonly string[] = [
  // Preferences and local content the user would be sad to lose.
  'settings-v1',
  'spicesync-settings-v3',
  'conversation-store',
  'couple-dice',
  'fantasy-journal',
  'love-languages-storage',
  'match-missions',
  'match-plans',
  'starter-pack',
  'viewed-matches',
  'share-codes',
  'spicesync-custom-game-cards',
  'spicesync-screen-tours-v1',

  // Progress. Restoring these is a convenience, not an entitlement.
  'votes',
  'spicesync-achievements',
  'spicesync-streak-storage',
  'spicesync-leveling',
  'spicesync-nudges',
];

/**
 * Keys deliberately excluded, with the reason. This is not used to filter —
 * the allowlist already does that — but an exhaustive, reviewed list of what
 * we refuse to carry, so an auditor can see the decisions rather than infer
 * them from an absence.
 */
export const BACKUP_EXCLUSIONS: Readonly<Record<string, string>> = {
  // Device-bound cryptographic identity. The matching private keys live in
  // SecureStore and are never exported, so restoring the public half onto
  // another device would produce a device that cannot decrypt its own sync
  // traffic. Identity must be re-established, not copied.
  'spicesync.sync.identity.public': 'device-bound sync identity',

  // Entitlement state. Restoring this from a user-editable file would let any
  // backup grant premium. Purchases are restored through the store instead.
  'spicesync-premium-v3': 'store entitlement, restored via IAP',

  // Live partner link + relay transport state. Bound to this device's identity and
  // to server-side sequence cursors; replaying it on a restore desynchronizes
  // the relay and can resurrect revoked partner links.
  'spicesync-couple-link': 'device-bound partner link',
  'spicesync-sync-queue': 'in-flight relay transport state',
  'spicesync-vote-sync': 'relay cursor state',
  'spicesync-vote-snapshot-sync': 'device-bound snapshot sequence state',
  'spicesync-partner-votes': "partner's data, re-synced from partner",
  'spicesync-reveal-consent': 'consent must be re-granted, never restored',

  // Profiles hold plaintext PINs today. Handled separately by
  // `sanitizeProfiles` rather than excluded outright, since the user does want
  // their profiles back.
  profiles: 'exported via sanitizeProfiles (PIN stripped)',
  activeProfileId: 'derived from restored profiles',
};

/** Profile fields stripped before export. */
const PROFILE_SECRET_FIELDS = ['pin', 'pinHash'] as const;

export type BackupSnapshot = {
  format: typeof BACKUP_FORMAT;
  createdAt: number;
  /** Raw AsyncStorage values, keyed exactly as stored. */
  entries: Record<string, string>;
};

/**
 * Remove per-profile secrets from the serialized `profiles` payload.
 *
 * Profile PINs are shoulder-surfing protection, not encryption, and they are
 * currently persisted in plaintext. Carrying them into a file that leaves the
 * device would turn a local-only weakness into an exportable one, so the PIN
 * is dropped and the user re-sets it after restoring.
 */
export function sanitizeProfiles(rawProfiles: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawProfiles);
  } catch {
    // An unreadable profiles blob is not worth guessing at; omit it entirely
    // rather than exporting bytes we could not inspect.
    return '[]';
  }
  if (!Array.isArray(parsed)) return '[]';

  const sanitized = parsed.map((profile) => {
    if (!profile || typeof profile !== 'object') return profile;
    const next: Record<string, unknown> = { ...(profile as object) };
    for (const field of PROFILE_SECRET_FIELDS) delete next[field];
    return next;
  });

  return JSON.stringify(sanitized);
}

/**
 * Gather the allowlisted subset of AsyncStorage into a snapshot.
 *
 * Keys that are absent are skipped rather than stored as null, so a snapshot
 * only ever asserts what actually existed.
 */
export async function createSnapshot(
  now: number = Date.now()
): Promise<BackupSnapshot> {
  const keys = [...BACKUP_ALLOWLIST, 'profiles'];
  const pairs = await AsyncStorage.multiGet(keys);

  const entries: Record<string, string> = {};
  for (const [key, value] of pairs) {
    if (value == null) continue;
    entries[key] = key === 'profiles' ? sanitizeProfiles(value) : value;
  }

  return { format: BACKUP_FORMAT, createdAt: now, entries };
}

export class SnapshotFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotFormatError';
  }
}

/**
 * Validate a decrypted snapshot before it is trusted.
 *
 * Decryption proves the file came from someone holding the recovery phrase; it
 * proves nothing about the shape or the key set. A restore therefore
 * re-filters against the allowlist instead of writing whatever it was handed.
 */
export function parseSnapshot(plaintext: string): BackupSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(plaintext);
  } catch {
    throw new SnapshotFormatError('Backup contents are not valid JSON');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new SnapshotFormatError('Backup contents are malformed');
  }

  const candidate = parsed as Partial<BackupSnapshot>;
  if (candidate.format !== BACKUP_FORMAT) {
    throw new SnapshotFormatError(
      `Unsupported backup format: ${String(candidate.format)}`
    );
  }
  if (typeof candidate.createdAt !== 'number') {
    throw new SnapshotFormatError('Backup is missing a creation time');
  }
  if (!candidate.entries || typeof candidate.entries !== 'object') {
    throw new SnapshotFormatError('Backup is missing its contents');
  }

  const entries: Record<string, string> = {};
  for (const [key, value] of Object.entries(candidate.entries)) {
    if (typeof value !== 'string') continue;
    entries[key] = value;
  }

  return {
    format: BACKUP_FORMAT,
    createdAt: candidate.createdAt,
    entries,
  };
}

export type RestorePlan = {
  /** Keys that will be written. */
  restore: Record<string, string>;
  /** Keys present in the file but refused, with the allowlist as the reason. */
  skipped: string[];
};

/**
 * Decide what a snapshot is allowed to write, without writing it.
 *
 * Separating the decision from the effect makes the security-relevant half
 * testable and lets the UI show the user what a restore will touch.
 */
export function planRestore(snapshot: BackupSnapshot): RestorePlan {
  const permitted = new Set([...BACKUP_ALLOWLIST, 'profiles']);
  const restore: Record<string, string> = {};
  const skipped: string[] = [];

  for (const [key, value] of Object.entries(snapshot.entries)) {
    if (!permitted.has(key)) {
      skipped.push(key);
      continue;
    }
    // Re-sanitize on the way in: a hand-edited backup could reintroduce a PIN.
    restore[key] = key === 'profiles' ? sanitizeProfiles(value) : value;
  }

  return { restore, skipped };
}

/**
 * Apply a restore plan to AsyncStorage.
 *
 * This merges rather than wiping: keys the backup does not mention keep their
 * current values, so restoring cannot silently destroy state (an entitlement,
 * a live partner link) that the backup was never allowed to carry.
 */
export async function applyRestore(plan: RestorePlan): Promise<void> {
  const pairs = Object.entries(plan.restore);
  if (pairs.length === 0) return;
  await AsyncStorage.multiSet(pairs);
}
