export type AccountStatus =
  | 'local-only'
  | 'anonymous'
  | 'permanent'
  | 'recovering'
  | 'error';

export type ProviderCredential = {
  provider: 'apple' | 'google';
  token: string;
  nonce?: string;
  accessToken?: string;
  authorizationCode?: string;
};

export type AccountSnapshot = {
  status: AccountStatus;
  userId: string | null;
  providers: ('apple' | 'google')[];
  error: { code: string; message: string } | null;
};

export interface AccountServiceLike {
  getSnapshot(): Promise<AccountSnapshot>;
  ensureAnonymousUser(): Promise<string>;
  requirePermanentUser(): Promise<string>;
  linkProvider(input: ProviderCredential): Promise<AccountSnapshot>;
  signIn(input: ProviderCredential): Promise<AccountSnapshot>;
  signOut(): Promise<void>;
  forgetCurrentDevice(): Promise<void>;
}
