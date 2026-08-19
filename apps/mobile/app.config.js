const appJson = require('./app.json');

const GOOGLE_IOS_CLIENT_ID_SUFFIX = '.apps.googleusercontent.com';
const GOOGLE_SIGN_IN_PLUGIN = '@react-native-google-signin/google-signin';

function deriveGoogleIosUrlScheme(clientId) {
  if (!clientId?.endsWith(GOOGLE_IOS_CLIENT_ID_SUFFIX)) return null;

  const clientIdPrefix = clientId.slice(0, -GOOGLE_IOS_CLIENT_ID_SUFFIX.length);
  return clientIdPrefix ? `com.googleusercontent.apps.${clientIdPrefix}` : null;
}

const googleIosUrlScheme = deriveGoogleIosUrlScheme(
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
);

module.exports = () => ({
  ...appJson.expo,
  plugins: appJson.expo.plugins.map((plugin) => {
    if (plugin !== GOOGLE_SIGN_IN_PLUGIN || !googleIosUrlScheme) return plugin;

    return [GOOGLE_SIGN_IN_PLUGIN, { iosUrlScheme: googleIosUrlScheme }];
  }),
});
