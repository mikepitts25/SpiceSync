import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { decodeBase64, encodeBase64 } from './base64';
import {
  EncryptionKeypair,
  SigningKeypair,
  generateEncryptionKeypair,
  generateSigningKeypair,
  randomBytes,
} from './crypto';

const SECURE_SIGNING_PRIVATE_KEY = 'spicesync.sync.signing.private';
const SECURE_ENCRYPTION_PRIVATE_KEY = 'spicesync.sync.encryption.private';
const IDENTITY_PUBLIC_KEY = 'spicesync.sync.identity.public';

export type SyncIdentity = {
  deviceId: string;
  signingPublicKey: string;
  encryptionPublicKey: string;
  createdAt: number;
};

type StoredPublic = SyncIdentity;

type IdentityWithSecrets = {
  identity: SyncIdentity;
  signingPrivateKey: Uint8Array;
  encryptionPrivateKey: Uint8Array;
};

type SecureStoreLike = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

type AsyncStorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

export type IdentityDeps = {
  secureStore: SecureStoreLike;
  asyncStorage: AsyncStorageLike;
};

const defaultDeps: IdentityDeps = {
  secureStore: SecureStore,
  asyncStorage: AsyncStorage,
};

function newDeviceId(): string {
  return (
    'dev_' +
    encodeBase64(randomBytes(12))
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 16)
  );
}

async function loadIdentity(
  deps: IdentityDeps
): Promise<IdentityWithSecrets | null> {
  const [publicJson, signingPrivate, encryptionPrivate] = await Promise.all([
    deps.asyncStorage.getItem(IDENTITY_PUBLIC_KEY),
    deps.secureStore.getItemAsync(SECURE_SIGNING_PRIVATE_KEY),
    deps.secureStore.getItemAsync(SECURE_ENCRYPTION_PRIVATE_KEY),
  ]);
  if (!publicJson || !signingPrivate || !encryptionPrivate) return null;
  try {
    const stored = JSON.parse(publicJson) as StoredPublic;
    return {
      identity: stored,
      signingPrivateKey: decodeBase64(signingPrivate),
      encryptionPrivateKey: decodeBase64(encryptionPrivate),
    };
  } catch {
    return null;
  }
}

async function persistIdentity(
  deps: IdentityDeps,
  identity: SyncIdentity,
  signing: SigningKeypair,
  encryption: EncryptionKeypair
): Promise<void> {
  await deps.secureStore.setItemAsync(
    SECURE_SIGNING_PRIVATE_KEY,
    encodeBase64(signing.privateKey)
  );
  await deps.secureStore.setItemAsync(
    SECURE_ENCRYPTION_PRIVATE_KEY,
    encodeBase64(encryption.privateKey)
  );
  await deps.asyncStorage.setItem(
    IDENTITY_PUBLIC_KEY,
    JSON.stringify(identity)
  );
}

let cached: IdentityWithSecrets | null = null;
let activeDeps: IdentityDeps = defaultDeps;

export function setIdentityDeps(deps: Partial<IdentityDeps>): void {
  activeDeps = { ...activeDeps, ...deps };
  cached = null;
}

export async function getOrCreateIdentity(
  deps: IdentityDeps = activeDeps
): Promise<IdentityWithSecrets> {
  if (cached) return cached;
  const existing = await loadIdentity(deps);
  if (existing) {
    cached = existing;
    return existing;
  }
  const signing = generateSigningKeypair();
  const encryption = generateEncryptionKeypair();
  const identity: SyncIdentity = {
    deviceId: newDeviceId(),
    signingPublicKey: encodeBase64(signing.publicKey),
    encryptionPublicKey: encodeBase64(encryption.publicKey),
    createdAt: Date.now(),
  };
  await persistIdentity(deps, identity, signing, encryption);
  cached = {
    identity,
    signingPrivateKey: signing.privateKey,
    encryptionPrivateKey: encryption.privateKey,
  };
  return cached;
}

export async function getIdentityIfExists(
  deps: IdentityDeps = activeDeps
): Promise<IdentityWithSecrets | null> {
  if (cached) return cached;
  const existing = await loadIdentity(deps);
  if (existing) cached = existing;
  return existing;
}

export async function clearIdentity(
  deps: IdentityDeps = activeDeps
): Promise<void> {
  cached = null;
  await Promise.all([
    deps.secureStore.deleteItemAsync(SECURE_SIGNING_PRIVATE_KEY),
    deps.secureStore.deleteItemAsync(SECURE_ENCRYPTION_PRIVATE_KEY),
    deps.asyncStorage.removeItem(IDENTITY_PUBLIC_KEY),
  ]);
}

export function _resetCacheForTests(): void {
  cached = null;
}
