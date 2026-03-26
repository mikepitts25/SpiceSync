// apps/mobile/app/(tabs)/kinks.tsx
// Kinks tier selector - choose between soft, naughty, xxx

import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useFilters } from '../../lib/state/filters';
import { useKinks } from '../../lib/data';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useProfiles } from '../../lib/state/profiles';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { useTranslation, interpolate } from '../../lib/i18n';

const TIERS = [
  {
    key: 'soft' as const,
    color: '#FF6B9D',
    glow: 'rgba(255, 107, 157, 0.3)',
  },
  {
    key: 'naughty' as const,
    color: '#F472B6',
    glow: 'rgba(244, 114, 182, 0.3)',
  },
  {
    key: 'xxx' as const,
    color: '#EF4444',
    glow: 'rgba(239, 68, 68, 0.3)',
  },
];

export default function KinksScreen() {
  const router = useRouter();
  const { setTier } = useFilters();
  const language = useSettingsStore((state) => state.language);
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');
  const { t } = useTranslation();
  const tk = t.kinks;
  const { profiles, currentUserId } = (useProfiles() as any) || {};
  const me = profiles?.find((p: any) => p.id === currentUserId) || null;

  const counts = kinks.reduce<Record<string, number>>((acc, k) => {
    const tier = k.tier || 'soft';
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {});

  const onPick = (tierKey: 'soft' | 'naughty' | 'xxx') => {
    const count = counts[tierKey] || 0;
    if (count <= 0) {
      Alert.alert(t.discover.noItems, interpolate(t.discover.noItemsDesc, { tier: tierKey }));
      return;
    }
    setTier(tierKey);
    router.push('/(tabs)/deck');
  };

  const getTierLabel = (key: 'soft' | 'naughty' | 'xxx') => {
    switch (key) {
      case 'soft': return { title: tk.soft, subtitle: tk.softSubtitle, description: tk.softDesc };
      case 'naughty': return { title: tk.naughty, subtitle: tk.naughtySubtitle, description: tk.naughtyDesc };
      case 'xxx': return { title: tk.xxx, subtitle: tk.xxxSubtitle, description: tk.xxxDesc };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
          {/* Active profile indicator - top-left, clear of menu button */}
          {me && (
            <View style={styles.profileBadge}>
              <Text style={styles.profileBadgeEmoji}>{me.emoji}</Text>
              <Text style={styles.profileBadgeName}>{me.displayName}</Text>
              <View style={styles.profileActiveDot} />
            </View>
          )}
          <Text style={styles.headerEmoji}>🔥</Text>
          <Text style={styles.headerTitle}>{tk.header}</Text>
          <Text style={styles.headerSubtitle}>{tk.headerSubtitle}</Text>
        </Animated.View>

        {/* Category Cards */}
        <View style={styles.cardsContainer}>
          {TIERS.map((tier, index) => {
            const labels = getTierLabel(tier.key);
            return (
              <Animated.View
                key={tier.key}
                entering={FadeInUp.delay(200 + index * 100)}
                style={[styles.cardWrapper, { shadowColor: tier.color }]}
              >
                <Pressable
                  style={[styles.card, { backgroundColor: tier.color }]}
                  onPress={() => onPick(tier.key)}
                  android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
                >
                  {/* Glow effect */}
                  <View style={[styles.glow, { backgroundColor: tier.glow }]} />

                  {/* Content */}
                  <View style={styles.cardContent}>
                    <View style={styles.cardTop}>
                      <View style={styles.countBadge}>
                        <Text style={styles.countText}>{counts[tier.key] || 0}</Text>
                      </View>
                    </View>

                    <Text style={styles.cardTitle}>{labels.title}</Text>
                    <Text style={styles.cardSubtitle}>{labels.subtitle}</Text>
                    <Text style={styles.cardDescription}>{labels.description}</Text>

                    <View style={styles.arrowContainer}>
                      <Text style={styles.arrow}>→</Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* All Categories Button */}
        <Animated.View entering={FadeInUp.delay(600)} style={styles.allButtonContainer}>
          <Pressable
            style={styles.allButton}
            onPress={() => {
              setTier(null);
              router.push('/(tabs)/deck');
            }}
          >
            <Text style={styles.allButtonText}>{tk.browseAll}</Text>
          </Pressable>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  profileBadgeEmoji: {
    fontSize: 16,
  },
  profileBadgeName: {
    fontSize: SIZES.small,
    fontWeight: '600',
    color: COLORS.text,
  },
  profileActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.yes ?? '#22c55e',
  },
  headerEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: SIZES.h1,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  
  // Cards
  cardsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  cardWrapper: {
    borderRadius: SIZES.radiusXL,
    ...SHADOWS.lg,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  card: {
    borderRadius: SIZES.radiusXL,
    overflow: 'hidden',
    padding: SIZES.paddingLarge,
    minHeight: 180,
  },
  glow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.5,
  },
  cardContent: {
    position: 'relative',
    zIndex: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  countBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  cardTitle: {
    fontSize: SIZES.h2,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: SIZES.h4,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
  },
  arrowContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  arrow: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
  
  // All Button
  allButtonContainer: {
    marginTop: 8,
  },
  allButton: {
    backgroundColor: COLORS.card,
    padding: SIZES.paddingLarge,
    borderRadius: SIZES.radiusLarge,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  allButtonText: {
    fontSize: SIZES.body,
    fontWeight: '700',
    color: COLORS.text,
  },
});