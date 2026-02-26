import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import EmojiMenu from '../../../components/EmojiMenu';
import { EMOJI_CHOICES } from '../../../src/constants/emojis';
import {
  createProfile as createProfileAction,
  useProfilesStore,
} from '../../../lib/state/profiles';

const PIN_LENGTH = 4;

export default function NewProfileScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromWelcome = from === 'welcome';
  const profileCount = useProfilesStore((state) => state.getProfiles().length);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState<string>(EMOJI_CHOICES[0]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const requiresPin = profileCount === 1;
  const [pinEnabled, setPinEnabled] = useState(requiresPin);

  const emojiLabel = useMemo(() => emoji || EMOJI_CHOICES[0], [emoji]);

  const onSelectEmoji = (value: string) => {
    setEmoji(value);
    setMenuVisible(false);
  };

  const onPinChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setPin(digits);
    if (confirmPin && confirmPin !== digits) {
      setPinError('PINs do not match');
    } else {
      setPinError(null);
    }
  };

  const onConfirmPinChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setConfirmPin(digits);
    if (pin && digits !== pin) {
      setPinError('PINs do not match');
    } else {
      setPinError(null);
    }
  };

  const pinActive = requiresPin || pinEnabled;
  const pinValid =
    !pinActive ||
    (pin.length === PIN_LENGTH && confirmPin === pin && !pinError);
  const nameValid = name.trim().length > 0;
  const canSubmit = nameValid && pinValid && !isSaving;

  const togglePin = () => {
    if (requiresPin) return;
    setPinEnabled((prev) => {
      const next = !prev;
      if (!next) {
        setPin('');
        setConfirmPin('');
        setPinError(null);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!canSubmit) return;

    try {
      setIsSaving(true);
      if (pinActive) {
        if (pin.length !== PIN_LENGTH) {
          setPinError('PIN must be 4 digits');
          setIsSaving(false);
          return;
        }
        if (pin !== confirmPin) {
          setPinError('PINs do not match');
          setIsSaving(false);
          return;
        }
      }

      const inputPin = pinActive ? pin : undefined;
      createProfileAction({
        name: name.trim(),
        emoji: emojiLabel,
        pin: inputPin,
      });
      if (fromWelcome) {
        router.replace('/(tabs)/categories');
      } else {
        router.back();
      }
    } catch (error) {
      console.error('create profile failed', error);
      const message =
        error instanceof Error ? error.message : 'Please try again.';
      Alert.alert('Could not create profile', message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>New Profile</Text>

          <View style={styles.section}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter name"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoFocus
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Emoji</Text>
            <Pressable
              style={styles.emojiSelector}
              onPress={() => setMenuVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Choose emoji"
            >
              <Text style={styles.emoji}>{emojiLabel}</Text>
              <Text style={styles.emojiHint}>Tap to choose</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <View style={styles.pinHeader}>
              <Text style={styles.label}>
                {requiresPin ? 'Set a 4-digit PIN' : 'PIN (optional)'}
              </Text>
              {!requiresPin ? (
                <Pressable
                  style={styles.pinToggle}
                  onPress={togglePin}
                  accessibilityRole="button"
                >
                  <Text style={styles.pinToggleText}>
                    {pinEnabled ? 'Remove PIN' : 'Set a PIN (optional)'}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {pinActive ? (
              <View style={styles.pinFields}>
                <TextInput
                  style={styles.pinInput}
                  value={pin}
                  onChangeText={onPinChange}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={PIN_LENGTH}
                  placeholder="••••"
                  placeholderTextColor="#475569"
                />

                <TextInput
                  style={styles.pinInput}
                  value={confirmPin}
                  onChangeText={onConfirmPinChange}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={PIN_LENGTH}
                  placeholder="••••"
                  placeholderTextColor="#475569"
                />
                <Text style={styles.hint}>
                  Digits only. You’ll need this PIN to switch profiles.
                </Text>
                {pinError ? <Text style={styles.error}>{pinError}</Text> : null}
              </View>
            ) : (
              <Text style={styles.hint}>
                You can keep this profile open or secure it with a PIN.
              </Text>
            )}
          </View>

          <Pressable
            style={[
              styles.primaryButton,
              (!canSubmit || isSaving) && styles.primaryDisabled,
            ]}
            onPress={handleSave}
            disabled={!canSubmit}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>
              {requiresPin ? 'Create Profile & Set PIN' : 'Create Profile'}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      <EmojiMenu
        visible={menuVisible}
        selected={emojiLabel}
        onSelect={onSelectEmoji}
        onClose={() => setMenuVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: '#0b0f14' },
  content: { padding: 16, gap: 20 },
  title: { fontSize: 22, fontWeight: '800', color: 'white' },
  section: { gap: 12 },
  label: { color: '#cbd5e1', fontWeight: '700', fontSize: 14 },
  input: {
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: 'white',
    fontSize: 16,
  },
  emojiSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emoji: { fontSize: 30 },
  emojiHint: { color: '#94a3b8', fontSize: 14 },
  pinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pinToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
  },
  pinToggleText: { color: '#93c5fd', fontWeight: '700' },
  pinFields: { gap: 12 },
  pinInput: {
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: 'white',
    fontSize: 24,
    letterSpacing: 12,
    textAlign: 'center',
  },
  hint: { color: '#64748b', marginTop: 8 },
  error: { color: '#f87171', fontWeight: '700' },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryDisabled: { opacity: 0.4 },
  primaryText: { color: 'white', fontWeight: '800', fontSize: 16 },
});
