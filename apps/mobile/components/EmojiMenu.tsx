import React from 'react';
import {
  Modal,
  View,
  Pressable,
  Text,
  StyleSheet,
  FlatList,
  Platform,
} from 'react-native';

import { EMOJI_CHOICES } from '../src/constants/emojis';

type EmojiMenuProps = {
  visible: boolean;
  selected?: string;
  onSelect: (emoji: string) => void;
  onClose: () => void;
};

const columns = 3;

export default function EmojiMenu({
  visible,
  selected,
  onSelect,
  onClose,
}: EmojiMenuProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <Text style={styles.title}>Choose Emoji</Text>
          <FlatList
            data={EMOJI_CHOICES}
            keyExtractor={(item) => item}
            numColumns={columns}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => {
              const isSelected = item === selected;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityLabel={`Emoji ${item}`}
                  onPress={() => onSelect(item)}
                  style={[
                    styles.emojiButton,
                    isSelected && styles.emojiSelected,
                  ]}
                >
                  <Text style={styles.emoji}>{item}</Text>
                </Pressable>
              );
            }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  title: {
    fontSize: 18,
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
  },
  grid: {
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiButton: {
    width: Platform.select({ ios: 72, android: 72, default: 64 }),
    height: Platform.select({ ios: 72, android: 72, default: 64 }),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  emojiSelected: {
    borderColor: '#60a5fa',
    backgroundColor: '#1e293b',
  },
  emoji: {
    fontSize: 32,
  },
  closeButton: {
    marginTop: 8,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1f2937',
  },
  closeText: {
    color: 'white',
    fontWeight: '700',
  },
});
