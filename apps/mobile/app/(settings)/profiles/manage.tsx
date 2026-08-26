import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from '../../../components/SafeAreaView';
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
import { deleteProfileAndData } from '../../../lib/safety/localDataControls';
import { COLORS, SHADOWS } from '../../../constants/theme';

import { ui } from '../../../lib/i18n/uiLiteral';

export default function ManageProfileScreen() {
  const router = useRouter();
  const { profileId } = useLocalSearchParams<{ profileId?: string }>();
  const profiles = useProfilesStore((state) => state.profiles);
  const activeProfileId = useProfilesStore((state) => state.activeProfileId);
  const verifyPin = useProfilesStore((state) => state.verifyPin);
  const [pinPromptOpen, setPinPromptOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    'activate' | 'edit' | 'pin' | 'delete' | null
  >(null);

  const profile = useMemo(
    () => profiles.find((item) => item.id === profileId) ?? null,
    [profileId, profiles]
  );
  const isActive = !!profile && profile.id === activeProfileId;

  const performAction = (action: 'activate' | 'edit' | 'pin' | 'delete') => {
    if (!profile) return;

    if (action === 'activate') {
      if (!isActive) setActiveProfile(profile.id);
      return;
    }
    if (action === 'edit') {
      router.push({
        pathname: '/(settings)/profiles/edit',
        params: { profileId: profile.id },
      });
      return;
    }
    if (action === 'pin') {
      router.push({
        pathname: '/(settings)/profiles/pin',
        params: { profileId: profile.id },
      });
      return;
    }

    Alert.alert(
      ui('Delete profile?'),
      `${ui('This permanently removes')} ${profile.displayName ?? profile.name} ${ui('and their data. An encrypted backup made before now can restore them.')}`,
      [
        { text: ui('Cancel'), style: 'cancel' },
        {
          text: ui('Delete'),
          style: 'destructive',
          onPress: () => {
            deleteProfileAndData(profile.id);
            router.replace('/(settings)/profiles');
          },
        },
      ]
    );
  };

  const requestAction = (action: 'activate' | 'edit' | 'pin' | 'delete') => {
    if (!profile) return;
    if (profile.pin) {
      setPendingAction(action);
      setPinPromptOpen(true);
      return;
    }
    performAction(action);
  };

  if (!profile) {
    return (
      <SafeAreaView
        style={styles.screen}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <StatusBar style="light" />
        <BackHeader title={ui('Profile')} />
        <View style={styles.missingState}>
          <Text style={styles.missingTitle}>{ui('Profile not found')}</Text>
          <Text style={styles.missingCopy}>
            {ui(' This profile may have already been deleted. ')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(settings)/profiles')}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>
              {ui('Back to Profiles')}
            </Text>
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
      <BackHeader title={ui('Profile Options')} subtitle={displayName} />
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
                    <Text style={styles.activePillText}>{ui('Active')}</Text>
                  </View>
                ) : (
                  <Text style={styles.profileMeta}>
                    {ui('Available profile')}
                  </Text>
                )}
                {profile.pin ? (
                  <View style={styles.pinPill}>
                    <ShieldCheck size={11} color={COLORS.purpleLight} />
                    <Text style={styles.pinPillText}>
                      {ui('PIN protected')}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionGroup}>
          <Text style={styles.sectionTitle}>{ui('PROFILE')}</Text>
          <View style={styles.sectionCard}>
            <SectionRow
              icon={UserCheck}
              label={ui('Active Profile')}
              value={isActive ? ui('Selected') : ui('Select')}
              tint={COLORS.yes}
              badgeBg="rgba(34,197,94,0.12)"
              onPress={isActive ? undefined : () => requestAction('activate')}
            />
            <SectionRow
              icon={Pencil}
              label={ui('Edit Profile')}
              value={ui('Name / avatar')}
              tint={COLORS.pink}
              badgeBg="rgba(255,45,146,0.12)"
              onPress={() => requestAction('edit')}
            />
            <SectionRow
              icon={KeyRound}
              label={getProfilePinActionLabel(!!profile.pin)}
              value={profile.pin ? ui('Set') : ui('Not set')}
              tint={COLORS.purpleLight}
              badgeBg="rgba(167,139,250,0.12)"
              onPress={() => requestAction('pin')}
            />
            <SectionRow
              icon={Trash2}
              label={ui('Delete Profile')}
              value={ui('Remove')}
              tint={COLORS.no}
              badgeBg="rgba(239,68,68,0.12)"
              onPress={() => requestAction('delete')}
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
          setPinPromptOpen(false);
          if (pendingAction) performAction(pendingAction);
          setPendingAction(null);
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
