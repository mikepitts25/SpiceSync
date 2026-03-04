# SpiceSync MVP Launch Plan
## Speed to Market: 4-6 Weeks to First Users

---

## Week 1-2: Core Foundation

### Must-Have Features Only
- [ ] **User auth** (Firebase Auth - email + anonymous)
- [ ] **Kink browsing** (swipeable cards, 3 categories)
- [ ] **Basic selection** (Yes / No / Maybe)
- [ ] **QR code sharing** (the differentiator)
- [ ] **Match results screen**

### Tech Stack (Keep It Simple)
```
Frontend: React Native (Expo) - one codebase, both platforms
Backend: Firebase (Auth + Firestore)
QR: LZ-string + qrcode library
Storage: Local AsyncStorage for selections
```

### Why Expo?
- No Xcode/Android Studio headaches
- Over-the-air updates
- Fast iteration
- Free for MVP

---

## Week 3: Polish & Test

### Critical Polish
- [ ] Smooth card animations (react-native-deck-swiper)
- [ ] QR scanning that actually works
- [ ] Match results that feel exciting, not clinical
- [ ] Splash screen + basic branding

### Testing
- [ ] 5 couples beta test
- [ ] QR scan success rate >90%
- [ ] iOS TestFlight build
- [ ] Android APK

---

## Week 4: Launch Prep

### App Store Assets
- [ ] Screenshots (5 frames, iPhone + Android)
- [ ] App description (sexy but safe for stores)
- [ ] Privacy policy (no data collection = simple)
- [ ] Demo video (15 sec, couples swiping)

### Landing Page
- [ ] Single page: problem → solution → download
- [ ] Email capture for waitlist
- [ ] Simple analytics (Plausible or none)

### Submission
- [ ] App Store (expect 1-2 day review)
- [ ] Google Play (expect 1-3 day review)
- [ ] Set price: FREE with in-app purchase later

---

## Week 5-6: Soft Launch

### Get First 100 Users
- [ ] Reddit: r/BDSMcommunity, r/sex, r/relationships (be helpful, not spammy)
- [ ] Twitter/X: Kink-friendly accounts
- [ ] Podcast outreach: Savage Love, sex-positive shows
- [ ] Influencer: 1-2 micro-influencers ($500 budget)

### Gather Feedback
- [ ] In-app survey (3 questions max)
- [ ] Email 20 power users for video call
- [ ] Track: retention, QR usage, match rate

---

## What Gets Cut (For Later)

| Cut Now | Add Later |
|---------|-----------|
| Spanish translation | v2.0 |
| User accounts/profiles | v1.5 |
| Chat/messaging | v2.0 (use existing apps) |
| Advanced matching algorithms | v1.5 |
| Subscription/payment | v1.5 |
| Web version | v2.0 |
| AI recommendations | v3.0 |
| Community features | v3.0 |

---

## The Pitch

**For couples:**
> "Discover what you both want—without the awkward conversation. Swipe through desires privately, then scan each other's codes to see where you match."

**Key hook:**
- Privacy-first (no accounts, no cloud)
- QR scanning feels fun/techy
- Immediate results (no waiting)

---

## Monetization Path (Post-MVP)

**Free:**
- 50 core kinks
- Basic QR sharing
- One partner match

**Pro ($4.99/month or $29.99/year):**
- All 250+ kinks
- Unlimited partner comparisons
- Save match history
- "Curated experiences" (guided scenarios)
- Couples challenges

**One-time unlock:**
- "Complete Collection" for $9.99

---

## Success Metrics (Month 1)

| Metric | Target |
|--------|--------|
| Downloads | 1,000 |
| Signups | 500 |
| QR scans completed | 300 |
| Matches made | 500+ |
| Day-7 retention | 30% |
| Store rating | 4.5+ |

---

## Risk Mitigation

**App Store rejection?**
- Submit as "Relationship Compatibility Tool"
- No explicit images
- Focus on "communication" and "consent"
- If rejected, appeal with explanation

**No one uses it?**
- Pivot to "friend compatibility" or "roommate compatibility"
- Keep same tech, change content

**QR doesn't work well?**
- Add NFC tap option (iOS/Android)
- Add backup: shareable link

---

## Next Steps (This Week)

1. **Today:** Finalize kink list (250 cards)
2. **Day 2:** Set up Expo project, Firebase
3. **Day 3:** Build card swiper component
4. **Day 4-5:** QR generation/scanning
5. **Weekend:** Match results screen

**Need help with:**
- [ ] App name (SpiceSync? Or something else?)
- [ ] Logo/icon (simple, suggestive but safe)
- [ ] Landing page copy
- [ ] Beta tester recruiting

---

## Total MVP Budget

| Item | Cost |
|------|------|
| Developer (you + AI) | $0 |
| Expo/Firebase free tier | $0 |
| Apple Developer | $99/year |
| Google Play | $25 one-time |
| Domain + simple hosting | $50/year |
| Initial marketing | $500 |
| **Total** | **~$675** |

---

Ready to build? Start with the card swiper—if that feels good, everything else follows.
