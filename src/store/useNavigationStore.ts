import { create } from 'zustand';

interface NavigationState {
    selectedCardId: string | null;
    setSelectedCardId: (id: string | null) => void;
    
    pendingClusterReview: boolean;
    setPendingClusterReview: (pending: boolean) => void;
    
    networkPanelPinned: boolean;
    setNetworkPanelPinned: (pinned: boolean) => void;
    
    pinnedCardId: string | null;
    setPinnedCardId: (id: string | null) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
    selectedCardId: null,
    setSelectedCardId: (id) => set({ selectedCardId: id }),
    
    pendingClusterReview: false,
    setPendingClusterReview: (pending) => set({ pendingClusterReview: pending }),
    
    networkPanelPinned: false,
    setNetworkPanelPinned: (pinned) => set({ networkPanelPinned: pinned }),
    
    pinnedCardId: null,
    setPinnedCardId: (id) => set({ pinnedCardId: id }),
}));
