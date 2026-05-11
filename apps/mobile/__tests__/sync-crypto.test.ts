import { decodeBase64, encodeBase64 } from '../lib/sync/base64';
import {
  decryptFromPartner,
  encryptForPartner,
  generateEncryptionKeypair,
  generateSigningKeypair,
  randomBytes,
  sha256,
  sha256Base64,
  signEd25519,
  verifyEd25519,
} from '../lib/sync/crypto';

describe('sync crypto', () => {
  it('roundtrips base64 for random bytes', () => {
    const bytes = randomBytes(64);
    const encoded = encodeBase64(bytes);
    const decoded = decodeBase64(encoded);
    expect(decoded).toEqual(bytes);
  });

  it('hashes a string deterministically', () => {
    expect(sha256Base64('hello')).toBe(sha256Base64('hello'));
    expect(sha256Base64('hello')).not.toBe(sha256Base64('world'));
    expect(sha256('hello').length).toBe(32);
  });

  it('encrypts a payload that the partner can decrypt', () => {
    const a = generateEncryptionKeypair();
    const b = generateEncryptionKeypair();
    const message = JSON.stringify({ cardId: 'k_42', vote: 'yes' });

    const { encryptedPayload, payloadHash } = encryptForPartner(
      a.privateKey,
      b.publicKey,
      message
    );
    expect(encryptedPayload.length).toBeGreaterThan(40);
    expect(payloadHash).toBe(sha256Base64(encryptedPayload));

    const decrypted = decryptFromPartner(
      b.privateKey,
      a.publicKey,
      encryptedPayload
    );
    expect(decrypted).toBe(message);
  });

  it('produces fresh ciphertext each call', () => {
    const a = generateEncryptionKeypair();
    const b = generateEncryptionKeypair();
    const c1 = encryptForPartner(
      a.privateKey,
      b.publicKey,
      'same'
    ).encryptedPayload;
    const c2 = encryptForPartner(
      a.privateKey,
      b.publicKey,
      'same'
    ).encryptedPayload;
    expect(c1).not.toBe(c2);
  });

  it('rejects tampered ciphertext', () => {
    const a = generateEncryptionKeypair();
    const b = generateEncryptionKeypair();
    const { encryptedPayload } = encryptForPartner(
      a.privateKey,
      b.publicKey,
      'hi'
    );
    const tampered =
      encryptedPayload.slice(0, -2) +
      (encryptedPayload.endsWith('a') ? 'bb' : 'aa');
    expect(() =>
      decryptFromPartner(b.privateKey, a.publicKey, tampered)
    ).toThrow();
  });

  it('signs and verifies', () => {
    const signing = generateSigningKeypair();
    const message = new Uint8Array([1, 2, 3, 4, 5]);
    const signature = signEd25519(signing.privateKey, message);
    expect(verifyEd25519(signing.publicKey, signature, message)).toBe(true);
    expect(
      verifyEd25519(signing.publicKey, signature, new Uint8Array([9, 9, 9]))
    ).toBe(false);
  });
});
