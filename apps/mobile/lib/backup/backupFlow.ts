import {
  BackupFormatError,
  BackupPassphraseError,
  type BackupEnvelope,
  decryptBackup,
  encryptBackup,
} from './backupCrypto';
import {
  generateRecoveryPhrase,
  validateRecoveryPhrase,
} from './recoveryPhrase';
import { rehydrateRestoredStores } from './rehydrate';
import {
  SnapshotFormatError,
  applyRestore,
  createSnapshot,
  parseSnapshot,
  planRestore,
} from './snapshot';

/**
 * Orchestration for the backup/restore user flow.
 *
 * The screen stays a thin renderer over these functions so the sequencing —
 * which is where a restore can go subtly wrong — is testable without mounting
 * React.
 */

export type CreatedBackup = {
  /** Shown once, and never recoverable afterwards. */
  recoveryPhrase: string;
  /** The encrypted payload, ready to be copied or written to a file. */
  payload: string;
  createdAt: number;
};

/**
 * Produce an encrypted backup and the phrase that opens it.
 *
 * The phrase is generated rather than user-chosen: a typed password would be
 * the weakest link in an otherwise strong construction, and there is no server
 * that could ever help recover it.
 */
export async function createBackup(
  now: number = Date.now()
): Promise<CreatedBackup> {
  const recoveryPhrase = generateRecoveryPhrase();
  const snapshot = await createSnapshot(now);
  const envelope = encryptBackup(recoveryPhrase, JSON.stringify(snapshot));

  return {
    recoveryPhrase,
    payload: JSON.stringify(envelope, null, 2),
    createdAt: now,
  };
}

export type RestoreOutcome =
  | {
      ok: true;
      /** Keys written and re-read into live state. */
      restoredKeys: string[];
      /** Present in the file but refused by the allowlist. */
      skippedKeys: string[];
      /** Stores that failed to re-read; data is on disk but needs a restart. */
      staleKeys: string[];
      createdAt: number;
    }
  | { ok: false; reason: RestoreFailure };

export type RestoreFailure =
  /** The phrase is empty, the wrong length, or has words not in the wordlist.
   *  `words` carries the offending words for 'unknown-word' so the UI can
   *  point at the typo rather than saying "something is wrong". */
  | {
      kind: 'invalid-phrase';
      reason: 'empty' | 'length' | 'unknown-word';
      words: string[];
    }
  /** The pasted text is not a backup envelope at all. */
  | { kind: 'unreadable-file'; message: string }
  /** Correct-looking file, but the phrase does not open it. Also covers a
   *  tampered file: the two are not distinguishable, by design. */
  | { kind: 'wrong-phrase' }
  /** Decrypted, but the contents are not a snapshot we understand. */
  | { kind: 'unreadable-contents'; message: string };

function parseEnvelope(payload: string): BackupEnvelope {
  const parsed: unknown = JSON.parse(payload);
  if (!parsed || typeof parsed !== 'object') {
    throw new BackupFormatError('Backup file is malformed');
  }
  return parsed as BackupEnvelope;
}

/**
 * Restore a pasted backup using a recovery phrase.
 *
 * The phrase is checked for typos *before* key derivation, so an obvious
 * mistake costs nothing rather than a second of PBKDF2 followed by an
 * indistinguishable "wrong phrase".
 */
export async function restoreBackup(
  phrase: string,
  payload: string
): Promise<RestoreOutcome> {
  const validation = validateRecoveryPhrase(phrase);
  if (!validation.valid) {
    return {
      ok: false,
      reason: {
        kind: 'invalid-phrase',
        reason: validation.reason,
        words: validation.words,
      },
    };
  }

  let envelope: BackupEnvelope;
  try {
    envelope = parseEnvelope(payload);
  } catch (error) {
    return {
      ok: false,
      reason: { kind: 'unreadable-file', message: describeError(error) },
    };
  }

  let plaintext: string;
  try {
    plaintext = decryptBackup(validation.normalized, envelope);
  } catch (error) {
    if (error instanceof BackupPassphraseError) {
      return { ok: false, reason: { kind: 'wrong-phrase' } };
    }
    return {
      ok: false,
      reason: { kind: 'unreadable-file', message: describeError(error) },
    };
  }

  let plan;
  let createdAt: number;
  try {
    const snapshot = parseSnapshot(plaintext);
    createdAt = snapshot.createdAt;
    plan = planRestore(snapshot);
  } catch (error) {
    if (error instanceof SnapshotFormatError) {
      return {
        ok: false,
        reason: { kind: 'unreadable-contents', message: error.message },
      };
    }
    throw error;
  }

  await applyRestore(plan);

  // Writing to storage is only half a restore; the running app still holds the
  // old values in memory until the stores re-read them.
  const restoredKeys = Object.keys(plan.restore);
  const { rehydrated, failed } = await rehydrateRestoredStores(restoredKeys);

  return {
    ok: true,
    restoredKeys: rehydrated,
    skippedKeys: plan.skipped,
    staleKeys: failed.map((entry) => entry.key),
    createdAt,
  };
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
