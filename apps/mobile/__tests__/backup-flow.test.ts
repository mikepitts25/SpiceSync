import AsyncStorage from '@react-native-async-storage/async-storage';

import { BACKUP_FORMAT, encryptBackup } from '../lib/backup/backupCrypto';
import { createBackup, restoreBackup } from '../lib/backup/backupFlow';
import { RECOVERY_PHRASE_WORDS } from '../lib/backup/recoveryPhrase';
import { useScreenToursStore } from '../src/stores/screenTours';

const persisted = (state: unknown) => JSON.stringify({ state, version: 0 });

beforeEach(async () => {
  await AsyncStorage.clear();
  useScreenToursStore.setState({ dismissedTourScreens: {} });
});

describe('createBackup', () => {
  it('returns a 12-word phrase and an encrypted payload', async () => {
    await AsyncStorage.setItem('votes', persisted({ votesByProfile: {} }));

    const backup = await createBackup(5000);

    expect(backup.recoveryPhrase.split(' ')).toHaveLength(
      RECOVERY_PHRASE_WORDS
    );
    expect(backup.createdAt).toBe(5000);
    const envelope = JSON.parse(backup.payload);
    expect(envelope.cipher).toBe('aes-256-gcm');
    expect(envelope.ciphertext).toEqual(expect.any(String));
  });

  it('never puts the phrase or plaintext into the payload', async () => {
    await AsyncStorage.setItem(
      'votes',
      persisted({ votesByProfile: { p1: { secretkink: 'yes' } } })
    );

    const backup = await createBackup();

    expect(backup.payload).not.toContain(backup.recoveryPhrase);
    expect(backup.payload).not.toContain('secretkink');
  });

  it('produces a different phrase each time', async () => {
    const a = await createBackup();
    const b = await createBackup();

    expect(a.recoveryPhrase).not.toBe(b.recoveryPhrase);
  });
});

describe('restoreBackup', () => {
  it('roundtrips through create and restore, updating live state', async () => {
    await AsyncStorage.setItem(
      'spicesync-screen-tours-v1',
      persisted({ dismissedTourScreens: { deck: true } })
    );
    const backup = await createBackup(7000);

    // Simulate a fresh device: storage cleared, stores holding defaults.
    await AsyncStorage.clear();
    useScreenToursStore.setState({ dismissedTourScreens: {} });

    const result = await restoreBackup(backup.recoveryPhrase, backup.payload);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.createdAt).toBe(7000);
    expect(result.restoredKeys).toContain('spicesync-screen-tours-v1');
    expect(result.staleKeys).toEqual([]);
    // The live store reflects the restore without a restart.
    expect(useScreenToursStore.getState().dismissedTourScreens).toEqual({
      deck: true,
    });
  });

  it('rejects a phrase with an unknown word and names it', async () => {
    const backup = await createBackup();
    const words = backup.recoveryPhrase.split(' ');
    words[3] = 'zzzznotaword';

    const result = await restoreBackup(words.join(' '), backup.payload);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason.kind).toBe('invalid-phrase');
    if (result.reason.kind !== 'invalid-phrase') return;
    expect(result.reason.reason).toBe('unknown-word');
    expect(result.reason.words).toContain('zzzznotaword');
  });

  it('distinguishes a wrong-length phrase from a typo', async () => {
    const backup = await createBackup();
    const short = backup.recoveryPhrase.split(' ').slice(0, 5).join(' ');

    const result = await restoreBackup(short, backup.payload);

    expect(result.ok).toBe(false);
    if (result.ok || result.reason.kind !== 'invalid-phrase') return;
    expect(result.reason.reason).toBe('length');
  });

  it('reports a wrong phrase for a valid phrase that does not open the file', async () => {
    const backup = await createBackup();
    const other = await createBackup();

    const result = await restoreBackup(other.recoveryPhrase, backup.payload);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason.kind).toBe('wrong-phrase');
  });

  it('reports tampering as a wrong phrase, revealing nothing extra', async () => {
    const backup = await createBackup();
    const envelope = JSON.parse(backup.payload);
    const bytes = Buffer.from(envelope.ciphertext, 'base64');
    bytes[0] ^= 0xff;
    envelope.ciphertext = bytes.toString('base64');

    const result = await restoreBackup(
      backup.recoveryPhrase,
      JSON.stringify(envelope)
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    // Deliberately identical to the wrong-phrase case; no tampering oracle.
    expect(result.reason.kind).toBe('wrong-phrase');
  });

  it('reports unreadable input rather than throwing', async () => {
    const backup = await createBackup();

    const result = await restoreBackup(
      backup.recoveryPhrase,
      'not json at all'
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason.kind).toBe('unreadable-file');
  });

  it('does not write anything when the phrase is wrong', async () => {
    await AsyncStorage.setItem(
      'spicesync-screen-tours-v1',
      persisted({ dismissedTourScreens: { deck: true } })
    );
    const backup = await createBackup();
    const other = await createBackup();

    await AsyncStorage.clear();
    const result = await restoreBackup(other.recoveryPhrase, backup.payload);

    expect(result.ok).toBe(false);
    expect(await AsyncStorage.getItem('spicesync-screen-tours-v1')).toBeNull();
  });

  it('reports keys the allowlist refused from a hand-edited backup', async () => {
    const backup = await createBackup();
    // Re-encrypt a snapshot carrying a key a backup may never restore.
    const tampered = encryptBackup(
      backup.recoveryPhrase,
      JSON.stringify({
        format: BACKUP_FORMAT,
        createdAt: 1,
        entries: { 'spicesync-premium-v3': '{"tier":"premium"}' },
      })
    );

    const result = await restoreBackup(
      backup.recoveryPhrase,
      JSON.stringify(tampered)
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.skippedKeys).toEqual(['spicesync-premium-v3']);
    expect(result.restoredKeys).toEqual([]);
  });
});
