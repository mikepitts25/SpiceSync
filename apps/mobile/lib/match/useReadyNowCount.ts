// Ready Now count for the Matches tab badge — the same derivation the
// matches screen uses (computeActionBuckets over both partners' votes),
// memoized so the tab bar stays cheap on unrelated re-renders.
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useKinks } from '../data';
import { computeActionBuckets } from './actionBuckets';
import { useProfilesStore } from '../state/profiles';
import { useCoupleLinkStore } from '../sync/coupleLink';
import { usePartnerVotesStore } from '../sync/partnerVotes';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useVotesStore, type KinkVote } from '../../src/stores/votes';

export function useReadyNowCount(): number {
  const language = useSettingsStore((state) => state.language);
  const coupleLink = useCoupleLinkStore((state) => state.link);
  const isRemotePartner = coupleLink?.status === 'active';
  const { profiles, activeProfileId } = useProfilesStore(
    useShallow((state) => ({
      profiles: state.getProfiles(),
      activeProfileId: state.getActiveProfileId(),
    }))
  );
  const activeKey = activeProfileId ? String(activeProfileId) : null;
  const partnerKey = useMemo(() => {
    const partner = profiles.find((profile) => profile.id !== activeProfileId);
    return partner ? String(partner.id) : null;
  }, [profiles, activeProfileId]);
  const [mine, localTheirs] = useVotesStore(
    useShallow((state) => [
      activeKey ? state.votesByProfile[activeKey] : undefined,
      partnerKey ? state.votesByProfile[partnerKey] : undefined,
    ])
  );
  const remotePartnerVotes = usePartnerVotesStore((state) => state.byCardId);
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');

  return useMemo(() => {
    const theirs = isRemotePartner
      ? (Object.fromEntries(
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
        ) as Record<string, KinkVote>)
      : localTheirs;

    if (!mine || !theirs) return 0;
    if (!Object.keys(mine).length || !Object.keys(theirs).length) return 0;

    return computeActionBuckets({ kinks, mine, theirs }).readyNow.length;
  }, [isRemotePartner, remotePartnerVotes, localTheirs, mine, kinks]);
}
