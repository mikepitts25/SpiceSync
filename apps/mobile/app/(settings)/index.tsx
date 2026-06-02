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
  ShieldCheck,
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
import ProfileAvatarIcon from '../../components/ProfileAvatarIcon';
import {
  getActiveProfileCardDestination,
  getProfilePinActionLabel,
} from '../../lib/profile-management';
import { useProfilesStore } from '../../lib/state/profiles';
import { useCoupleLinkStore } from '../../lib/sync/coupleLink';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useTranslation } from '../../lib/i18n';
import {
  authenticateWithBiometrics,
  getBiometricSupport,
} from '../../lib/lock';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const biometricLockEnabled = useSettingsStore(
    (state) => state.biometricLockEnabled
  );
  const setBiometricLockEnabled = useSettingsStore(
    (state) => state.setBiometricLockEnabled
  );
  const remotePartnerActive = useCoupleLinkStore(
    (state) => state.link?.status === 'active'
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
    activeProfile?.displayName ?? activeProfile?.name ?? t.settings.noProfile;

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
        Alert.alert(t.settings.biometricUnavailable, support.reason);
        return;
      }

      const result = await authenticateWithBiometrics(
        t.settings.enableBiometricLock
      );
      if (!result.ok) {
        Alert.alert(t.settings.biometricEnableError, result.message);
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
              : t.profiles.chooseProfile
          }
          onPress={() =>
            router.push(getActiveProfileCardDestination(activeProfile?.id))
          }
          style={styles.profileCard}
        >
          <CardAccentTop />
          <View style={styles.profileInner}>
            <ProfileAvatarIcon avatar={activeProfile?.emoji} size={48} />
            <View style={styles.profileCopy}>
              <Text style={styles.profileName}>{activeProfileName}</Text>
              <Text style={styles.profileAction}>
                {activeProfile
                  ? t.settings.profileOptions
                  : t.settings.chooseInProfiles}
              </Text>
            </View>
            <View style={styles.profileChevron}>
              <ChevronRight size={18} color={COLORS.textMuted} />
            </View>
          </View>
        </Pressable>

        <SettingsSection title={t.settings.account.toUpperCase()}>
          <SectionRow
            icon={User}
            label={t.settings.profiles}
            value={`${profiles.length || 0}`}
            tint={COLORS.crimson}
            badgeBg="rgba(194,24,91,0.15)"
            onPress={() => router.push('/(settings)/profiles')}
          />
          <SectionRow
            icon={LinkIcon}
            label={t.settings.partnerCode}
            value={remotePartnerActive ? 'Connected' : t.settings.qrCode}
            tint={COLORS.purple}
            badgeBg="rgba(139,92,246,0.15)"
            onPress={() =>
              router.push(
                remotePartnerActive
                  ? '/(settings)/partner-sync'
                  : '/(onboarding)/partner-connect'
              )
            }
            last
          />
        </SettingsSection>

        <SettingsSection title={t.settings.preferences.toUpperCase()}>
          <SectionRow
            icon={Globe}
            label={t.settings.language}
            value={language.toUpperCase()}
            tint="#00D9FF"
            badgeBg="rgba(0,217,255,0.1)"
            onPress={() => router.push('/(settings)/language')}
          />
          <SectionRow
            icon={Bell}
            label={t.settings.notifications}
            value={t.settings.daily}
            tint={COLORS.maybe}
            badgeBg="rgba(245,158,11,0.1)"
            onPress={() => router.push('/(settings)/notifications')}
            last
          />
        </SettingsSection>

        <SettingsSection title={t.settings.security.toUpperCase()}>
          <SectionRow
            icon={Fingerprint}
            label={t.settings.biometricLock}
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
            icon={ShieldCheck}
            label="Privacy & Safety"
            value="Data controls"
            tint={COLORS.purple}
            badgeBg="rgba(139,92,246,0.14)"
            onPress={() => router.push('/(settings)/privacy-safety')}
          />
          <SectionRow
            icon={Lock}
            label={getProfilePinActionLabel(!!activeProfile?.pin)}
            value={activeProfile?.pin ? t.settings.set : t.settings.notSet}
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

        <SettingsSection title={t.settings.premium.toUpperCase()}>
          <SectionRow
            icon={Star}
            label={t.settings.upgradeToPremium}
            value={t.settings.unlockAll}
            gradientBadge
            onPress={() => router.push('/(unlock)')}
          />
          <SectionRow
            icon={Gift}
            label={t.settings.redeemGiftCode}
            value={t.settings.redeem}
            tint={COLORS.purple}
            badgeBg="rgba(139,92,246,0.15)"
            onPress={() => router.push('/(redeem)')}
            last
          />
        </SettingsSection>

        <SettingsSection title={t.settings.about.toUpperCase()}>
          <SectionRow
            icon={Trophy}
            label={t.settings.achievements}
            tint={COLORS.maybe}
            badgeBg="rgba(245,158,11,0.15)"
            onPress={() => router.push('/(settings)/achievements')}
          />
          <SectionRow
            icon={BarChart3}
            label={t.settings.insights}
            tint={COLORS.yes}
            badgeBg="rgba(34,197,94,0.15)"
            onPress={() => router.push('/(insights)')}
          />
          <SectionRow
            icon={Info}
            label={t.settings.aboutSpiceSync}
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
