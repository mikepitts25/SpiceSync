/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/jest.e2e.config.js',
  configs: {
    'ios.sim.release': {
      type: 'ios.simulator',
      name: 'iPhone 15',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/SpiceSync.app',
      build: 'xcodebuild -workspace ios/SpiceSync.xcworkspace -scheme SpiceSync -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    }
  }
};