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
    expect(getAppEntryDestination(true, false, true, false)).toBe('/welcome');
  });

  it('waits for persisted age consent before making a launch decision', () => {
    expect(getAppEntryDestination(false, false, true, true)).toBeNull();
  });

  it('waits for profiles to hydrate before routing verified users', () => {
    expect(getAppEntryDestination(true, true, false, false)).toBeNull();
  });

  it('routes verified users without an active profile back to welcome', () => {
    expect(getAppEntryDestination(true, true, true, false)).toBe('/welcome');
  });

  it('routes verified users with an active profile to the deck', () => {
    expect(getAppEntryDestination(true, true, true, true)).toBe('/(tabs)/deck');
  });

  it('waits for durable age-consent persistence before leaving welcome', async () => {
    const routing = require('../lib/welcome/routing') as {
      completeAgeGateAcceptance?: (input: {
        confirmAge: () => void;
        waitForPersistence: () => Promise<void>;
        navigate: () => void;
      }) => Promise<void>;
    };
    const calls: string[] = [];
    let finishPersistence: (() => void) | undefined;
    const persistence = new Promise<void>((resolve) => {
      finishPersistence = resolve;
    });

    expect(routing.completeAgeGateAcceptance).toEqual(expect.any(Function));
    const completion = routing.completeAgeGateAcceptance!({
      confirmAge: () => calls.push('confirmed'),
      waitForPersistence: () => persistence,
      navigate: () => calls.push('navigated'),
    });
    await Promise.resolve();

    expect(calls).toEqual(['confirmed']);

    finishPersistence?.();
    await completion;
    expect(calls).toEqual(['confirmed', 'navigated']);
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

  it('links the welcome readiness gate to legal screens before confirmation', () => {
    const fs = require('fs');
    const path = require('path');
    const welcomeFlow = fs.readFileSync(
      path.join(__dirname, '..', 'app', 'welcome', 'WelcomeFlow.tsx'),
      'utf8'
    );

    expect(welcomeFlow).toContain("'/(settings)/privacy-policy'");
    expect(welcomeFlow).toContain("'/(settings)/terms-of-service'");
    expect(welcomeFlow).toContain('disabled={!readyToAccept}');
  });

  it('allows readiness checklist text to wrap inside the age gate card', () => {
    const fs = require('fs');
    const path = require('path');
    const welcomeFlow = fs.readFileSync(
      path.join(__dirname, '..', 'app', 'welcome', 'WelcomeFlow.tsx'),
      'utf8'
    );

    expect(welcomeFlow).toContain('readinessCheckWrap');
    expect(welcomeFlow).toContain('flexShrink: 0');
    expect(welcomeFlow).toContain('minWidth: 0');
    expect(welcomeFlow).toContain('flexShrink: 1');
  });
});
