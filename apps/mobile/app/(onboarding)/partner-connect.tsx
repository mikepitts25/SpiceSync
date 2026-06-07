import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import {
  ClipboardPaste,
  Link as LinkIcon,
  Radio,
  ShieldCheck,
  Users,
} from 'lucide-react-native';

import { BackHeader } from '../../components/app-chrome';
import ProfileAvatarIcon from '../../components/ProfileAvatarIcon';
import { COLORS, FONTS } from '../../constants/theme';
import { useProfilesStore } from '../../lib/state/profiles';
import { useCoupleLinkStore } from '../../lib/sync/coupleLink';
import {
  acceptInvite,
  createInvite,
  finalizePendingInvite,
  lookupInvite,
  parseInviteUrl,
  type InviteHandle,
  type InviteLookup,
  type ParsedInviteUrl,
} from '../../lib/sync/inviteFlow';
import { startSyncLoop } from '../../lib/sync/syncLoop';
import { startVoteSync, useVoteSyncStore } from '../../lib/sync/voteSync';

type Mode = 'menu' | 'remote-create' | 'remote-paste' | 'remote-accept';

function buildRuntimeInviteLink(invite: InviteHandle): string {
  const path = `/link/${encodeURIComponent(invite.inviteId)}`;
  return `${Linking.createURL(path)}#${encodeURIComponent(invite.inviteSecret)}`;
}

