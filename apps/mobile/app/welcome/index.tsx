import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import EmojiMenu from '../../components/EmojiMenu';
import SettingsButton from '../../src/components/SettingsButton';
import { useProfilesStore } from '../../lib/state/profiles';
import { EMOJI_CHOICES } from '../../src/constants/emojis';
import { useShallow } from 'zustand/react/shallow';

export default function WelcomeCreateProfile() {
  const router = useRouter();
  const { isHydrated, hasActive, createProfile, totalProfiles } = useProfilesStore(
    useShallow((state) => ({
      isHydrated: state.isHydrated(),
      hasActive: state.hasActiveProfile(),
      createProfile: state.createProfile,
      totalProfiles: state.getProfiles().length,
    }))
  );

  useEffect(() => {
    if (isHydrated && hasActive) {
      router.replace('/(tabs)/categories');
    }
  }, [isHydrated, hasActive, router]);

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

  if (!isHydrated) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <SettingsButton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
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
  screen: { flex: 1, padding: 16, backgroundColor: '#0b0f14', gap: 12 },
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
