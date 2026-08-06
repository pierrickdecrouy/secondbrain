import { useLocation } from 'react-router-dom';
import { useUIStore } from '../store/useUIStore';
import type { AppSection } from '../types';

export function useCurrentSection(): AppSection {
    const location = useLocation();
    const path = location.pathname;
    
    if (path === '/') return 'dashboard';
    if (path.startsWith('/courses')) return 'courses';
    if (path.startsWith('/cards') || path.startsWith('/browse')) return 'cards';
    if (path.startsWith('/network')) return 'network';
    if (path.startsWith('/review')) return 'review';
    if (path.startsWith('/stats')) return 'stats';
    if (path.startsWith('/settings')) return 'settings';
    if (path.startsWith('/add')) return 'add';
    
    return 'dashboard'; // fallback
}
