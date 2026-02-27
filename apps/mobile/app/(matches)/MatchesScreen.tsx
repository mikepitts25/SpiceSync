import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';

import SettingsButton from '../../src/components/SettingsButton';
import PinVerifyModal from '../../components/PinVerifyModal';
import MatchRow from '../../components/MatchRow';
import MatchesDebug from '../../components/MatchesDebug';
import { useProfilesStore } from '../../src/stores/profiles';
import type { Profile } from '../../src/stores/profiles';
import {
  useVotesStore,
  type VoteBuckets,
  type VoteValue,
} from '../../src/stores/votes';
import { useSettings } from '../../lib/state/useStore';
import { useKinks } from '../../lib/data';
import { usePrivacyGate } from '../../src/stores/privacyGate';

const EMPTY_PROFILE_VOTES = Object.freeze({}) as Record<string, VoteValue>;

const EMPTY_VISIBLE_BUCKETS: VoteBuckets = {
  mutualYes: [],
  mutualNo: [],
  mutualMaybe: [],
  partialYes: [],
};

type TabKey = 'mutualYes' | 'mutualNo' | 'mutualMaybe' | 'partialYes';

type TabOption = {
  key: TabKey;
  label: string;
  count?: number;
  locked?: boolean;
};

type MatchRowItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  aVote: VoteValue | undefined;
  bVote: VoteValue | undefined;
  sortCategory: string;
};

type PartnerOption = {
  id: string;
  label: string;
};

