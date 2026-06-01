import {
  getAppEntryDestination,
  getProfileCreatedDestination,
  getWelcomeCompletionDestination,
} from '../lib/welcome/routing';

describe('welcome onboarding routing', () => {
  it('routes users without an active profile to the settings profile creation screen', () => {
    expect(getWelcomeCompletionDestination(false, false)).toEqual({
      pathname: '/(settings)/profiles/new',
      params: { from: 'welcome' },
    });
  });

  it('routes users with an active profile to the deck', () => {
    expect(getWelcomeCompletionDestination(true, true)).toBe('/(tabs)/deck');
  });

  it('routes unverified users to the welcome flow', () => {
    expect(getAppEntryDestination(false, true, false)).toBe('/welcome');
  });

  it('waits for profiles to hydrate before routing verified users', () => {
    expect(getAppEntryDestination(true, false, false)).toBeNull();
  });

  it('routes verified users without an active profile back to welcome', () => {
    expect(getAppEntryDestination(true, true, false)).toBe('/welcome');
  });

  it('routes verified users with an active profile to the deck', () => {
    expect(getAppEntryDestination(true, true, true)).toBe('/(tabs)/deck');
  });

  it('routes a welcome-created profile to the comfort picker before the deck', () => {
    expect(getProfileCreatedDestination(true, 'profile-123')).toEqual({
      pathname: '/(settings)/profiles/comfort',
      params: { from: 'welcome', profileId: 'profile-123' },
    });
  });

  it('does not override normal profile creation navigation', () => {
    expect(getProfileCreatedDestination(false, 'profile-123')).toBeNull();
  });
});
