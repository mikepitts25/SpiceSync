// apps/mobile/components/DailyConversationWidget.tsx
// Widget for home screen showing today's conversation starter

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircle, ChevronRight, Sparkles } from 'lucide-react-native';

import { COLORS, GRADIENTS, SIZES, SHADOWS } from '../constants/theme';
import { getDailyStarter, ConversationStarter } from '../lib/conversationStarters';

interface DailyConversationWidgetProps {
  onPress?: () => void;
  compact?: boolean;
}

export function DailyConversationWidget({ onPress, compact = false }: DailyConversationWidgetProps) {
  const router = useRouter();
  const dailyStarter = getDailyStarter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/(conversation)');
    }
  };

  if (compact) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <LinearGradient
          colors={GRADIENTS.soft}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.compactContainer}
        >
          <View style={styles.compactIconContainer}>
            <MessageCircle size={20} color="#fff" />
          </View>
          <View style={styles.compactContent}>
            <Text style={styles.compactLabel}>Today's Conversation</Text>
            <Text style={styles.compactQuestion} numberOfLines={2}>
              {dailyStarter.question}
            </Text>
          </View>
          <ChevronRight size={20} color="rgba(255,255,255,0.7)" />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={styles.container}>
      <LinearGradient
        colors={GRADIENTS.soft}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Sparkles size={20} color="#fff" />
          </View>
          <Text style={styles.headerText}>Today's Conversation Starter</Text>
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{dailyStarter.question}</Text>
        </View>

        {dailyStarter.context && (
          <Text style={styles.contextText} numberOfLines={2}>
            {dailyStarter.context}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.tagsContainer}>
            {dailyStarter.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
          <View style={styles.ctaContainer}>
            <Text style={styles.ctaText}>Start talking</Text>
            <ChevronRight size={16} color="#fff" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    fontSize: SIZES.small,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  questionContainer: {
    marginBottom: 12,
  },
  questionText: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 28,
  },
  contextText: {
    fontSize: SIZES.body,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  ctaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ctaText: {
    fontSize: SIZES.body,
    color: '#fff',
    fontWeight: '600',
  },

  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: SIZES.radius,
  },
  compactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  compactContent: {
    flex: 1,
  },
  compactLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  compactQuestion: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 20,
  },
});

export default DailyConversationWidget;
