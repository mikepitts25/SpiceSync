import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const MANIFEST_SUFFIX = '.manifest';
const CHUNK_SUFFIX = '.chunk.';

type SecureStoreLike = Pick<
  typeof SecureStore,
  'getItemAsync' | 'setItemAsync' | 'deleteItemAsync'
>;

type LegacyStorageLike = Pick<
  typeof AsyncStorage,
  'getItem' | 'setItem' | 'removeItem'
>;

type Deps = {
  secure: SecureStoreLike;
  legacy: LegacyStorageLike;
  chunkSize?: number;
};

export function createSecureSessionStorage({
  secure,
  legacy,
  chunkSize = 1800,
}: Deps) {
  const storage = {
    async getItem(key: string): Promise<string | null> {
      const manifest = await secure.getItemAsync(key + MANIFEST_SUFFIX);
      if (manifest) {
        const count = Number(manifest);
        const chunks = await Promise.all(
          Array.from({ length: count }, (_, index) =>
            secure.getItemAsync(`${key}${CHUNK_SUFFIX}${index}`)
          )
        );
        return chunks.every((value): value is string => value !== null)
          ? chunks.join('')
          : null;
      }

      const legacyValue = await legacy.getItem(key);
      if (legacyValue === null) return null;
      await storage.setItem(key, legacyValue);
      await legacy.removeItem(key);
      return legacyValue;
    },

    async setItem(key: string, value: string): Promise<void> {
      await storage.removeItem(key);
      const chunks = value.match(new RegExp(`.{1,${chunkSize}}`, 'gs')) ?? [''];
      await Promise.all(
        chunks.map((chunk, index) =>
          secure.setItemAsync(`${key}${CHUNK_SUFFIX}${index}`, chunk)
        )
      );
      await secure.setItemAsync(key + MANIFEST_SUFFIX, String(chunks.length));
    },

    async removeItem(key: string): Promise<void> {
      const count = Number(
        (await secure.getItemAsync(key + MANIFEST_SUFFIX)) ?? 0
      );
      await Promise.all([
        ...Array.from({ length: count }, (_, index) =>
          secure.deleteItemAsync(`${key}${CHUNK_SUFFIX}${index}`)
        ),
        secure.deleteItemAsync(key + MANIFEST_SUFFIX),
        legacy.removeItem(key),
      ]);
    },
  };

  return storage;
}

export const secureSessionStorage = createSecureSessionStorage({
  secure: SecureStore,
  legacy: AsyncStorage,
});
