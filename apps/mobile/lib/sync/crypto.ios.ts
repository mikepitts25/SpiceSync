import SpiceSyncCrypto from '../../modules/spicesync-crypto';

import { decodeBase64, encodeBase64, utf8ToBytes } from './base64';

function asBytes(input: Uint8Array | string): Uint8Array {
  return typeof input === 'string' ? utf8ToBytes(input) : input;
}

export function randomBytes(length: number): Uint8Array {
  return decodeBase64(SpiceSyncCrypto.randomBytes(length));
}

export function sha256(input: Uint8Array | string): Uint8Array {
  return decodeBase64(SpiceSyncCrypto.sha256(encodeBase64(asBytes(input))));
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

function decodeKeypair(pair: {
  privateKey: string;
  publicKey: string;
}): SigningKeypair {
  return {
    privateKey: decodeBase64(pair.privateKey),
    publicKey: decodeBase64(pair.publicKey),
  };
}

export function generateSigningKeypair(): SigningKeypair {
  return decodeKeypair(SpiceSyncCrypto.generateSigningKeypair());
}

export function generateEncryptionKeypair(): EncryptionKeypair {
  return decodeKeypair(SpiceSyncCrypto.generateEncryptionKeypair());
}

export function signEd25519(
  privateKey: Uint8Array,
  message: Uint8Array
): Uint8Array {
  return decodeBase64(
    SpiceSyncCrypto.signEd25519(
      encodeBase64(privateKey),
      encodeBase64(message)
    )
  );
}

export function verifyEd25519(
  publicKey: Uint8Array,
  signature: Uint8Array,
  message: Uint8Array
): boolean {
  return SpiceSyncCrypto.verifyEd25519(
    encodeBase64(publicKey),
    encodeBase64(signature),
    encodeBase64(message)
  );
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
  return SpiceSyncCrypto.encryptForPartner(
    encodeBase64(myEncryptionPrivate),
    encodeBase64(partnerEncryptionPublic),
    plaintext
  );
}

export function decryptFromPartner(
  myEncryptionPrivate: Uint8Array,
  partnerEncryptionPublic: Uint8Array,
  encryptedPayload: string
): string {
  return SpiceSyncCrypto.decryptFromPartner(
    encodeBase64(myEncryptionPrivate),
    encodeBase64(partnerEncryptionPublic),
    encryptedPayload
  );
}
