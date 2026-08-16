import { requireNativeModule } from 'expo';

export type NativeKeypair = {
  privateKey: string;
  publicKey: string;
};

export type NativeEncryptedPayload = {
  encryptedPayload: string;
  payloadHash: string;
};

export type SpiceSyncCryptoNativeModule = {
  randomBytes(length: number): string;
  sha256(inputBase64: string): string;
  generateSigningKeypair(): NativeKeypair;
  generateEncryptionKeypair(): NativeKeypair;
  signEd25519(privateKey: string, message: string): string;
  verifyEd25519(
    publicKey: string,
    signature: string,
    message: string
  ): boolean;
  encryptForPartner(
    privateKey: string,
    partnerPublicKey: string,
    plaintext: string
  ): NativeEncryptedPayload;
  decryptFromPartner(
    privateKey: string,
    partnerPublicKey: string,
    encryptedPayload: string
  ): string;
};

export default requireNativeModule<SpiceSyncCryptoNativeModule>(
  'SpiceSyncCrypto'
);
