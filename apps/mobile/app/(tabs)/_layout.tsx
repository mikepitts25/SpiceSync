import React from 'react';
import { Tabs } from 'expo-router';

// Native tab bar is hidden; screens render the redesigned shared tab bar.
export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="deck"
      screenOptions={{
        animation: 'none',
        headerShown: false,
        lazy: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          display: 'none', // Hide the tab bar since we use the menu
        },
      }}
    >
      {/* Profiles Hub */}
      <Tabs.Screen name="profiles" />

      {/* Home Screen */}
      <Tabs.Screen name="categories" />

      {/* Kinks Section */}
      <Tabs.Screen name="kinks" />
      <Tabs.Screen name="deck" />

      {/* Game Section */}
      <Tabs.Screen name="game" />

      {/* Matches Section */}
      <Tabs.Screen name="matches" />

      {/* Browse - kept for compatibility */}
      <Tabs.Screen name="browse" />

      {/* Conversation Section */}
      <Tabs.Screen name="conversation" />
    </Tabs>
  );
}
