// apps/mobile/app/(tabs)/categories.tsx
// Home Screen - Central hub with links to all app sections

import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useProfilesStore } from '../../lib/state/profiles';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '../../lib/i18n';
import { useKinks } from '../../lib/data';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { MASTER_DECK } from '../../data/gameCards';
import { AppTabBar, SpiceSyncLogo } from '../../components/app-chrome';

const HOME_SECTIONS = [
  {
    id: 'kinks',
    emoji: '🔥',
    color: '#FF6B9D',
    gradient: ['#FF6B9D', '#F472B6'],
    route: '/(tabs)/kinks',
  },
  {
    id: 'game',
    emoji: '🎲',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#A78BFA'],
    route: '/(tabs)/game',
  },
  {
    id: 'matches',
    emoji: '💕',
    color: '#10B981',
    gradient: ['#10B981', '#34D399'],
    route: '/(tabs)/matches',
  },
  {
    id: 'conversation',
    emoji: '💬',
    color: '#3B82F6',
    gradient: ['#3B82F6', '#60A5FA'],
    route: '/(tabs)/conversation',
  },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');
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

  if (!isHydrated || !hasActive) {
    return null;
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          <SpiceSyncLogo width={280} height={106} />
          <Text style={styles.headerSubtitle}>{t.home.subtitle}</Text>
        </Animated.View>

        {/* Main Sections Grid */}
        <View style={styles.gridContainer}>
          {HOME_SECTIONS.map((section, index) => (
            <Animated.View
              key={section.id}
              entering={FadeInUp.delay(200 + index * 100)}
              style={styles.gridItem}
            >
              <Pressable
                style={[styles.sectionCard, { backgroundColor: section.color }]}
                onPress={() => router.push(section.route as never)}
                android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.cardEmoji}>{section.emoji}</Text>
                  <Text style={styles.cardTitle}>
                    {t.home.sections[section.id].title}
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    {t.home.sections[section.id].subtitle}
                  </Text>
                  <Text style={styles.cardDescription}>
                    {t.home.sections[section.id].description}
                  </Text>
                </View>
                <View style={styles.arrowContainer}>
                  <Text style={styles.arrow}>→</Text>
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Stats Section */}
        <Animated.View
          entering={FadeIn.delay(700)}
          style={styles.statsContainer}
        >
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{kinks.length}</Text>
            <Text style={styles.statLabel}>{t.home.totalKinks}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {MASTER_DECK?.length ?? '400+'}
            </Text>
            <Text style={styles.statLabel}>{t.home.gameCards}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>200+</Text>
            <Text style={styles.statLabel}>{t.home.conversations}</Text>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
      <AppTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SIZES.paddingLarge,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerSubtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Grid - Stacked layout (1 per row)
  gridContainer: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 32,
  },
  gridItem: {
    width: '100%',
    ...SHADOWS.md,
  },
  sectionCard: {
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.paddingLarge,
    minHeight: 160,
    position: 'relative',
    overflow: 'hidden',
  },
  cardContent: {
    position: 'relative',
    zIndex: 1,
  },
  cardEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: SIZES.h3,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDescription: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 23,
  },
  arrowContainer: {
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
  arrow: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '300',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.paddingLarge,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: SIZES.h2,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
});
