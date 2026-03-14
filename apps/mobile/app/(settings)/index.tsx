// apps/mobile/app/settings/index.tsx
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  Users,
  Globe,
  Trophy,
  Bell,
  Trash2,
  Info,
  ChevronRight,
} from 'lucide-react-native';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useProfiles } from '../../lib/state/profiles';
import { useVotesStore } from '../../src/stores/votes';
import { useKinks } from '../../lib/data';
import { useTranslation, interpolate } from '../../lib/i18n';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import ResetAgeGateButton from '../../src/components/ResetAgeGateButton';

const MENU_ITEMS = [
  { id: 'profiles', icon: Users, color: '#8B5CF6', route: '/(settings)/profiles' },
  { id: 'achievements', icon: Trophy, color: '#F59E0B', route: '/(settings)/achievements' },
  { id: 'notifications', icon: Bell, color: '#10B981', route: '/(settings)/notifications' },
];

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

  const LangButton = ({ code, label }: { code: 'en' | 'es'; label: string }) => (
    <Pressable
      onPress={() => setLanguage(code)}
      style={[styles.langBtn, language === code && styles.langBtnActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: language === code }}
    >
      <Text style={[styles.langText, language === code && styles.langTextActive]}>
        {label}
      </Text>
    </Pressable>
  );

  const MenuItem = ({ item, index }: { item: typeof MENU_ITEMS[0]; index: number }) => {
    const Icon = item.icon;
    const titles: Record<string, string> = {
      profiles: t.settings.profiles,
      achievements: '🏆 Achievements',
      notifications: '🔔 Notifications',
    };
    const descriptions: Record<string, string> = {
      profiles: t.settings.profilesDesc,
      achievements: 'Track your progress and unlock badges',
      notifications: 'Get daily activity suggestions',
    };

    return (
      <Animated.View entering={FadeInUp.delay(100 + index * 100)}>
        <Pressable
          style={styles.menuItem}
          onPress={() => router.push(item.route as any)}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}20` }]}>
            <Icon size={24} color={item.color} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>{titles[item.id]}</Text>
            <Text style={styles.menuDescription}>{descriptions[item.id]}</Text>
          </View>
          <ChevronRight size={20} color={COLORS.textMuted} />
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(50)} style={styles.header}>
          <Text style={styles.headerTitle}>{t.settings.title}</Text>
          <Text style={styles.headerSubtitle}>Customize your experience</Text>
        </Animated.View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item, index) => (
            <MenuItem key={item.id} item={item} index={index} />
          ))}
        </View>

        {/* Language Card */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: `${COLORS.accent}20` }]}>
              <Globe size={20} color={COLORS.accent} />
            </View>
            <View>
              <Text style={styles.cardTitle}>{t.settings.language}</Text>
              <Text style={styles.cardSubtitle}>{t.settings.languageDesc}</Text>
            </View>
          </View>
          <View style={styles.langRow}>
            <LangButton code="en" label={t.settings.english} />
            <LangButton code="es" label={t.settings.spanish} />
          </View>
        </Animated.View>

        {/* Active Profile Card */}
        <Animated.View entering={FadeInUp.delay(500)} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: `${COLORS.primary}20` }]}>
              <Users size={20} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.cardTitle}>{t.settings.activeProfile}</Text>
            </View>
          </View>
          
          {me ? (
            <View style={styles.profileContent}>
              <View style={styles.profileRow}>
                <Text style={styles.profileEmoji}>{me.emoji}</Text>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{me.displayName}</Text>
                  <Text style={styles.profileMeta}>
                    ID: {me.id.slice(0, 8)} • {new Date(me.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <Pressable onPress={onReset} style={styles.dangerButton}>
                <Trash2 size={18} color="#fff" />
                <Text style={styles.dangerButtonText}>{t.settings.resetVotes}</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.emptyText}>{t.settings.noProfile}</Text>
          )}
        </Animated.View>

        {/* About Card */}
        <Animated.View entering={FadeInUp.delay(600)} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: `${COLORS.textSecondary}20` }]}>
              <Info size={20} color={COLORS.textSecondary} />
            </View>
            <View>
              <Text style={styles.cardTitle}>{t.settings.about}</Text>
              <Text style={styles.cardSubtitle}>{t.settings.privacyDesc}</Text>
            </View>
          </View>
          <Text style={styles.versionText}>{t.settings.version}</Text>
        </Animated.View>

        {/* Dev Tools */}
        {__DEV__ && me && (
          <Animated.View entering={FadeInUp.delay(700)}>
            <Pressable
              style={styles.devButton}
              onPress={() => {
                const others = (profiles || []).filter((p: any) => p.id !== me.id);
                if (!others.length) {
                  Alert.alert(t.profiles.needPartner, t.profiles.createPartner);
                  return;
                }

                const partner = others[0];
                const pool = [...kinks];
                if (!pool.length) {
                  Alert.alert(t.common.error, 'Unable to seed matches without kink data.');
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

                Alert.alert(t.common.success, 'Generated demo matches for quick testing.');
              }}
            >
              <Text style={styles.devButtonText}>🛠️ Dev: Seed Votes</Text>
            </Pressable>
          </Animated.View>
        )}

        <ResetAgeGateButton />
        
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
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h1,
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  
  // Menu Items
  menuContainer: {
    gap: 12,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: 2,
  },
  menuDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  
  // Cards
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.paddingLarge,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  
  // Language
  langRow: {
    flexDirection: 'row',
    gap: 12,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  langBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  langText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  langTextActive: {
    color: '#fff',
  },
  
  // Profile
  profileContent: {
    gap: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileEmoji: {
    fontSize: 32,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: 2,
  },
  profileMeta: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textMuted,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  
  // Danger Button
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.danger,
    paddingVertical: 14,
    borderRadius: SIZES.radius,
  },
  dangerButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
  
  // Version
  versionText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  
  // Dev
  devButton: {
    backgroundColor: COLORS.cardElevated,
    paddingVertical: 14,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 16,
  },
  devButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#34d399',
  },
});
