import { create } from 'zustand';

import { getAccountService } from './accountService';
import type { AccountSnapshot } from './types';

type AccountStoreState = AccountSnapshot & {
  setSnapshot: (snapshot: AccountSnapshot) => void;
};

const initialSnapshot: AccountSnapshot = {
  status: 'local-only',
  userId: null,
  providers: [],
  error: null,
};

export const useAccountStore = create<AccountStoreState>()((set) => ({
  ...initialSnapshot,
  setSnapshot: (snapshot) => set(snapshot),
}));

/**
 * Cold start resolves the account exactly once, and a paused link only resumes
 * once a real user id is known. A transient network or server auth failure must
 * therefore not end the attempt, or an owned link stays paused for the whole
 * process lifetime with only an AppState transition to recover it.
 */
const BOOTSTRAP_RETRY_DELAYS_MS = [400, 1200, 3000];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function bootstrapAccountState(
  retryDelaysMs: readonly number[] = BOOTSTRAP_RETRY_DELAYS_MS
): Promise<AccountSnapshot> {
  const service = getAccountService();
  let snapshot = await service.getSnapshot();

  for (const wait of retryDelaysMs) {
    // Only an error snapshot is retryable. A `local-only` result is Supabase's
    // real answer for empty storage, and anonymous/permanent are resolved.
    if (snapshot.status !== 'error') break;
    await delay(wait);
    snapshot = await service.getSnapshot();
  }

  useAccountStore.getState().setSnapshot(snapshot);
  return snapshot;
}
