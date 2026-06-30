import {
  getStoreKitAppAccountToken,
  normalizeStoreKitAppAccountToken,
} from '../lib/purchases/storeKitAccountToken';
import { getConfiguredSupabaseRelayClient } from '../lib/sync/supabaseClient';
import { isSupabaseRelayConfigured } from '../lib/sync/supabaseConfig';

jest.mock('../lib/sync/supabaseConfig', () => ({
  isSupabaseRelayConfigured: jest.fn(),
}));

jest.mock('../lib/sync/supabaseClient', () => ({
  getConfiguredSupabaseRelayClient: jest.fn(),
}));

const mockedIsSupabaseRelayConfigured = jest.mocked(
  isSupabaseRelayConfigured
);
const mockedGetConfiguredSupabaseRelayClient = jest.mocked(
  getConfiguredSupabaseRelayClient
);

describe('StoreKit account token', () => {
  beforeEach(() => {
    mockedIsSupabaseRelayConfigured.mockReset();
    mockedGetConfiguredSupabaseRelayClient.mockReset();
  });

  it('normalizes canonical Supabase auth UUIDs for StoreKit', () => {
    expect(
      normalizeStoreKitAppAccountToken(
        ' F81D4FAE-7DEC-11D0-A765-00A0C91E6BF6 '
      )
    ).toBe('f81d4fae-7dec-11d0-a765-00a0c91e6bf6');
    expect(normalizeStoreKitAppAccountToken('user-1')).toBeNull();
  });

  it('returns null when Supabase auth is not configured', async () => {
    mockedIsSupabaseRelayConfigured.mockReturnValue(false);

    await expect(getStoreKitAppAccountToken()).resolves.toBeNull();
    expect(mockedGetConfiguredSupabaseRelayClient).not.toHaveBeenCalled();
  });

  it('uses the authenticated Supabase user id when Supabase is configured', async () => {
    mockedIsSupabaseRelayConfigured.mockReturnValue(true);
    mockedGetConfiguredSupabaseRelayClient.mockReturnValue({
      getAuthenticatedUserId: jest
        .fn()
        .mockResolvedValue('9B2F6D55-9B8A-4DBB-B9DD-5120F20FD533'),
    } as unknown as ReturnType<typeof getConfiguredSupabaseRelayClient>);

    await expect(getStoreKitAppAccountToken()).resolves.toBe(
      '9b2f6d55-9b8a-4dbb-b9dd-5120f20fd533'
    );
  });
});
