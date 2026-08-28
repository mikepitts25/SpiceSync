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
  if (input.profileCount === 0) {
    return {
      pathname: '/(settings)/profiles/new',
      params: { from: 'account-recovery' },
    };
  }

  if (!input.requiresConfirmation) return '/(tabs)/deck';

  return '/(auth)/confirm-profile';
}
