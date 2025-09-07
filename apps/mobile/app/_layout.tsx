import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Slot } from 'expo-router';
import { I18nProvider } from '../lib/i18n';
import { ThemeProvider } from '../lib/theme/ThemeProvider';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nProvider>
        <ThemeProvider>
          {/* Slot ensures a navigator is present on the very first render */}
          <Slot />
        </ThemeProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}
