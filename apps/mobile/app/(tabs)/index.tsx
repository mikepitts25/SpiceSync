import { Redirect } from 'expo-router';

export default function TabsIndex() {
  return <Redirect href="/(tabs)/categories" />;
}

// Hide this screen from the tab bar
export const unstable_settings = {
  href: null,
};
