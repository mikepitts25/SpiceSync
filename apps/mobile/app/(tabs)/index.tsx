// Redirect to categories as the default tab
import { Redirect } from 'expo-router';

export default function TabsIndex() {
  return <Redirect href="/(tabs)/categories" />;
}

// Hide this route from the tab bar
export const unstable_settings = {
  href: null,
};
