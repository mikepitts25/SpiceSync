import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Animated,
  Share,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { usePartnerStore } from '../../src/stores/partner';
import { useSettingsStore } from '../../src/stores/settingsStore';
import {
  acceptInvite,
  createInvite,
  finalizePendingInvite,
  type InviteHandle,
} from '../../lib/sync/inviteFlow';
import { useCoupleLinkStore } from '../../lib/sync/coupleLink';
import { startSyncLoop } from '../../lib/sync/syncLoop';
import { startVoteSync, useVoteSyncStore } from '../../lib/sync/voteSync';
import ProfileAvatarIcon from '../../components/ProfileAvatarIcon';
import { PROFILE_AVATAR_OPTIONS } from '../../src/constants/emojis';

const AVATARS = PROFILE_AVATAR_OPTIONS.slice(0, 8);
type Mode = 'menu' | 'code' | 'remote-create' | 'remote-accept';

export default function PartnerConnect() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    code: incomingCode,
    remoteInviteId,
    remoteInviteSecret,
  } = useLocalSearchParams<{
    code?: string;
    remoteInviteId?: string;
    remoteInviteSecret?: string;
  }>();

  const {
    acceptInvite: acceptLocalInvite,
    hasPartner,
  } = usePartnerStore();
  const addProfile = useSettingsStore((state) => state.addProfile);
  const activeProfileId = useSettingsStore((state) => state.activeProfileId);
  const setActiveProfile = useSettingsStore((state) => state.setActiveProfile);
  const coupleLink = useCoupleLinkStore((state) => state.link);

  const [mode, setMode] = useState<Mode>(() => {
    if (remoteInviteId) return 'remote-accept';
    if (incomingCode) return 'code';
    return 'menu';
  });
  const [code, setCode] = useState(incomingCode || '');
  const [partnerName, setPartnerName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(AVATARS[0].id);
  const [isConnecting, setIsConnecting] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<InviteHandle | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    if (hasPartner() || coupleLink?.status === 'active') {
      router.replace('/(tabs)');
    }
  }, []);

  useEffect(() => {
    if (mode !== 'remote-create' || !pendingInvite) return;
    const handle = setInterval(async () => {
      try {
        const result = await finalizePendingInvite(pendingInvite.inviteId);
        if (result) {
          useVoteSyncStore
            .getState()
            .setLocalProfileId(activeProfileId ?? null);
          startVoteSync();
          startSyncLoop();
          router.replace('/(tabs)');
        }
      } catch (err) {
        setPollError(
          err instanceof Error ? err.message : 'Could not check invite'
        );
      }
    }, 4000);
    return () => clearInterval(handle);
  }, [mode, pendingInvite, activeProfileId, router]);

  const handleCreateRemoteInvite = async () => {
    try {
      setIsConnecting(true);
      setPollError(null);
      const invite = await createInvite();
      setPendingInvite(invite);
      setMode('remote-create');
    } catch (err) {
      Alert.alert(
        'Could not create invite',
        err instanceof Error ? err.message : 'Try again'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleShareInvite = async () => {
    if (!pendingInvite) return;
    try {
      await Share.share({
        message: `Join me on SpiceSync 💕\n${pendingInvite.appUrl}`,
        url: pendingInvite.appUrl,
      });
    } catch {}
  };

  const handleAcceptRemote = async () => {
    if (!remoteInviteId || !remoteInviteSecret) return;
    try {
      setIsConnecting(true);
      await acceptInvite({
        inviteId: remoteInviteId,
        inviteSecret: remoteInviteSecret,
      });
      useVoteSyncStore.getState().setLocalProfileId(activeProfileId ?? null);
      startVoteSync();
      startSyncLoop();
      Alert.alert('Connected 💕', 'You are now linked with your partner.', [
        { text: 'Start Exploring', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (err) {
      Alert.alert(
        'Could not link',
        err instanceof Error ? err.message : 'Try again'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnect = async () => {
    if (!code.trim() || !partnerName.trim()) {
      Alert.alert(
        'Missing Info',
        "Please enter the invite code and your partner's name"
      );
      return;
    }

    setIsConnecting(true);

    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const success = acceptLocalInvite(code.trim().toUpperCase(), {
      name: partnerName.trim(),
      emoji: selectedEmoji,
    });

    if (success) {
      // Also add partner as a profile
      const profile = addProfile({
        name: partnerName.trim(),
        emoji: selectedEmoji,
      });
      setActiveProfile(profile.id);

      Alert.alert(
        'Connected! 💕',
        `You're now connected with ${partnerName}!`,
        [
          {
            text: 'Start Exploring',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } else {
      Alert.alert('Invalid Code', 'The invite code is invalid or has expired.');
    }

    setIsConnecting(false);
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip for Now?',
      'You can connect with a partner later from settings. Some features work best with a partner connected.',
      [
        { text: 'Go Back', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => router.replace('/(tabs)'),
        },
      ]
    );
  };

  if (mode === 'menu') {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <Text style={styles.emoji}>💕</Text>
            <Text style={styles.title}>Connect with Your Partner</Text>
            <Text style={styles.subtitle}>
              Together in person, or apart? Pick how you want to link up.
            </Text>
          </View>

          <Pressable
            style={styles.optionCard}
            onPress={handleCreateRemoteInvite}
            disabled={isConnecting}
          >
            <Text style={styles.optionEmoji}>📡</Text>
            <Text style={styles.optionTitle}>Link remotely</Text>
            <Text style={styles.optionBody}>
              Send your partner a secure link. Your votes stay private; the
              server only relays encrypted updates.
            </Text>
          </Pressable>

          <Pressable style={styles.optionCard} onPress={() => setMode('code')}>
            <Text style={styles.optionEmoji}>🔑</Text>
            <Text style={styles.optionTitle}>Use invite code</Text>
            <Text style={styles.optionBody}>
              Enter a short code they shared with you (for offline matching).
            </Text>
          </Pressable>
        </Animated.View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'remote-create') {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <Text style={styles.emoji}>📡</Text>
            <Text style={styles.title}>Invite Your Partner</Text>
            <Text style={styles.subtitle}>
              Share this link with your partner. We&apos;ll detect when they
              accept.
            </Text>
          </View>

          {pendingInvite ? (
            <>
              <View style={styles.inputSection}>
                <Text style={styles.label}>Invite link</Text>
                <Text selectable style={styles.linkBox}>
                  {pendingInvite.appUrl}
                </Text>
              </View>
              <Pressable
                style={styles.connectButton}
                onPress={handleShareInvite}
              >
                <Text style={styles.connectButtonText}>Share link</Text>
              </Pressable>
              <Text style={styles.helperText}>
                Waiting for your partner to accept…
              </Text>
              {pollError ? (
                <Text style={styles.errorText}>{pollError}</Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.helperText}>Creating invite…</Text>
          )}
        </Animated.View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable style={styles.skipButton} onPress={() => setMode('menu')}>
            <Text style={styles.skipText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'remote-accept') {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <Text style={styles.emoji}>🔒</Text>
            <Text style={styles.title}>Accept Partner Link</Text>
            <Text style={styles.subtitle}>
              You opened a remote link from your partner. Accept to start
              syncing privately.
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoEmoji}>🛡️</Text>
            <Text style={styles.infoText}>
              The relay never sees your votes — only encrypted updates routed
              between your devices.
            </Text>
          </View>
        </Animated.View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable
            style={[
              styles.connectButton,
              isConnecting && styles.buttonDisabled,
            ]}
            onPress={handleAcceptRemote}
            disabled={isConnecting}
          >
            <Text style={styles.connectButtonText}>
              {isConnecting ? 'Linking…' : 'Accept invite'}
            </Text>
          </Pressable>
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.emoji}>💕</Text>
          <Text style={styles.title}>Connect with Your Partner</Text>
          <Text style={styles.subtitle}>
            Enter the invite code they shared with you
          </Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Invite Code</Text>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
            placeholder="XXX-XXX"
            placeholderTextColor={COLORS.textMuted}
            maxLength={7}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Partner&apos;s Name</Text>
          <TextInput
            style={styles.input}
            value={partnerName}
            onChangeText={setPartnerName}
            placeholder="Enter their name"
            placeholderTextColor={COLORS.textMuted}
            maxLength={20}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Their Avatar</Text>
          <View style={styles.emojiGrid}>
            {AVATARS.map((avatar) => (
              <Pressable
                key={avatar.id}
                style={[
                  styles.emojiButton,
                  selectedEmoji === avatar.id && styles.emojiButtonSelected,
                ]}
                onPress={() => setSelectedEmoji(avatar.id)}
                accessibilityRole="button"
                accessibilityLabel={`${avatar.label} avatar`}
                accessibilityState={{ selected: selectedEmoji === avatar.id }}
              >
                <ProfileAvatarIcon
                  avatar={avatar.id}
                  size={44}
                  selected={selectedEmoji === avatar.id}
                />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoEmoji}>🔒</Text>
          <Text style={styles.infoText}>
            Your connection is private. Only you and your partner can see each
            other&apos;s activity.
          </Text>
        </View>
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable
          style={[
            styles.connectButton,
            (!code.trim() || !partnerName.trim() || isConnecting) &&
              styles.buttonDisabled,
          ]}
          onPress={handleConnect}
          disabled={!code.trim() || !partnerName.trim() || isConnecting}
        >
          <Text style={styles.connectButtonText}>
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Text>
        </Pressable>

        <Pressable style={styles.skipButton} onPress={() => setMode('menu')}>
          <Text style={styles.skipText}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SIZES.padding * 2,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 3,
  },
  emoji: {
    fontSize: 64,
    marginBottom: SIZES.padding,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h1,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: SIZES.padding * 2,
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  codeInput: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    color: COLORS.text,
    fontFamily: FONTS.bold,
    fontSize: SIZES.h2,
    textAlign: 'center',
    letterSpacing: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emojiButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  emojiButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SIZES.padding,
  },
  infoEmoji: {
    fontSize: 24,
    marginRight: SIZES.padding,
  },
  infoText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: SIZES.padding * 2,
    paddingTop: 0,
  },
  connectButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  buttonDisabled: {
    backgroundColor: COLORS.border,
  },
  connectButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: SIZES.padding,
  },
  skipText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  optionCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 1.5,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.padding,
  },
  optionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h3,
    color: COLORS.text,
    marginBottom: 4,
  },
  optionBody: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  linkBox: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
  },
  helperText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.padding,
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: SIZES.padding,
  },
});
