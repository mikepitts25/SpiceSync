import {
  BACKUP_FORMAT,
  BackupFormatError,
  BackupPassphraseError,
  PBKDF2_ITERATIONS,
  decryptBackup,
  encryptBackup,
  type BackupEnvelope,
} from '../lib/backup/backupCrypto';
import {
  RECOVERY_PHRASE_ENTROPY_BITS,
  RECOVERY_PHRASE_WORDS,
  RECOVERY_WORDLIST,
  generateRecoveryPhrase,
  normalizeRecoveryPhrase,
  validateRecoveryPhrase,
} from '../lib/backup/recoveryPhrase';

// Keep derivation cheap in tests; strength is asserted separately.
const FAST_ITERATIONS = 100_000;

const PHRASE = 'anchor apple amber arrow atlas autumn bamboo banjo';

describe('backup crypto', () => {
  it('roundtrips a payload with the correct passphrase', () => {
    const plaintext = JSON.stringify({ votes: { k1: 'yes' }, profiles: [] });
    const envelope = encryptBackup(PHRASE, plaintext, FAST_ITERATIONS);

    expect(decryptBackup(PHRASE, envelope)).toBe(plaintext);
  });

  it('rejects a wrong passphrase without revealing why', () => {
    const envelope = encryptBackup(PHRASE, 'secret', FAST_ITERATIONS);

    expect(() => decryptBackup('wrong phrase entirely', envelope)).toThrow(
      BackupPassphraseError
    );
  });

  it('never stores the plaintext or passphrase in the envelope', () => {
    const plaintext = 'bondage-and-blindfolds';
    const envelope = encryptBackup(PHRASE, plaintext, FAST_ITERATIONS);
    const serialized = JSON.stringify(envelope);

    expect(serialized).not.toContain(plaintext);
    expect(serialized).not.toContain(PHRASE);
    expect(serialized).not.toContain('anchor');
  });

  it('declares only FIPS-approved algorithms in the envelope header', () => {
    const envelope = encryptBackup(PHRASE, 'x', FAST_ITERATIONS);

    expect(envelope.format).toBe(BACKUP_FORMAT);
    expect(envelope.cipher).toBe('aes-256-gcm');
    expect(envelope.kdf).toBe('pbkdf2-sha256');
  });

  it('uses a fresh salt and nonce for every backup', () => {
    const a = encryptBackup(PHRASE, 'same', FAST_ITERATIONS);
    const b = encryptBackup(PHRASE, 'same', FAST_ITERATIONS);

    expect(a.salt).not.toBe(b.salt);
    expect(a.nonce).not.toBe(b.nonce);
    // Identical plaintext must not produce identical ciphertext.
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it('defaults to the current OWASP PBKDF2 iteration count', () => {
    expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(210_000);
  });

  it('detects tampered ciphertext via the GCM tag', () => {
    const envelope = encryptBackup(PHRASE, 'secret', FAST_ITERATIONS);
    const raw = Buffer.from(envelope.ciphertext, 'base64');
    raw[0] ^= 0xff;
    const tampered: BackupEnvelope = {
      ...envelope,
      ciphertext: raw.toString('base64'),
    };

    expect(() => decryptBackup(PHRASE, tampered)).toThrow(
      BackupPassphraseError
    );
  });

  it('rejects a downgraded iteration count instead of deriving a weak key', () => {
    const envelope = encryptBackup(PHRASE, 'secret', FAST_ITERATIONS);
    const downgraded: BackupEnvelope = { ...envelope, iterations: 1 };

    expect(() => decryptBackup(PHRASE, downgraded)).toThrow(BackupFormatError);
  });

  it('rejects a tampered iteration count that is still strong enough', () => {
    // The header is bound as AEAD additional data, so changing iterations
    // within the accepted range must still fail authentication.
    const envelope = encryptBackup(PHRASE, 'secret', FAST_ITERATIONS);
    const swapped: BackupEnvelope = {
      ...envelope,
      iterations: FAST_ITERATIONS + 1,
    };

    expect(() => decryptBackup(PHRASE, swapped)).toThrow();
  });

  it('rejects unknown formats, ciphers, and KDFs', () => {
    const envelope = encryptBackup(PHRASE, 'secret', FAST_ITERATIONS);

    expect(() =>
      decryptBackup(PHRASE, { ...envelope, format: 'v99' } as never)
    ).toThrow(BackupFormatError);
    expect(() =>
      decryptBackup(PHRASE, { ...envelope, cipher: 'rot13' } as never)
    ).toThrow(BackupFormatError);
    expect(() =>
      decryptBackup(PHRASE, { ...envelope, kdf: 'md5' } as never)
    ).toThrow(BackupFormatError);
  });

  it('rejects malformed salt and nonce lengths', () => {
    const envelope = encryptBackup(PHRASE, 'secret', FAST_ITERATIONS);

    expect(() => decryptBackup(PHRASE, { ...envelope, salt: 'AAAA' })).toThrow(
      BackupFormatError
    );
    expect(() => decryptBackup(PHRASE, { ...envelope, nonce: 'AAAA' })).toThrow(
      BackupFormatError
    );
  });

  it('requires a passphrase to encrypt', () => {
    expect(() => encryptBackup('', 'secret', FAST_ITERATIONS)).toThrow(
      BackupFormatError
    );
  });

  it('roundtrips unicode and large payloads', () => {
    const plaintext = JSON.stringify({
      note: 'acentuación 💜 ünïcode',
      bulk: 'x'.repeat(50_000),
    });
    const envelope = encryptBackup(PHRASE, plaintext, FAST_ITERATIONS);

    expect(decryptBackup(PHRASE, envelope)).toBe(plaintext);
  });

  it('treats normalized phrase spacing and case as the same key', () => {
    const envelope = encryptBackup(
      normalizeRecoveryPhrase(PHRASE),
      'secret',
      FAST_ITERATIONS
    );

    expect(
      decryptBackup(
        normalizeRecoveryPhrase(`  ${PHRASE.toUpperCase()}  `),
        envelope
      )
    ).toBe('secret');
  });
});

describe('recovery phrase', () => {
  it('uses a bias-free wordlist of exactly 256 unique words', () => {
    expect(RECOVERY_WORDLIST).toHaveLength(256);
    expect(new Set(RECOVERY_WORDLIST).size).toBe(256);
  });

  it('generates the expected number of wordlist words', () => {
    const phrase = generateRecoveryPhrase();
    const words = phrase.split(' ');

    expect(words).toHaveLength(RECOVERY_PHRASE_WORDS);
    for (const word of words) {
      expect(RECOVERY_WORDLIST).toContain(word);
    }
  });

  it('carries at least 96 bits of entropy', () => {
    expect(RECOVERY_PHRASE_ENTROPY_BITS).toBeGreaterThanOrEqual(96);
  });

  it('does not repeat phrases across generations', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i += 1) seen.add(generateRecoveryPhrase());

    expect(seen.size).toBe(50);
  });

  it('accepts a generated phrase and reports its normalized form', () => {
    const phrase = generateRecoveryPhrase();
    const result = validateRecoveryPhrase(`  ${phrase.toUpperCase()} `);

    expect(result).toEqual({ valid: true, normalized: phrase });
  });

  it('reports the specific unknown words so the UI can flag a typo', () => {
    const phrase = generateRecoveryPhrase().split(' ');
    phrase[3] = 'notaword';

    expect(validateRecoveryPhrase(phrase.join(' '))).toEqual({
      valid: false,
      reason: 'unknown-word',
      words: ['notaword'],
    });
  });

  it('rejects empty and wrong-length phrases', () => {
    expect(validateRecoveryPhrase('   ')).toMatchObject({
      valid: false,
      reason: 'empty',
    });
    expect(validateRecoveryPhrase('anchor apple')).toMatchObject({
      valid: false,
      reason: 'length',
    });
  });

  it('roundtrips a backup using a generated phrase', () => {
    const phrase = generateRecoveryPhrase();
    const envelope = encryptBackup(phrase, 'private notes', FAST_ITERATIONS);

    expect(decryptBackup(phrase, envelope)).toBe('private notes');
  });
});
