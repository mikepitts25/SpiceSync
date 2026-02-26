module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$':
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|react-native-mmkv|react-native-reanimated)/)',
  ],
};
