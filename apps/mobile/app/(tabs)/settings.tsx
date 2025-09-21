import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useProfiles } from '../../lib/state/profiles';
import { useVotes } from '../../lib/state/votes';

export default function SettingsScreen() {
  const { profiles, currentUserId } = useProfiles();
  const clearUser = useVotes(s => s.clearUser);

  const me = profiles.find(p => p.id === currentUserId) || null;

  const onReset = () => {
    if (!me) return;
    Alert.alert(
      'Reset selections?',
      `This will remove all votes for ${me.displayName}. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            clearUser(me.id);
            Alert.alert('Selections cleared', `${me.displayName}'s votes have been removed.`);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Text style={styles.h1}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.h2}>Active profile</Text>
        {me ? (
          <View style={{ gap: 6 }}>
            <Text style={styles.p}>
              <Text style={{ fontSize: 18 }}>{me.emoji}</Text>{' '}
              <Text style={styles.strong}>{me.displayName}</Text>
            </Text>
            <Text style={styles.meta}>ID: {me.id.slice(0, 8)} • Created {new Date(me.createdAt).toLocaleDateString()}</Text>
            <Pressable
              onPress={onReset}
              style={({ pressed }) => [styles.btnDanger, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
            >
              <Text style={styles.btnStrong}>Reset selections for this profile</Text>
            </Pressable>
            <Text style={styles.hint}>
              This removes all YES/NO/MAYBE votes made by {me.displayName}. The other profile’s votes are unaffected.
            </Text>
          </View>
        ) : (
          <Text style={styles.p}>
            No active profile selected. Switch or create one in the Profiles tab, then return here to reset selections.
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>About & Safety</Text>
        <Text style={styles.p}>
          This app is for adults (18+) exploring consensual intimacy. Keep it legal, consensual, and respectful.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: '#0b0f14', gap: 12 },
  h1: { fontSize: 22, fontWeight: '800', color: 'white', marginBottom: 6 },
  h2: { color: 'white', fontWeight: '800', marginBottom: 8, fontSize: 16 },
  p: { color: '#cbd5e1' },
  strong: { color: 'white', fontWeight: '800' },
  meta: { color: '#94a3b8' },
  hint: { color: '#9ca3af', marginTop: 6 },
  card: { backgroundColor: '#0e1526', borderWidth: 1, borderColor: '#111827', borderRadius: 14, padding: 14, gap: 6 },
  btnDanger: { backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center', marginTop: 8 },
  btnStrong: { color: 'white', fontWeight: '900' },
});
