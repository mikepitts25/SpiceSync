import { describe, expect, it } from 'vitest';
import { parseAppendEvent, parseCreateInvite } from './validation';

describe('relay request validation', () => {
  it('accepts valid create invite input', () => {
    expect(
      parseCreateInvite({
        inviterDeviceId: 'dev_123',
        inviterPublicKey: 'pub_abc',
        inviteSecretHash: 'hash_xyz',
      }),
    ).toEqual({
      inviterDeviceId: 'dev_123',
      inviterPublicKey: 'pub_abc',
      inviteSecretHash: 'hash_xyz',
    });
  });

  it('rejects empty create invite fields', () => {
    expect(() =>
      parseCreateInvite({
        inviterDeviceId: '',
        inviterPublicKey: 'pub_abc',
        inviteSecretHash: 'hash_xyz',
      }),
    ).toThrow('Invalid request body');
  });

  it('rejects encrypted payloads over the configured byte limit', () => {
    expect(() =>
      parseAppendEvent(
        {
          eventId: 'evt_1',
          authorDeviceId: 'dev_1',
          clientSequence: 1,
          encryptedPayload: 'abcd',
          payloadHash: 'hash',
          signature: 'sig',
        },
        3,
      ),
    ).toThrow('Encrypted payload exceeds maximum size');
  });
});
