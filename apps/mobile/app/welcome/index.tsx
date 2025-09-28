import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfilesStore } from '../../lib/state/profiles';
import SettingsButton from '../../src/components/SettingsButton';
import { EMOJI_CHOICES } from '../../src/constants/emojis';

type EmojiChoice = (typeof EMOJI_CHOICES)[number];

export default function WelcomeCreateProfile() {
  const router = useRouter();
  const hydrated = useProfilesStore((state) => state.isHydrated);
  const hasActive = useProfilesStore((state) => state.hasActiveProfile());
  const createProfileState = useProfilesStore((state) => state.createProfile);

  // If somehow profiles exist already, bounce to tabs
  useEffect(() => {
    if (hydrated && hasActive) {
      router.replace('/(tabs)/categories');
    }
  }, [hydrated, hasActive, router]);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState<EmojiChoice>(EMOJI_CHOICES[0]);

  const onCreate = () => {
    const safeName = name.trim();
    if (!safeName) {
      Alert.alert('Name required', 'Please enter a display name.');
      return;
    }
    try {
      createProfileState({ name: safeName, emoji });
      router.replace('/(tabs)/categories');
    } catch (error) {
      console.error('create profile failed', error);
      Alert.alert('Could not create profile', 'Please try again.');
    }
  };

  if (!hydrated) {
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
        <Text style={styles.h2}>Choose an emoji</Text>
        <FlatList
          data={EMOJI_CHOICES as readonly EmojiChoice[]}
          keyExtractor={(item) => item}
          numColumns={5}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 8 }}
          renderItem={({ item }) => {
            const active = item === emoji;
            return (
              <Pressable onPress={() => setEmoji(item)} style={[styles.emojiBtn, active && styles.emojiBtnActive]}>
                <Text style={styles.emoji}>{item}</Text>
              </Pressable>
            );
          }}
        />
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
        <Pressable onPress={onCreate} style={styles.primary}>
          <Text style={styles.btnStrong}>Create profile</Text>
        </Pressable>
      </View>

      <Text style={styles.hint}>
        You can add more profiles later in Settings → Profiles.
      </Text>
      <SettingsButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: '#0b0f14', gap: 12 },
  h1: { fontSize: 24, fontWeight: '900', color: 'white' },
  h2: { color: 'white', fontWeight: '800', marginBottom: 8, fontSize: 16 },
  p: { color: '#cbd5e1' },
  hint: { color: '#94a3b8' },

  card: { backgroundColor: '#0e1526', borderWidth: 1, borderColor: '#111827', borderRadius: 14, padding: 14 },

  emojiBtn: {
    width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', marginBottom: 8,
  },
  emojiBtnActive: { borderColor: '#2563eb', backgroundColor: '#0b1222' },
  emoji: { fontSize: 28 },

  input: {
    backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: 'white', marginBottom: 8,
  },
  primary: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  btnStrong: { color: 'white', fontWeight: '900' },
});
