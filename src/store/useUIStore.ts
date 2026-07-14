import { create } from 'zustand';

export type AddDataMode = 'none' | 'create' | 'edit' | 'import';
type ViewMode = 'grid' | 'list' | 'network' | 'split';
type AppSection = 'dashboard' | 'cards' | 'courses' | 'network' | 'review' | 'settings' | 'stats' | 'add';
type SyncStatus = 'synced' | 'pending' | 'error';

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
  
  addDataMode: AddDataMode;
  setAddDataMode: (mode: AddDataMode) => void;
  
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  activeFilters: string[];
  setActiveFilters: (filters: string[]) => void;
  
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  activeSection: AppSection;
  setActiveSection: (section: AppSection) => void;

  isZenMode: boolean;
  setZenMode: (isZen: boolean) => void;

  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;

  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
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
  
  addDataMode: 'none',
  setAddDataMode: (mode) => set({ addDataMode: mode }),
  
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  activeFilters: [],
  setActiveFilters: (filters) => set({ activeFilters: filters }),
  
  viewMode: 'grid',
  setViewMode: (mode) => set({ viewMode: mode }),

  activeSection: 'dashboard',
  setActiveSection: (section) => set({ activeSection: section }),

  isZenMode: false,
  setZenMode: (isZen) => set({ isZenMode: isZen }),

  hasCompletedOnboarding: localStorage.getItem('extnd_onboarding_v1') === 'true',
  completeOnboarding: () => {
    localStorage.setItem('extnd_onboarding_v1', 'true');
    set({ hasCompletedOnboarding: true });
  },

  syncStatus: 'synced',
  setSyncStatus: (status) => set({ syncStatus: status }),
}));
