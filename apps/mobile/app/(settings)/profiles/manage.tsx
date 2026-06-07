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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Check,
  KeyRound,
  Pencil,
  ShieldCheck,
  Trash2,
  UserCheck,
} from 'lucide-react-native';

import PinVerifyModal from '../../../components/PinVerifyModal';
import ProfileAvatarIcon from '../../../components/ProfileAvatarIcon';
import {
  BackHeader,
  CardAccentTop,
  SectionRow,
} from '../../../components/app-chrome';
import {
  setActiveProfile,
  useProfilesStore,
  type Profile,
} from '../../../lib/state/profiles';
import { getProfilePinActionLabel } from '../../../lib/profile-management';
import { COLORS, SHADOWS } from '../../../constants/theme';

export default function ManageProfileScreen() {
  const router = useRouter();
  const { profileId } = useLocalSearchParams<{ profileId?: string }>();
  const profiles = useProfilesStore((state) => state.profiles);
  const activeProfileId = useProfilesStore((state) => state.activeProfileId);
  const deleteProfile = useProfilesStore((state) => state.deleteProfile);
  const verifyPin = useProfilesStore((state) => state.verifyPin);
  const [pinPromptOpen, setPinPromptOpen] = useState(false);

  const profile = useMemo(
    () => profiles.find((item) => item.id === profileId) ?? null,
    [profileId, profiles]
  );
  const isActive = !!profile && profile.id === activeProfileId;

  const activateProfile = () => {
    if (!profile || isActive) return;
    if (profile.pin) {
      setPinPromptOpen(true);
      return;
    }
    setActiveProfile(profile.id);
  };

  const confirmDelete = () => {
    if (!profile) return;

    Alert.alert(
      'Delete profile?',
      `This permanently removes ${profile.displayName ?? profile.name} and their data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProfile(profile.id);
            router.replace('/(settings)/profiles');
          },
        },
      ]
    );
  };

  if (!profile) {
    return (
      <SafeAreaView
        style={styles.screen}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <StatusBar style="light" />
        <BackHeader title="Profile" />
        <View style={styles.missingState}>
          <Text style={styles.missingTitle}>Profile not found</Text>
          <Text style={styles.missingCopy}>
            This profile may have already been deleted.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(settings)/profiles')}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Back to Profiles</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = profile.displayName ?? profile.name;

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <BackHeader title="Profile Options" subtitle={displayName} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <CardAccentTop />
          <View style={styles.profileInner}>
            <ProfileAvatarIcon
              avatar={profile.emoji}
              size={56}
              selected={isActive}
            />
            <View style={styles.profileCopy}>
              <Text style={styles.profileName}>{displayName}</Text>
              <View style={styles.statusRow}>
                {isActive ? (
                  <View style={styles.activePill}>
                    <Check size={11} color={COLORS.pink} />
                    <Text style={styles.activePillText}>Active</Text>
                  </View>
                ) : (
                  <Text style={styles.profileMeta}>Available profile</Text>
                )}
                {profile.pin ? (
                  <View style={styles.pinPill}>
                    <ShieldCheck size={11} color={COLORS.purpleLight} />
                    <Text style={styles.pinPillText}>PIN protected</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionGroup}>
          <Text style={styles.sectionTitle}>PROFILE</Text>
          <View style={styles.sectionCard}>
            <SectionRow
              icon={UserCheck}
              label="Active Profile"
              value={isActive ? 'Selected' : 'Select'}
              tint={COLORS.yes}
              badgeBg="rgba(34,197,94,0.12)"
              onPress={isActive ? undefined : activateProfile}
            />
            <SectionRow
              icon={Pencil}
              label="Edit Profile"
              value="Name / avatar"
              tint={COLORS.pink}
              badgeBg="rgba(255,45,146,0.12)"
              onPress={() =>
                router.push({
                  pathname: '/(settings)/profiles/edit',
                  params: { profileId: profile.id },
                })
              }
            />
            <SectionRow
              icon={KeyRound}
              label={getProfilePinActionLabel(!!profile.pin)}
              value={profile.pin ? 'Set' : 'Not set'}
              tint={COLORS.purpleLight}
              badgeBg="rgba(167,139,250,0.12)"
              onPress={() =>
                router.push({
                  pathname: '/(settings)/profiles/pin',
                  params: { profileId: profile.id },
                })
              }
            />
            <SectionRow
              icon={Trash2}
              label="Delete Profile"
              value="Remove"
              tint={COLORS.no}
              badgeBg="rgba(239,68,68,0.12)"
              onPress={confirmDelete}
              last
            />
          </View>
        </View>
      </ScrollView>

      <PinVerifyModal
        open={pinPromptOpen}
        profiles={[profile as Profile]}
        onClose={() => setPinPromptOpen(false)}
        onSuccess={() => {
          setActiveProfile(profile.id);
          setPinPromptOpen(false);
        }}
        onVerifyProfile={(item, pin) =>
          verifyPin(item.id, pin)
            ? { success: true }
            : { success: false, error: 'Incorrect PIN' }
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 18,
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
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileCopy: {
    flex: 1,
    gap: 8,
  },
  profileName: {
    color: COLORS.textPrimary,
    fontSize: 21,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  profileMeta: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '700',
  },
  activePill: {
    borderRadius: 12,
    backgroundColor: 'rgba(194,24,91,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(194,24,91,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activePillText: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '800',
  },
  pinPill: {
    borderRadius: 12,
    backgroundColor: 'rgba(167,139,250,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pinPillText: {
    color: COLORS.purpleLight,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionGroup: {
    gap: 8,
  },
  sectionTitle: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
    paddingHorizontal: 4,
  },
  sectionCard: {
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    overflow: 'hidden',
  },
  missingState: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  missingTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  missingCopy: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '800',
  },
});
