// Storage adapter that works in both Expo Go and native builds
// Uses AsyncStorage for Expo Go compatibility

import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage adapter for zustand/persist middleware
export const mmkvStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch {
      // Ignore errors
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      // Ignore errors
    }
  },
};

// For code that expects sync MMKV API (limited functionality in Expo Go)
export const mmkv = {
  getString: (key: string): string | undefined => {
    // Cannot synchronously read from AsyncStorage
    // This will return undefined in Expo Go
    // Components should use state/store instead
    return undefined;
  },
  set: (key: string, value: string): void => {
    AsyncStorage.setItem(key, value).catch(() => {});
  },
  delete: (key: string): void => {
    AsyncStorage.removeItem(key).catch(() => {});
  },
};
