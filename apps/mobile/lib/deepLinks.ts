import { useEffect } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';

import { parseInviteUrl, ParsedInviteUrl } from './sync/inviteFlow';

export function parseRemoteInviteUrl(url: string): ParsedInviteUrl | null {
  return parseInviteUrl(url);
}

export function useDeepLinks() {
  const router = useRouter();

  useEffect(() => {
    const handleURL = (url: string) => {
      const remote = parseRemoteInviteUrl(url);
      if (!remote) return;

      router.push({
        pathname: '/(onboarding)/partner-connect',
        params: {
          remoteInviteId: remote.inviteId,
          remoteInviteSecret: remote.inviteSecret,
        },
      });
    };

    const handleInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) handleURL(url);
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleURL(url);
    });

    handleInitialURL();

    return () => {
      subscription.remove();
    };
  }, [router]);
}
