import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

export function createNonce(): string {
  const crypto = globalThis.crypto;
  if (!crypto || typeof crypto.getRandomValues !== 'function') {
    throw new Error('Secure random generator is unavailable');
  }
  return bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
}

export function sha256Hex(value: string): string {
  return bytesToHex(sha256(value));
}
