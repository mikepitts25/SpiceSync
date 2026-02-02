module.exports = {
  preset: 'react-native',
  // Keep test environment lightweight; current tests don't require @testing-library/react-native.
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|react-native-mmkv|react-native-reanimated)/)'
  ],
};