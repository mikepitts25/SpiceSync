import AsyncStorage from '@react-native-async-storage/async-storage';

const LEGACY_PARTNER_STORAGE_KEY = 'spicesync-partner';

let cleanupStarted = false;

export function cleanupLegacyPartnerCodes(): void {
  if (cleanupStarted) return;
  cleanupStarted = true;

  AsyncStorage.removeItem(LEGACY_PARTNER_STORAGE_KEY).catch((error) => {
    console.warn('[PartnerSync] Could not clear legacy partner codes', error);
  });
}
