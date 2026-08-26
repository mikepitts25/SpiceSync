import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import {
  ClipboardPaste,
  Copy,
  Download,
  ShieldCheck,
} from 'lucide-react-native';

import { BackHeader } from '../../components/app-chrome';
import { SafeAreaView } from '../../components/SafeAreaView';
import { COLORS } from '../../constants/theme';
import {
  type RestoreFailure,
  createBackup,
  restoreBackup,
} from '../../lib/backup/backupFlow';
import { RECOVERY_PHRASE_WORDS } from '../../lib/backup/recoveryPhrase';
import { ui } from '../../lib/i18n/uiLiteral';

type Created = { phrase: string; payload: string };

export default function BackupSettingsScreen() {
  const [busy, setBusy] = useState<'create' | 'restore' | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [phraseInput, setPhraseInput] = useState('');
  const [payloadInput, setPayloadInput] = useState('');
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    setBusy('create');
    try {
      const backup = await createBackup();
      setCreated({ phrase: backup.recoveryPhrase, payload: backup.payload });
    } catch {
      Alert.alert(
        ui('Backup failed'),
        ui('Something went wrong while creating the backup. Please try again.')
      );
    } finally {
      setBusy(null);
    }
  }, []);

  const handleCopyPayload = useCallback(async () => {
    if (!created) return;
    await Clipboard.setStringAsync(created.payload);
    Alert.alert(
      ui('Copied'),
      ui('Your encrypted backup is on the clipboard. Paste it somewhere safe.')
    );
  }, [created]);

  const handleCopyPhrase = useCallback(async () => {
    if (!created) return;
    await Clipboard.setStringAsync(created.phrase);
    Alert.alert(
      ui('Copied'),
      ui('Store your recovery phrase separately from the backup itself.')
    );
  }, [created]);

  const handlePastePayload = useCallback(async () => {
    const text = await Clipboard.getStringAsync();
    setPayloadInput(text ?? '');
    setRestoreError(null);
  }, []);

  const handleRestore = useCallback(async () => {
    setBusy('restore');
    setRestoreError(null);
    try {
      const result = await restoreBackup(phraseInput, payloadInput);
      if (!result.ok) {
        setRestoreError(describeFailure(result.reason));
        return;
      }

      const notes = [
        `${ui('Restored')}: ${result.restoredKeys.length}`,
        result.skippedKeys.length > 0
          ? ui('Some items were skipped because backups may not restore them.')
          : null,
        result.staleKeys.length > 0
          ? ui('Restart the app to finish loading everything.')
          : null,
      ].filter(Boolean);

      setPhraseInput('');
      setPayloadInput('');
      Alert.alert(ui('Restore complete'), notes.join('\n'));
    } catch {
      setRestoreError(
        ui('Something went wrong while restoring. Please try again.')
      );
    } finally {
      setBusy(null);
    }
  }, [phraseInput, payloadInput]);

  const canRestore =
    busy === null &&
    phraseInput.trim().length > 0 &&
    payloadInput.trim().length > 0;

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <BackHeader title={ui('Encrypted backup')} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.noticeCard}>
          <ShieldCheck size={18} color={COLORS.yes} />
          <Text style={styles.noticeText}>
            {ui(
              'Backups are encrypted on this device. Only your recovery phrase can open one, and nobody can recover it for you if it is lost.'
            )}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>
          {ui('Create a backup').toUpperCase()}
        </Text>

        {created ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{ui('Your recovery phrase')}</Text>
            <Text style={styles.phrase}>{created.phrase}</Text>
            <Text style={styles.cardHint}>
              {ui(
                'Write these words down now. They are shown once and are not stored anywhere.'
              )}
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={ui('Copy recovery phrase')}
              onPress={handleCopyPhrase}
              style={styles.secondaryButton}
            >
              <Copy size={16} color={COLORS.textPrimary} />
              <Text style={styles.secondaryButtonText}>
                {ui('Copy recovery phrase')}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={ui('Copy encrypted backup')}
              onPress={handleCopyPayload}
              style={styles.primaryButton}
            >
              <Copy size={16} color={COLORS.textPrimary} />
              <Text style={styles.primaryButtonText}>
                {ui('Copy encrypted backup')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardHint}>
              {ui(
                'This creates an encrypted copy of your profiles, votes, and progress. Your partner link and purchases are not included.'
              )}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={ui('Create backup')}
              disabled={busy !== null}
              onPress={handleCreate}
              style={[
                styles.primaryButton,
                busy !== null && styles.buttonDisabled,
              ]}
            >
              {busy === 'create' ? (
                <ActivityIndicator color={COLORS.textPrimary} size="small" />
              ) : (
                <Download size={16} color={COLORS.textPrimary} />
              )}
              <Text style={styles.primaryButtonText}>
                {busy === 'create' ? ui('Encrypting...') : ui('Create backup')}
              </Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.sectionLabel}>
          {ui('Restore a backup').toUpperCase()}
        </Text>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>{ui('Recovery phrase')}</Text>
          <TextInput
            accessibilityLabel={ui('Recovery phrase')}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
            onChangeText={(text) => {
              setPhraseInput(text);
              setRestoreError(null);
            }}
            placeholder={ui('Enter your 12 words, separated by spaces')}
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            value={phraseInput}
          />

          <View style={styles.fieldHeader}>
            <Text style={styles.fieldLabel}>{ui('Encrypted backup')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={ui('Paste backup')}
              onPress={handlePastePayload}
              style={styles.pasteButton}
            >
              <ClipboardPaste size={14} color={COLORS.purpleLight} />
              <Text style={styles.pasteButtonText}>{ui('Paste')}</Text>
            </Pressable>
          </View>
          <TextInput
            accessibilityLabel={ui('Encrypted backup')}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
            onChangeText={(text) => {
              setPayloadInput(text);
              setRestoreError(null);
            }}
            placeholder={ui('Paste the encrypted backup here')}
            placeholderTextColor={COLORS.textMuted}
            style={[styles.input, styles.payloadInput]}
            value={payloadInput}
          />

          {restoreError ? (
            <Text style={styles.errorText}>{restoreError}</Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ui('Restore backup')}
            disabled={!canRestore}
            onPress={handleRestore}
            style={[styles.primaryButton, !canRestore && styles.buttonDisabled]}
          >
            {busy === 'restore' ? (
              <ActivityIndicator color={COLORS.textPrimary} size="small" />
            ) : null}
            <Text style={styles.primaryButtonText}>
              {busy === 'restore' ? ui('Decrypting...') : ui('Restore backup')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function describeFailure(reason: RestoreFailure): string {
  switch (reason.kind) {
    case 'invalid-phrase':
      if (reason.reason === 'empty') {
        return ui('Enter your recovery phrase.');
      }
      if (reason.reason === 'length') {
        return `${ui('A recovery phrase has this many words:')} ${RECOVERY_PHRASE_WORDS}`;
      }
      return `${ui('These words are not part of a recovery phrase:')} ${reason.words.join(', ')}`;
    case 'wrong-phrase':
      return ui(
        'That phrase does not open this backup, or the backup has been altered.'
      );
    case 'unreadable-contents':
      return ui('This backup opened but its contents are not readable.');
    case 'unreadable-file':
    default:
      return ui('That does not look like a SpiceSync backup.');
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 12,
  },
  noticeCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderColor: 'rgba(34,197,94,0.25)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  noticeText: {
    flex: 1,
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 22,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderFaint,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  cardHint: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 22,
  },
  phrase: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 26,
    letterSpacing: 0.4,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.cardAlt,
    borderColor: COLORS.borderFaint,
    borderWidth: 1,
    borderRadius: 12,
    color: COLORS.textPrimary,
    fontSize: 16,
    minHeight: 64,
    padding: 12,
    textAlignVertical: 'top',
  },
  payloadInput: {
    minHeight: 110,
    fontSize: 16,
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  pasteButtonText: {
    color: COLORS.purpleLight,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.pink,
    borderRadius: 12,
    paddingVertical: 13,
  },
  primaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.cardAlt,
    borderColor: COLORS.borderFaint,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    color: COLORS.no,
    fontSize: 16,
    lineHeight: 22,
  },
});
