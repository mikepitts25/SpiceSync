import {
  _resetCacheForTests,
  getOrCreateIdentity,
  setIdentityDeps,
} from '../lib/sync/identity';
import {
  acceptInvite,
  createInvite,
  finalizePendingInvite,
  parseInviteUrl,
} from '../lib/sync/inviteFlow';
import { useCoupleLinkStore } from '../lib/sync/coupleLink';
import { RelayClient } from '../lib/sync/relayClient';
import { _resetRelayClientForTests } from '../lib/sync/relayConfig';
import { sha256Base64 } from '../lib/sync/crypto';

function memoryDeps() {
  const secure = new Map<string, string>();
  const async = new Map<string, string>();
  return {
    secureStore: {
      getItemAsync: async (k: string) =>
        secure.has(k) ? secure.get(k)! : null,
      setItemAsync: async (k: string, v: string) => {
        secure.set(k, v);
      },
      deleteItemAsync: async (k: string) => {
        secure.delete(k);
      },
    },
    asyncStorage: {
      getItem: async (k: string) => (async.has(k) ? async.get(k)! : null),
      setItem: async (k: string, v: string) => {
        async.set(k, v);
      },
      removeItem: async (k: string) => {
        async.delete(k);
      },
    },
  };
}

describe('invite flow', () => {
  beforeEach(() => {
    _resetCacheForTests();
    useCoupleLinkStore.setState({ link: null });
    setIdentityDeps(memoryDeps());
  });

  it('parses a remote invite URL with fragment secret', () => {
    const parsed = parseInviteUrl(
      'https://relay.spicesync.app/link/inv_abc#secret123'
    );
    expect(parsed).toEqual({ inviteId: 'inv_abc', inviteSecret: 'secret123' });
  });

  it('parses an app-scheme invite URL', () => {
    const parsed = parseInviteUrl('spicesync://link/inv_xyz#topsecret');
    expect(parsed?.inviteId).toBe('inv_xyz');
    expect(parsed?.inviteSecret).toBe('topsecret');
  });

  it('parses an Expo Go invite URL', () => {
    const parsed = parseInviteUrl('exp://192.168.1.10:8081/--/link/inv_exp#topsecret');
    expect(parsed?.inviteId).toBe('inv_exp');
    expect(parsed?.inviteSecret).toBe('topsecret');
  });

  it('returns null for non-invite URLs', () => {
    expect(parseInviteUrl('https://example.com/foo')).toBeNull();
    expect(parseInviteUrl('not a url')).toBeNull();
  });

  it('createInvite posts hash of secret, never the secret itself', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        inviteId: 'inv_1',
        inviteUrl: 'https://relay.test/link/inv_1',
        expiresAt: 1700,
      }),
    });
    _resetRelayClientForTests(
      new RelayClient('https://relay.test', fetchMock as any)
    );

    const handle = await createInvite({
      profileName: 'Alex',
      profileAvatar: 'fire',
    });
    expect(handle.inviteId).toBe('inv_1');
    expect(handle.inviteSecret.length).toBeGreaterThan(20);
    expect(handle.appUrl).toContain('spicesync://link/inv_1');

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init as any).body);
    expect(body.inviteSecretHash).toBe(sha256Base64(handle.inviteSecret));
    expect(body.inviteSecretHash).not.toBe(handle.inviteSecret);
    expect(body.inviterSigningPublicKey).toEqual(expect.any(String));
    expect(body.inviterProfileName).toBe('Alex');
    expect(body.inviterProfileAvatar).toBe('fire');
  });

  it('acceptInvite saves a couple link with the partner public key', async () => {
    const secret = 'abc_secret_xyz';
    const expectedProof = sha256Base64(secret);

    const fetchMock = jest
      .fn()
      .mockImplementation((url: string, init?: any) => {
        if (url.endsWith('/invites/inv_1')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              inviteId: 'inv_1',
              inviterDeviceId: 'dev_a',
              inviterPublicKey: 'partner_enc_pub',
              inviterSigningPublicKey: 'partner_sign_pub',
              inviterProfileName: 'Sam',
              inviterProfileAvatar: 'cherries',
              expiresAt: 9999,
              acceptedAt: null,
              coupleId: null,
              status: 'pending',
            }),
          });
        }
        if (url.endsWith('/invites/inv_1/accept')) {
          const body = JSON.parse(init.body);
          expect(body.inviteProof).toBe(expectedProof);
          expect(body.accepterSigningPublicKey).toEqual(expect.any(String));
          return Promise.resolve({
            ok: true,
            json: async () => ({
              coupleId: 'cpl_1',
              memberADeviceId: 'dev_a',
              memberBDeviceId: body.accepterDeviceId,
              memberAPublicKey: 'partner_enc_pub',
              memberBPublicKey: body.accepterPublicKey,
              memberASigningPublicKey: 'partner_sign_pub',
              memberBSigningPublicKey: body.accepterSigningPublicKey,
              memberAProfileName: 'Sam',
              memberAProfileAvatar: 'cherries',
              memberBProfileName: body.accepterProfileName,
              memberBProfileAvatar: body.accepterProfileAvatar,
              createdAt: 1700,
            }),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 404,
          json: async () => ({}),
        });
      });
    _resetRelayClientForTests(
      new RelayClient('https://relay.test', fetchMock as any)
    );

    const result = await acceptInvite(
      {
        inviteId: 'inv_1',
        inviteSecret: secret,
      },
      {
        profileName: 'Alex',
        profileAvatar: 'fire',
      }
    );
    expect(result.coupleId).toBe('cpl_1');
    const link = useCoupleLinkStore.getState().link!;
    expect(link.status).toBe('active');
    expect(link.partnerEncryptionPublicKey).toBe('partner_enc_pub');
    expect(link.partnerSigningPublicKey).toBe('partner_sign_pub');
    expect(link.myDeviceId).toMatch(/^dev_/);
    expect(link.partnerDeviceId).toBe('dev_a');
    expect(link.partnerProfileName).toBe('Sam');
    expect(link.partnerProfileAvatar).toBe('cherries');
  });

  it('finalizePendingInvite returns null until accepted, then saves link', async () => {
    const { identity } = await getOrCreateIdentity();
    const myDeviceId = identity.deviceId;

    let status: 'pending' | 'accepted' = 'pending';
    const fetchMock = jest.fn().mockImplementation((url: string) => {
      if (url.endsWith('/invites/inv_2')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            inviteId: 'inv_2',
            inviterDeviceId: 'dev_self',
            inviterPublicKey: 'self_pub',
            inviterSigningPublicKey: 'self_sign_pub',
            expiresAt: 9999,
            acceptedAt: status === 'accepted' ? 1 : null,
            coupleId: status === 'accepted' ? 'cpl_2' : null,
            status,
          }),
        });
      }
      if (url.includes('/couples/cpl_2')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            coupleId: 'cpl_2',
            memberADeviceId: myDeviceId,
            memberBDeviceId: 'dev_partner',
            memberAPublicKey: 'self_pub',
            memberBPublicKey: 'partner_pub',
            memberASigningPublicKey: 'self_sign_pub',
            memberBSigningPublicKey: 'partner_sign_pub',
            memberAProfileName: 'Me',
            memberAProfileAvatar: 'fire',
            memberBProfileName: 'Partner',
            memberBProfileAvatar: 'cherries',
            createdAt: 1700,
            revokedAt: null,
          }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({}),
      });
    });
    _resetRelayClientForTests(
      new RelayClient('https://relay.test', fetchMock as any)
    );

    expect(await finalizePendingInvite('inv_2')).toBeNull();
    status = 'accepted';
    const result = await finalizePendingInvite('inv_2');
    expect(result?.coupleId).toBe('cpl_2');
    expect(useCoupleLinkStore.getState().link?.partnerEncryptionPublicKey).toBe(
      'partner_pub'
    );
    expect(useCoupleLinkStore.getState().link?.partnerSigningPublicKey).toBe(
      'partner_sign_pub'
    );
  });
});
