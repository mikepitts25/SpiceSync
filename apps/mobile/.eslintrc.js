module.exports = {
  root: true,
  extends: ['universe/native'],
  rules: {
    // Relax import ordering - not critical for build
    'import/order': 'off',
    // Allow explicit any in specific cases
    '@typescript-eslint/no-explicit-any': 'warn',
    // Allow duplicate imports (needed for react-native-gesture-handler side-effect import)
    'import/no-duplicates': 'off',
  },
};
