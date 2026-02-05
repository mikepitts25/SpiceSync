import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
export function useAppLock() {
  async function ensureLockReady() {
    const has = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (has && enrolled) {
      await SecureStore.setItemAsync('lock-ready', '1');
    }
  }
  return { ensureLockReady };
}
