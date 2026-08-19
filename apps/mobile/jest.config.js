module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^(?:\\.\\.?/)+(?:lib/sync/)?crypto$': '<rootDir>/lib/sync/crypto.ts',
    '^@react-native-async-storage/async-storage$':
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
    '^expo-secure-store$': '<rootDir>/__mocks__/expo-secure-store.js',
    '^expo-constants$': '<rootDir>/__mocks__/expo-constants.js',
    '^expo-notifications$': '<rootDir>/__mocks__/expo-notifications.js',
    '^expo-apple-authentication$':
      '<rootDir>/__mocks__/expo-apple-authentication.js',
    '^@react-native-google-signin/google-signin$':
      '<rootDir>/__mocks__/@react-native-google-signin-google-signin.js',
    '\\.(mp3|m4a|wav|aac)$': '<rootDir>/__mocks__/audio-asset.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|react-native-mmkv|react-native-reanimated|react-native-url-polyfill|@noble|expo|expo-iap|expo-notifications)/)',
  ],
};
