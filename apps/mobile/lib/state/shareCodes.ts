import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkv';

export type ShareCode = {
  code: string;
  createdAt: number;
  expiresAt: number;
  profileId: string;
};

export type DecodedMatch = {
  profileId: string;
  votes: Record<string, 'yes' | 'maybe' | 'no'>;
  timestamp: number;
};

type ShareState = {
  myCodes: ShareCode[];
  scannedCodes: DecodedMatch[];
  
  // Actions
  generateCode: (profileId: string, votes: Record<string, string>) => string;
  decodeCode: (code: string) => DecodedMatch | null;
  saveScannedCode: (match: DecodedMatch) => void;
  getCompatibility: (myVotes: Record<string, string>, theirVotes: Record<string, string>) => {
    percentage: number;
    mutualYes: string[];
    mutualMaybe: string[];
    myYesTheirMaybe: string[];
    myMaybeTheirYes: string[];
  };
  clearOldCodes: () => void;
  deleteScannedCode: (profileId: string) => void;
};

// Generate a random 8-character code
function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code.match(/.{4}/g)?.join('-') || code; // Format as XXXX-XXXX
}

// Simple encoding of votes into a compact string
// Format: base64 encoded JSON with compression
function encodeVotes(profileId: string, votes: Record<string, string>): string {
  const data = {
    p: profileId.slice(0, 8), // Short profile ID
    v: Object.entries(votes).reduce((acc, [kinkId, vote]) => {
      // Map vote to single char: y=yes, m=maybe, n=no
      const v = vote === 'yes' ? 'y' : vote === 'maybe' ? 'm' : 'n';
      acc[kinkId.slice(0, 6)] = v; // Short kink IDs
      return acc;
    }, {} as Record<string, string>),
    t: Math.floor(Date.now() / 1000), // Timestamp
  };
  
  // Convert to base64 (URL safe)
  const json = JSON.stringify(data);
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeVotes(encoded: string): DecodedMatch | null {
  try {
    // Restore base64
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    
    const json = atob(base64);
    const data = JSON.parse(json);
    
    return {
      profileId: data.p,
      votes: Object.entries(data.v).reduce((acc, [kinkId, vote]) => {
        const v = vote === 'y' ? 'yes' : vote === 'm' ? 'maybe' : 'no';
        acc[kinkId] = v;
        return acc;
      }, {} as Record<string, 'yes' | 'maybe' | 'no'>),
      timestamp: data.t * 1000,
    };
  } catch {
    return null;
  }
}

export const useShareCodes = create<ShareState>()(
  persist(
    (set, get) => ({
      myCodes: [],
      scannedCodes: [],

      generateCode: (profileId, votes) => {
        const code = generateRandomCode();
        const now = Date.now();
        const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days
        
        const shareCode: ShareCode = {
          code,
          createdAt: now,
          expiresAt,
          profileId,
        };
        
        set((state) => ({
          myCodes: [...state.myCodes, shareCode],
        }));
        
        // Return code with encoded data
        const encoded = encodeVotes(profileId, votes);
        return `${code}:${encoded}`;
      },

      decodeCode: (fullCode) => {
        const parts = fullCode.split(':');
        if (parts.length !== 2) return null;
        
        const [, encoded] = parts;
        return decodeVotes(encoded);
      },

      saveScannedCode: (match) => {
        set((state) => ({
          scannedCodes: [
            ...state.scannedCodes.filter((s) => s.profileId !== match.profileId),
            match,
          ],
        }));
      },

      getCompatibility: (myVotes, theirVotes) => {
        const mutualYes: string[] = [];
        const mutualMaybe: string[] = [];
        const myYesTheirMaybe: string[] = [];
        const myMaybeTheirYes: string[] = [];
        
        const allKinks = new Set([...Object.keys(myVotes), ...Object.keys(theirVotes)]);
        
        for (const kinkId of allKinks) {
          const myVote = myVotes[kinkId];
          const theirVote = theirVotes[kinkId];
          
          if (!myVote || !theirVote) continue;
          if (myVote === 'no' || theirVote === 'no') continue;
          
          if (myVote === 'yes' && theirVote === 'yes') {
            mutualYes.push(kinkId);
          } else if (myVote === 'maybe' && theirVote === 'maybe') {
            mutualMaybe.push(kinkId);
          } else if (myVote === 'yes' && theirVote === 'maybe') {
            myYesTheirMaybe.push(kinkId);
          } else if (myVote === 'maybe' && theirVote === 'yes') {
            myMaybeTheirYes.push(kinkId);
          }
        }
        
        // Calculate percentage
        const totalMatches = mutualYes.length + mutualMaybe.length + 
                           myYesTheirMaybe.length + myMaybeTheirYes.length;
        const totalVoted = allKinks.size;
        const percentage = totalVoted > 0 ? Math.round((totalMatches / totalVoted) * 100) : 0;
        
        return {
          percentage,
          mutualYes,
          mutualMaybe,
          myYesTheirMaybe,
          myMaybeTheirYes,
        };
      },

      clearOldCodes: () => {
        const now = Date.now();
        set((state) => ({
          myCodes: state.myCodes.filter((c) => c.expiresAt > now),
        }));
      },

      deleteScannedCode: (profileId) => {
        set((state) => ({
          scannedCodes: state.scannedCodes.filter((s) => s.profileId !== profileId),
        }));
      },
    }),
    {
      name: 'share-codes',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
