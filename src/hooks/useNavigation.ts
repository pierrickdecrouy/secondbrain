import { useCallback, useState } from 'react';
import { useUIStore } from '../store/useUIStore';

export function useNavigation() {
    const { setActiveSection, setSidebarOpen, setViewMode, viewMode, activeSection } = useUIStore();

    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [pendingClusterReview, setPendingClusterReview] = useState(false);
    const [networkPanelPinned, setNetworkPanelPinned] = useState(false);
    const [pinnedCardId, setPinnedCardId] = useState<string | null>(null);

    const navigateSection = useCallback((section: typeof activeSection) => {
        setActiveSection(section);
        setSidebarOpen(false);
        setSelectedCardId(null); // Clear selected card when switching sections
        if (section === 'network') {
            setViewMode('network');
        }
        if (section === 'cards' && viewMode === 'network') {
            setViewMode('grid');
        }
        // Always clear pinned cards when changing tabs
        setNetworkPanelPinned(false);
        setPinnedCardId(null);
    }, [viewMode, setActiveSection, setSidebarOpen, setViewMode]);

    const startClusterReviewMode = useCallback(() => {
        setActiveSection('network');
        setViewMode('network');
        setPendingClusterReview(true);
    }, [setActiveSection, setViewMode]);

    const cancelClusterReviewMode = useCallback(() => {
        setPendingClusterReview(false);
    }, []);

    return {
        selectedCardId,
        setSelectedCardId,
        pendingClusterReview,
        setPendingClusterReview,
        networkPanelPinned,
        setNetworkPanelPinned,
        pinnedCardId,
        setPinnedCardId,
        navigateSection,
        startClusterReviewMode,
        cancelClusterReviewMode,
    };
}
