module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$':
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
    '^expo-secure-store$': '<rootDir>/__mocks__/expo-secure-store.js',
    '^expo-constants$': '<rootDir>/__mocks__/expo-constants.js',
    '^expo-notifications$': '<rootDir>/__mocks__/expo-notifications.js',
    '\\.(mp3|m4a|wav|aac)$': '<rootDir>/__mocks__/audio-asset.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|react-native-mmkv|react-native-reanimated|@noble|expo|expo-iap|expo-notifications)/)',
  ],
};
