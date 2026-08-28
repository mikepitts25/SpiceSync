import { encodeBase64Url, utf8ToBytes } from '../lib/sync/base64';
import { credentialPayloadForIdToken } from '../lib/auth/idToken';

function token(payload: Record<string, unknown>): string {
  return [
    encodeBase64Url(utf8ToBytes(JSON.stringify({ alg: 'none' }))),
    encodeBase64Url(utf8ToBytes(JSON.stringify(payload))),
    'signature',
  ].join('.');
}

describe('native ID token credential payloads', () => {
  it('includes the raw nonce when the provider token carries a nonce claim', () => {
    expect(
      credentialPayloadForIdToken({
        provider: 'apple',
        token: token({ sub: 'apple-user', nonce: 'hashed-nonce' }),
        nonce: 'raw-nonce',
        authorizationCode: 'apple-code',
      })
    ).toEqual({
      provider: 'apple',
      token: expect.any(String),
      access_token: 'apple-code',
      nonce: 'raw-nonce',
    });
  });

  it('omits the nonce when the provider token has no nonce claim', () => {
    const idToken = token({ sub: 'apple-user' });
    expect(
      credentialPayloadForIdToken({
        provider: 'apple',
        token: idToken,
        nonce: 'raw-nonce',
      })
    ).toEqual({
      provider: 'apple',
      token: idToken,
      access_token: undefined,
    });
  });

  it('rejects a token nonce when the matching raw nonce is unavailable', () => {
    expect(() =>
      credentialPayloadForIdToken({
        provider: 'google',
        token: token({ sub: 'google-user', nonce: 'provider-nonce' }),
      })
    ).toThrow('matching raw nonce');
  });

  it('rejects malformed provider tokens before calling Supabase', () => {
    expect(() =>
      credentialPayloadForIdToken({
        provider: 'apple',
        token: 'not-a-jwt',
        nonce: 'raw-nonce',
      })
    ).toThrow('invalid ID token');
    expect(() =>
      credentialPayloadForIdToken({
        provider: 'apple',
        token: `${token({ nonce: 'claim' })}.extra`,
        nonce: 'raw-nonce',
      })
    ).toThrow('invalid ID token');
  });
});
