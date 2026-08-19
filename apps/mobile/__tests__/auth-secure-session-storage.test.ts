import { createSecureSessionStorage } from '../lib/auth/secureSessionStorage';

type MemorySecureStore = {
  values: Map<string, string>;
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

type MemoryAsyncStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

function memorySecureStore(): MemorySecureStore {
  const values = new Map<string, string>();
  return {
    values,
    async getItemAsync(key) {
      return values.get(key) ?? null;
    },
    async setItemAsync(key, value) {
      values.set(key, value);
    },
    async deleteItemAsync(key) {
      values.delete(key);
    },
  };
}

function memoryAsyncStorage(
  initialValues: Record<string, string> = {}
): MemoryAsyncStorage {
  const values = new Map(Object.entries(initialValues));
  return {
    async getItem(key) {
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      values.set(key, value);
    },
    async removeItem(key) {
      values.delete(key);
    },
  };
}

describe('secure session storage', () => {
  it('chunks values and reconstructs them from SecureStore', async () => {
    const secure = memorySecureStore();
    const legacy = memoryAsyncStorage();
    const storage = createSecureSessionStorage({ secure, legacy, chunkSize: 8 });

    await storage.setItem('sb-session', 'abcdefghijklmnopqrstuvwxyz');

    await expect(storage.getItem('sb-session')).resolves.toBe(
      'abcdefghijklmnopqrstuvwxyz'
    );
    expect(
      [...secure.values.keys()].filter((key) => key.includes('.chunk.'))
    ).toHaveLength(4);
  });

  it('moves an existing AsyncStorage session into SecureStore on first read', async () => {
    const secure = memorySecureStore();
    const legacy = memoryAsyncStorage({ 'sb-session': 'legacy-token' });
    const storage = createSecureSessionStorage({ secure, legacy, chunkSize: 8 });

    await expect(storage.getItem('sb-session')).resolves.toBe('legacy-token');
    await expect(legacy.getItem('sb-session')).resolves.toBeNull();
    await expect(storage.getItem('sb-session')).resolves.toBe('legacy-token');
  });
});
