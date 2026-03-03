// apps/mobile/app/(tabs)/categories.tsx
import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFilters } from '../../lib/state/filters';
import { useKinks } from '../../lib/data';
import SettingsButton from '../../src/components/SettingsButton';
import { useProfilesStore } from '../../lib/state/profiles';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation, interpolate } from '../../lib/i18n';
import { useSettingsStore } from '../../src/stores/settingsStore';

export default function CategoriesScreen() {
  const router = useRouter();
  const { setTier } = useFilters();
  const language = useSettingsStore((state) => state.language);
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');
  const { t } = useTranslation();
  const { isHydrated, hasActive } = useProfilesStore(
    useShallow((state) => ({
      isHydrated: state.isHydrated(),
      hasActive: state.hasActiveProfile(),
    }))
  );

  useEffect(() => {
    if (isHydrated && !hasActive) {
      router.replace('/welcome');
    }
  }, [isHydrated, hasActive, router]);

  const counts = kinks.reduce<Record<string, number>>((acc, k) => {
    const t = k.tier || 'soft';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const TIERS: {
    key: 'romance' | 'soft' | 'naughty' | 'xxx';
    label: string;
    desc: string;
  }[] = [
    { key: 'romance', label: t.discover.romance, desc: t.discover.romanceDesc },
    { key: 'soft', label: t.discover.soft, desc: t.discover.softDesc },
    { key: 'naughty', label: t.discover.naughty, desc: t.discover.naughtyDesc },
    { key: 'xxx', label: t.discover.xxx, desc: t.discover.xxxDesc },
  ];

  const onPick = (tier: 'romance' | 'soft' | 'naughty' | 'xxx') => {
    const count = counts[tier] || 0;
    if (count <= 0) {
      Alert.alert(
        t.discover.noItems,
        interpolate(t.discover.noItemsDesc, { tier })
      );
      return;
    }
    setTier(tier);
    router.push('/(tabs)/deck');
  };

  if (!isHydrated || !hasActive) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Text style={styles.h1}>{t.discover.title}</Text>
      <View style={styles.grid}>
        {TIERS.map((tier) => (
          <Pressable
            key={tier.key}
            style={styles.card}
            onPress={() => onPick(tier.key)}
            accessibilityRole="button"
          >
            <Text style={styles.title}>{tier.label}</Text>
            <Text style={styles.desc}>{tier.desc}</Text>
            <Text style={styles.count}>{counts[tier.key] || 0} {t.common.items}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ height: 12 }} />
      <Pressable
        style={styles.primary}
        onPress={() => {
          setTier(null);
          router.push('/(tabs)/deck');
        }}
      >
        <Text style={styles.primaryText}>{t.discover.skipCategory}</Text>
      </Pressable>
      <SettingsButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: '#0b0f14' },
  h1: { fontSize: 22, fontWeight: '800', color: 'white', marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    flexBasis: '47%',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#1f2937',
  },
  title: { color: 'white', fontSize: 16, fontWeight: '700' },
  desc: { color: '#cbd5e1', marginTop: 4 },
  count: { color: '#93c5fd', marginTop: 8, fontWeight: '700' },
  primary: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  primaryText: { color: 'white', fontWeight: '800' },
});