export default function MatchesScreen() {
  const router = useRouter();
  const { language } = useSettings();

  const { hydrated, activeId, profiles } = useProfilesStore(
    useShallow((state) => ({
      hydrated: state.isHydrated(),
      activeId: state.getActiveProfileId(),
      profiles: state.getProfiles(),
    }))
  );

  const [partnerPickerOpen, setPartnerPickerOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(
    null
  );
  const [selectedTab, setSelectedTab] = useState<TabKey>('mutualYes');
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinModalProfiles, setPinModalProfiles] = useState<Profile[]>([]);
  const [pendingReveal, setPendingReveal] = useState<
    'partial' | 'unlock' | null
  >(null);
  const previousPartnerId = useRef<string | null>(null);

  const partners = useMemo(() => {
    if (!activeId) return [] as Profile[];
    return profiles.filter((profile) => profile.id !== activeId);
  }, [profiles, activeId]);

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeId) ?? null,
    [profiles, activeId]
  );

  useEffect(() => {
    if (!partners.length) {
      setSelectedPartnerId(null);
      setPartnerPickerOpen(false);
      return;
    }
    if (
      !selectedPartnerId ||
      !partners.some((p) => p.id === selectedPartnerId)
    ) {
      setSelectedPartnerId(partners[0].id);
    }
  }, [partners, selectedPartnerId]);

  const partnerProfile = useMemo<Profile | null>(() => {
    if (!partners.length) return null;
    if (!selectedPartnerId) return partners[0] ?? null;
    return (
      partners.find((profile) => profile.id === selectedPartnerId) ??
      partners[0] ??
      null
    );
  }, [partners, selectedPartnerId]);

  const partnerId = partnerProfile?.id ?? null;

  const activeKey = activeId ? String(activeId) : null;
  const partnerKey = partnerId ? String(partnerId) : null;

  const [activeVotes, partnerVotes] = useVotesStore(
    useShallow((state) => [
      activeKey
        ? (state.votesByProfile[activeKey] ?? EMPTY_PROFILE_VOTES)
        : EMPTY_PROFILE_VOTES,
      partnerKey
        ? (state.votesByProfile[partnerKey] ?? EMPTY_PROFILE_VOTES)
        : EMPTY_PROFILE_VOTES,
    ])
  );

  const {
    verified,
    isExpired,
    verify: verifyProfile,
    clear,
    closeForPair,
  } = usePrivacyGate(
    useShallow((state) => ({
      verified: state.verified,
      isExpired: state.isExpired,
      verify: state.verify,
      clear: state.clear,
      closeForPair: state.closeForPair,
    }))
  );

  const { kinksById } = useKinks(language === 'es' ? 'es' : 'en');

  useEffect(() => {
    if (hydrated && !activeId) {
      router.replace('/welcome');
    }
  }, [hydrated, activeId, router]);

  useEffect(() => {
    if (isExpired?.()) {
      clear();
      setSelectedTab('mutualYes');
      setPendingReveal(null);
      setPinModalProfiles([]);
    }
  }, [isExpired, clear]);

  useEffect(() => {
    if (!activeId || !partnerId) {
      previousPartnerId.current = partnerId;
      return;
    }

    if (previousPartnerId.current && previousPartnerId.current !== partnerId) {
      closeForPair?.(activeId, previousPartnerId.current);
      setSelectedTab('mutualYes');
      setPendingReveal(null);
      setPinModalProfiles([]);
    }

    previousPartnerId.current = partnerId;
  }, [activeId, partnerId, closeForPair]);

  const gateOpen = useMemo(() => {
    if (!activeId || !partnerId) return false;
    if (isExpired?.()) return false;
    return !!verified[activeId] && !!verified[partnerId];
  }, [verified, activeId, partnerId, isExpired]);

  useEffect(() => {
    if (!gateOpen && selectedTab === 'partialYes') {
      setSelectedTab('mutualYes');
    }
  }, [gateOpen, selectedTab]);

  useEffect(() => {
    setSelectedTab('mutualYes');
  }, [partnerId]);

  const rawBuckets = useMemo<VoteBuckets>(() => {
    if (!activeId || !partnerId) return EMPTY_VISIBLE_BUCKETS;
    const mutualYes: string[] = [];
    const mutualNo: string[] = [];
    const mutualMaybe: string[] = [];
    const partialYes: string[] = [];

    const keys = new Set<string>();
    for (const key of Object.keys(activeVotes)) {
      if (partnerVotes[key] !== undefined) {
        keys.add(key);
      }
    }

    keys.forEach((kinkId) => {
      const aVote = activeVotes[kinkId];
      const bVote = partnerVotes[kinkId];
      if (!aVote || !bVote) return;

      if (aVote === 'yes' && bVote === 'yes') {
        mutualYes.push(kinkId);
        return;
      }
      if (aVote === 'no' && bVote === 'no') {
        mutualNo.push(kinkId);
        return;
      }
      if (aVote === 'maybe' && bVote === 'maybe') {
        mutualMaybe.push(kinkId);
        return;
      }

      if (
        (aVote === 'yes' && bVote === 'maybe') ||
        (aVote === 'maybe' && bVote === 'yes')
      ) {
        partialYes.push(kinkId);
      }
    });

    return { mutualYes, mutualNo, mutualMaybe, partialYes };
  }, [activeId, partnerId, activeVotes, partnerVotes]);

  const visibleBuckets = useMemo(() => {
    if (gateOpen) return rawBuckets;
    return {
      mutualYes: rawBuckets.mutualYes,
      mutualNo: rawBuckets.mutualNo,
      mutualMaybe: rawBuckets.mutualMaybe,
      partialYes: [],
    };
  }, [rawBuckets, gateOpen]);

  const mapKinksToRows = useCallback(
    (ids: string[]): MatchRowItem[] => {
      const mapped = ids.map((id) => {
        const item = kinksById[id];
        const category = item?.category ?? 'Other';
        const tier = item?.tier ? item.tier.toUpperCase() : null;
        const subtitle =
          tier && category
            ? `${category} • ${tier}`
            : (tier ?? category ?? null);
        return {
          id: item?.id ?? id,
          title: item?.title ?? id,
          subtitle,
          aVote: activeVotes[id],
          bVote: partnerVotes[id],
          sortCategory: category.toLowerCase(),
        } satisfies MatchRowItem;
      });
      return mapped.sort((a, b) => {
        if (a.sortCategory === b.sortCategory) {
          return a.title.localeCompare(b.title);
        }
        return a.sortCategory.localeCompare(b.sortCategory);
      });
    },
    [activeVotes, kinksById, partnerVotes]
  );

  const tabOptions: TabOption[] = useMemo(() => {
    const options: TabOption[] = [
      {
        key: 'mutualYes',
        label: 'Mutual Yes',
        count: visibleBuckets.mutualYes.length,
      },
      {
        key: 'mutualNo',
        label: 'Mutual No',
        count: visibleBuckets.mutualNo.length,
      },
      {
        key: 'mutualMaybe',
        label: 'Mutual Maybe',
        count: visibleBuckets.mutualMaybe.length,
      },
    ];

    if (gateOpen) {
      options.push({
        key: 'partialYes',
        label: 'Partial Yes',
        count: rawBuckets.partialYes.length,
      });
    } else {
      options.push({
        key: 'partialYes',
        label: 'Partial Yes',
        locked: true,
      });
    }

    return options;
  }, [
    gateOpen,
    rawBuckets.partialYes.length,
    visibleBuckets.mutualMaybe.length,
    visibleBuckets.mutualNo.length,
    visibleBuckets.mutualYes.length,
  ]);

  const rows: MatchRowItem[] = useMemo(() => {
    switch (selectedTab) {
      case 'mutualYes':
        return mapKinksToRows(visibleBuckets.mutualYes);
      case 'mutualNo':
        return mapKinksToRows(visibleBuckets.mutualNo);
      case 'mutualMaybe':
        return mapKinksToRows(visibleBuckets.mutualMaybe);
      case 'partialYes':
        return gateOpen ? mapKinksToRows(visibleBuckets.partialYes) : [];
      default:
        return [];
    }
  }, [gateOpen, mapKinksToRows, selectedTab, visibleBuckets]);

  const hasAnyMatches = useMemo(() => {
    if (
      visibleBuckets.mutualYes.length ||
      visibleBuckets.mutualNo.length ||
      visibleBuckets.mutualMaybe.length
    ) {
      return true;
    }
    if (gateOpen && visibleBuckets.partialYes.length) {
      return true;
    }
    return false;
  }, [gateOpen, visibleBuckets]);

  const verificationQueue = useMemo<Profile[]>(() => {
    if (!activeProfile || !partnerProfile) return [];
    return [activeProfile, partnerProfile];
  }, [activeProfile, partnerProfile]);

  const openPinModal = useCallback(
    (mode: 'partial' | 'unlock') => {
      if (!verificationQueue.length) return;
      const missingPinProfile = verificationQueue.find(
        (profile) => !profile.pin
      );
      if (missingPinProfile) {
        const name = missingPinProfile.displayName ?? missingPinProfile.name;
        Alert.alert(
          'PIN required',
          `${name} needs a PIN to unlock Partial Yes matches. Set a PIN in Settings.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => router.push('/(settings)') },
          ]
        );
        return;
      }
      setPendingReveal(mode);
      setPinModalProfiles(verificationQueue);
      setPinModalVisible(true);
    },
    [verificationQueue, router]
  );

  const handlePartnerToggle = useCallback(() => {
    setPartnerPickerOpen((prev) => !prev);
  }, []);

  const handlePartnerSelect = useCallback((id: string) => {
    setSelectedPartnerId(id);
    setPartnerPickerOpen(false);
  }, []);

  const handleLockSensitive = useCallback(() => {
    clear();
    setSelectedTab('mutualYes');
    setPendingReveal(null);
    setPinModalProfiles([]);
  }, [clear]);

  const handlePinModalClose = useCallback(() => {
    setPinModalVisible(false);
    setPendingReveal(null);
    setPinModalProfiles([]);
  }, []);

  const handleVerifyProfilePin = useCallback(
    (profile: Profile, pin: string) => {
      if (!profile.pin) {
        return { success: false, error: 'PIN not set for this profile.' };
      }
      if (profile.pin !== pin) {
        return { success: false, error: 'Incorrect PIN' };
      }
      verifyProfile(profile.id);
      return { success: true };
    },
    [verifyProfile]
  );

  const handlePinModalSuccess = useCallback(() => {
    setPinModalVisible(false);
    if (pendingReveal === 'partial') {
      setSelectedTab('partialYes');
    }
    setPendingReveal(null);
    setPinModalProfiles([]);
  }, [pendingReveal]);

  const handleTabPress = useCallback(
    (option: TabOption) => {
      if (option.locked && !gateOpen) {
        openPinModal('partial');
        return;
      }
      setSelectedTab(option.key);
    },
    [gateOpen, openPinModal]
  );

  const handleUnlockPress = useCallback(() => {
    if (!gateOpen) {
      openPinModal('unlock');
    }
  }, [gateOpen, openPinModal]);

  if (!hydrated || !activeId) {
    return null;
  }

  if (!profiles.length) {
    return (
      <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
        <Text style={styles.h1}>No profiles yet</Text>
        <Text style={styles.p}>
          Create a profile to start swiping and build matches.
        </Text>
        <SettingsButton />
      </SafeAreaView>
    );
  }

  if (!partners.length || !partnerProfile || !activeProfile) {
    return (
      <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
        <Text style={styles.h1}>Need two profiles</Text>
        <Text style={styles.p}>
          Create another profile in Settings → Profiles to compare matches.
        </Text>
        <SettingsButton />
      </SafeAreaView>
    );
  }

  const partnerOptions: PartnerOption[] = partners.map((profile) => ({
    id: profile.id,
    label: `${profile.emoji} ${profile.displayName ?? profile.name}`,
  }));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Matches</Text>
        <Text style={styles.subtitle}>
          {activeProfile.emoji}{' '}
          {activeProfile.displayName ?? activeProfile.name} •{' '}
          {partnerProfile.emoji}{' '}
          {partnerProfile.displayName ?? partnerProfile.name}
        </Text>
      </View>

      {partners.length > 1 ? (
        <View style={styles.partnerPicker}>
          <Pressable
            style={styles.partnerButton}
            accessibilityRole="button"
            accessibilityLabel="Choose partner to compare"
            onPress={handlePartnerToggle}
          >
            <Text style={styles.partnerButtonLabel}>
              Viewing with {partnerProfile.emoji}{' '}
              {partnerProfile.displayName ?? partnerProfile.name}
            </Text>
          </Pressable>
          {partnerPickerOpen ? (
            <View style={styles.partnerDropdown}>
              {partnerOptions.map((option) => (
                <Pressable
                  key={option.id}
                  style={[
                    styles.partnerOption,
                    option.id === partnerProfile.id &&
                      styles.partnerOptionActive,
                  ]}
                  onPress={() => handlePartnerSelect(option.id)}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.partnerOptionLabel,
                      option.id === partnerProfile.id &&
                        styles.partnerOptionLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.tabs}>
        {tabOptions.map((option) => (
          <Pressable
            key={option.key}
            style={[
              styles.tabButton,
              selectedTab === option.key && styles.tabButtonActive,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedTab === option.key }}
            onPress={() => handleTabPress(option)}
          >
            <Text
              style={[
                styles.tabLabel,
                selectedTab === option.key && styles.tabLabelActive,
              ]}
            >
              {option.label}
              {typeof option.count === 'number'
                ? ` (${option.count})`
                : option.locked
                  ? ' 🔒'
                  : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sensitiveBanner}>
        {gateOpen ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.sensitiveTitle}>Partial Yes unlocked</Text>
            <Text style={styles.sensitiveCopy}>
              They will lock again after inactivity or when you choose to hide
              them.
            </Text>
            <Pressable
              style={styles.lockButton}
              onPress={handleLockSensitive}
              accessibilityRole="button"
            >
              <Text style={styles.lockButtonLabel}>Lock Partial Yes</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            <Text style={styles.sensitiveTitle}>Partial Yes locked</Text>
            <Text style={styles.sensitiveCopy}>
              Unlock to reveal "Yes + Maybe" matches. Both profiles must enter
              their PIN.
            </Text>
            <Pressable
              style={styles.unlockButton}
              onPress={handleUnlockPress}
              accessibilityRole="button"
            >
              <Text style={styles.unlockButtonLabel}>Unlock Partial Yes</Text>
            </Pressable>
          </View>
        )}
      </View>

      {hasAnyMatches ? (
        rows.length ? (
          <FlatList
            data={rows}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MatchRow
                title={item.title}
                subtitle={item.subtitle}
                aEmoji={activeProfile?.emoji}
                bEmoji={partnerProfile?.emoji}
                aVote={item.aVote}
                bVote={item.bVote}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              No{' '}
              {tabOptions
                .find((tab) => tab.key === selectedTab)
                ?.label.toLowerCase()}{' '}
              yet
            </Text>
            <Text style={styles.emptyCopy}>Keep swiping to uncover more.</Text>
          </View>
        )
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyCopy}>
            Keep swiping together—only shared interest shows up here.
          </Text>
        </View>
      )}

      <SettingsButton />

      <PinVerifyModal
        open={pinModalVisible}
        profiles={pinModalProfiles}
        onClose={handlePinModalClose}
        onSuccess={handlePinModalSuccess}
        onVerifyProfile={handleVerifyProfilePin}
      />

      <MatchesDebug
        activeId={activeId ?? null}
        partnerId={partnerId}
        aVotes={activeVotes}
        bVotes={partnerVotes}
        buckets={rawBuckets}
        gateOpen={gateOpen}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0f14', paddingBottom: 12 },
  wrap: {
    flex: 1,
    backgroundColor: '#0b0f14',
    padding: 16,
    gap: 12,
    justifyContent: 'center',
  },
  h1: { color: 'white', fontWeight: '900', fontSize: 22 },
  p: { color: '#94a3b8' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 6 },
  title: { color: 'white', fontSize: 24, fontWeight: '900' },
  subtitle: { color: '#93c5fd', fontWeight: '600' },
  partnerPicker: { paddingHorizontal: 16, marginBottom: 8 },
  partnerButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
  },
  partnerButtonLabel: { color: 'white', fontWeight: '700' },
  partnerDropdown: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
    overflow: 'hidden',
  },
  partnerOption: { paddingVertical: 10, paddingHorizontal: 14 },
  partnerOptionActive: { backgroundColor: '#1d4ed8' },
  partnerOptionLabel: { color: 'white', fontWeight: '600' },
  partnerOptionLabelActive: { color: 'white' },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  tabLabel: { color: '#cbd5e1', fontWeight: '700' },
  tabLabelActive: { color: 'white' },
  sensitiveBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  sensitiveTitle: { color: 'white', fontWeight: '800', fontSize: 16 },
  sensitiveCopy: { color: '#94a3b8' },
  unlockButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#2563eb',
  },
  unlockButtonLabel: { color: 'white', fontWeight: '800' },
  lockButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1f2937',
  },
  lockButtonLabel: { color: '#f97316', fontWeight: '700' },
  listContent: { paddingBottom: 24, paddingHorizontal: 16 },
  separator: { height: 1, backgroundColor: '#111827' },
  emptyState: {
    marginTop: 32,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  emptyTitle: { color: 'white', fontWeight: '800', fontSize: 18 },
  emptyCopy: { color: '#94a3b8', textAlign: 'center' },
});
