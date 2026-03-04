# QR Code Kink Sharing - Technical Specification

## Overview
Privacy-first way for couples to compare kinks without any data touching a server. All matching happens locally on-device after QR code exchange.

## Core Concept
1. Partner A selects their kinks in the app
2. App generates a QR code containing encrypted/compressed kink data
3. Partner B scans the QR code with their app
4. Both devices now have both datasets
5. Local matching algorithm shows overlaps
6. No server involved, zero data persistence

## Data Flow

```
┌─────────────┐         ┌─────────────┐
│  Partner A  │         │  Partner B  │
│   Device    │         │   Device    │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │  1. Select Kinks      │
       │  2. Generate QR       │
       │                       │
       │     ┌─────────┐       │
       │     │   QR    │       │
       │     │  Code   │       │
       │     └────┬────┘       │
       │          │            │
       │          │ 3. Scan     │
       │          │───────────>│
       │          │            │
       │  4. Decrypt/Decode    │
       │<─────────────────────>│
       │          │            │
       │  5. Local Matching    │
       │  6. Show Results      │
```

## Data Structure

### User Selection Object
```typescript
interface UserKinkSelection {
  userId: string;           // Anonymous UUID, regenerated each session
  timestamp: number;        // Unix timestamp, for expiration
  selections: string[];     // Array of kink slugs selected
  limits: string[];         // Array of kink slugs marked as limits/hard no
  maybe: string[];          // Array of kink slugs marked as "maybe/curious"
  version: string;          // App version for compatibility
}

// Example
{
  "userId": "anon-7f8d9a2b",
  "timestamp": 1704067200,
  "selections": [
    "oral-face-sitting-receive",
    "bondage-wrists-receive", 
    "spanking-receive",
    "roleplay-stranger"
  ],
  "limits": [
    "cnc-agreed",
    "watersports"
  ],
  "maybe": [
    "anal-beginner-receive"
  ],
  "version": "1.2.0"
}
```

## Compression & Encoding

### Size Calculation
- Typical selection: 30-80 kink slugs
- Average slug length: ~25 characters
- Raw JSON: ~2-4KB
- After compression: ~500-1500 bytes
- QR Code capacity: ~3KB ( alphanumeric )

### Compression Strategy
```javascript
// 1. Replace full slugs with indices if using standard set
// Or use dictionary compression

// 2. Pack into compact format
const compact = {
  u: "anon-7f8d9a2b",     // userId
  t: 1704067200,          // timestamp
  s: [45, 67, 89, 120],   // selection indices
  l: [200, 210],          // limit indices
  m: [34],                // maybe indices
  v: "1.2.0"
};

// 3. JSON.stringify + LZ-string compression
// 4. Base64 encode for QR compatibility
```

### QR Code Generation
```javascript
import QRCode from 'qrcode';
import { compressToBase64 } from 'lz-string';

function generateQR(userData) {
  // Compact the data
  const compact = compactUserData(userData);
  
  // Compress
  const compressed = compressToBase64(JSON.stringify(compact));
  
  // Generate QR
  const qrDataUrl = QRCode.toDataURL(compressed, {
    errorCorrectionLevel: 'M',  // Medium, balances capacity/reliability
    width: 512,
    margin: 2
  });
  
  return qrDataUrl;
}
```

### QR Code Scanning
```javascript
import { decompressFromBase64 } from 'lz-string';

function scanQR(qrContent) {
  try {
    // Decompress
    const json = decompressFromBase64(qrContent);
    const compact = JSON.parse(json);
    
    // Validate
    if (!compact.v || !compact.u || !compact.s) {
      throw new Error('Invalid QR data');
    }
    
    // Check expiration (QR valid for 24 hours)
    const age = Date.now() - (compact.t * 1000);
    if (age > 24 * 60 * 60 * 1000) {
      throw new Error('QR code expired');
    }
    
    // Expand compact format back to full
    return expandUserData(compact);
  } catch (e) {
    throw new Error('Failed to parse QR: ' + e.message);
  }
}
```

## Matching Algorithm

### Simple Match (Same Slug)
```javascript
function findMatches(userA, userB) {
  const matches = {
    // Both want the same exact thing
    perfect: [],
    
    // One wants to give, other wants to receive (complementary)
    complementary: [],
    
    // One wants it, other is curious
    potential: [],
    
    // Hard limits that conflict
    conflicts: []
  };
  
  // Find perfect matches
  for (const kink of userA.selections) {
    if (userB.selections.includes(kink)) {
      matches.perfect.push({
        kink: kink,
        type: 'both-want'
      });
    }
  }
  
  // Find complementary matches
  // e.g., userA has "oral-face-sitting-give" 
  //       userB has "oral-face-sitting-receive"
  for (const kinkA of userA.selections) {
    if (kinkA.endsWith('-give')) {
      const base = kinkA.replace('-give', '');
      const complement = base + '-receive';
      if (userB.selections.includes(complement)) {
        matches.complementary.push({
          kink: base,
          giver: userA.userId,
          receiver: userB.userId
        });
      }
    }
    if (kinkA.endsWith('-receive')) {
      const base = kinkA.replace('-receive', '');
      const complement = base + '-give';
      if (userB.selections.includes(complement)) {
        matches.complementary.push({
          kink: base,
          giver: userB.userId,
          receiver: userA.userId
        });
      }
    }
  }
  
  // Find potential (maybe) matches
  for (const kink of userA.selections) {
    if (userB.maybe.includes(kink)) {
      matches.potential.push({
        kink: kink,
        status: 'partner-curious'
      });
    }
  }
  
  // Check for conflicts
  for (const limit of userA.limits) {
    if (userB.selections.includes(limit)) {
      matches.conflicts.push({
        kink: limit,
        conflict: 'hard-limit-vs-desire'
      });
    }
  }
  
  return matches;
}
```

