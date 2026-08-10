export function isPurchaseProviderConfigured(): boolean {
  return process.env.EXPO_PUBLIC_PURCHASES_ENABLED !== 'false';
}
