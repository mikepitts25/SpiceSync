import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from '../../components/SafeAreaView';
import { StatusBar } from 'expo-status-bar';
import { BackHeader } from '../../components/app-chrome';

import { ui } from '../../lib/i18n/uiLiteral';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="dark" />
      <BackHeader title={ui('Privacy Policy')} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>{ui('Last updated: August 2026')}</Text>

        <Section title={ui('Overview')}>
          {ui(
            ' SpiceSync is designed with privacy as a core principle. All data you create — profiles, votes, preferences, and matches — is stored on your device by default. If you connect a remote partner, SpiceSync uses a relay service only to pass encrypted sync updates between your devices. '
          )}
        </Section>

        <Section title={ui('Information We Collect')}>
          {ui(
            ' SpiceSync does not require an email address or password. If you choose Apple or Google to protect an account, SpiceSync uses the provider identifier needed to link and recover that account; we do not receive your provider password. When you use remote partner sync, SpiceSync creates an anonymous Supabase user ID and sends device IDs, device public keys for encryption and signing, invite and connection status, optional profile display metadata, and encrypted sync payloads to the relay. '
          )}
        </Section>

        <Section title={ui('How Your Data Is Stored')}>
          {ui(
            " All app data is stored locally using your device's built-in storage (AsyncStorage / SecureStore). With remote partner sync enabled, vote updates leave your device only after they are encrypted for your linked partner's device. "
          )}
        </Section>

        <Section title={ui('Encrypted Backups')}>
          {ui(
            ' You can create an encrypted backup of your profiles, votes, and progress. The backup is encrypted on your device with a recovery phrase that is shown to you once and is never sent anywhere or stored by SpiceSync. Only that phrase can open the backup, and if it is lost the backup cannot be recovered by us or anyone else. Backups are never uploaded automatically; the file goes wherever you choose to put it, and you are responsible for keeping it safe. Backups deliberately exclude your device sync identity, your partner link, your purchase entitlement, and any profile PINs. '
          )}
        </Section>

        <Section title={ui('Partner Sync')}>
          {ui(
            ' Invite links contain a temporary secret used to link two devices. The relay stores invite status, linked device IDs, optional profile display metadata, and encrypted sync payloads. It does not receive the plaintext contents of your votes. '
          )}
        </Section>

        <Section title={ui('Third-Party Services')}>
          {ui(
            ' Remote partner sync is provided through Supabase. SpiceSync does not include third-party advertising or tracking SDKs and does not use relay data for advertising. '
          )}
        </Section>

        <Section title={ui('Children')}>
          {ui(
            ' SpiceSync is intended exclusively for adults aged 18 and older. We do not knowingly collect any information from minors. An age confirmation is required before accessing any app content. '
          )}
        </Section>

        <Section title={ui('Data Deletion')}>
          {ui(
            ' Account deletion removes your SpiceSync authentication account, the provider email or identifier stored with it, account-associated device and couple metadata, invitations, and encrypted relay events. In-app deletion is immediate after fresh provider verification; manually verified requests are completed within 30 days. A manual request record retains the submitted provider, contact, status, and timestamps to process and document the request. Only the current device is cleared after in-app deletion; local copies on other devices remain until you reset or uninstall SpiceSync there. Reinstalling does not restore local profiles, votes, or history after deletion, unless you restore an encrypted backup you made yourself beforehand. Account deletion and store subscription cancellation are separate; SpiceSync currently offers lifetime access, not a subscription. Unlinking a partner revokes the connection, but clearing or uninstalling the app does not automatically delete relay records. '
          )}
        </Section>

        <Section title={ui('Reinstall Recovery')}>
          {ui(
            ' Reinstall recovery for a still-existing account restores account and couple metadata, including device public keys, but does not restore local history, intimate profile data, or vote data. '
          )}
        </Section>

        <Section title={ui('Changes to This Policy')}>
          {ui(
            ' We may update this Privacy Policy from time to time. Any changes will be reflected in an updated version of the app. '
          )}
        </Section>

        <Section title={ui('Contact')}>
          {ui(
            ' If you have questions about this Privacy Policy, you can reach us through the App Store listing for SpiceSync. '
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
