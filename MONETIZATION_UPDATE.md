# SpiceSync Monetization Update

## Overview
This update implements a new tiered monetization model to lower the barrier to entry and increase conversion.

## New Pricing Model

### 1. Base Premium - $4.99 (was $19.99)
- One-time unlock
- All premium features
- All 3 activity packs included
- Best value option

### 2. À La Carte Packs - $2.99 each
Individual themed activity packs:
- **Vacation Pack** 🏖️ - Travel & adventure themed activities
- **Kinky 201** 🔥 - Advanced & experimental activities  
- **Date Night** 💕 - Romantic evening focused activities

Each pack contains 15+ unique game cards.

### 3. Gift Subscriptions - $4.99
- Gift Premium to another couple
- Generates unique redeemable code
- Recipient gets lifetime Premium access

## Files Added/Modified

### New Files
- `lib/pricing.ts` - Pricing constants, SKUs, pack definitions
- `lib/packActivities.ts` - Pack-specific activity definitions
- `lib/purchases/purchaseService.ts` - IAP handling service
- `app/(redeem)/index.tsx` - Gift code redemption screen

### Modified Files
- `src/stores/premium.ts` - Added pack support & gift subscriptions
- `app/(unlock)/index.tsx` - New paywall UI with tabs
- `components/PaywallModal.tsx` - Updated modal with new pricing
- `hooks/usePaywall.ts` - Added pack access checking
- `app/_layout.tsx` - Added unlock & redeem routes

## Store Configuration

### Required IAP Products (App Store / Play Store)

| SKU | Type | Price | Description |
|-----|------|-------|-------------|
| `spicesync_premium_lifetime` | Non-consumable | $4.99 | Lifetime Premium |
| `pack_vacation` | Non-consumable | $2.99 | Vacation Pack |
| `pack_kinky201` | Non-consumable | $2.99 | Kinky 201 Pack |
| `pack_datenight` | Non-consumable | $2.99 | Date Night Pack |
| `spicesync_gift_premium` | Consumable | $4.99 | Gift Premium |

## Implementation Notes

### Entitlement Logic
```typescript
// Full premium unlocks everything
if (subscription.tier === 'premium' || subscription.tier === 'pro') {
  return true; // Access to all packs
}

// Individual pack access
return packs.some(p => p.packId === packId);
```

### Gift Code Format
- Prefix: `SPICE-`
- Length: 12 characters (after prefix)
- Characters: A-Z, 2-9 (excluding 0, O, 1, I)
- Example: `SPICE-A7B9C2D4E8F1`

### Legacy Support
- Existing $19.99 purchases remain valid (grandfathered)
- Legacy SKU: `spicesync_premium_legacy`
- No action needed for existing premium users

## Next Steps for Production

1. **Configure IAP Products**
   - Set up products in App Store Connect
   - Set up products in Google Play Console
   - Match SKUs exactly as defined in `lib/pricing.ts`

2. **Enable Real Purchase Flow**
   - Uncomment IAP library calls in `purchaseService.ts`
   - Install `expo-in-app-purchases` or `react-native-iap`
   - Test on real devices with sandbox accounts

3. **Backend Integration (Optional)**
   - Move gift code validation to server
   - Add receipt validation
   - Implement server-side purchase tracking

4. **Analytics**
   - Track conversion rates by tier
   - Monitor pack purchase distribution
   - Measure gift subscription uptake
