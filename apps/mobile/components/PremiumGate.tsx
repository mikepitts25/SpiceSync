import React, { useEffect, type PropsWithChildren } from 'react';
import { useRouter } from 'expo-router';

import { hasPremiumFeatureAccess } from '../lib/purchases/access';
import { usePremiumStore } from '../src/stores/premium';

export function PremiumGate({ children }: PropsWithChildren) {
  const router = useRouter();
  const locallyEntitled = usePremiumStore((state) => state.isPremium());
  const hasAccess = hasPremiumFeatureAccess(locallyEntitled);

  useEffect(() => {
    if (!hasAccess) router.replace('/(unlock)');
  }, [hasAccess, router]);

  return hasAccess ? <>{children}</> : null;
}
