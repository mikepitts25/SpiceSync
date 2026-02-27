// apps/mobile/app/settings/index.tsx
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSettings } from '../../lib/state/useStore';
import { useProfiles } from '../../lib/state/profiles';
import { useVotesStore } from '../../src/stores/votes';
import { useKinks } from '../../lib/data';
import ResetAgeGateButton from '../../src/components/ResetAgeGateButton';

export default function SettingsScreen() {
  const router = useRouter();
  const { language, setLanguage } = useSettings();
  const { profiles, currentUserId } = (useProfiles() as any) || {};
  const clearUser = useVotesStore((s) => s.clearProfile);
  const setVote = useVotesStore((s) => s.setVote);
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');

  const me = profiles?.find((p: any) => p.id === currentUserId) || null;

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
            Alert.alert(
              'Selections cleared',
              `${me.displayName}'s votes have been removed.`
            );
          },
        },
      ]
    );
  };

  const LangButton = ({
    code,
    label,
  }: {
    code: 'en' | 'es';
    label: string;
  }) => (
    <Pressable
      onPress={() => setLanguage(code)}
      style={[styles.langBtn, language === code && styles.langBtnActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: language === code }}
    >
      <Text
        style={[styles.langText, language === code && styles.langTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Text style={styles.h1}>Settings</Text>

      {/* Profiles card */}
      <View style={styles.card}>
        <Text style={styles.h2}>Profiles</Text>
        <Text style={styles.p}>Manage who’s swiping, emoji, and names.</Text>
        <Pressable
          onPress={() => router.push('/settings/profiles')}
          style={styles.primary}
          accessibilityRole="button"
        >
          <Text style={styles.btnStrong}>Manage profiles</Text>
        </Pressable>
      </View>

      {/* Language card */}
      <View style={styles.card}>
        <Text style={styles.h2}>Language</Text>
        <Text style={styles.p}>
          Choose your app language. Content and UI will switch instantly.
        </Text>
        <View style={styles.langRow}>
          <LangButton code="en" label="English" />
          <LangButton code="es" label="Español" />
        </View>
      </View>

      {/* Active profile + reset */}
      <View style={styles.card}>
        <Text style={styles.h2}>Active profile</Text>
        {me ? (
          <View style={{ gap: 6 }}>
            <Text style={styles.p}>
              <Text style={{ fontSize: 18 }}>{me.emoji}</Text>{' '}
              <Text style={styles.strong}>{me.displayName}</Text>
            </Text>
            <Text style={styles.meta}>
              ID: {me.id.slice(0, 8)} • Created{' '}
              {new Date(me.createdAt).toLocaleDateString()}
            </Text>
            <Pressable
              onPress={onReset}
              style={styles.btnDanger}
              accessibilityRole="button"
            >
              <Text style={styles.btnStrong}>
                Reset selections for this profile
              </Text>
            </Pressable>
            <Text style={styles.hint}>
              This removes all YES/NO/MAYBE votes made by {me.displayName}. The
              other profile’s votes are unaffected.
            </Text>
          </View>
        ) : (
          <Text style={styles.p}>
            No active profile selected. Open “Manage profiles” above to create
            or select one.
          </Text>
        )}
      </View>

      {/* About & Safety */}
      <View style={styles.card}>
        <Text style={styles.h2}>About & Safety</Text>
        <Text style={styles.p}>
          This app is for adults (18+) exploring consensual intimacy. Keep it
          legal, consensual, and respectful.
        </Text>
      </View>

      {__DEV__ ? (
        <Pressable
          onPress={() => {
            if (!me) {
              Alert.alert(
                'No active profile',
                'Select an active profile first.'
              );
              return;
            }
            const others = (profiles || []).filter((p: any) => p.id !== me.id);
            if (!others.length) {
              Alert.alert(
                'Need another profile',
                'Create a second profile to seed matches.'
              );
              return;
            }

            const partner = others[0];
            const pool = [...kinks];
            if (!pool.length) {
              Alert.alert(
                'No content',
                'Unable to seed matches without kink data.'
              );
              return;
            }

            function shuffle<T>(arr: T[]): T[] {
              const copy = [...arr];
              for (let i = copy.length - 1; i > 0; i -= 1) {
                const j = Math.floor(Math.random() * (i + 1));
                [copy[i], copy[j]] = [copy[j], copy[i]];
              }
              return copy;
            }

            const sampleIds = shuffle(pool)
              .slice(0, Math.min(30, pool.length))
              .map((item) => String(item.id));
            const mutualYes = sampleIds.slice(0, 4);
            const partial = sampleIds.slice(4, 10);
            const mutualMaybe = sampleIds.slice(10, 16);

            clearUser(me.id);
            clearUser(partner.id);

            mutualYes.forEach((id) => {
              setVote(me.id, id, 'yes');
              setVote(partner.id, id, 'yes');
            });

            partial.forEach((id, index) => {
              if (index % 2 === 0) {
                setVote(me.id, id, 'yes');
                setVote(partner.id, id, 'maybe');
              } else {
                setVote(me.id, id, 'maybe');
                setVote(partner.id, id, 'yes');
              }
            });

            mutualMaybe.forEach((id) => {
              setVote(me.id, id, 'maybe');
              setVote(partner.id, id, 'maybe');
            });

            Alert.alert(
              'Seeded votes',
              'Generated demo matches for quick testing.'
            );
          }}
          style={styles.devButton}
          accessibilityRole="button"
        >
          <Text style={styles.devButtonLabel}>Dev: Seed Votes</Text>
        </Pressable>
      ) : null}

      <ResetAgeGateButton />
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

  card: {
    backgroundColor: '#0e1526',
    borderWidth: 1,
    borderColor: '#111827',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },

  // Language
  langRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  langBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#111827',
  },
  langBtnActive: { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  langText: { color: 'white', fontWeight: '700' },
  langTextActive: { color: 'white' },

  // Buttons
  primary: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  btnDanger: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnStrong: { color: 'white', fontWeight: '900' },
  devButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
    alignItems: 'center',
  },
  devButtonLabel: { color: '#34d399', fontWeight: '800' },
});
