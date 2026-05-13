import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
  BarChart3,
  Bell,
  ChevronRight,
  Fingerprint,
  Gift,
  Globe,
  Info,
  Link as LinkIcon,
  Lock,
  Star,
  Trophy,
  User,
} from 'lucide-react-native';
import { useShallow } from 'zustand/react/shallow';

import {
  AppHeader,
  AppTabBar,
  CardAccentTop,
  SectionRow,
  Toggle,
} from '../../components/app-chrome';
import {
  getActiveProfileCardDestination,
  getProfilePinActionLabel,
} from '../../lib/profile-management';
import { useProfilesStore } from '../../lib/state/profiles';
import { useSettingsStore } from '../../src/stores/settingsStore';
import {
  authenticateWithBiometrics,
  getBiometricSupport,
} from '../../lib/lock';
import { COLORS, GRADIENTS, SHADOWS } from '../../constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const language = useSettingsStore((state) => state.language);
  const biometricLockEnabled = useSettingsStore(
    (state) => state.biometricLockEnabled
  );
  const setBiometricLockEnabled = useSettingsStore(
    (state) => state.setBiometricLockEnabled
  );
  const { profiles, activeProfileId } = useProfilesStore(
    useShallow((state) => ({
      profiles: state.getProfiles(),
      activeProfileId: state.getActiveProfileId(),
    }))
  );
  const [biometricPending, setBiometricPending] = useState(false);

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) ?? null,
    [activeProfileId, profiles]
  );
  const activeProfileName =
    activeProfile?.displayName ?? activeProfile?.name ?? 'No active profile';

  const handleBiometricToggle = async (enabled: boolean) => {
    if (biometricPending) return;

    if (!enabled) {
      setBiometricLockEnabled(false);
      return;
    }

    setBiometricPending(true);
    try {
      const support = await getBiometricSupport();
      if (!support.available) {
        Alert.alert('Biometric lock unavailable', support.reason);
        return;
      }

      const result = await authenticateWithBiometrics('Enable Biometric Lock');
      if (!result.ok) {
        Alert.alert('Could not enable biometric lock', result.message);
        return;
      }

      setBiometricLockEnabled(true);
    } finally {
      setBiometricPending(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <AppHeader onRightPress={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            activeProfile
              ? `Manage ${activeProfileName}`
              : 'Choose an active profile'
          }
          onPress={() =>
            router.push(getActiveProfileCardDestination(activeProfile?.id))
          }
          style={styles.profileCard}
        >
          <CardAccentTop />
          <View style={styles.profileInner}>
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.profileAvatar}
            >
              <Text style={styles.profileEmoji}>
                {activeProfile?.emoji ?? '🌶️'}
              </Text>
            </LinearGradient>
            <View style={styles.profileCopy}>
              <Text style={styles.profileName}>{activeProfileName}</Text>
              <Text style={styles.profileAction}>
                {activeProfile ? 'Profile Options' : 'Choose in Profiles'}
              </Text>
            </View>
            <View style={styles.profileChevron}>
              <ChevronRight size={18} color={COLORS.textMuted} />
            </View>
          </View>
        </Pressable>

        <SettingsSection title="ACCOUNT">
          <SectionRow
            icon={User}
            label="Profiles"
            value={`${profiles.length || 0}`}
            tint={COLORS.crimson}
            badgeBg="rgba(194,24,91,0.15)"
            onPress={() => router.push('/(settings)/profiles')}
          />
          <SectionRow
            icon={LinkIcon}
            label="Partner Code"
            value="QR / Code"
            tint={COLORS.purple}
            badgeBg="rgba(139,92,246,0.15)"
            onPress={() => router.push('/(onboarding)/invite')}
            last
          />
        </SettingsSection>

        <SettingsSection title="PREFERENCES">
          <SectionRow
            icon={Globe}
            label="Language"
            value={language.toUpperCase()}
            tint="#00D9FF"
            badgeBg="rgba(0,217,255,0.1)"
            onPress={() => router.push('/(settings)/language')}
          />
          <SectionRow
            icon={Bell}
            label="Notifications"
            value="Daily"
            tint={COLORS.maybe}
            badgeBg="rgba(245,158,11,0.1)"
            onPress={() => router.push('/(settings)/notifications')}
            last
          />
        </SettingsSection>

        <SettingsSection title="SECURITY">
          <SectionRow
            icon={Fingerprint}
            label="Biometric Lock"
            tint={COLORS.yes}
            badgeBg="rgba(34,197,94,0.1)"
            toggle={
              <Toggle
                value={biometricLockEnabled}
                onValueChange={handleBiometricToggle}
              />
            }
          />
          <SectionRow
            icon={Lock}
            label={getProfilePinActionLabel(!!activeProfile?.pin)}
            value={activeProfile?.pin ? 'Set' : 'Not set'}
            tint={COLORS.crimson}
            badgeBg="rgba(194,24,91,0.1)"
            onPress={() =>
              activeProfile
                ? router.push({
                    pathname: '/(settings)/profiles/pin',
                    params: { profileId: activeProfile.id },
                  })
                : router.push('/(settings)/profiles')
            }
            last
          />
        </SettingsSection>

        <SettingsSection title="PREMIUM">
          <SectionRow
            icon={Star}
            label="Upgrade to Premium"
            value="Unlock all"
            gradientBadge
            onPress={() => router.push('/(unlock)')}
          />
          <SectionRow
            icon={Gift}
            label="Redeem Gift Code"
            value="Redeem"
            tint={COLORS.purple}
            badgeBg="rgba(139,92,246,0.15)"
            onPress={() => router.push('/(redeem)')}
            last
          />
        </SettingsSection>

        <SettingsSection title="ABOUT">
          <SectionRow
            icon={Trophy}
            label="Achievements"
            tint={COLORS.maybe}
            badgeBg="rgba(245,158,11,0.15)"
            onPress={() => router.push('/(settings)/achievements')}
          />
          <SectionRow
            icon={BarChart3}
            label="Insights"
            tint={COLORS.yes}
            badgeBg="rgba(34,197,94,0.15)"
            onPress={() => router.push('/(insights)')}
          />
          <SectionRow
            icon={Info}
            label="About SpiceSync"
            tint={COLORS.textSub}
            badgeBg="rgba(255,255,255,0.06)"
            onPress={() => router.push('/(settings)/about')}
          />
          <SectionRow label="App Version" value="v1.0.0" last />
        </SettingsSection>
      </ScrollView>

      <AppTabBar />
    </SafeAreaView>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionGroup}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 16,
  },
  profileCard: {
    borderRadius: 24,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  profileInner: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileEmoji: {
    fontSize: 22,
  },
  profileCopy: {
    flex: 1,
  },
  profileName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  profileAction: {
    color: 'rgba(255,255,255,0.37)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  profileChevron: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionGroup: {
    gap: 8,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    paddingHorizontal: 2,
  },
  sectionCard: {
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(194,24,91,0.19)',
    overflow: 'hidden',
  },
});
