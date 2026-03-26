import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import {
  Search,
  Gamepad2,
  Heart,
  MessageCircle,
  Settings,
  X,
  Menu,
} from 'lucide-react-native';
import { COLORS, SIZES } from '../constants/theme';

const MENU_ITEMS = [
  { id: 'kinks', label: 'Kinks', emoji: '🔥', icon: Search, route: '/(tabs)/kinks' },
  { id: 'game', label: 'Game', emoji: '🎲', icon: Gamepad2, route: '/(tabs)/game' },
  { id: 'matches', label: 'Matches', emoji: '💕', icon: Heart, route: '/(tabs)/matches' },
  { id: 'conversation', label: 'Conversation', emoji: '💬', icon: MessageCircle, route: '/(tabs)/conversation' },
  { id: 'loveLanguages', label: 'Love Languages', emoji: '💝', icon: Heart, route: '/(settings)/love-languages' },
  { id: 'settings', label: 'Settings', emoji: '⚙️', icon: Settings, route: '/(settings)' },
];

export default function AppMenu() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (route: string) => {
    setIsOpen(false);
    // Small delay to let modal close
    setTimeout(() => {
      router.navigate(route as any);
    }, 100);
  };

  const isActive = (route: string) => {
    if (route === '/(tabs)/kinks') {
      return pathname?.includes('/deck') || pathname?.includes('/kinks');
    }
    return pathname?.includes(route.replace('/(tabs)/', '').replace('/(settings)', 'settings'));
  };

  return (
    <>
      {/* Menu Button */}
      <View
        pointerEvents="box-none"
        style={[styles.wrapper, { top: insets.top + 8 }]}
      >
        <Pressable
          onPress={() => setIsOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          style={styles.buttonContainer}
        >
          <View style={styles.solidBackground}>
            <Menu size={24} color="white" />
          </View>
        </Pressable>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View style={styles.modalOverlay}>
            <BlurView intensity={60} tint="dark" style={styles.blurOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.menuContainer, { marginTop: insets.top + 60 }]}>
                  <View style={styles.menuHeader}>
                    <Text style={styles.menuTitle}>Menu</Text>
                    <TouchableOpacity onPress={() => setIsOpen(false)}>
                      <X size={24} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>

                  {MENU_ITEMS.map((item, index) => {
                    const Icon = item.icon;
                    const active = isActive(item.route);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.menuItem,
                          active && styles.menuItemActive,
                          index === MENU_ITEMS.length - 1 && styles.menuItemLast,
                        ]}
                        onPress={() => handleNavigate(item.route)}
                      >
                        <View style={styles.menuItemLeft}>
                          <Text style={styles.menuItemEmoji}>{item.emoji}</Text>
                          <Text
                            style={[
                              styles.menuItemLabel,
                              active && styles.menuItemLabelActive,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </View>
                        {active && <View style={styles.activeIndicator} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </TouchableWithoutFeedback>
            </BlurView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 12,
    zIndex: 1000,
  },
  buttonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  blurBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  solidBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  blurOverlay: {
    flex: 1,
  },
  menuContainer: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    marginHorizontal: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: SIZES.radius,
  },
  menuItemActive: {
    backgroundColor: 'rgba(255, 107, 157, 0.15)',
  },
  menuItemLast: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderRadius: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemEmoji: {
    fontSize: 20,
  },
  menuItemLabel: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  menuItemLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});