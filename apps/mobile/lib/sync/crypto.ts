import * as ed25519 from '@noble/ed25519';
import { x25519 } from '@noble/curves/ed25519';
import { xchacha20poly1305 } from '@noble/ciphers/chacha';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 as sha256Hash } from '@noble/hashes/sha256';
import { sha512 } from '@noble/hashes/sha512';
import { randomBytes as nobleRandomBytes } from '@noble/hashes/utils';

import { bytesToUtf8, decodeBase64, encodeBase64, utf8ToBytes } from './base64';

function concat(arrays: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const a of arrays) total += a.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

ed25519.etc.sha512Sync = (...m) => sha512(concat(m));

const HKDF_INFO = utf8ToBytes('spicesync-sync-v1');
const NONCE_LEN = 24;

export function randomBytes(length: number): Uint8Array {
  return nobleRandomBytes(length);
}

export function sha256(input: Uint8Array | string): Uint8Array {
  return sha256Hash(typeof input === 'string' ? utf8ToBytes(input) : input);
}

export function sha256Base64(input: Uint8Array | string): string {
  return encodeBase64(sha256(input));
}

export type SigningKeypair = {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
};

export type EncryptionKeypair = {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
};

export function generateSigningKeypair(): SigningKeypair {
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = ed25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

export function generateEncryptionKeypair(): EncryptionKeypair {
  const privateKey = x25519.utils.randomPrivateKey();
  const publicKey = x25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

export function signEd25519(
  privateKey: Uint8Array,
  message: Uint8Array
): Uint8Array {
  return ed25519.sign(message, privateKey);
}

export function verifyEd25519(
  publicKey: Uint8Array,
  signature: Uint8Array,
  message: Uint8Array
): boolean {
  try {
    return ed25519.verify(signature, message, publicKey);
  } catch {
    return false;
  }
}

function deriveSharedKey(
  myPrivate: Uint8Array,
  partnerPublic: Uint8Array
): Uint8Array {
  const shared = x25519.getSharedSecret(myPrivate, partnerPublic);
  return hkdf(sha256Hash, shared, undefined, HKDF_INFO, 32);
}

export type EncryptedPayload = {
  encryptedPayload: string;
  payloadHash: string;
};

export function encryptForPartner(
  myEncryptionPrivate: Uint8Array,
  partnerEncryptionPublic: Uint8Array,
  plaintext: string
): EncryptedPayload {
  const key = deriveSharedKey(myEncryptionPrivate, partnerEncryptionPublic);
  const nonce = randomBytes(NONCE_LEN);
  const ciphertext = xchacha20poly1305(key, nonce).encrypt(
    utf8ToBytes(plaintext)
  );
  const combined = concat([nonce, ciphertext]);
  const encryptedPayload = encodeBase64(combined);
  return { encryptedPayload, payloadHash: sha256Base64(encryptedPayload) };
}

export function decryptFromPartner(
  myEncryptionPrivate: Uint8Array,
  partnerEncryptionPublic: Uint8Array,
  encryptedPayload: string
): string {
  const combined = decodeBase64(encryptedPayload);
  if (combined.length <= NONCE_LEN)
    throw new Error('Encrypted payload too short');
  const nonce = combined.subarray(0, NONCE_LEN);
  const ciphertext = combined.subarray(NONCE_LEN);
  const key = deriveSharedKey(myEncryptionPrivate, partnerEncryptionPublic);
  const plaintext = xchacha20poly1305(key, nonce).decrypt(ciphertext);
  return bytesToUtf8(plaintext);
}
