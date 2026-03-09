import { useEffect } from 'react';
import { Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { usePartnerStore } from '../src/stores/partner';

// Deep link prefixes
const PREFIXES = ['spicesync://', 'https://spicesync.app'];

// Parse deep link URL
export function parseInviteCode(url: string): string | null {
  // Handle formats:
  // spicesync://invite?code=ABC-123
  // https://spicesync.app/invite/ABC-123
  
  try {
    const urlObj = new URL(url);
    
    // Check if it's an invite link
    if (urlObj.pathname.includes('/invite') || urlObj.hostname === 'invite') {
      // Get code from query param or path
      const code = urlObj.searchParams.get('code') || 
                   urlObj.pathname.split('/').pop();
      
      if (code && /^[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(code)) {
        return code;
      }
    }
  } catch (e) {
    console.error('Failed to parse URL:', e);
  }
  
  return null;
}

// Hook to handle deep links
export function useDeepLinks() {
  const router = useRouter();
  const { partner, acceptInvite } = usePartnerStore();
  
  useEffect(() => {
    // Handle initial URL (app opened from link)
    const handleInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        handleURL(url);
      }
    };
    
    // Handle URL events (app already open)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleURL(url);
    });
    
    handleInitialURL();
    
    return () => {
      subscription.remove();
    };
  }, []);
  
  const handleURL = (url: string) => {
    const code = parseInviteCode(url);
    
    if (code) {
      // Check if user already has a partner
      if (partner) {
        Alert.alert(
          'Already Connected',
          'You already have a partner connected. Would you like to connect with someone new?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Continue', 
              onPress: () => router.push({
                pathname: '/(onboarding)/partner-connect',
                params: { code },
              }),
            },
          ]
        );
      } else {
        // Navigate to partner connect screen
        router.push({
          pathname: '/(onboarding)/partner-connect',
          params: { code },
        });
      }
    }
  };
}

// Generate shareable invite link
export function generateInviteLink(code: string): string {
  return `https://spicesync.app/invite/${code}`;
}

// Share invite message
export function getInviteMessage(code: string): string {
  return `Join me on SpiceSync! 💑\n\nUse code: ${code}\n\nDownload the app and enter this code to connect with me.\n\nhttps://spicesync.app/invite/${code}`;
}
