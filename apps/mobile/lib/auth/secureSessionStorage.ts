import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const MANIFEST_SUFFIX = '.manifest';
const CHUNK_SUFFIX = '.chunk.';

type SessionManifest = {
  generation: string;
  count: number;
};

type StoredManifest =
  | { kind: 'legacy'; count: number }
  | { kind: 'generation'; value: SessionManifest };

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
  let generationSequence = 0;

  function parseManifest(raw: string | null): StoredManifest | null {
    if (!raw) return null;
    const legacyCount = Number(raw);
    if (Number.isSafeInteger(legacyCount) && legacyCount >= 0) {
      return { kind: 'legacy', count: legacyCount };
    }
    try {
      const parsed = JSON.parse(raw) as Partial<SessionManifest>;
      if (
        typeof parsed.generation === 'string' &&
        parsed.generation.length > 0 &&
        Number.isSafeInteger(parsed.count) &&
        (parsed.count ?? -1) >= 0
      ) {
        return {
          kind: 'generation',
          value: parsed as SessionManifest,
        };
      }
    } catch {}
    return null;
  }

  function chunkKeys(key: string, manifest: StoredManifest): string[] {
    if (manifest.kind === 'legacy') {
      return Array.from(
        { length: manifest.count },
        (_, index) => `${key}${CHUNK_SUFFIX}${index}`
      );
    }
    return Array.from(
      { length: manifest.value.count },
      (_, index) => `${key}${CHUNK_SUFFIX}${manifest.value.generation}.${index}`
    );
  }

  const storage = {
    async getItem(key: string): Promise<string | null> {
      const manifest = parseManifest(
        await secure.getItemAsync(key + MANIFEST_SUFFIX)
      );
      if (manifest) {
        const chunks = await Promise.all(
          chunkKeys(key, manifest).map((chunkKey) =>
            secure.getItemAsync(chunkKey)
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
      const previousManifest = parseManifest(
        await secure.getItemAsync(key + MANIFEST_SUFFIX)
      );
      const chunks = value.match(new RegExp(`.{1,${chunkSize}}`, 'gs')) ?? [''];
      const generation = `${Date.now().toString(36)}-${++generationSequence}`;
      const nextManifest: StoredManifest = {
        kind: 'generation',
        value: { generation, count: chunks.length },
      };
      const nextChunkKeys = chunkKeys(key, nextManifest);
      try {
        await Promise.all(
          chunks.map((chunk, index) =>
            secure.setItemAsync(nextChunkKeys[index], chunk)
          )
        );
      } catch (error) {
        await Promise.all(
          nextChunkKeys.map((chunkKey) => secure.deleteItemAsync(chunkKey))
        ).catch(() => undefined);
        throw error;
      }
      // The manifest is the atomic commit point. Until it changes, a relaunch
      // continues reading the previous complete session.
      await secure.setItemAsync(
        key + MANIFEST_SUFFIX,
        JSON.stringify(nextManifest.value)
      );
      await legacy.removeItem(key);
      if (previousManifest) {
        await Promise.all(
          chunkKeys(key, previousManifest).map((chunkKey) =>
            secure.deleteItemAsync(chunkKey)
          )
        ).catch(() => undefined);
      }
    },

    async removeItem(key: string): Promise<void> {
      const manifest = parseManifest(
        await secure.getItemAsync(key + MANIFEST_SUFFIX)
      );
      await Promise.all([
        ...(manifest
          ? chunkKeys(key, manifest).map((chunkKey) =>
              secure.deleteItemAsync(chunkKey)
            )
          : []),
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
