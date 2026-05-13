type ProfileManageDestination = {
  pathname: '/(settings)/profiles/manage';
  params: { profileId: string };
};

type ActiveProfileCardDestination =
  | ProfileManageDestination
  | '/(settings)/profiles';

type PinUpdateInput = {
  currentPin: string;
  newPin: string;
  confirmPin: string;
  existingPin?: string;
};

type PinValidationResult = { ok: true } | { ok: false; error: string };

const PIN_PATTERN = /^[0-9]{4}$/;

export function getProfileManageDestination(
  profileId: string
): ProfileManageDestination {
  return {
    pathname: '/(settings)/profiles/manage',
    params: { profileId },
  };
}

export function getActiveProfileCardDestination(
  profileId: string | null | undefined
): ActiveProfileCardDestination {
  return profileId
    ? getProfileManageDestination(profileId)
    : '/(settings)/profiles';
}

export function getProfilePinActionLabel(hasExistingPin: boolean): string {
  return hasExistingPin ? 'Change PIN' : 'Set PIN';
}

export function validatePinUpdate({
  currentPin,
  newPin,
  confirmPin,
  existingPin,
}: PinUpdateInput): PinValidationResult {
  if (existingPin && currentPin !== existingPin) {
    return { ok: false, error: 'Incorrect current PIN' };
  }

  if (!PIN_PATTERN.test(newPin)) {
    return { ok: false, error: 'PIN must be 4 digits' };
  }

  if (newPin !== confirmPin) {
    return { ok: false, error: 'PINs do not match' };
  }

  return { ok: true };
}
