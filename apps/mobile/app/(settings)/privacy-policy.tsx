import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BackHeader } from '../../components/app-chrome';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />
      <BackHeader title="Privacy Policy" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Last updated: May 2025</Text>

        <Section title="Overview">
          SpiceSync is designed with privacy as a core principle. All data you create — profiles,
          votes, preferences, and partner codes — is stored exclusively on your device. We do not
          operate servers that collect, process, or store your personal information.
        </Section>

        <Section title="Information We Collect">
          We do not collect any personal information. SpiceSync has no accounts, no sign-up, no
          login, and no backend. Everything you enter stays on the device you entered it on.
        </Section>

        <Section title="How Your Data Is Stored">
          All app data is stored locally using your device's built-in storage (AsyncStorage /
          SecureStore). This data never leaves your device unless you explicitly share a partner
          code, which is a short encoded string containing only vote data — no names, no device
          identifiers, and no location information.
        </Section>

        <Section title="Partner Codes">
          When you share or receive a partner code, that code encodes a snapshot of vote choices
          (yes, maybe, no) for specific activities. No identifying information about you or your
          device is included in these codes. Codes are shared directly between users — SpiceSync
          does not transmit them through any server.
        </Section>

        <Section title="Third-Party Services">
          SpiceSync does not integrate with any third-party analytics, advertising, or tracking
          services. No SDKs that collect data are included in the app.
        </Section>

        <Section title="Children">
          SpiceSync is intended exclusively for adults aged 18 and older. We do not knowingly
          collect any information from minors. An age confirmation is required before accessing
          any app content.
        </Section>

        <Section title="Data Deletion">
          Because all data is stored locally on your device, you can delete it at any time by
          clearing the app's storage in your device settings or by uninstalling the app.
        </Section>

        <Section title="Changes to This Policy">
          We may update this Privacy Policy from time to time. Any changes will be reflected in an
          updated version of the app.
        </Section>

        <Section title="Contact">
          If you have questions about this Privacy Policy, you can reach us through the App Store
          listing for SpiceSync.
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
    fontSize: 12,
    color: '#888',
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  body: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
});
