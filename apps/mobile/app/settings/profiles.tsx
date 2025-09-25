import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { useProfiles } from '../../lib/state/profiles';

type MaybeFn = ((...args: any[]) => any) | undefined;

export default function ProfilesInSettingsScreen() {
  // NOTE: using `as any` here so this screen works with your existing store API,
  // even if function names differ slightly. We guard every call with `?.`.
  const {
    profiles,
    currentUserId,
    setCurrentUser,
    createProfile,
    updateProfile,
    deleteProfile,
  } = (useProfiles() as any) || {};

  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🙂');

  const canCreate = typeof createProfile === 'function';
  const canUpdate = typeof updateProfile === 'function';
  const canDelete = typeof deleteProfile === 'function';
  const canSelect = typeof setCurrentUser === 'function';

  const me = useMemo(
    () => profiles?.find((p: any) => p.id === currentUserId) ?? null,
    [profiles, currentUserId]
  );

  const onCreate = () => {
    if (!canCreate) {
      Alert.alert('Not available', 'Profile creation isn’t exposed by the store in this build.');
      return;
    }
    const name = newName.trim() || `Partner ${String((profiles?.length ?? 0) + 1)}`;
    const emoji = (newEmoji || '🙂').slice(0, 2);
    const id: string | undefined = createProfile?.(name, emoji);
    if (id) {
      setNewName('');
      setNewEmoji('🙂');
      setCurrentUser?.(id);
    }
  };

  const onRename = (id: string, displayName: string) => {
    if (!canUpdate) {
      Alert.alert('Not available', 'Profile editing isn’t exposed by the store in this build.');
      return;
    }
    updateProfile?.(id, { displayName });
  };

  const onReemoji = (id: string, emoji: string) => {
    if (!canUpdate) return;
    updateProfile?.(id, { emoji: emoji.slice(0, 2) });
  };

  const onDelete = (id: string) => {
    if (!canDelete) {
      Alert.alert('Not available', 'Profile deletion isn’t exposed by the store in this build.');
      return;
    }
    const p = profiles?.find((x: any) => x.id === id);
    Alert.alert(
      'Delete profile?',
      `This permanently removes ${p?.displayName ?? 'this profile'} and their votes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProfile?.(id);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Text style={styles.h1}>Profiles</Text>
      <Text style={styles.p}>
        Create, rename, set emoji, select the active profile, or remove extra profiles.
      </Text>

      <View style={styles.card}>
        <Text style={styles.h2}>Create new</Text>
        <View style={styles.row}>
          <TextInput
            placeholder="Emoji"
            value={newEmoji}
            onChangeText={setNewEmoji}
            style={[styles.input, { width: 64, textAlign: 'center' }]}
            maxLength={2}
            placeholderTextColor="#64748b"
          />
          <TextInput
            placeholder="Display name"
            value={newName}
            onChangeText={setNewName}
            style={[styles.input, { flex: 1 }]}
            placeholderTextColor="#64748b"
          />
          <Pressable onPress={onCreate} style={styles.primary}>
            <Text style={styles.btnStrong}>Add</Text>
          </Pressable>
        </View>
        {!canCreate && (
          <Text style={styles.hint}>
            Your profiles store doesn’t expose <Text style={styles.code}>createProfile(name, emoji)</Text> yet. You can still manage existing ones below.
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>Existing profiles</Text>
        {!profiles?.length ? (
          <Text style={styles.p}>No profiles yet.</Text>
        ) : (
          <FlatList
            data={profiles}
            keyExtractor={(item: any) => item.id}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }: any) => {
              const active = item.id === currentUserId;
              return (
                <View style={[styles.profileRow, active && styles.profileRowActive]}>
                  <Text style={styles.emoji}>{item.emoji ?? '🙂'}</Text>
                  <TextInput
                    style={[styles.input, styles.nameInput]}
                    value={item.displayName}
                    onChangeText={(t) => onRename(item.id, t)}
                    placeholder="Name"
                    placeholderTextColor="#64748b"
                  />
                  <TextInput
                    style={[styles.input, styles.emojiInput]}
                    value={item.emoji ?? ''}
                    onChangeText={(t) => onReemoji(item.id, t)}
                    maxLength={2}
                    placeholder="🙂"
                    placeholderTextColor="#64748b"
                  />
                  <Pressable
                    onPress={() => (canSelect ? setCurrentUser?.(item.id) : Alert.alert('Not available', 'Selecting active profile is not exposed by the store.'))}
                    style={[styles.secondary, active && styles.secondaryDisabled]}
                    disabled={active}
                  >
                    <Text style={styles.btnStrong}>{active ? 'Active' : 'Set active'}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onDelete(item.id)}
                    style={styles.danger}
                  >
                    <Text style={styles.btnStrong}>Delete</Text>
                  </Pressable>
                </View>
              );
            }}
          />
        )}
        {me && (
          <Text style={[styles.hint, { marginTop: 8 }]}>
            Active: <Text style={styles.strong}>{me.emoji} {me.displayName}</Text>
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: '#0b0f14', gap: 12 },
  h1: { fontSize: 22, fontWeight: '800', color: 'white' },
  p: { color: '#cbd5e1' },
  h2: { color: 'white', fontWeight: '800', marginBottom: 8, fontSize: 16 },
  code: { fontFamily: 'Menlo', color: '#93c5fd' },
  strong: { color: 'white', fontWeight: '800' },

  card: { backgroundColor: '#0e1526', borderWidth: 1, borderColor: '#111827', borderRadius: 14, padding: 14, gap: 8 },

  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: 'white',
  },
  primary: { backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  secondary: { backgroundColor: '#1f2937', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  secondaryDisabled: { opacity: 0.6 },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0b1222',
    borderWidth: 1,
    borderColor: '#111827',
    padding: 8,
    borderRadius: 12,
  },
  profileRowActive: { borderColor: '#2563eb' },
  nameInput: { flex: 1 },
  emojiInput: { width: 56, textAlign: 'center' },
  emoji: { fontSize: 22, width: 28, textAlign: 'center' },

  hint: { color: '#94a3b8' },
  danger: { backgroundColor: '#ef4444', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  btnStrong: { color: 'white', fontWeight: '900' },
});
