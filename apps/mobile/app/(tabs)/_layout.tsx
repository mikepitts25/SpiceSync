// apps/mobile/app/(tabs)/_layout.tsx  (add a Profiles tab)
import React from 'react';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="categories"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#60a5fa',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { backgroundColor: '#0b0f14', borderTopColor: '#111827' },
        tabBarLabelStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="categories" options={{ title: 'Categories' }} />
      <Tabs.Screen name="deck" options={{ title: 'Deck' }} />
      <Tabs.Screen name="browse" options={{ title: 'Browse' }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches' }} />
      <Tabs.Screen name="profiles" options={{ title: 'Profiles' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
