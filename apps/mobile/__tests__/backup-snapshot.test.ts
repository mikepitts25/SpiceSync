import fs from 'fs';
import path from 'path';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  BACKUP_FORMAT,
  decryptBackup,
  encryptBackup,
} from '../lib/backup/backupCrypto';
import {
  BACKUP_ALLOWLIST,
  BACKUP_EXCLUSIONS,
  SnapshotFormatError,
  applyRestore,
  createSnapshot,
  parseSnapshot,
  planRestore,
  sanitizeProfiles,
} from '../lib/backup/snapshot';

const PHRASE = 'anchor apple amber arrow atlas autumn bamboo banjo';
const FAST_ITERATIONS = 100_000;

const PROFILES_WITH_PIN = JSON.stringify([
  { id: 'p1', name: 'A', emoji: '🦊', pin: '1234', createdAt: 1, updatedAt: 2 },
  { id: 'p2', name: 'B', emoji: '🐼', createdAt: 3, updatedAt: 4 },
]);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('backup allowlist', () => {
  it('never lists a key that is also excluded', () => {
    for (const key of BACKUP_ALLOWLIST) {
      expect(BACKUP_EXCLUSIONS[key]).toBeUndefined();
    }
  });

  it('excludes device-bound sync identity', () => {
    expect(BACKUP_ALLOWLIST).not.toContain('spicesync.sync.identity.public');
    expect(BACKUP_EXCLUSIONS['spicesync.sync.identity.public']).toBeDefined();
  });

  it('excludes store entitlement so a backup cannot grant premium', () => {
    expect(BACKUP_ALLOWLIST).not.toContain('spicesync-premium-v3');
    expect(BACKUP_EXCLUSIONS['spicesync-premium-v3']).toBeDefined();
  });

  it('excludes partner link, relay transport, and consent state', () => {
    for (const key of [
      'spicesync-couple-link',
      'spicesync-sync-queue',
      'spicesync-vote-sync',
      'spicesync-vote-snapshot-sync',
      'spicesync-partner-votes',
      'spicesync-reveal-consent',
    ]) {
      expect(BACKUP_ALLOWLIST).not.toContain(key);
      expect(BACKUP_EXCLUSIONS[key]).toBeDefined();
    }
  });
});

describe('sanitizeProfiles', () => {
  it('strips PINs while keeping the rest of the profile', () => {
    const result = JSON.parse(sanitizeProfiles(PROFILES_WITH_PIN));

    expect(result).toHaveLength(2);
    expect(result[0].pin).toBeUndefined();
    expect(result[0].name).toBe('A');
    expect(result[0].emoji).toBe('🦊');
    expect(result[0].id).toBe('p1');
  });

  it('strips a legacy pinHash field', () => {
    const raw = JSON.stringify([{ id: 'p1', pinHash: 'deadbeef' }]);

    expect(sanitizeProfiles(raw)).not.toContain('deadbeef');
  });

  it('drops an unparsable or non-array payload rather than passing it through', () => {
    expect(sanitizeProfiles('not json')).toBe('[]');
    expect(sanitizeProfiles('{"a":1}')).toBe('[]');
  });
});

describe('createSnapshot', () => {
  it('captures allowlisted keys and omits everything else', async () => {
    await AsyncStorage.multiSet([
      ['votes', '{"v":1}'],
      ['settings-v1', '{"s":1}'],
      ['spicesync-premium-v3', '{"tier":"premium"}'],
      ['spicesync.sync.identity.public', '{"deviceId":"dev_x"}'],
      ['spicesync-couple-link', '{"link":{}}'],
      ['some-unclassified-key', 'whatever'],
    ]);

    const snapshot = await createSnapshot(1000);

    expect(snapshot.entries.votes).toBe('{"v":1}');
    expect(snapshot.entries['settings-v1']).toBe('{"s":1}');
    expect(snapshot.entries['spicesync-premium-v3']).toBeUndefined();
    expect(snapshot.entries['spicesync.sync.identity.public']).toBeUndefined();
    expect(snapshot.entries['spicesync-couple-link']).toBeUndefined();
    expect(snapshot.entries['some-unclassified-key']).toBeUndefined();
    expect(snapshot.createdAt).toBe(1000);
    expect(snapshot.format).toBe(BACKUP_FORMAT);
  });

  it('omits absent keys instead of recording them as null', async () => {
    await AsyncStorage.setItem('votes', '{"v":1}');

    const snapshot = await createSnapshot();

    expect(Object.keys(snapshot.entries)).toEqual(['votes']);
    expect('settings-v1' in snapshot.entries).toBe(false);
  });

  it('never carries a profile PIN into the snapshot', async () => {
    await AsyncStorage.setItem('profiles', PROFILES_WITH_PIN);

    const snapshot = await createSnapshot();

    expect(snapshot.entries.profiles).toBeDefined();
    expect(JSON.stringify(snapshot)).not.toContain('1234');
  });
});

