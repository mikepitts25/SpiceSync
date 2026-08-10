import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';

import { SafeAreaView } from '../../components/SafeAreaView';
import { BackHeader } from '../../components/app-chrome';
import { GameButton, GameSurface } from '../../components/game/GameControls';
import { MatchMissionEmptyState } from '../../components/game/MatchMissionEmptyState';
import {
  MatchMissionActiveCard,
  MatchMissionDraftCard,
} from '../../components/game/MatchMissionCard';
import { MatchMissionHistory } from '../../components/game/MatchMissionHistory';
import { COLORS } from '../../constants/theme';
import { useTranslation, interpolate } from '../../lib/i18n';
import { useKinks } from '../../lib/data';
import { useProfilesStore } from '../../lib/state/profiles';
import { useCoupleLinkStore } from '../../lib/sync/coupleLink';
import { usePartnerVotesStore } from '../../lib/sync/partnerVotes';
import { useVotesStore, type KinkVote } from '../../src/stores/votes';
import { computeMutualYesKinks } from '../../lib/gameMatchDeck';
import { useMatchMissionsStore } from '../../lib/state/matchMissions';
import { useStreakStore } from '../../lib/achievements';
import {
  remainingMissionMs,
  formatRemainingDuration,
} from '../../lib/matchMissions';
import { PremiumGate } from '../../components/PremiumGate';

function MatchMissionsScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();

  const { profiles, activeProfileId, hasActiveProfile } = useProfilesStore(
    useShallow((state) => ({
      profiles: state.getProfiles(),
      activeProfileId: state.getActiveProfileId(),
      hasActiveProfile: state.hasActiveProfile(),
    }))
  );
  const activeKey = activeProfileId ? String(activeProfileId) : null;

  const coupleLink = useCoupleLinkStore((state) => state.link);
  const isRemotePartner = coupleLink?.status === 'active';
  const partnerKey = useMemo(() => {
    const partner = profiles.find((profile) => profile.id !== activeProfileId);
    return partner ? String(partner.id) : null;
  }, [profiles, activeProfileId]);

  const [activeVotes, localPartnerVotes] = useVotesStore(
    useShallow((state) => [
      activeKey ? state.votesByProfile[activeKey] : undefined,
      partnerKey ? state.votesByProfile[partnerKey] : undefined,
    ])
  );
  const remotePartnerVotes = usePartnerVotesStore((state) => state.byCardId);
  const partnerVotesMap = useMemo(() => {
    if (!isRemotePartner) return localPartnerVotes;
    return Object.fromEntries(
      Object.entries(remotePartnerVotes).map(([cardId, record]) => [
        cardId,
        record.pairPreference || record.readiness
          ? {
              value: record.vote,
              pairPreference: record.pairPreference,
              readiness: record.readiness,
            }
          : record.vote,
      ])
    ) as Record<string, KinkVote>;
  }, [isRemotePartner, localPartnerVotes, remotePartnerVotes]);

  const hasPartnerLink = isRemotePartner || !!partnerKey;

  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');
  const mutualYesKinks = useMemo(
    () => computeMutualYesKinks(kinks, activeVotes, partnerVotesMap),
    [kinks, activeVotes, partnerVotesMap]
  );

  const missionsStore = useMatchMissionsStore();
  const activeMission = activeKey
    ? missionsStore.getActiveMission(activeKey)
    : undefined;
  const draft = activeKey ? missionsStore.getDraft(activeKey) : undefined;
  const history = activeKey ? missionsStore.getHistory(activeKey) : [];

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!activeKey) return;
    missionsStore.expireDueMissions(activeKey);
  }, [activeKey, missionsStore]);

  useEffect(() => {
    if (!activeMission) return;
    const interval = setInterval(() => {
      setNow(Date.now());
      if (activeKey) missionsStore.expireDueMissions(activeKey);
    }, 30_000);
    return () => clearInterval(interval);
  }, [activeMission, activeKey, missionsStore]);

  const drawMission = useCallback(() => {
    if (!activeKey) return;
    missionsStore.drawCandidate(activeKey, mutualYesKinks, { language });
  }, [activeKey, missionsStore, mutualYesKinks, language]);

  const startMission = useCallback(() => {
    if (!activeKey) return;
    missionsStore.startDraftedMission(activeKey);
    useStreakStore.getState().recordGamePlayed('match-missions');
  }, [activeKey, missionsStore]);

  const completeMission = useCallback(() => {
    if (!activeKey) return;
    missionsStore.completeMission(activeKey);
    useStreakStore.getState().recordMissionCompleted();
  }, [activeKey, missionsStore]);

  const skipMission = useCallback(() => {
    if (!activeKey) return;
    missionsStore.skipMission(activeKey);
  }, [activeKey, missionsStore]);

  const outcomeLabels = useMemo(
    () => ({
      completed: t.matchMissions.outcomeCompleted,
      skipped: t.matchMissions.outcomeSkipped,
      expired: t.matchMissions.outcomeExpired,
    }),
    [t]
  );

  let body: React.ReactNode;

  if (!hasActiveProfile || !hasPartnerLink) {
    body = (
      <MatchMissionEmptyState
        title={t.matchMissions.noPartnerTitle}
        body={t.matchMissions.noPartnerBody}
        ctaLabel={t.matchMissions.backToBrowse}
        onPressCta={() => router.push('/(tabs)/browse')}
      />
    );
  } else if (mutualYesKinks.length === 0 && !activeMission && !draft) {
    body = (
      <MatchMissionEmptyState
        title={t.matchMissions.emptyTitle}
        body={t.matchMissions.emptyBody}
        ctaLabel={t.matchMissions.emptyCta}
        onPressCta={() => router.push('/(tabs)/browse')}
      />
    );
  } else if (activeMission) {
    const remaining = remainingMissionMs(activeMission, now);
    const isExpired = activeMission.status !== 'active';
    body = (
      <MatchMissionActiveCard
        eyebrow={t.matchMissions.activeTitle}
        copy={activeMission.copy}
        timeRemainingLabel={interpolate(t.matchMissions.timeRemaining, {
          time: formatRemainingDuration(remaining),
        })}
        expiredLabel={t.matchMissions.expired}
        isExpired={isExpired}
        completeLabel={t.matchMissions.complete}
        skipLabel={t.matchMissions.skip}
        onComplete={completeMission}
        onSkip={skipMission}
      />
    );
  } else if (draft) {
    body = (
      <MatchMissionDraftCard
        eyebrow={t.matchMissions.draftTitle}
        hint={t.matchMissions.draftHint}
        copy={draft.copy}
        startLabel={t.matchMissions.startMission}
        notYetLabel={t.matchMissions.notYet}
        onStart={startMission}
        onDrawAnother={drawMission}
      />
    );
  } else {
    body = (
      <GameSurface elevated style={styles.drawPrompt}>
        <Text style={styles.drawPromptText}>{t.matchMissions.subtitle}</Text>
        <GameButton label={t.matchMissions.drawMission} onPress={drawMission} />
      </GameSurface>
    );
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <BackHeader
        title={t.matchMissions.title}
        subtitle={t.matchMissions.subtitle}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {body}

        {hasActiveProfile && hasPartnerLink ? (
          <Text style={styles.consentNote}>{t.matchMissions.consentNote}</Text>
        ) : null}

        {hasActiveProfile && hasPartnerLink ? (
          <MatchMissionHistory
            title={t.matchMissions.historyTitle}
            emptyLabel={t.matchMissions.historyEmpty}
            entries={history}
            outcomeLabels={outcomeLabels}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function PremiumMatchMissionsScreen() {
  return (
    <PremiumGate>
      <MatchMissionsScreen />
    </PremiumGate>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: 16,
    gap: 18,
  },
  drawPrompt: {
    padding: 20,
    gap: 14,
    alignItems: 'center',
  },
  drawPromptText: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  consentNote: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 21,
    textAlign: 'center',
  },
});
