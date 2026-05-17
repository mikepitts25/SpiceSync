import { useRevealConsentStore } from '../lib/sync/revealConsent';

describe('reveal consent', () => {
  beforeEach(() => {
    useRevealConsentStore.setState({ local: {}, partner: {} });
  });

  it('unlocks local comparisons with local consent only', () => {
    useRevealConsentStore.getState().grantLocal('partialYesMaybe', 100);

    expect(
      useRevealConsentStore.getState().hasUnlock('partialYesMaybe', false)
    ).toBe(true);
  });

  it('requires local and partner consent for remote comparisons', () => {
    const store = useRevealConsentStore.getState();

    store.grantLocal('mutualMaybe', 100);
    expect(store.hasUnlock('mutualMaybe', true)).toBe(false);

    store.applyPartnerConsent('mutualMaybe', 101);
    expect(
      useRevealConsentStore.getState().hasUnlock('mutualMaybe', true)
    ).toBe(true);
  });
});