describe('end-to-end snapshot encryption', () => {
  it('roundtrips a real snapshot through the crypto layer', async () => {
    await AsyncStorage.multiSet([
      ['votes', '{"v":1}'],
      ['profiles', PROFILES_WITH_PIN],
    ]);

    const snapshot = await createSnapshot(2000);
    const envelope = encryptBackup(
      PHRASE,
      JSON.stringify(snapshot),
      FAST_ITERATIONS
    );
    const restored = parseSnapshot(decryptBackup(PHRASE, envelope));

    expect(restored.createdAt).toBe(2000);
    expect(restored.entries.votes).toBe('{"v":1}');
  });

  it('does not leak plaintext votes or a PIN into the encrypted envelope', async () => {
    await AsyncStorage.multiSet([
      ['votes', '{"secretkink":"yes"}'],
      ['profiles', PROFILES_WITH_PIN],
    ]);

    const snapshot = await createSnapshot();
    const serialized = JSON.stringify(
      encryptBackup(PHRASE, JSON.stringify(snapshot), FAST_ITERATIONS)
    );

    expect(serialized).not.toContain('secretkink');
    expect(serialized).not.toContain('1234');
    expect(serialized).not.toContain(PHRASE);
  });
});

describe('parseSnapshot', () => {
  it('rejects non-JSON, malformed, and wrong-format payloads', () => {
    expect(() => parseSnapshot('nope')).toThrow(SnapshotFormatError);
    expect(() => parseSnapshot('null')).toThrow(SnapshotFormatError);
    expect(() =>
      parseSnapshot(
        JSON.stringify({ format: 'other-app-v1', createdAt: 1, entries: {} })
      )
    ).toThrow(SnapshotFormatError);
  });

  it('rejects a payload missing createdAt or entries', () => {
    expect(() =>
      parseSnapshot(JSON.stringify({ format: BACKUP_FORMAT, entries: {} }))
    ).toThrow(SnapshotFormatError);
    expect(() =>
      parseSnapshot(JSON.stringify({ format: BACKUP_FORMAT, createdAt: 1 }))
    ).toThrow(SnapshotFormatError);
  });

  it('drops non-string entry values', () => {
    const parsed = parseSnapshot(
      JSON.stringify({
        format: BACKUP_FORMAT,
        createdAt: 1,
        entries: { votes: '{"v":1}', bad: { nested: true }, alsoBad: 42 },
      })
    );

    expect(parsed.entries).toEqual({ votes: '{"v":1}' });
  });
});

describe('planRestore', () => {
  it('refuses non-allowlisted keys even when they decrypt correctly', () => {
    // A backup file the user could have hand-edited after decrypting it.
    const plan = planRestore({
      format: BACKUP_FORMAT,
      createdAt: 1,
      entries: {
        votes: '{"v":1}',
        'spicesync-premium-v3': '{"tier":"premium"}',
        'spicesync.sync.identity.public': '{"deviceId":"attacker"}',
        'spicesync-couple-link': '{"link":{}}',
      },
    });

    expect(plan.restore).toEqual({ votes: '{"v":1}' });
    expect(plan.skipped.sort()).toEqual(
      [
        'spicesync-couple-link',
        'spicesync-premium-v3',
        'spicesync.sync.identity.public',
      ].sort()
    );
  });

  it('re-strips a PIN reintroduced into a hand-edited backup', () => {
    const plan = planRestore({
      format: BACKUP_FORMAT,
      createdAt: 1,
      entries: { profiles: PROFILES_WITH_PIN },
    });

    expect(plan.restore.profiles).not.toContain('1234');
  });
});

describe('applyRestore', () => {
  it('writes permitted keys and leaves unmentioned keys untouched', async () => {
    await AsyncStorage.multiSet([
      ['spicesync-premium-v3', '{"tier":"premium"}'],
      ['votes', '{"old":true}'],
    ]);

    const plan = planRestore({
      format: BACKUP_FORMAT,
      createdAt: 1,
      entries: {
        votes: '{"new":true}',
        'spicesync-premium-v3': '{"tier":"free"}',
      },
    });
    await applyRestore(plan);

    expect(await AsyncStorage.getItem('votes')).toBe('{"new":true}');
    // The live entitlement survives a restore that tried to overwrite it.
    expect(await AsyncStorage.getItem('spicesync-premium-v3')).toBe(
      '{"tier":"premium"}'
    );
  });

  it('is a no-op for an empty plan', async () => {
    await AsyncStorage.setItem('votes', '{"v":1}');

    await applyRestore({ restore: {}, skipped: [] });

    expect(await AsyncStorage.getItem('votes')).toBe('{"v":1}');
  });
});

describe('allowlist drift guard', () => {
  // A new store is easy to add and easy to forget. This asserts every
  // persisted store in the app has been consciously classified as either
  // backed up or excluded — a new one fails here rather than silently
  // defaulting to "not in the backup" with nobody having looked at it.
  it('classifies every persisted zustand store key', () => {
    const root = path.join(__dirname, '..');
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.tsx?$/.test(entry.name)) files.push(full);
      }
    };
    walk(path.join(root, 'lib'));
    walk(path.join(root, 'src'));

    const classified = new Set([
      ...BACKUP_ALLOWLIST,
      ...Object.keys(BACKUP_EXCLUSIONS),
    ]);

    const unclassified: string[] = [];
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8');
      // Only look at files that actually configure zustand persistence.
      if (!source.includes('persist(')) continue;
      // Tolerant of indentation and quote style so a differently formatted
      // store cannot slip past the guard.
      for (const match of source.matchAll(/\bname:\s*['"`]([^'"`]+)['"`]/g)) {
        const key = match[1];
        if (!classified.has(key)) unclassified.push(`${key} (${file})`);
      }
    }

    expect(unclassified).toEqual([]);
  });
});
