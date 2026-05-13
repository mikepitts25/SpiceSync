import {
  getActiveProfileCardDestination,
  getProfileManageDestination,
  getProfilePinActionLabel,
  validatePinUpdate,
} from '../lib/profile-management';

describe('profile management helpers', () => {
  it('routes the active profile card to profile options when a profile is active', () => {
    expect(getActiveProfileCardDestination('profile-1')).toEqual({
      pathname: '/(settings)/profiles/manage',
      params: { profileId: 'profile-1' },
    });
  });

  it('routes the active profile card to profiles when no profile is active', () => {
    expect(getActiveProfileCardDestination(null)).toBe('/(settings)/profiles');
  });

  it('routes to the selected profile management screen', () => {
    expect(getProfileManageDestination('profile-1')).toEqual({
      pathname: '/(settings)/profiles/manage',
      params: { profileId: 'profile-1' },
    });
  });

  it('labels the pin action based on whether the profile already has a pin', () => {
    expect(getProfilePinActionLabel(false)).toBe('Set PIN');
    expect(getProfilePinActionLabel(true)).toBe('Change PIN');
  });

  it('requires the current pin when changing an existing pin', () => {
    expect(
      validatePinUpdate({
        currentPin: '0000',
        newPin: '1234',
        confirmPin: '1234',
        existingPin: '1111',
      })
    ).toEqual({ ok: false, error: 'Incorrect current PIN' });
  });

  it('validates new pin length and confirmation', () => {
    expect(
      validatePinUpdate({
        currentPin: '',
        newPin: '123',
        confirmPin: '123',
      })
    ).toEqual({ ok: false, error: 'PIN must be 4 digits' });

    expect(
      validatePinUpdate({
        currentPin: '',
        newPin: '1234',
        confirmPin: '9876',
      })
    ).toEqual({ ok: false, error: 'PINs do not match' });
  });

  it('accepts a matching set or change pin request', () => {
    expect(
      validatePinUpdate({
        currentPin: '',
        newPin: '1234',
        confirmPin: '1234',
      })
    ).toEqual({ ok: true });

    expect(
      validatePinUpdate({
        currentPin: '0000',
        newPin: '1234',
        confirmPin: '1234',
        existingPin: '0000',
      })
    ).toEqual({ ok: true });
  });
});
