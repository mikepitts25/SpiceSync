import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BackHeader } from '../../components/app-chrome';
import { SafeAreaView } from '../../components/SafeAreaView';
import { COLORS, FONTS } from '../../constants/theme';
import { useProfilesStore } from '../../lib/state/profiles';
import { useCoupleLinkStore } from '../../lib/sync/coupleLink';
import { startSyncLoop } from '../../lib/sync/syncLoop';
import { startVoteSync, useVoteSyncStore } from '../../lib/sync/voteSync';
import { ui } from '../../lib/i18n/uiLiteral';

export default function ConfirmProfileScreen() {
  const router = useRouter();
  const profiles = useProfilesStore((state) => state.profiles);
  const profilesHydrated = useProfilesStore((state) => state.hydrated);
  const link = useCoupleLinkStore((state) => state.link);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const requiresConfirmation =
    link?.status === 'active' && link.requiresProfileConfirmation === true;

  useEffect(() => {
    if (!profilesHydrated || !requiresConfirmation || profiles.length > 0) {
      return;
    }
    router.replace({
      pathname: '/(settings)/profiles/new',
      params: { from: 'account-recovery' },
    });
  }, [profiles.length, profilesHydrated, requiresConfirmation, router]);

  const confirmRecoveredProfile = async (profileId: string) => {
    setError(null);
    setIsConfirming(true);
    try {
      const confirmationStarted = useCoupleLinkStore
        .getState()
        .beginProfileConfirmation(profileId);
      if (!confirmationStarted) {
        throw new Error(ui('Could not confirm this profile.'));
      }
      useVoteSyncStore.getState().setLocalProfileId(profileId);
      const bootstrapped = await startVoteSync(profileId, {
        allowPendingProfileConfirmation: true,
      });
      if (!bootstrapped) {
        throw new Error(ui('Could not confirm this profile.'));
      }
      // Clearing the persisted pause is deliberately after the bootstrap.
      // RootLayout suppresses the resulting link transition, so this screen
      // still owns the next operation: starting the remote sync loop.
      const confirmed = useCoupleLinkStore
        .getState()
        .confirmLocalProfile(profileId);
      if (!confirmed) {
        throw new Error(ui('Could not confirm this profile.'));
      }
      startSyncLoop();
      router.replace('/(tabs)/deck');
    } catch (confirmError) {
      useCoupleLinkStore.getState().cancelProfileConfirmation(profileId);
      setError(
        confirmError instanceof Error && confirmError.message
          ? confirmError.message
          : ui('Could not confirm this profile.')
      );
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <BackHeader title={ui('Confirm local profile')} />
      <View style={styles.content}>
        <Text style={styles.title}>{ui('Which profile is yours?')}</Text>
        <Text style={styles.body}>
          {ui(
            'Choose the profile on this device before restoring encrypted partner sync.'
          )}
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {requiresConfirmation && profiles.length > 0 ? (
          <View style={styles.profileList}>
            {profiles.map((profile) => (
              <Pressable
                key={profile.id}
                accessibilityRole="button"
                accessibilityLabel={profile.name}
                disabled={isConfirming}
                onPress={() => confirmRecoveredProfile(profile.id)}
                style={[styles.profileButton, isConfirming && styles.disabled]}
              >
                <Text style={styles.profileName}>{profile.name}</Text>
                <Text style={styles.profileHint}>{ui('Use this profile')}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    gap: 16,
    padding: 24,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONTS.bold,
    fontSize: 28,
    textAlign: 'center',
  },
  body: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
  },
  error: {
    color: COLORS.no,
    fontFamily: FONTS.regular,
    fontSize: 16,
    textAlign: 'center',
  },
  profileList: {
    gap: 12,
  },
  profileButton: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 72,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  profileName: {
    color: COLORS.text,
    fontFamily: FONTS.bold,
    fontSize: 18,
  },
  profileHint: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    fontSize: 16,
    marginTop: 3,
  },
  disabled: {
    opacity: 0.55,
  },
});
