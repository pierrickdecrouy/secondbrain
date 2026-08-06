import { create } from 'zustand';
import type { Card } from '../types';
import type { AddDataMode } from '../types';
type ViewMode = 'grid' | 'list' | 'network' | 'split';
type SyncStatus = 'synced' | 'pending' | 'error';

export type AvatarConfig = {
  type: 'auto' | 'gradient' | 'dicebear' | 'icon';
  value?: string;
  color?: string;
};

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  isProfileMenuOpen: boolean;
  setProfileMenuOpen: (open: boolean) => void;
  
  isOmniboxOpen: boolean;
  setOmniboxOpen: (open: boolean) => void;
  
  userName: string;
  setUserName: (name: string) => void;
  
  avatarConfig: AvatarConfig;
  setAvatarConfig: (config: AvatarConfig) => void;
  
  addDataMode: AddDataMode;
  setAddDataMode: (mode: AddDataMode) => void;
  
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  activeFilters: string[];
  setActiveFilters: (filters: string[]) => void;
  
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;


  isZenMode: boolean;
  setZenMode: (isZen: boolean) => void;

  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;

  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;

  pendingOfflineCards: Card[] | null;
  setPendingOfflineCards: (cards: Card[] | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  sidebarCollapsed: localStorage.getItem('sidebarCollapsed') !== 'false',
  setSidebarCollapsed: (collapsed) => {
    localStorage.setItem('sidebarCollapsed', collapsed.toString());
    set({ sidebarCollapsed: collapsed });
  },
  
  isProfileMenuOpen: false,
  setProfileMenuOpen: (open) => set({ isProfileMenuOpen: open }),
  
  isOmniboxOpen: false,
  setOmniboxOpen: (open) => set({ isOmniboxOpen: open }),
  
  userName: 'Pierrick',
  setUserName: (name) => set({ userName: name }),
  
  avatarConfig: (() => {
    try {
        const stored = localStorage.getItem('extnd_avatar_config');
        return stored ? JSON.parse(stored) : { type: 'auto' };
    } catch {
        return { type: 'auto' };
    }
  })(),
  setAvatarConfig: (config) => {
    localStorage.setItem('extnd_avatar_config', JSON.stringify(config));
    set({ avatarConfig: config });
  },
  
  addDataMode: 'none',
  setAddDataMode: (mode) => set({ addDataMode: mode }),
  
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  activeFilters: [],
  setActiveFilters: (filters) => set({ activeFilters: filters }),
  
  viewMode: 'grid',
  setViewMode: (mode) => set({ viewMode: mode }),


  isZenMode: false,
  setZenMode: (isZen) => set({ isZenMode: isZen }),

  hasCompletedOnboarding: localStorage.getItem('extnd_onboarding_v1') === 'true',
  completeOnboarding: () => {
    localStorage.setItem('extnd_onboarding_v1', 'true');
    set({ hasCompletedOnboarding: true });
  },

  syncStatus: 'synced',
  setSyncStatus: (status) => set({ syncStatus: status }),

  pendingOfflineCards: null,
  setPendingOfflineCards: (cards) => set({ pendingOfflineCards: cards }),
}));
