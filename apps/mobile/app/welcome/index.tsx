import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import EmojiMenu from '../../components/EmojiMenu';
import SettingsButton from '../../src/components/SettingsButton';
import { useProfilesStore } from '../../lib/state/profiles';
import { EMOJI_CHOICES } from '../../src/constants/emojis';
import { useShallow } from 'zustand/react/shallow';
import { useSettingsStore } from '../../src/stores/settings';

export default function WelcomeCreateProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 24);
  const bottomInset = Math.max(insets.bottom, 24);
  const ageGateAccepted = useSettingsStore((state) => state.ageGateAccepted);
  const acceptAgeGate = useSettingsStore((state) => state.acceptAgeGate);
  const { isHydrated, hasActive, createProfile, totalProfiles } = useProfilesStore(
    useShallow((state) => ({
      isHydrated: state.isHydrated(),
      hasActive: state.hasActiveProfile(),
      createProfile: state.createProfile,
      totalProfiles: state.getProfiles().length,
    }))
  );

  useEffect(() => {
    if (isHydrated && hasActive && ageGateAccepted) {
      router.replace('/(tabs)/categories');
    }
  }, [isHydrated, hasActive, ageGateAccepted, router]);

  const [name, setName] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [emoji, setEmoji] = useState<string>(EMOJI_CHOICES[0]);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const pinOptional = totalProfiles === 0;

  const togglePin = () => {
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

  const pinCtaLabel = useMemo(() => {
    if (!pinEnabled) {
      return pinOptional ? 'Set a PIN (optional)' : 'Set a PIN';
    }
    return 'Remove PIN';
  }, [pinEnabled, pinOptional]);

  const handleCreate = () => {
    const safeName = name.trim();
    if (!safeName) {
      Alert.alert('Name required', 'Please enter a display name.');
      return;
    }

    let pinToSave: string | undefined;
    if (pinEnabled) {
      if (pin.length !== 4) {
        setPinError('PIN must be 4 digits');
        return;
      }
      if (pin !== confirmPin) {
        setPinError('PINs do not match');
        return;
      }
      pinToSave = pin;
    }

    try {
      createProfile({ name: safeName, emoji, pin: pinToSave });
      router.replace('/(tabs)/categories');
    } catch (error) {
      console.error('create profile failed', error);
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert('Could not create profile', message);
    }
  };

  if (!ageGateAccepted) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View
          style={[
            styles.ageGateWrapper,
            { paddingTop: topInset, paddingBottom: bottomInset },
          ]}
        >
          <View style={styles.ageGateCenter}>
            <View style={styles.ageGateContent}>
              <Text style={styles.ageGateTitle}>SpiceSync</Text>
              <Text style={styles.ageGateBadge}>(18+)</Text>
              <Text style={styles.ageGateCopy}>
                SpiceSync is for consenting adults only. By continuing you confirm you are at least 18
                years old.
              </Text>
              <Pressable
                onPress={acceptAgeGate}
                style={[styles.primary, styles.ageGateCta]}
                accessibilityRole="button"
                accessibilityLabel="Confirm that you are at least eighteen years old"
              >
                <Text style={styles.btnStrong}>{"I'm 18+"}</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.ageGateFooter}>
            <SettingsButton />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!isHydrated) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={[styles.loadingShell, { paddingTop: topInset, paddingBottom: bottomInset }]}>
          <SettingsButton />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.h1}>Welcome</Text>
        <Text style={styles.p}>Let’s create your first profile.</Text>

        <View style={styles.card}>
          <Text style={styles.h2}>Emoji</Text>
          <Pressable
            onPress={() => setMenuVisible(true)}
            style={styles.emojiSelector}
            accessibilityRole="button"
            accessibilityLabel="Choose emoji"
          >
            <Text style={styles.selectedEmoji}>{emoji}</Text>
            <Text style={styles.emojiHint}>Tap to choose</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.h2}>Profile details</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Display name"
            placeholderTextColor="#64748b"
          />

          <Pressable style={styles.pinToggle} onPress={togglePin} accessibilityRole="button">
            <Text style={styles.pinToggleText}>{pinCtaLabel}</Text>
          </Pressable>

          {pinEnabled ? (
            <View style={styles.pinGroup}>
              <TextInput
                style={styles.pinInput}
                value={pin}
                onChangeText={(value) => {
                  setPin(value.replace(/\D/g, '').slice(0, 4));
                  setPinError(null);
                }}
                placeholder="PIN"
                placeholderTextColor="#475569"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
              />
              <TextInput
                style={styles.pinInput}
                value={confirmPin}
                onChangeText={(value) => {
                  setConfirmPin(value.replace(/\D/g, '').slice(0, 4));
                  setPinError(null);
                }}
                placeholder="Confirm PIN"
                placeholderTextColor="#475569"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
              />
              {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
            </View>
          ) : null}

          <Pressable onPress={handleCreate} style={styles.primary} accessibilityRole="button">
            <Text style={styles.btnStrong}>Create profile</Text>
          </Pressable>
        </View>

        <Text style={styles.hint}>You can add more profiles later in Settings → Profiles.</Text>
        <SettingsButton />
      </ScrollView>

      <EmojiMenu
        visible={menuVisible}
        selected={emoji}
        onSelect={(value) => {
          setEmoji(value);
          setMenuVisible(false);
        }}
        onClose={() => setMenuVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0b0f14' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 24, gap: 12 },
  loadingShell: { flex: 1, paddingHorizontal: 16 },
  ageGateWrapper: { flex: 1, width: '100%' },
  ageGateCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  ageGateContent: { width: '100%', maxWidth: 360, alignItems: 'center', gap: 16, paddingHorizontal: 24, alignSelf: 'center' },
  ageGateTitle: { fontSize: 28, fontWeight: '900', color: 'white', textAlign: 'center' },
  ageGateBadge: { fontSize: 20, fontWeight: '800', color: '#f97316', textAlign: 'center' },
  ageGateCopy: { color: '#cbd5e1', textAlign: 'center' },
  ageGateCta: { alignSelf: 'stretch', marginTop: 12 },
  ageGateFooter: { alignItems: 'flex-end', paddingHorizontal: 16 },
  h1: { fontSize: 24, fontWeight: '900', color: 'white' },
  h2: { color: 'white', fontWeight: '800', marginBottom: 8, fontSize: 16 },
  p: { color: '#cbd5e1' },
  hint: { color: '#94a3b8' },
  card: {
    backgroundColor: '#0e1526',
    borderWidth: 1,
    borderColor: '#111827',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  emojiSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
  },
  selectedEmoji: { fontSize: 28 },
  emojiHint: { color: '#64748b', fontWeight: '600' },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: 'white',
  },
  pinToggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
  },
  pinToggleText: { color: '#93c5fd', fontWeight: '700' },
  pinGroup: { gap: 10 },
  pinInput: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: 'white',
    fontSize: 18,
    letterSpacing: 8,
  },
  pinError: { color: '#f87171', fontWeight: '600' },
  primary: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  btnStrong: { color: 'white', fontWeight: '900' },
});