### Match Display Categories
```typescript
interface MatchResults {
  // "You both want this"
  mutualDesires: MatchedKink[];
  
  // "You want to give, they want to receive" 
  complementary: ComplementaryMatch[];
  
  // "You're curious about..." (both maybe)
  exploreTogether: MatchedKink[];
  
  // "They want to try... you're open to"
  theirDesireYourMaybe: MatchedKink[];
  
  // "You want to try... they're open to"
  yourDesireTheirMaybe: MatchedKink[];
  
  // Conflicts to discuss
  limits: Conflict[];
}
```

## UI Flow

### Screen 1: My Kinks
- User browses/swipes through kink cards
- Selects: Yes (green) / No (red) / Maybe (yellow)
- "Share My Kinks" button when done

### Screen 2: Share Options
```
┌─────────────────────────────┐
│     Share Your Kinks        │
│                             │
│   [ Show QR Code ]          │
│                             │
│   - or -                    │
│                             │
│   [ Scan Their QR ]         │
│                             │
│   [ Share via Link ]        │
│   (encrypted, expires)      │
└─────────────────────────────┘
```

### Screen 3: QR Display
```
┌─────────────────────────────┐
│   Have your partner scan    │
│                             │
│   ┌───────────────────┐     │
│   │                   │     │
│   │     [QR CODE]     │     │
│   │                   │     │
│   └───────────────────┘     │
│                             │
│   Valid for 24 hours        │
│   [ Generate New ]          │
└─────────────────────────────┘
```

### Screen 4: Scan QR
- Camera view with QR frame
- Auto-detect and vibrate on success
- Loading animation while processing

### Screen 5: Match Results
```
┌─────────────────────────────┐
│      Your Compatibility     │
│         🔥 87% Match        │
│                             │
│ 💚 Mutual Desires (12)      │
│    • Oral Face Sitting      │
│    • Light Bondage          │
│    • Roleplay Stranger      │
│                             │
│ 💜 Perfect Fit (8)          │
│    • You give → They receive│
│    • You receive → They give│
│                             │
💛 Explore Together (5)       │
│    • Both curious about...  │
│                             │
│ ⚠️  Discuss (2)             │
│    • Conflicting limits     │
└─────────────────────────────┘
```

## Security Considerations

### 1. No Server Storage
- All data stays on device
- QR is generated client-side
- No API calls for matching

### 2. Expiration
- QR codes expire after 24 hours
- Timestamp embedded in data
- Old codes rejected

### 3. Optional Encryption
```javascript
// Optional: Add password protection
function encryptWithPassword(data, password) {
  const key = deriveKey(password);  // PBKDF2
  return aesEncrypt(data, key);
}

// User can optionally set a 4-digit PIN
// PIN is required to scan/decrypt
```

### 4. One-Time Use Option
```javascript
// Add nonce that makes QR single-use
{
  ...data,
  nonce: crypto.randomUUID(),
  oneTime: true
}

// After first scan, mark as used locally
// Subsequent scans rejected
```

## Alternative: Encrypted Link Sharing

For users who can't scan QR in person:

```javascript
// Generate encrypted blob
const encrypted = encrypt(userData, sessionKey);
const blobId = await uploadTempBlob(encrypted, { expires: '1h' });

// Share short link
const shareUrl = `https://spicesync.app/s/${blobId}#${sessionKey}`;

// Hash fragment (after #) never hits server
// Only browser can decrypt

// Recipient opens link:
// 1. Fetch encrypted blob from server
// 2. Decrypt using key from URL hash
// 3. Server never sees plaintext
```

## Implementation Phases

### Phase 1: Basic QR (MVP)
- [ ] QR generation with compressed data
- [ ] QR scanning with camera
- [ ] Basic matching algorithm
- [ ] Match results display

### Phase 2: Enhanced Security
- [ ] Expiration timestamps
- [ ] Optional PIN protection
- [ ] One-time use option

### Phase 3: Advanced Features
- [ ] Encrypted link sharing
- [ ] Multiple partner comparison
- [ ] Save match results locally
- [ ] Export compatibility report

## Libraries Needed

```json
{
  "dependencies": {
    "qrcode": "^1.5.3",
    "lz-string": "^1.5.0",
    "react-native-camera": "^4.2.1",
    "react-native-qrcode-scanner": "^1.5.5"
  }
}
```

## File Structure

```
/src/features/qr-sharing/
  ├── components/
  │   ├── QRDisplay.tsx       # Show generated QR
  │   ├── QRScanner.tsx       # Camera scanner
  │   └── MatchResults.tsx    # Display matches
  ├── hooks/
  │   ├── useQRGenerator.ts   # Generate QR data
  │   ├── useQRScanner.ts     # Handle scanning
  │   └── useKinkMatching.ts  # Matching algorithm
  ├── utils/
  │   ├── compression.ts      # LZ-string wrapper
  │   ├── crypto.ts           # Encryption helpers
  │   └── matching.ts         # Match logic
  └── types.ts                # TypeScript interfaces
```

## Success Metrics

- QR generation time: <500ms
- QR scan success rate: >95%
- Data decode time: <100ms
- Matching calculation: <50ms
- QR readable from 6 inches to 2 feet
