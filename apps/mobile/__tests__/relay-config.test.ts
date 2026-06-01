import { RelayClient } from '../lib/sync/relayClient';
import {
  _resetRelayClientForTests,
  getRelayClient,
  setRelayBaseUrl,
} from '../lib/sync/relayConfig';
import { isSupabaseRelayConfigured } from '../lib/sync/supabaseConfig';

jest.mock('../lib/sync/supabaseConfig', () => ({
  isSupabaseRelayConfigured: jest.fn(),
}));

jest.mock(
  '../lib/sync/supabaseClient',
  () => ({
    getConfiguredSupabaseRelayClient: jest.fn(),
  }),
  { virtual: true }
);

describe('relay transport selection', () => {
  beforeEach(() => {
    _resetRelayClientForTests();
    setRelayBaseUrl(null);
    jest.mocked(isSupabaseRelayConfigured).mockReset();
    const { getConfiguredSupabaseRelayClient } = jest.requireMock(
      '../lib/sync/supabaseClient'
    );
    jest.mocked(getConfiguredSupabaseRelayClient).mockReset();
  });

  it('uses the existing HTTP relay client when Supabase is not configured', () => {
    jest.mocked(isSupabaseRelayConfigured).mockReturnValue(false);
    const { getConfiguredSupabaseRelayClient } = jest.requireMock(
      '../lib/sync/supabaseClient'
    );

    const client = getRelayClient();

    expect(client).toBeInstanceOf(RelayClient);
    expect(getConfiguredSupabaseRelayClient).not.toHaveBeenCalled();
  });

  it('uses the Supabase relay client when Supabase is configured', () => {
    const supabaseRelay = { health: jest.fn() };
    const { getConfiguredSupabaseRelayClient } = jest.requireMock(
      '../lib/sync/supabaseClient'
    );
    jest.mocked(isSupabaseRelayConfigured).mockReturnValue(true);
    jest
      .mocked(getConfiguredSupabaseRelayClient)
      .mockReturnValue(supabaseRelay as never);

    expect(getRelayClient()).toBe(supabaseRelay);
    expect(getConfiguredSupabaseRelayClient).toHaveBeenCalledTimes(1);
  });
});
