import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Partner {
  id: string;
  name: string;
  emoji: string;
  joinedAt: number;
  lastActive?: number;
}

export interface PartnerInvite {
  code: string;
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'accepted' | 'expired';
  partnerId?: string;
}

interface PartnerState {
  // Current partner
  partner: Partner | null;
  
  // Pending invite
  pendingInvite: PartnerInvite | null;
  
  // Actions
  generateInviteCode: () => string;
  cancelInvite: () => void;
  acceptInvite: (code: string, partnerInfo: Omit<Partner, 'id' | 'joinedAt'>) => boolean;
  removePartner: () => void;
  updatePartnerActivity: () => void;
  
  // Getters
  hasPartner: () => boolean;
  getInviteCode: () => string | null;
}

// Generate 6-character code (XXX-XXX format)
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

export const usePartnerStore = create<PartnerState>()(
  persist(
    (set, get) => ({
      partner: null,
      pendingInvite: null,
      
      generateInviteCode: () => {
        const code = generateCode();
        const now = Date.now();
        const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days
        
        set({
          pendingInvite: {
            code,
            createdAt: now,
            expiresAt,
            status: 'pending',
          },
        });
        
        return code;
      },
      
      cancelInvite: () => {
        set({ pendingInvite: null });
      },
      
      acceptInvite: (code, partnerInfo) => {
        // In a real app, this would verify the code with a server
        // For now, we'll simulate a successful match
        
        const newPartner: Partner = {
          ...partnerInfo,
          id: `partner-${Date.now()}`,
          joinedAt: Date.now(),
          lastActive: Date.now(),
        };
        
        set({
          partner: newPartner,
          pendingInvite: null,
        });
        
        return true;
      },
      
      removePartner: () => {
        set({ partner: null, pendingInvite: null });
      },
      
      updatePartnerActivity: () => {
        const { partner } = get();
        if (partner) {
          set({
            partner: {
              ...partner,
              lastActive: Date.now(),
            },
          });
        }
      },
      
      hasPartner: () => {
        return get().partner !== null;
      },
      
      getInviteCode: () => {
        const { pendingInvite } = get();
        if (pendingInvite && pendingInvite.status === 'pending') {
          // Check if expired
          if (Date.now() > pendingInvite.expiresAt) {
            set({
              pendingInvite: { ...pendingInvite, status: 'expired' },
            });
            return null;
          }
          return pendingInvite.code;
        }
        return null;
      },
    }),
    {
      name: 'spicesync-partner',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