export default function PartnerConnect() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { remoteInviteId, remoteInviteSecret } = useLocalSearchParams<{
    remoteInviteId?: string;
    remoteInviteSecret?: string;
  }>();

  const coupleLink = useCoupleLinkStore((state) => state.link);
  const { profiles, activeProfileId } = useProfilesStore((state) => ({
    profiles: state.getProfiles(),
    activeProfileId: state.getActiveProfileId(),
  }));

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) ?? null,
    [profiles, activeProfileId]
  );
  const myProfileName =
    activeProfile?.displayName ?? activeProfile?.name ?? 'Me';
  const myProfileAvatar = activeProfile?.emoji ?? null;

  const [mode, setMode] = useState<Mode>(() => {
    if (remoteInviteId) return 'remote-accept';
    return 'menu';
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<InviteHandle | null>(null);
  const [remoteInvite, setRemoteInvite] = useState<InviteLookup | null>(null);
  const [activeRemoteInvite, setActiveRemoteInvite] =
    useState<ParsedInviteUrl | null>(() =>
      remoteInviteId && remoteInviteSecret
        ? { inviteId: remoteInviteId, inviteSecret: remoteInviteSecret }
        : null
    );
  const [inviteLinkInput, setInviteLinkInput] = useState('');
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    if (coupleLink?.status === 'active') {
      router.replace('/(tabs)/deck');
    }
  }, [coupleLink?.status, router]);

  useEffect(() => {
    if (remoteInviteId && remoteInviteSecret) {
      setActiveRemoteInvite({
        inviteId: remoteInviteId,
        inviteSecret: remoteInviteSecret,
      });
      setMode('remote-accept');
    }
  }, [remoteInviteId, remoteInviteSecret]);

  useEffect(() => {
    if (mode !== 'remote-accept' || !activeRemoteInvite?.inviteId) return;
    let alive = true;
    lookupInvite(activeRemoteInvite.inviteId)
      .then((lookup) => {
        if (alive) setRemoteInvite(lookup);
      })
      .catch(() => {
        if (alive) setRemoteInvite(null);
      });
    return () => {
      alive = false;
    };
  }, [mode, activeRemoteInvite?.inviteId]);

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
          router.replace('/(tabs)/deck');
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
      const invite = await createInvite({
        profileName: myProfileName,
        profileAvatar: myProfileAvatar,
      });
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
    const inviteUrl = buildRuntimeInviteLink(pendingInvite);
    try {
      await Share.share({
        message: `Join me on SpiceSync\n${inviteUrl}`,
        url: inviteUrl,
      });
    } catch {}
  };

  const handleCopyInvite = async () => {
    if (!pendingInvite) return;
    await Clipboard.setStringAsync(buildRuntimeInviteLink(pendingInvite));
    Alert.alert('Copied', 'Invite link copied to the clipboard.');
  };

  const handlePasteInviteLink = () => {
    const parsed = parseInviteUrl(inviteLinkInput);
    if (!parsed) {
      Alert.alert(
        'Invalid link',
        'Paste the full invite link your partner created.'
      );
      return;
    }
    setRemoteInvite(null);
    setActiveRemoteInvite(parsed);
    setMode('remote-accept');
  };

  const handleAcceptRemote = async () => {
    if (!activeRemoteInvite) return;
    try {
      setIsConnecting(true);
      await acceptInvite(activeRemoteInvite, {
        profileName: myProfileName,
        profileAvatar: myProfileAvatar,
      });
      useVoteSyncStore.getState().setLocalProfileId(activeProfileId ?? null);
      startVoteSync();
      startSyncLoop();
      Alert.alert('Connected', 'You are now linked with your partner.', [
        {
          text: 'Start Exploring',
          onPress: () => router.replace('/(tabs)/deck'),
        },
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

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <BackHeader title="Partner setup" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 28 },
        ]}
      >
        {mode === 'menu' ? (
          <MenuContent
            myProfileName={myProfileName}
            myProfileAvatar={myProfileAvatar}
            isConnecting={isConnecting}
            onLocalProfile={() =>
              router.push('/(settings)/profiles/new?from=partner-connect')
            }
            onRemoteInvite={handleCreateRemoteInvite}
            onPasteInvite={() => setMode('remote-paste')}
          />
        ) : null}

        {mode === 'remote-create' ? (
          <RemoteCreateContent
            invite={pendingInvite}
            myProfileName={myProfileName}
            myProfileAvatar={myProfileAvatar}
            isConnecting={isConnecting}
            pollError={pollError}
            onShare={handleShareInvite}
            onCopy={handleCopyInvite}
            onBack={() => setMode('menu')}
          />
        ) : null}

        {mode === 'remote-paste' ? (
          <PasteInviteContent
            value={inviteLinkInput}
            onChange={setInviteLinkInput}
            onContinue={handlePasteInviteLink}
            onBack={() => setMode('menu')}
          />
        ) : null}

        {mode === 'remote-accept' ? (
          <RemoteAcceptContent
            remoteInvite={remoteInvite}
            isConnecting={isConnecting}
            onAccept={handleAcceptRemote}
            onBack={() => setMode('menu')}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ScreenIntro({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.intro}>
      <Text style={styles.kicker}>Partner Sync</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{body}</Text>
    </View>
  );
}

function MenuContent({
  myProfileName,
  myProfileAvatar,
  isConnecting,
  onLocalProfile,
  onRemoteInvite,
  onPasteInvite,
}: {
  myProfileName: string;
  myProfileAvatar: string | null;
  isConnecting: boolean;
  onLocalProfile: () => void;
  onRemoteInvite: () => void;
  onPasteInvite: () => void;
}) {
  return (
    <>
      <ScreenIntro
        title="How do you want to compare?"
        body="Use two profiles on this device, or link a partner on another device with encrypted sync."
      />

      <View style={styles.identityRow}>
        <ProfileAvatarIcon avatar={myProfileAvatar} size={38} selected />
        <View style={styles.identityCopy}>
          <Text style={styles.identityLabel}>You appear as</Text>
          <Text style={styles.identityName}>{myProfileName}</Text>
        </View>
      </View>

      <ChoiceCard
        icon={Users}
        title="Two profiles on this device"
        body="Add a second local profile when you share one phone or tablet. No network sync is needed."
        actionLabel="Add local profile"
        onPress={onLocalProfile}
      />
      <ChoiceCard
        icon={Radio}
        title="Remote partner"
        body="Create an encrypted invite link for a partner using their own device. Your selected avatar is shared with them."
        actionLabel={isConnecting ? 'Creating...' : 'Create invite link'}
        onPress={onRemoteInvite}
        disabled={isConnecting}
        primary
      />
      <ChoiceCard
        icon={ClipboardPaste}
        title="Paste invite link"
        body="Use a link from another device when Messages, AirDrop, or the share sheet is not available."
        actionLabel="Paste link"
        onPress={onPasteInvite}
      />
    </>
  );
}

function ChoiceCard({
  icon: Icon,
  title,
  body,
  actionLabel,
  onPress,
  disabled,
  primary,
}: {
  icon: typeof Users;
  title: string;
  body: string;
  actionLabel: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.choiceCard, disabled && styles.disabled]}
    >
      <View style={styles.choiceIcon}>
        <Icon size={24} color={primary ? COLORS.primary : COLORS.purple} />
      </View>
      <View style={styles.choiceCopy}>
        <Text style={styles.choiceTitle}>{title}</Text>
        <Text style={styles.choiceBody}>{body}</Text>
        <Text
          style={[styles.choiceAction, primary && styles.choiceActionPrimary]}
        >
          {actionLabel}
        </Text>
      </View>
    </Pressable>
  );
}

