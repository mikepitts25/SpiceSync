import { SupabaseRelayClient } from '../lib/sync/supabaseRelayClient';
import { RelayHttpError } from '../lib/sync/relayClient';

function makeSupabaseMock() {
  return {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      signInAnonymously: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      }),
    },
    rpc: jest.fn(),
  };
}

describe('SupabaseRelayClient', () => {
  it('signs in anonymously and maps createInvite RPC responses', async () => {
    const supabase = makeSupabaseMock();
    supabase.rpc.mockResolvedValueOnce({
      data: {
        inviteId: 'inv_1',
        expiresAt: 1770000000,
      },
      error: null,
    });

    const client = new SupabaseRelayClient(supabase, {
      publicBaseUrl: 'https://project.supabase.co',
    });

    await expect(
      client.createInvite({
        inviterDeviceId: 'dev_a',
        inviterPublicKey: 'pub_a',
        inviteSecretHash: 'hash_a',
        inviterProfileName: 'Alex',
        inviterProfileAvatar: 'fire',
      })
    ).resolves.toEqual({
      inviteId: 'inv_1',
      inviteUrl: 'https://project.supabase.co/link/inv_1',
      expiresAt: 1770000000,
    });

    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
    expect(supabase.auth.signInAnonymously).toHaveBeenCalledTimes(1);
    expect(supabase.rpc).toHaveBeenCalledWith('spicesync_create_invite', {
      p_inviter_device_id: 'dev_a',
      p_inviter_public_key: 'pub_a',
      p_invite_secret_hash: 'hash_a',
      p_inviter_profile_name: 'Alex',
      p_inviter_profile_avatar: 'fire',
    });
  });

  it('does not sign in again when a Supabase session exists', async () => {
    const supabase = makeSupabaseMock();
    supabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { access_token: 'token' } },
      error: null,
    });
    supabase.rpc.mockResolvedValueOnce({
      data: {
        inviteId: 'inv_2',
        inviterDeviceId: 'dev_a',
        inviterPublicKey: 'pub_a',
        expiresAt: 1770000000,
        acceptedAt: null,
        coupleId: null,
        status: 'pending',
      },
      error: null,
    });

    const client = new SupabaseRelayClient(supabase);
    await client.getInvite('inv_2');

    expect(supabase.auth.signInAnonymously).not.toHaveBeenCalled();
    expect(supabase.rpc).toHaveBeenCalledWith('spicesync_get_invite', {
      p_invite_id: 'inv_2',
    });
  });

  it('maps append/list/revoke RPC calls to the existing relay API shape', async () => {
    const supabase = makeSupabaseMock();
    supabase.rpc
      .mockResolvedValueOnce({
        data: {
          serverSequence: 12,
          eventId: 'evt_1',
          coupleId: 'cpl_1',
          authorDeviceId: 'dev_a',
          clientSequence: 3,
          encryptedPayload: 'ciphertext',
          payloadHash: 'hash',
          createdAt: 1770000001,
          expiresAt: 1777777777,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          events: [
            {
              serverSequence: 13,
              eventId: 'evt_2',
              coupleId: 'cpl_1',
              authorDeviceId: 'dev_b',
              clientSequence: 4,
              encryptedPayload: 'ciphertext-2',
              payloadHash: 'hash-2',
              createdAt: 1770000002,
              expiresAt: null,
            },
          ],
          cursor: 13,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { coupleId: 'cpl_1', revokedAt: 1770000003 },
        error: null,
      });

    const client = new SupabaseRelayClient(supabase);

    await expect(
      client.appendEvent('cpl_1', {
        eventId: 'evt_1',
        authorDeviceId: 'dev_a',
        clientSequence: 3,
        encryptedPayload: 'ciphertext',
        payloadHash: 'hash',
        signature: 'sig',
      })
    ).resolves.toMatchObject({ serverSequence: 12, eventId: 'evt_1' });

    await expect(client.listEvents('cpl_1', 12)).resolves.toMatchObject({
      cursor: 13,
      events: [{ eventId: 'evt_2' }],
    });

    await expect(client.revokeCouple('cpl_1')).resolves.toEqual({
      coupleId: 'cpl_1',
      revokedAt: 1770000003,
    });

    expect(supabase.rpc).toHaveBeenNthCalledWith(
      1,
      'spicesync_append_event',
      {
        p_couple_id: 'cpl_1',
        p_event_id: 'evt_1',
        p_author_device_id: 'dev_a',
        p_client_sequence: 3,
        p_encrypted_payload: 'ciphertext',
        p_payload_hash: 'hash',
        p_signature: 'sig',
      }
    );
    expect(supabase.rpc).toHaveBeenNthCalledWith(2, 'spicesync_list_events', {
      p_couple_id: 'cpl_1',
      p_after_server_sequence: 12,
      p_limit: 100,
    });
    expect(supabase.rpc).toHaveBeenNthCalledWith(3, 'spicesync_revoke_couple', {
      p_couple_id: 'cpl_1',
    });
  });

  it('throws RelayHttpError for Supabase RPC errors', async () => {
    const supabase = makeSupabaseMock();
    supabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: 'P0001', message: 'Invite expired' },
    });

    const client = new SupabaseRelayClient(supabase);

    await expect(client.getInvite('inv_old')).rejects.toMatchObject({
      name: 'RelayHttpError',
      status: 400,
      code: 'P0001',
      message: 'Invite expired',
    } satisfies Partial<RelayHttpError>);
  });
});
