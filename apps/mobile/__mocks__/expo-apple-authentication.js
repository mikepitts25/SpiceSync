const AppleAuthenticationScope = {
  FULL_NAME: 0,
  EMAIL: 1,
};

module.exports = {
  AppleAuthenticationScope,
  isAvailableAsync: jest.fn(),
  signInAsync: jest.fn(),
};
