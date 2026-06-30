import { RelayClient, RelayHttpError } from '../lib/sync/relayClient';

describe('RelayClient', () => {
  it('creates an invite using fetch', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ inviteId: 'inv_1', inviteUrl: 'https://example.com/link/inv_1' }),
    });
    const client = new RelayClient('https://relay.example.com', fetchMock);

    await expect(
      client.createInvite({
        inviterDeviceId: 'dev_a',
        inviterPublicKey: 'pub_a',
        inviterSigningPublicKey: 'sign_pub_a',
        inviteSecretHash: 'hash',
      }),
    ).resolves.toEqual({
      inviteId: 'inv_1',
      inviteUrl: 'https://example.com/link/inv_1',
    });

    expect(fetchMock).toHaveBeenCalledWith('https://relay.example.com/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inviterDeviceId: 'dev_a',
        inviterPublicKey: 'pub_a',
        inviterSigningPublicKey: 'sign_pub_a',
        inviteSecretHash: 'hash',
      }),
    });
  });

  it('throws structured errors for failed responses', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 410,
      json: async () => ({ error: { code: 'INVITE_EXPIRED', message: 'Invite expired' } }),
    });
    const client = new RelayClient('https://relay.example.com', fetchMock);

    await expect(client.getInvite('inv_1')).rejects.toMatchObject({
      name: 'RelayHttpError',
      status: 410,
      code: 'INVITE_EXPIRED',
    } satisfies Partial<RelayHttpError>);
  });

  it('normalizes base URLs with trailing slashes', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    const client = new RelayClient('https://relay.example.com/', fetchMock);

    await client.health();

    expect(fetchMock).toHaveBeenCalledWith('https://relay.example.com/healthz', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
  });
});
