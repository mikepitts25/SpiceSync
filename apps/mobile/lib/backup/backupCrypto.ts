// Passphrase-based encryption for local-data backups.
//
// Algorithms are deliberately limited to FIPS 140-approved primitives so the
// App Store / Play export-compliance answers stay simple and defensible:
//   - AES-256-GCM (NIST SP 800-38D) for authenticated encryption
//   - PBKDF2-HMAC-SHA256 (NIST SP 800-132) for passphrase stretching
//
// The partner-sync path in lib/sync/crypto.ts uses XChaCha20-Poly1305, which is
// strong but is an IETF draft rather than a FIPS-approved algorithm. Backups do
// not reuse it for that reason; the two paths are intentionally independent.
//
// The derived key never leaves the device and is never persisted: the server
// only ever receives the opaque envelope produced by encryptBackup().

import { gcm } from '@noble/ciphers/aes';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';

import {
  bytesToUtf8,
  decodeBase64,
  encodeBase64,
  utf8ToBytes,
} from '../sync/base64';
import { randomBytes } from '../sync/crypto';

/** Envelope format version. Bump only for breaking layout changes. */
export const BACKUP_FORMAT = 'spicesync-backup-v1';

const SALT_LEN = 16;
const NONCE_LEN = 12; // GCM standard nonce length (SP 800-38D)
const KEY_LEN = 32; // AES-256

/**
 * PBKDF2 iteration count. Matches the current OWASP guidance for
 * PBKDF2-HMAC-SHA256. Stored in the envelope so an increase stays
 * backward-compatible with existing backups.
 */
export const PBKDF2_ITERATIONS = 210_000;

/** Lowest iteration count a stored envelope may claim before we reject it. */
const MIN_ACCEPTED_ITERATIONS = 100_000;

export type BackupEnvelope = {
  format: typeof BACKUP_FORMAT;
  kdf: 'pbkdf2-sha256';
  iterations: number;
  cipher: 'aes-256-gcm';
  salt: string;
  nonce: string;
  ciphertext: string;
};

export class BackupPassphraseError extends Error {
  constructor() {
    super('Backup could not be decrypted with that recovery phrase');
    this.name = 'BackupPassphraseError';
  }
}

export class BackupFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupFormatError';
  }
}

function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number
): Uint8Array {
  // NFKC keeps the derived key stable across platforms that normalize the
  // user's typed phrase differently.
  const normalized = passphrase.normalize('NFKC');
  return pbkdf2(sha256, utf8ToBytes(normalized), salt, {
    c: iterations,
    dkLen: KEY_LEN,
  });
}

/**
 * Header bytes bound into the AEAD as additional authenticated data, so the
 * KDF parameters cannot be downgraded without invalidating the tag.
 */
function headerAad(iterations: number): Uint8Array {
  return utf8ToBytes(
    `${BACKUP_FORMAT}:pbkdf2-sha256:${iterations}:aes-256-gcm`
  );
}

export function encryptBackup(
  passphrase: string,
  plaintext: string,
  iterations: number = PBKDF2_ITERATIONS
): BackupEnvelope {
  if (!passphrase) throw new BackupFormatError('Passphrase is required');

  const salt = randomBytes(SALT_LEN);
  const nonce = randomBytes(NONCE_LEN);
  const key = deriveKey(passphrase, salt, iterations);
  const ciphertext = gcm(key, nonce, headerAad(iterations)).encrypt(
    utf8ToBytes(plaintext)
  );

  return {
    format: BACKUP_FORMAT,
    kdf: 'pbkdf2-sha256',
    iterations,
    cipher: 'aes-256-gcm',
    salt: encodeBase64(salt),
    nonce: encodeBase64(nonce),
    ciphertext: encodeBase64(ciphertext),
  };
}

function assertEnvelope(envelope: BackupEnvelope): void {
  if (!envelope || typeof envelope !== 'object') {
    throw new BackupFormatError('Backup envelope is missing');
  }
  if (envelope.format !== BACKUP_FORMAT) {
    throw new BackupFormatError(
      `Unsupported backup format: ${String(envelope.format)}`
    );
  }
  if (envelope.kdf !== 'pbkdf2-sha256') {
    throw new BackupFormatError(`Unsupported KDF: ${String(envelope.kdf)}`);
  }
  if (envelope.cipher !== 'aes-256-gcm') {
    throw new BackupFormatError(
      `Unsupported cipher: ${String(envelope.cipher)}`
    );
  }
  if (
    !Number.isInteger(envelope.iterations) ||
    envelope.iterations < MIN_ACCEPTED_ITERATIONS
  ) {
    // Refuse attacker-supplied weak parameters rather than silently doing
    // cheap key derivation.
    throw new BackupFormatError('Backup key-derivation strength is too low');
  }
}

export function decryptBackup(
  passphrase: string,
  envelope: BackupEnvelope
): string {
  assertEnvelope(envelope);

  const salt = decodeBase64(envelope.salt);
  const nonce = decodeBase64(envelope.nonce);
  const ciphertext = decodeBase64(envelope.ciphertext);

  if (salt.length !== SALT_LEN) {
    throw new BackupFormatError('Backup salt is malformed');
  }
  if (nonce.length !== NONCE_LEN) {
    throw new BackupFormatError('Backup nonce is malformed');
  }

  const key = deriveKey(passphrase, salt, envelope.iterations);

  let plaintext: Uint8Array;
  try {
    plaintext = gcm(key, nonce, headerAad(envelope.iterations)).decrypt(
      ciphertext
    );
  } catch {
    // A GCM tag failure means a wrong phrase or tampering; the two are not
    // distinguishable and must not be reported differently.
    throw new BackupPassphraseError();
  }

  return bytesToUtf8(plaintext);
}
