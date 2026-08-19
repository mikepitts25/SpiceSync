import { redirectSystemPath } from '../app/+native-intent';

describe('invite native intent routing', () => {
  it('rewrites an incoming invite URL before Expo Router matches routes', () => {
    expect(
      redirectSystemPath({
        path: 'spicesync://link/inv_abc123#secret_123-xyz',
        initial: true,
      })
    ).toBe(
      '/partner-connect?remoteInviteId=inv_abc123&remoteInviteSecret=secret_123-xyz'
    );
  });
});
