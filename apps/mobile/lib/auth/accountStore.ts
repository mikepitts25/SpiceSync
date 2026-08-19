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

export async function bootstrapAccountState(): Promise<AccountSnapshot> {
  const snapshot = await getAccountService().getSnapshot();
  useAccountStore.getState().setSnapshot(snapshot);
  return snapshot;
}
