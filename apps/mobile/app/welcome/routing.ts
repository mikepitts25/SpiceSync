export type WelcomeCompletionDestination =
  | '/(tabs)/deck'
  | {
      pathname: '/(settings)/profiles/new';
      params: { from: 'welcome' };
    };

export type ProfileCreatedDestination =
  | {
      pathname: '/(settings)/profiles/comfort';
      params: { from: 'welcome'; profileId: string };
    }
  | null;

export type AppEntryDestination = '/welcome' | WelcomeCompletionDestination | null;

export function getAppEntryDestination(
  ageConfirmed: boolean,
  hydrated: boolean,
  hasActiveProfile: boolean
): AppEntryDestination {
  if (!ageConfirmed) {
    return '/welcome';
  }

  if (!hydrated) {
    return null;
  }

  if (!hasActiveProfile) {
    return '/welcome';
  }

  return getWelcomeCompletionDestination(hydrated, hasActiveProfile);
}

export function getWelcomeCompletionDestination(
  hydrated: boolean,
  hasActiveProfile: boolean
): WelcomeCompletionDestination {
  if (hydrated && hasActiveProfile) {
    return '/(tabs)/deck';
  }

  return {
    pathname: '/(settings)/profiles/new',
    params: { from: 'welcome' },
  };
}

export function getProfileCreatedDestination(
  fromWelcome: boolean,
  profileId: string
): ProfileCreatedDestination {
  if (!fromWelcome) {
    return null;
  }

  return {
    pathname: '/(settings)/profiles/comfort',
    params: { from: 'welcome', profileId },
  };
}
