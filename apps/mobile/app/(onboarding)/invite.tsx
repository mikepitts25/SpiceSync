import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function InviteScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(onboarding)/partner-connect');
  }, [router]);

  return null;
}
