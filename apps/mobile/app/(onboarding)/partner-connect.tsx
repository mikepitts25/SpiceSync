import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from '../../components/SafeAreaView';
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
import { PartnerAccountGate } from '../../components/auth/PartnerAccountGate';
import ProfileAvatarIcon from '../../components/ProfileAvatarIcon';
import { COLORS, FONTS } from '../../constants/theme';
import { getAccountService } from '../../lib/auth/accountService';
import { useShallow } from 'zustand/react/shallow';
import { useProfilesStore } from '../../lib/state/profiles';
import {
  hasPendingRecoveryConfirmation,
  useCoupleLinkStore,
} from '../../lib/sync/coupleLink';
import {
  acceptInvite,
  buildInviteShareContent,
  buildInviteShareUrl,
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

import { ui } from '../../lib/i18n/uiLiteral';

type Mode = 'menu' | 'remote-create' | 'remote-paste' | 'remote-accept';
type RecoveryError = {
  title: string;
  body: string;
};

type RemoteAction = () => Promise<void>;

type DeferredRemoteAction = {
  action: RemoteAction;
  sessionId: number;
};

function errorBody(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function isAccountRequired(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ACCOUNT_REQUIRED'
  );
}

export default function PartnerConnect() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { remoteInviteId, remoteInviteSecret } = useLocalSearchParams<{
    remoteInviteId?: string;
    remoteInviteSecret?: string;
  }>();

  const coupleLink = useCoupleLinkStore((state) => state.link);
  // Subscribed rather than latched, so the notice clears on its own once
  // recovery completes and the user returns to this still-mounted screen.
  const recoveryPending = useCoupleLinkStore(
    (state) =>
      state.pendingProfileConfirmationOwnerUserId !== null ||
      state.link?.requiresProfileConfirmation === true
  );
  const { profiles, activeProfileId } = useProfilesStore(
    useShallow((state) => ({
      profiles: state.getProfiles(),
      activeProfileId: state.getActiveProfileId(),
    }))
  );

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
  const [createError, setCreateError] = useState<RecoveryError | null>(null);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [lookupRetryKey, setLookupRetryKey] = useState(0);
  const [accountGateVisible, setAccountGateVisible] = useState(false);
  const [recoveryBlocked, setRecoveryBlocked] = useState(false);
  const [deferredRemoteAction, setDeferredRemoteAction] =
    useState<DeferredRemoteAction | null>(null);
  const remoteActionInFlightRef = useRef(false);
  const accountGateSessionRef = useRef(0);

  const handleLocalProfile = useCallback(() => {
    router.push('/(settings)/profiles/new?from=partner-connect');
  }, [router]);

  const handleRetryLookup = useCallback(() => {
    setLookupRetryKey((key) => key + 1);
  }, []);

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
    setLookupError(null);
    setRemoteInvite(null);
    lookupInvite(activeRemoteInvite.inviteId)
      .then((lookup) => {
        if (alive) setRemoteInvite(lookup);
      })
      .catch((err) => {
        if (alive) {
          setRemoteInvite(null);
          setLookupError(
            errorBody(err, 'Check your connection and try again.')
          );
        }
      });
    return () => {
      alive = false;
    };
  }, [mode, activeRemoteInvite?.inviteId, lookupRetryKey]);

  const completePendingInvite = useCallback(
    async (inviteId: string) => {
      try {
        const result = await finalizePendingInvite(inviteId);
        if (result) {
          useVoteSyncStore
            .getState()
            .setLocalProfileId(activeProfileId ?? null);
          await startVoteSync();
          startSyncLoop();
          router.replace('/(tabs)/deck');
        }
      } catch (err) {
        setPollError(errorBody(err, 'Could not check invite'));
      }
    },
    [activeProfileId, router]
  );

  useEffect(() => {
    if (mode !== 'remote-create' || !pendingInvite) return;
    const handle = setInterval(() => {
      completePendingInvite(pendingInvite.inviteId);
    }, 4000);
    return () => clearInterval(handle);
  }, [mode, pendingInvite, completePendingInvite]);

  const handleRetryPoll = useCallback(() => {
    if (!pendingInvite) return;
    setPollError(null);
    completePendingInvite(pendingInvite.inviteId);
  }, [completePendingInvite, pendingInvite]);

  const runAfterPermanentAccount = useCallback(async (action: RemoteAction) => {
    if (remoteActionInFlightRef.current) return;
    // Recovery must resolve before a new relationship replaces the state it is
    // waiting on. Checked before and after the account gate, because cancelling
    // the gate and retrying otherwise reaches create/accept with a permanent
    // but unrecovered session.
    if (hasPendingRecoveryConfirmation()) {
      setRecoveryBlocked(true);
      return;
    }
    remoteActionInFlightRef.current = true;
    setIsConnecting(true);
    try {
      await getAccountService().requirePermanentUser();
      if (hasPendingRecoveryConfirmation()) {
        setRecoveryBlocked(true);
        return;
      }
      await action();
    } catch (error) {
      if (isAccountRequired(error)) {
        const sessionId = ++accountGateSessionRef.current;
        setDeferredRemoteAction({ action, sessionId });
        setAccountGateVisible(true);
        return;
      }
      throw error;
    } finally {
      remoteActionInFlightRef.current = false;
      setIsConnecting(false);
    }
  }, []);

  const createRemoteInvite = async () => {
    try {
      setIsConnecting(true);
      setCreateError(null);
      setPollError(null);
      const invite = await createInvite({
        profileName: myProfileName,
        profileAvatar: myProfileAvatar,
      });
      setPendingInvite(invite);
      setMode('remote-create');
    } catch (err) {
      setCreateError({
        title: ui('Could not create invite'),
        body: errorBody(err, ui('Check your connection and try again.')),
      });
      setMode('menu');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCreateRemoteInvite = async () => {
    await runAfterPermanentAccount(createRemoteInvite);
  };

  const handleShareInvite = async () => {
    if (!pendingInvite) return;
    try {
      const inviteUrl = buildInviteShareUrl(pendingInvite);
      await Share.share({
        ...buildInviteShareContent(pendingInvite),
        message: `${ui('Join me on SpiceSync')}\n${inviteUrl}`,
      });
    } catch {}
  };

  const handleCopyInvite = async () => {
    if (!pendingInvite) return;
    await Clipboard.setStringAsync(buildInviteShareUrl(pendingInvite));
    Alert.alert(ui('Copied'), ui('Invite link copied to the clipboard.'));
  };

  const handlePasteInviteLink = () => {
    const parsed = parseInviteUrl(inviteLinkInput);
    if (!parsed) {
      setPasteError(ui('Paste the full invite link your partner created.'));
      return;
    }
    setPasteError(null);
    setLookupError(null);
    setAcceptError(null);
    setRemoteInvite(null);
    setActiveRemoteInvite(parsed);
    setMode('remote-accept');
  };

  const acceptRemoteInvite = async () => {
    if (!activeRemoteInvite) return;
    try {
      setIsConnecting(true);
      setAcceptError(null);
      await acceptInvite(activeRemoteInvite, {
        profileName: myProfileName,
        profileAvatar: myProfileAvatar,
      });
      useVoteSyncStore.getState().setLocalProfileId(activeProfileId ?? null);
      await startVoteSync();
      startSyncLoop();
      Alert.alert(
        ui('Connected'),
        ui('You are now linked with your partner.'),
        [
          {
            text: ui('Start Exploring'),
            onPress: () => router.replace('/(tabs)/deck'),
          },
        ]
      );
    } catch (err) {
      setAcceptError(
        errorBody(err, ui('Check your connection and try again.'))
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAcceptRemote = async () => {
    await runAfterPermanentAccount(acceptRemoteInvite);
  };

  const handleAccountGateComplete = useCallback(async () => {
    const deferred = deferredRemoteAction;
    if (!deferred || deferred.sessionId !== accountGateSessionRef.current) {
      return;
    }
    setDeferredRemoteAction(null);
    setAccountGateVisible(false);
    await runAfterPermanentAccount(deferred.action);
  }, [deferredRemoteAction, runAfterPermanentAccount]);

  const handleAccountGateCancel = useCallback(() => {
    accountGateSessionRef.current += 1;
    setDeferredRemoteAction(null);
    setAccountGateVisible(false);
    setMode('menu');
  }, []);

  // Shown only when the user actually attempted a blocked action and recovery
  // is still outstanding.
  const recoveryRequired = recoveryBlocked && recoveryPending;

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <BackHeader title={ui('Partner setup')} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 28 },
        ]}
      >
        {recoveryRequired ? (
          <RecoveryCard
            title={ui('Finish restoring your account')}
            body={ui(
              'This account has a connection waiting to be restored. Finish restoring it before creating or accepting a new partner connection.'
            )}
            primaryLabel={ui('Restore account')}
            onPrimary={() => router.push('/(auth)/restore')}
            onLocalProfile={handleLocalProfile}
          />
        ) : null}

        {!recoveryRequired && accountGateVisible ? (
          <PartnerAccountGate
            intent="protect"
            onComplete={handleAccountGateComplete}
            onCancel={handleAccountGateCancel}
          />
        ) : null}

        {!recoveryRequired && !accountGateVisible && mode === 'menu' ? (
          <MenuContent
            myProfileName={myProfileName}
            myProfileAvatar={myProfileAvatar}
            isConnecting={isConnecting}
            createError={createError}
            onLocalProfile={handleLocalProfile}
            onRemoteInvite={handleCreateRemoteInvite}
            onPasteInvite={() => setMode('remote-paste')}
          />
        ) : null}

        {!recoveryRequired &&
        !accountGateVisible &&
        mode === 'remote-create' ? (
          <RemoteCreateContent
            invite={pendingInvite}
            myProfileName={myProfileName}
            myProfileAvatar={myProfileAvatar}
            isConnecting={isConnecting}
            pollError={pollError}
            onShare={handleShareInvite}
            onCopy={handleCopyInvite}
            onRetryPoll={handleRetryPoll}
            onLocalProfile={handleLocalProfile}
            onBack={() => setMode('menu')}
          />
        ) : null}

        {!recoveryRequired && !accountGateVisible && mode === 'remote-paste' ? (
          <PasteInviteContent
            value={inviteLinkInput}
            pasteError={pasteError}
            onChange={(value) => {
              setInviteLinkInput(value);
              setPasteError(null);
            }}
            onContinue={handlePasteInviteLink}
            onBack={() => setMode('menu')}
          />
        ) : null}

        {!recoveryRequired &&
        !accountGateVisible &&
        mode === 'remote-accept' ? (
          <RemoteAcceptContent
            remoteInvite={remoteInvite}
            lookupError={lookupError}
            acceptError={acceptError}
            isConnecting={isConnecting}
            onRetryLookup={handleRetryLookup}
            onLocalProfile={handleLocalProfile}
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
      <Text style={styles.kicker}>{ui('Partner Sync')}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{body}</Text>
    </View>
  );
}

function MenuContent({
  myProfileName,
  myProfileAvatar,
  isConnecting,
  createError,
  onLocalProfile,
  onRemoteInvite,
  onPasteInvite,
}: {
  myProfileName: string;
  myProfileAvatar: string | null;
  isConnecting: boolean;
  createError: RecoveryError | null;
  onLocalProfile: () => void;
  onRemoteInvite: () => void;
  onPasteInvite: () => void;
}) {
  return (
    <>
      <ScreenIntro
        title={ui('How do you want to compare?')}
        body={ui(
          'Use two profiles on this device, or link a partner on another device with encrypted sync.'
        )}
      />
      <View style={styles.identityRow}>
        <ProfileAvatarIcon avatar={myProfileAvatar} size={38} selected />
        <View style={styles.identityCopy}>
          <Text style={styles.identityLabel}>{ui('You appear as')}</Text>
          <Text style={styles.identityName}>{myProfileName}</Text>
        </View>
      </View>
      <ChoiceCard
        icon={Users}
        title={ui('Two profiles on this device')}
        body={ui(
          'Add a second local profile when you share one phone or tablet. No network sync is needed.'
        )}
        actionLabel={ui('Add local profile')}
        onPress={onLocalProfile}
      />
      <ChoiceCard
        icon={Radio}
        title={ui('Remote partner')}
        body={ui(
          'Create an encrypted invite link for a partner using their own device. Your selected avatar is shared with them.'
        )}
        actionLabel={
          isConnecting ? ui('Creating...') : ui('Create invite link')
        }
        onPress={onRemoteInvite}
        disabled={isConnecting}
        primary
      />
      <ChoiceCard
        icon={ClipboardPaste}
        title={ui('Paste invite link')}
        body={ui(
          'Use a link from another device when Messages, AirDrop, or the share sheet is not available.'
        )}
        actionLabel={ui('Paste link')}
        onPress={onPasteInvite}
      />
      {createError ? (
        <RecoveryCard
          title={createError.title}
          body={createError.body}
          primaryLabel={ui('Try again')}
          onPrimary={onRemoteInvite}
          onLocalProfile={onLocalProfile}
        />
      ) : null}
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
  onRetryPoll,
  onLocalProfile,
  onBack,
}: {
  invite: InviteHandle | null;
  myProfileName: string;
  myProfileAvatar: string | null;
  isConnecting: boolean;
  pollError: string | null;
  onShare: () => void;
  onCopy: () => void;
  onRetryPoll: () => void;
  onLocalProfile: () => void;
  onBack: () => void;
}) {
  const inviteUrl = invite ? buildInviteShareUrl(invite) : null;

  return (
    <>
      <ScreenIntro
        title={ui('Send a private invite')}
        body={ui(
          'Your partner will see your selected avatar, then both devices sync encrypted vote updates.'
        )}
      />
      <View style={styles.identityRow}>
        <ProfileAvatarIcon avatar={myProfileAvatar} size={38} selected />
        <View style={styles.identityCopy}>
          <Text style={styles.identityLabel}>
            {ui('Shared with your partner')}
          </Text>
          <Text style={styles.identityName}>{myProfileName}</Text>
        </View>
      </View>
      <View style={styles.panel}>
        <Text style={styles.label}>{ui('Invite link')}</Text>
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
          {inviteUrl ?? ui('Creating invite...')}
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
            <Text style={styles.secondaryButtonText}>{ui('Copy link')}</Text>
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
            <Text style={styles.primaryButtonText}>{ui('Share link')}</Text>
          </Pressable>
        </View>
        <Text style={styles.helperText}>
          {ui(
            ' Scan the QR code with another device, copy the link, or use the share sheet. Leave this screen open so we can detect when your partner accepts. '
          )}
        </Text>
        {pollError ? (
          <RecoveryCard
            title={ui('Could not check invite')}
            body={pollError}
            primaryLabel={ui('Check again')}
            onPrimary={onRetryPoll}
            onLocalProfile={onLocalProfile}
          />
        ) : null}
      </View>
      <BackToMenu onPress={onBack} />
    </>
  );
}

function PasteInviteContent({
  value,
  pasteError,
  onChange,
  onContinue,
  onBack,
}: {
  value: string;
  pasteError: string | null;
  onChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <ScreenIntro
        title={ui('Paste invite link')}
        body={ui(
          "Paste the full private invite link from your partner's device."
        )}
      />
      <View style={styles.panel}>
        <View style={styles.securityRow}>
          <LinkIcon size={22} color={COLORS.primary} />
          <Text style={styles.securityText}>
            {ui(
              ' The link includes a temporary secret that proves you were invited. '
            )}
          </Text>
        </View>
        <TextInput
          style={styles.linkInput}
          value={value}
          onChangeText={onChange}
          placeholder={ui('Paste invite link')}
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
        />
        {pasteError ? <Text style={styles.errorText}>{pasteError}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={!value.trim()}
          style={[styles.primaryButton, !value.trim() && styles.disabled]}
          onPress={onContinue}
        >
          <Text style={styles.primaryButtonText}>{ui('Continue')}</Text>
        </Pressable>
      </View>
      <BackToMenu onPress={onBack} />
    </>
  );
}

function RemoteAcceptContent({
  remoteInvite,
  lookupError,
  acceptError,
  isConnecting,
  onRetryLookup,
  onLocalProfile,
  onAccept,
  onBack,
}: {
  remoteInvite: InviteLookup | null;
  lookupError: string | null;
  acceptError: string | null;
  isConnecting: boolean;
  onRetryLookup: () => void;
  onLocalProfile: () => void;
  onAccept: () => void;
  onBack: () => void;
}) {
  const inviterName =
    remoteInvite?.kind === 'pending'
      ? remoteInvite.inviterProfileName || ui('Your partner')
      : ui('Your partner');
  const inviterAvatar =
    remoteInvite?.kind === 'pending' ? remoteInvite.inviterProfileAvatar : null;
  const inviteIsPending = remoteInvite?.kind === 'pending';

  return (
    <>
      <ScreenIntro
        title={ui('Accept remote invite')}
        body={ui(
          'This links two devices. The relay only stores encrypted updates.'
        )}
      />
      <View style={styles.identityRow}>
        <ProfileAvatarIcon avatar={inviterAvatar ?? null} size={38} />
        <View style={styles.identityCopy}>
          <Text style={styles.identityLabel}>{ui('Invite from')}</Text>
          <Text style={styles.identityName}>{inviterName}</Text>
        </View>
      </View>
      <View style={styles.panel}>
        <View style={styles.securityRow}>
          <ShieldCheck size={22} color={COLORS.primary} />
          <Text style={styles.securityText}>
            {ui(
              ' Your votes stay encrypted end-to-end and matches are computed on your device. '
            )}
          </Text>
        </View>

        {lookupError ? (
          <RecoveryCard
            title={ui('Could not load invite')}
            body={lookupError}
            primaryLabel={ui('Try again')}
            onPrimary={onRetryLookup}
            onLocalProfile={onLocalProfile}
          />
        ) : null}

        {!lookupError && remoteInvite === null ? (
          <Text style={styles.helperText}>{ui('Checking invite...')}</Text>
        ) : null}

        {!lookupError && remoteInvite?.kind === 'expired' ? (
          <RecoveryCard
            title={ui('Invite expired')}
            body={ui(
              'Ask your partner to create a new invite, or use this device instead.'
            )}
            primaryLabel={ui('Back to setup')}
            onPrimary={onBack}
            onLocalProfile={onLocalProfile}
          />
        ) : null}

        {!lookupError && remoteInvite?.kind === 'accepted' ? (
          <RecoveryCard
            title={ui('Invite already used')}
            body={ui(
              'Ask your partner to create a new invite, or use this device instead.'
            )}
            primaryLabel={ui('Back to setup')}
            onPrimary={onBack}
            onLocalProfile={onLocalProfile}
          />
        ) : null}

        {acceptError ? (
          <RecoveryCard
            title={ui('Could not link')}
            body={acceptError}
            primaryLabel={ui('Try again')}
            onPrimary={onAccept}
            onLocalProfile={onLocalProfile}
          />
        ) : null}

        {inviteIsPending && !acceptError ? (
          <Pressable
            accessibilityRole="button"
            disabled={isConnecting}
            style={[styles.primaryButton, isConnecting && styles.disabled]}
            onPress={onAccept}
          >
            <Text style={styles.primaryButtonText}>
              {isConnecting ? ui('Linking...') : ui('Accept invite')}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <BackToMenu onPress={onBack} />
    </>
  );
}

function RecoveryCard({
  title,
  body,
  primaryLabel,
  onPrimary,
  onLocalProfile,
}: {
  title: string;
  body: string;
  primaryLabel: string;
  onPrimary: () => void;
  onLocalProfile?: () => void;
}) {
  return (
    <View style={styles.recoveryCard}>
      <Text style={styles.recoveryTitle}>{title}</Text>
      <Text style={styles.recoveryBody}>{body}</Text>
      <View style={styles.recoveryActions}>
        <Pressable
          accessibilityRole="button"
          style={styles.primaryButton}
          onPress={onPrimary}
        >
          <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
        </Pressable>
        {onLocalProfile ? (
          <Pressable
            accessibilityRole="button"
            style={styles.secondaryFullButton}
            onPress={onLocalProfile}
          >
            <Text style={styles.secondaryButtonText}>
              {ui(' Use this device instead ')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function BackToMenu({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.backToMenu}
    >
      <Text style={styles.backToMenuText}>{ui('Back to partner setup')}</Text>
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
  recoveryCard: {
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,94,98,0.35)',
    backgroundColor: 'rgba(255,94,98,0.08)',
    padding: 14,
  },
  recoveryTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  recoveryBody: {
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 23,
  },
  recoveryActions: {
    gap: 10,
  },
  secondaryFullButton: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
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
