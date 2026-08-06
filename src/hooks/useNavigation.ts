import { useCallback, useState } from 'react';
import { useUIStore } from '../store/useUIStore';
import { useNavigate } from 'react-router-dom';

import type { AppSection } from './useCurrentSection';

export function useNavigation() {
    const { setSidebarOpen, setViewMode, viewMode } = useUIStore();

    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [pendingClusterReview, setPendingClusterReview] = useState(false);
    const [networkPanelPinned, setNetworkPanelPinned] = useState(false);
    const [pinnedCardId, setPinnedCardId] = useState<string | null>(null);

    const navigate = useNavigate();

    const navigateSection = useCallback((section: AppSection) => {
        let path = '/';
        if (section === 'cards') path = '/cards';
        else if (section === 'courses') path = '/courses';
        else if (section === 'network') path = '/network';
        else if (section === 'review') path = '/review';
        else if (section === 'stats') path = '/stats';
        else if (section === 'settings') path = '/settings';
        else if (section === 'add') path = '/add';
        
        navigate(path);
        
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
    }, [viewMode, navigate, setSidebarOpen, setViewMode]);

    const startClusterReviewMode = useCallback(() => {
        navigate('/network');
        setViewMode('network');
        setPendingClusterReview(true);
    }, [navigate, setViewMode]);

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
