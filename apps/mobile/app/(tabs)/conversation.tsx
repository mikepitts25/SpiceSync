// apps/mobile/app/(tabs)/conversation.tsx
// Conversation tab - redirects to the main conversation screen

import { Redirect } from 'expo-router';

export default function ConversationTab() {
  return <Redirect href="/(conversation)" />;
}
