import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BackHeader } from '../../components/app-chrome';

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="dark" />
      <BackHeader title="Terms of Service" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>Last updated: May 2025</Text>

        <Section title="Acceptance of Terms">
          By downloading or using SpiceSync, you agree to these Terms of
          Service. If you do not agree, do not use the app.
        </Section>

        <Section title="Age Requirement">
          SpiceSync is intended exclusively for adults aged 18 and older. By
          using the app, you confirm that you are at least 18 years of age. If
          you are under 18, you may not use this app.
        </Section>

        <Section title="Use of the App">
          SpiceSync is a personal tool for consenting adults to explore and
          share preferences with a partner. You agree to use the app only for
          its intended purpose and in compliance with all applicable laws in
          your jurisdiction.
        </Section>

        <Section title="Content">
          SpiceSync contains adult-oriented content. All content within the app
          is provided for informational and entertainment purposes between
          consenting adults. You are responsible for ensuring that your use of
          the app complies with local laws and regulations.
        </Section>

        <Section title="No Account Required">
          SpiceSync does not require you to create an account. All data is
          stored locally on your device. We do not have access to your data and
          cannot recover it if lost.
        </Section>

        <Section title="Disclaimer of Warranties">
          SpiceSync is provided "as is" without warranties of any kind, express
          or implied. We do not warrant that the app will be error-free,
          uninterrupted, or meet your specific requirements.
        </Section>

        <Section title="Limitation of Liability">
          To the maximum extent permitted by law, SpiceSync and its developers
          shall not be liable for any indirect, incidental, special, or
          consequential damages arising from your use of the app.
        </Section>

        <Section title="Changes to These Terms">
          We may update these Terms of Service from time to time. Continued use
          of the app after changes are posted constitutes acceptance of the
          updated terms.
        </Section>

        <Section title="Contact">
          Questions about these terms can be directed to us through the App
          Store listing for SpiceSync.
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
