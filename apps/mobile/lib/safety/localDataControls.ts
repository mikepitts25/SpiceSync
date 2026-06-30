import { useProfilesStore } from '../state/profiles';
import { useSettings } from '../state/useStore';
import { useCoupleLinkStore } from '../sync/coupleLink';
import { useEventQueueStore } from '../sync/eventQueue';
import { clearIdentity } from '../sync/identity';
import { usePartnerVotesStore } from '../sync/partnerVotes';
import { useRevealConsentStore } from '../sync/revealConsent';
import { useVoteSyncStore } from '../sync/voteSync';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useVotesStore } from '../../src/stores/votes';

export function clearActiveProfileVotes(): boolean {
  const activeProfileId = useProfilesStore.getState().getActiveProfileId();
  if (!activeProfileId) return false;
  useVotesStore.getState().clearProfile(activeProfileId);
  return true;
}

export function disconnectRemotePartnerLocal(): void {
  useCoupleLinkStore.getState().clear();
  usePartnerVotesStore.getState().reset();
  useRevealConsentStore.getState().reset();
  useEventQueueStore.getState().reset();
}

export async function resetAppOnDevice(): Promise<void> {
  useProfilesStore.getState().resetAllProfiles();
  useVotesStore.setState({ votesByProfile: {} });
  disconnectRemotePartnerLocal();
  useVoteSyncStore.getState().reset();
  useSettingsStore.setState({
    activeProfileId: null,
    profiles: [],
    ageVerified: false,
  });
  useSettings.getState().setAgeConfirmed(false);
  await clearIdentity();
}
