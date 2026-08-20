export type RecoveryDestination =
  | '/(tabs)/deck'
  | '/(auth)/confirm-profile'
  | {
      pathname: '/(settings)/profiles/new';
      params: { from: 'account-recovery' };
    };

export function getRecoveryDestination(input: {
  profileCount: number;
  requiresConfirmation: boolean;
}): RecoveryDestination {
  if (!input.requiresConfirmation) return '/(tabs)/deck';

  if (input.profileCount === 0) {
    return {
      pathname: '/(settings)/profiles/new',
      params: { from: 'account-recovery' },
    };
  }

  return '/(auth)/confirm-profile';
}
