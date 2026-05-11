import {
  _resetCacheForTests,
  clearIdentity,
  getIdentityIfExists,
  getOrCreateIdentity,
} from '../lib/sync/identity';

function makeMemoryDeps() {
  const secure = new Map<string, string>();
  const async = new Map<string, string>();
  return {
    secureStore: {
      getItemAsync: async (k: string) =>
        secure.has(k) ? secure.get(k)! : null,
      setItemAsync: async (k: string, v: string) => {
        secure.set(k, v);
      },
      deleteItemAsync: async (k: string) => {
        secure.delete(k);
      },
    },
    asyncStorage: {
      getItem: async (k: string) => (async.has(k) ? async.get(k)! : null),
      setItem: async (k: string, v: string) => {
        async.set(k, v);
      },
      removeItem: async (k: string) => {
        async.delete(k);
      },
    },
    _internal: { secure, async },
  };
}

describe('sync identity', () => {
  beforeEach(() => {
    _resetCacheForTests();
  });

  it('creates and persists a new identity', async () => {
    const deps = makeMemoryDeps();
    const first = await getOrCreateIdentity(deps);
    expect(first.identity.deviceId).toMatch(/^dev_/);
    expect(first.identity.signingPublicKey.length).toBeGreaterThan(0);
    expect(first.identity.encryptionPublicKey.length).toBeGreaterThan(0);
    expect(first.signingPrivateKey.length).toBe(32);
    expect(first.encryptionPrivateKey.length).toBe(32);
    expect(deps._internal.secure.size).toBe(2);
    expect(deps._internal.async.size).toBe(1);
  });

  it('returns the same identity on reload', async () => {
    const deps = makeMemoryDeps();
    const first = await getOrCreateIdentity(deps);
    _resetCacheForTests();
    const second = await getOrCreateIdentity(deps);
    expect(second.identity.deviceId).toBe(first.identity.deviceId);
    expect(second.identity.signingPublicKey).toBe(
      first.identity.signingPublicKey
    );
    expect(Buffer.from(second.signingPrivateKey).toString('hex')).toBe(
      Buffer.from(first.signingPrivateKey).toString('hex')
    );
  });

  it('returns null when no identity exists yet', async () => {
    const deps = makeMemoryDeps();
    const existing = await getIdentityIfExists(deps);
    expect(existing).toBeNull();
  });

  it('clears identity completely', async () => {
    const deps = makeMemoryDeps();
    await getOrCreateIdentity(deps);
    await clearIdentity(deps);
    expect(deps._internal.secure.size).toBe(0);
    expect(deps._internal.async.size).toBe(0);
    _resetCacheForTests();
    expect(await getIdentityIfExists(deps)).toBeNull();
  });
});
