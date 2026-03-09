// apps/mobile/app/settings/index.tsx
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useProfiles } from '../../lib/state/profiles';
import { useVotesStore } from '../../src/stores/votes';
import { useKinks } from '../../lib/data';
import { useTranslation, interpolate } from '../../lib/i18n';
import ResetAgeGateButton from '../../src/components/ResetAgeGateButton';

export default function SettingsScreen() {
  const router = useRouter();
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const { profiles, currentUserId } = (useProfiles() as any) || {};
  const clearUser = useVotesStore((s) => s.clearProfile);
  const setVote = useVotesStore((s) => s.setVote);
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');
  const { t } = useTranslation();

  const me = profiles?.find((p: any) => p.id === currentUserId) || null;

  const onReset = () => {
    if (!me) return;
    Alert.alert(
      t.settings.resetVotes,
      interpolate(t.settings.resetVotesDesc, { name: me.displayName }),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: () => {
            clearUser(me.id);
            Alert.alert(
              t.settings.resetConfirm,
              interpolate(t.settings.resetConfirmDesc, { name: me.displayName })
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
      <Text style={styles.h1}>{t.settings.title}</Text>

      {/* Profiles card */}
      <View style={styles.card}>
        <Text style={styles.h2}>{t.settings.profiles}</Text>
        <Text style={styles.p}>{t.settings.profilesDesc}</Text>
        <Pressable
          onPress={() => router.push('/(settings)/profiles')}
          style={styles.primary}
          accessibilityRole="button"
        >
          <Text style={styles.btnStrong}>{t.settings.manageProfiles}</Text>
        </Pressable>
      </View>

      {/* Language card */}
      <View style={styles.card}>
        <Text style={styles.h2}>{t.settings.language}</Text>
        <Text style={styles.p}>{t.settings.languageDesc}</Text>
        <View style={styles.langRow}>
          <LangButton code="en" label={t.settings.english} />
          <LangButton code="es" label={t.settings.spanish} />
        </View>
      </View>

      {/* Achievements & Streaks */}
      <View style={styles.card}>
        <Text style={styles.h2}>🏆 Achievements</Text>
        <Text style={styles.p}>Track your progress and unlock badges</Text>
        <Pressable
          onPress={() => router.push('/(settings)/achievements')}
          style={styles.primary}
          accessibilityRole="button"
        >
          <Text style={styles.btnStrong}>View Achievements</Text>
        </Pressable>
      </View>

      {/* Notifications */}
      <View style={styles.card}>
        <Text style={styles.h2}>🔔 Notifications</Text>
        <Text style={styles.p}>Get daily activity suggestions</Text>
        <Pressable
          onPress={() => router.push('/(settings)/notifications')}
          style={styles.primary}
          accessibilityRole="button"
        >
          <Text style={styles.btnStrong}>Configure Notifications</Text>
        </Pressable>
      </View>

      {/* Active profile + reset */}
      <View style={styles.card}>
        <Text style={styles.h2}>{t.settings.activeProfile}</Text>
        {me ? (
          <View style={{ gap: 6 }}>
            <Text style={styles.p}>
              <Text style={{ fontSize: 18 }}>{me.emoji}</Text>{' '}
              <Text style={styles.strong}>{me.displayName}</Text>
            </Text>
            <Text style={styles.meta}>
              ID: {me.id.slice(0, 8)} • {t.profiles.created}: {' '}
              {new Date(me.createdAt).toLocaleDateString()}
            </Text>
            <Pressable
              onPress={onReset}
              style={styles.btnDanger}
              accessibilityRole="button"
            >
              <Text style={styles.btnStrong}>
                {t.settings.resetVotes}
              </Text>
            </Pressable>
            <Text style={styles.hint}>
              {interpolate(t.settings.resetVotesDesc, { name: me.displayName })}
            </Text>
          </View>
        ) : (
          <Text style={styles.p}>
            {t.settings.noProfile}
          </Text>
        )}
      </View>

      {/* About & Safety */}
      <View style={styles.card}>
        <Text style={styles.h2}>{t.settings.about}</Text>
        <Text style={styles.p}>
          {t.settings.privacyDesc}
        </Text>
        <Text style={styles.meta}>{t.settings.version}</Text>
      </View>

      {__DEV__ ? (
        <Pressable
          onPress={() => {
            if (!me) {
              Alert.alert(
                t.profiles.noProfile,
                t.profiles.selectProfile
              );
              return;
            }
            const others = (profiles || []).filter((p: any) => p.id !== me.id);
            if (!others.length) {
              Alert.alert(
                t.profiles.needPartner,
                t.profiles.createPartner
              );
              return;
            }

            const partner = others[0];
            const pool = [...kinks];
            if (!pool.length) {
              Alert.alert(
                t.common.error,
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
              t.common.success,
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
