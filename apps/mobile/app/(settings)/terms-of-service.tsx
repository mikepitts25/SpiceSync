import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from '../../components/SafeAreaView';
import { StatusBar } from 'expo-status-bar';
import { BackHeader } from '../../components/app-chrome';

import { ui } from '../../lib/i18n/uiLiteral';

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="dark" />
      <BackHeader title={ui('Terms of Service')} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>{ui('Last updated: August 2026')}</Text>

        <Section title={ui('Acceptance of Terms')}>
          {ui(
            ' By downloading or using SpiceSync, you agree to these Terms of Service. If you do not agree, do not use the app. '
          )}
        </Section>

        <Section title={ui('Age Requirement')}>
          {ui(
            ' SpiceSync is intended exclusively for adults aged 18 and older. By using the app, you confirm that you are at least 18 years of age. If you are under 18, you may not use this app. '
          )}
        </Section>

        <Section title={ui('Use of the App')}>
          {ui(
            ' SpiceSync is a personal tool for consenting adults to explore and share preferences with a partner. You agree to use the app only for its intended purpose and in compliance with all applicable laws in your jurisdiction. '
          )}
        </Section>

        <Section title={ui('Content')}>
          {ui(
            ' SpiceSync contains adult-oriented content. All content within the app is provided for informational and entertainment purposes between consenting adults. You are responsible for ensuring that your use of the app complies with local laws and regulations. '
          )}
        </Section>

        <Section title={ui('No Email Account Required')}>
          {ui(
            ' SpiceSync does not require an email address or password. Most app data is stored locally. If you enable remote partner sync, the app creates an anonymous backend identity and sends limited connection metadata and encrypted partner-sync data through the relay as described in the Privacy Policy. '
          )}
        </Section>

        <Section title={ui('Disclaimer of Warranties')}>
          {ui(
            ' SpiceSync is provided "as is" without warranties of any kind, express or implied. We do not warrant that the app will be error-free, uninterrupted, or meet your specific requirements. '
          )}
        </Section>

        <Section title={ui('Limitation of Liability')}>
          {ui(
            ' To the maximum extent permitted by law, SpiceSync and its developers shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the app. '
          )}
        </Section>

        <Section title={ui('Changes to These Terms')}>
          {ui(
            ' We may update these Terms of Service from time to time. Continued use of the app after changes are posted constitutes acceptance of the updated terms. '
          )}
        </Section>

        <Section title={ui('Contact')}>
          {ui(
            ' Questions about these terms can be directed to us through the App Store listing for SpiceSync. '
          )}
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
