import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BackHeader } from '../../components/app-chrome';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="dark" />
      <BackHeader title="Privacy Policy" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>Last updated: June 2026</Text>

        <Section title="Overview">
          SpiceSync is designed with privacy as a core principle. All data you
          create — profiles, votes, preferences, and matches — is stored on your
          device by default. If you connect a remote partner, SpiceSync uses a
          relay service only to pass encrypted sync updates between your
          devices.
        </Section>

        <Section title="Information We Collect">
          SpiceSync does not require a profile account, email address, or
          password. Remote partner sync uses an anonymous device identity so the
          relay can deliver encrypted updates to the right linked devices.
        </Section>

        <Section title="How Your Data Is Stored">
          All app data is stored locally using your device's built-in storage
          (AsyncStorage / SecureStore). With remote partner sync enabled, vote
          updates leave your device only after they are encrypted for your
          linked partner's device.
        </Section>

        <Section title="Partner Sync">
          Invite links contain a temporary secret used to link two devices. The
          relay stores invite status, linked device IDs, optional profile
          display metadata, and encrypted sync payloads. It does not receive the
          plaintext contents of your votes.
        </Section>

        <Section title="Third-Party Services">
          SpiceSync does not integrate with any third-party analytics,
          advertising, or tracking services. No SDKs that collect data are
          included in the app.
        </Section>

        <Section title="Children">
          SpiceSync is intended exclusively for adults aged 18 and older. We do
          not knowingly collect any information from minors. An age confirmation
          is required before accessing any app content.
        </Section>

        <Section title="Data Deletion">
          Because all data is stored locally on your device, you can delete it
          at any time by clearing the app's storage in your device settings or
          by uninstalling the app.
        </Section>

        <Section title="Changes to This Policy">
          We may update this Privacy Policy from time to time. Any changes will
          be reflected in an updated version of the app.
        </Section>

        <Section title="Contact">
          If you have questions about this Privacy Policy, you can reach us
          through the App Store listing for SpiceSync.
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 20,
  },
  updated: {
    fontSize: 16,
    color: '#888',
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  body: {
    fontSize: 16,
    color: '#333',
    lineHeight: 23,
  },
});