function RemoteCreateContent({
  invite,
  myProfileName,
  myProfileAvatar,
  isConnecting,
  pollError,
  onShare,
  onCopy,
  onBack,
}: {
  invite: InviteHandle | null;
  myProfileName: string;
  myProfileAvatar: string | null;
  isConnecting: boolean;
  pollError: string | null;
  onShare: () => void;
  onCopy: () => void;
  onBack: () => void;
}) {
  const inviteUrl = invite ? buildRuntimeInviteLink(invite) : null;

  return (
    <>
      <ScreenIntro
        title="Send a private invite"
        body="Your partner will see your selected avatar, then both devices sync encrypted vote updates."
      />
      <View style={styles.identityRow}>
        <ProfileAvatarIcon avatar={myProfileAvatar} size={38} selected />
        <View style={styles.identityCopy}>
          <Text style={styles.identityLabel}>Shared with your partner</Text>
          <Text style={styles.identityName}>{myProfileName}</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.label}>Invite link</Text>
        {inviteUrl ? (
          <View style={styles.qrWrap}>
            <QRCode
              value={inviteUrl}
              size={178}
              backgroundColor="#FFFFFF"
              color="#111111"
            />
          </View>
        ) : null}
        <Text selectable style={styles.linkBox}>
          {inviteUrl ?? 'Creating invite...'}
        </Text>
        <View style={styles.buttonRow}>
          <Pressable
            accessibilityRole="button"
            disabled={!invite || isConnecting}
            style={[
              styles.secondaryButton,
              (!invite || isConnecting) && styles.disabled,
            ]}
            onPress={onCopy}
          >
            <Text style={styles.secondaryButtonText}>Copy link</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={!invite || isConnecting}
            style={[
              styles.primaryButton,
              styles.buttonRowItem,
              (!invite || isConnecting) && styles.disabled,
            ]}
            onPress={onShare}
          >
            <Text style={styles.primaryButtonText}>Share link</Text>
          </Pressable>
        </View>
        <Text style={styles.helperText}>
          Scan the QR code with another device, copy the link, or use the share
          sheet. Leave this screen open so we can detect when your partner
          accepts.
        </Text>
        {pollError ? <Text style={styles.errorText}>{pollError}</Text> : null}
      </View>
      <BackToMenu onPress={onBack} />
    </>
  );
}

function PasteInviteContent({
  value,
  onChange,
  onContinue,
  onBack,
}: {
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <ScreenIntro
        title="Paste invite link"
        body="Paste the full private invite link from your partner's device."
      />
      <View style={styles.panel}>
        <View style={styles.securityRow}>
          <LinkIcon size={22} color={COLORS.primary} />
          <Text style={styles.securityText}>
            The link includes a temporary secret that proves you were invited.
          </Text>
        </View>
        <TextInput
          style={styles.linkInput}
          value={value}
          onChangeText={onChange}
          placeholder="Paste invite link"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
        />
        <Pressable
          accessibilityRole="button"
          disabled={!value.trim()}
          style={[styles.primaryButton, !value.trim() && styles.disabled]}
          onPress={onContinue}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>
      </View>
      <BackToMenu onPress={onBack} />
    </>
  );
}

function RemoteAcceptContent({
  remoteInvite,
  isConnecting,
  onAccept,
  onBack,
}: {
  remoteInvite: InviteLookup | null;
  isConnecting: boolean;
  onAccept: () => void;
  onBack: () => void;
}) {
  const inviterName =
    remoteInvite?.kind === 'pending'
      ? remoteInvite.inviterProfileName || 'Your partner'
      : 'Your partner';
  const inviterAvatar =
    remoteInvite?.kind === 'pending' ? remoteInvite.inviterProfileAvatar : null;

  return (
    <>
      <ScreenIntro
        title="Accept remote invite"
        body="This links two devices. The relay only stores encrypted updates."
      />
      <View style={styles.identityRow}>
        <ProfileAvatarIcon avatar={inviterAvatar ?? null} size={38} />
        <View style={styles.identityCopy}>
          <Text style={styles.identityLabel}>Invite from</Text>
          <Text style={styles.identityName}>{inviterName}</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.securityRow}>
          <ShieldCheck size={22} color={COLORS.primary} />
          <Text style={styles.securityText}>
            Your votes stay encrypted end-to-end and matches are computed on
            your device.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={isConnecting}
          style={[styles.primaryButton, isConnecting && styles.disabled]}
          onPress={onAccept}
        >
          <Text style={styles.primaryButtonText}>
            {isConnecting ? 'Linking...' : 'Accept invite'}
          </Text>
        </Pressable>
      </View>
      <BackToMenu onPress={onBack} />
    </>
  );
}

function BackToMenu({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.backToMenu}
    >
      <Text style={styles.backToMenuText}>Back to partner setup</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 14,
  },
  intro: {
    gap: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },
  kicker: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 30,
    lineHeight: 36,
    color: COLORS.text,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 23,
    color: COLORS.textSecondary,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  identityCopy: {
    flex: 1,
  },
  identityLabel: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
  identityName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  choiceCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  choiceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,45,146,0.12)',
  },
  choiceCopy: {
    flex: 1,
    gap: 5,
  },
  choiceTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '800',
  },
  choiceBody: {
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 23,
  },
  choiceAction: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
  choiceActionPrimary: {
    color: COLORS.primary,
  },
  panel: {
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.text,
  },
  linkBox: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 23,
  },
  linkInput: {
    minHeight: 112,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 23,
    textAlignVertical: 'top',
  },
  qrWrap: {
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonRowItem: {
    flex: 1,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: '#fff',
  },
  secondaryButton: {
    minHeight: 52,
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.text,
  },
  disabled: {
    opacity: 0.55,
  },
  helperText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 23,
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.no,
  },
  securityRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  securityText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 23,
  },
  backToMenu: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToMenuText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
});
