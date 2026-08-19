export type WelcomeCompletionDestination =
  | '/(tabs)/deck'
  | {
      pathname: '/(settings)/profiles/new';
      params: { from: 'welcome' };
    };

export type ProfileCreatedDestination = {
  pathname: '/(settings)/profiles/comfort';
  params: { from: 'welcome'; profileId: string };
} | null;

export type AppEntryDestination =
  | '/welcome'
  | WelcomeCompletionDestination
  | null;

export async function completeAgeGateAcceptance(input: {
  confirmAge: () => void;
  waitForPersistence: () => Promise<void>;
  navigate: () => void;
}): Promise<void> {
  input.confirmAge();
  await input.waitForPersistence();
  input.navigate();
}

export function getAppEntryDestination(
  settingsHydrated: boolean,
  ageConfirmed: boolean,
  profilesHydrated: boolean,
  hasActiveProfile: boolean
): AppEntryDestination {
  if (!settingsHydrated) {
    return null;
  }

  if (!ageConfirmed) {
    return '/welcome';
  }

  if (!profilesHydrated) {
    return null;
  }

  if (!hasActiveProfile) {
    return '/welcome';
  }

  return getWelcomeCompletionDestination(profilesHydrated, hasActiveProfile);
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
