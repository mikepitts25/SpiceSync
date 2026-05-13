import React from 'react';
import { Share, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Link2, Share2 } from 'lucide-react-native';

import { BackHeader } from '../../components/app-chrome';
import { usePartnerStore } from '../../src/stores/partner';
import { COLORS, GRADIENTS } from '../../constants/theme';

function ConnectVisual() {
  return (
    <View style={visual.wrap}>
      <LinearGradient
        colors={GRADIENTS.primary}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={visual.circle}
      >
        <Text style={visual.circleEmoji}>🌶️</Text>
      </LinearGradient>

      <View style={visual.connector}>
        <View style={visual.line} />
        <View style={visual.heartWrap}>
          <Heart size={18} color={COLORS.pink} fill={COLORS.pink} />
        </View>
        <View style={visual.line} />
      </View>

      <LinearGradient
        colors={GRADIENTS.purple}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={visual.circle}
      >
        <Text style={visual.circleEmoji}>💜</Text>
      </LinearGradient>
    </View>
  );
}

const visual = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    marginVertical: 8,
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleEmoji: {
    fontSize: 34,
  },
  connector: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
  },
  heartWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function InviteScreen() {
  const { pendingInvite, generateInviteCode } = usePartnerStore();

  const inviteCode = React.useMemo(() => {
    if (
      pendingInvite?.status === 'pending' &&
      Date.now() < pendingInvite.expiresAt
    ) {
      return pendingInvite.code;
    }
    return generateInviteCode();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on SpiceSync! Use code: ${inviteCode}\n\nDownload the app and enter this code to connect.`,
        title: 'Join me on SpiceSync',
      });
    } catch {
      // user cancelled share sheet
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <BackHeader title="Connect Partner" />

      <View style={styles.content}>
        <ConnectVisual />
        <Text style={styles.heading}>Invite Your Partner</Text>
        <Text style={styles.sub}>Share this code with your partner to connect</Text>

        {/* Code card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>YOUR INVITE CODE</Text>
          <Text style={styles.codeValue}>{inviteCode}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={handleShare}
            style={styles.sharePress}
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.shareButton}
            >
              <Share2 size={16} color="#fff" />
              <Text style={styles.shareText}>Share Code</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Steps */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>How it works</Text>
          {[
            'Share this code with your partner.',
            'They download SpiceSync and enter the code.',
            'Both vote on activities — matches appear in the Matches tab.',
          ].map((text, i) => (
            <View key={i} style={styles.step}>
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.stepBadge}
              >
                <Text style={styles.stepNumber}>{i + 1}</Text>
              </LinearGradient>
              <Text style={styles.stepText}>{text}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 20,
  },
  heading: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  sub: {
    color: COLORS.textSub,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: -8,
  },

  // Code card
  codeCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  codeLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  codeValue: {
    color: COLORS.pink,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 5,
  },
  sharePress: {
    borderRadius: 22,
    overflow: 'hidden',
    marginTop: 4,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  shareText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Steps
  stepsCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 18,
    gap: 14,
  },
  stepsTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    color: COLORS.textSub,
    fontSize: 13,
    lineHeight: 18,
  },
});
