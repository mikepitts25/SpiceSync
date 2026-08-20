import { useCoupleLinkStore } from '../lib/sync/coupleLink';
import { useEventQueueStore } from '../lib/sync/eventQueue';
import {
  requestRevealUnlock,
  useRevealConsentStore,
} from '../lib/sync/revealConsent';

const mockGetIdentityIfExists = jest.fn();

jest.mock('../lib/sync/identity', () => ({
  getIdentityIfExists: () => mockGetIdentityIfExists(),
}));

function activeOwnedLink() {
  return {
    coupleId: 'couple-reveal',
    ownerUserId: 'user-reveal',
    myDeviceId: 'device-me',
    partnerDeviceId: 'device-partner',
    partnerSigningPublicKey: 'sign-partner',
    partnerEncryptionPublicKey: 'enc-partner',
    linkedAt: 1,
    lastPulledServerSequence: 0,
    lastSyncedAt: null,
    requiresProfileConfirmation: false,
    status: 'active' as const,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

describe('reveal sync ownership', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRevealConsentStore.setState({ local: {}, partner: {} });
    useEventQueueStore.setState({
      pending: [],
      quarantined: [],
      nextClientSequence: 1,
    } as never);
    useCoupleLinkStore.setState({
      link: activeOwnedLink(),
      authenticatedUserId: 'user-reveal',
      remoteSyncPauseReason: null,
    } as never);
  });

  it('does not load identity or enqueue reveal consent before profile confirmation', async () => {
    useCoupleLinkStore.setState({
      link: {
        ...activeOwnedLink(),
        requiresProfileConfirmation: true,
      },
    } as never);

    await requestRevealUnlock('mutualMaybe');

    expect(mockGetIdentityIfExists).not.toHaveBeenCalled();
    expect(useEventQueueStore.getState().pending).toEqual([]);
  });

  it('rechecks ownership after identity loading and enqueues nothing when sign-out pauses in flight', async () => {
    const identity = deferred<{
      identity: { deviceId: string };
    } | null>();
    mockGetIdentityIfExists.mockReturnValue(identity.promise);

    const request = requestRevealUnlock('partialYesMaybe');
    await Promise.resolve();
    useCoupleLinkStore.setState({
      remoteSyncPauseReason: 'signed-out',
      authenticatedUserId: null,
    } as never);
    identity.resolve({ identity: { deviceId: 'device-me' } });
    await request;

    expect(useEventQueueStore.getState().pending).toEqual([]);
  });
});
