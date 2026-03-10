import React from 'react';
import { Tabs } from 'expo-router';
import { COLORS } from '../../constants/theme';

// This layout is simplified - navigation now happens through the App Menu
// All screens are accessible but the tab bar is minimal
export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="categories"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          display: 'none', // Hide the tab bar since we use the menu
        },
      }}
    >
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