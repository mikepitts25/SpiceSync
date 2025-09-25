
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfiles, EMOJI_OPTIONS, EmojiOption } from '../../lib/state/profiles';

export default function WelcomeCreateProfile() {
  const router = useRouter();
  const { profiles, createProfile } = useProfiles();

  // If somehow profiles exist already, bounce to tabs
  useEffect(() => {
    if (profiles.length > 0) {
      router.replace('/(tabs)/categories');
    }
  }, [profiles.length]);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState<EmojiOption>('👨🏻');
  const [pin, setPin] = useState('');

  const onCreate = () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a display name.');
      return;
    }
    if (pin && !/^\d{4,6}$/.test(pin)) {
      Alert.alert('Invalid PIN', 'PIN must be 4–6 digits or leave it blank.');
      return;
    }
    createProfile(name.trim(), emoji, pin || null);
    router.replace('/(tabs)/categories');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Text style={styles.h1}>Welcome</Text>
      <Text style={styles.p}>Let’s create your first profile.</Text>

      <View style={styles.card}>
        <Text style={styles.h2}>Choose an emoji</Text>
        <FlatList
          data={EMOJI_OPTIONS as readonly EmojiOption[]}
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
        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={setPin}
          placeholder="Optional PIN (4–6 digits)"
          placeholderTextColor="#64748b"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
        />

        <Pressable onPress={onCreate} style={styles.primary}>
          <Text style={styles.btnStrong}>Create profile</Text>
        </Pressable>
      </View>

      <Text style={styles.hint}>
        You can add more profiles later in Settings → Profiles.
      </Text>
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
