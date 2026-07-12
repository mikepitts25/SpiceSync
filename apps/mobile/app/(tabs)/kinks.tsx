// apps/mobile/app/(tabs)/kinks.tsx
// The deck is the single rating surface: it already exposes the same tier
// options as inline filter chips, so the old tier-picker screen now just
// redirects. The route stays registered for stale links and deep links.
import { Redirect } from 'expo-router';

export default function KinksScreen() {
  return <Redirect href="/(tabs)/deck" />;
}
