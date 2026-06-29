import { useEffect } from 'react';
import { useUIStore as useUI } from '../store/useUIStore';

export type AppSection = 'dashboard' | 'cards' | 'courses' | 'network' | 'review' | 'settings' | 'stats';

interface UseGlobalShortcutsOptions {
    isNetworkContext: boolean;
    networkPanelPinned: boolean;
    setSelectedCardId: (id: string | null) => void;
    navigateSection: (section: AppSection) => void;
}

export function useGlobalShortcuts({
    isNetworkContext,
    networkPanelPinned,
    setSelectedCardId,
    navigateSection
}: UseGlobalShortcutsOptions) {
    const { setOmniboxOpen, sidebarOpen, setSidebarOpen, setAddDataMode } = useUI();

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setOmniboxOpen(true);
            }
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
                event.preventDefault();
                setAddDataMode('create');
            }
            if (event.key === 'Escape' && sidebarOpen) {
                setSidebarOpen(false);
                return;
            }
            if (event.key === 'Escape' && isNetworkContext && !networkPanelPinned) {
                setSelectedCardId(null);
            }
            if (event.altKey && ['1', '2', '3', '4', '5'].includes(event.key)) {
                event.preventDefault();
                const mapping: Record<string, AppSection> = {
                    '1': 'dashboard',
                    '2': 'cards',
                    '3': 'network',
                    '4': 'review',
                    '5': 'settings'
                };
                navigateSection(mapping[event.key]);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isNetworkContext, networkPanelPinned, navigateSection, sidebarOpen, setOmniboxOpen, setSidebarOpen, setSelectedCardId]);
}
