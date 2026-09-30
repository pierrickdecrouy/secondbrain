import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlobalHeader } from './GlobalHeader';
import { useUIStore } from '../store/useUIStore';

const retryMock = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

vi.mock('../context/ThemeContext', () => ({
    useTheme: () => ({ darkMode: false, setThemeMode: vi.fn() }),
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        user: { uid: 'u1', displayName: 'User', email: 'user@test.dev' },
        signInWithGoogle: vi.fn(),
        logout: vi.fn(),
    }),
}));

vi.mock('../services/syncQueue', () => ({
    syncQueue: {
        requestProcessQueue: () => retryMock(),
    },
}));

vi.mock('./PomodoroTimer', () => ({
    PomodoroTimer: () => <div>Pomodoro</div>,
}));

vi.mock('./Avatar', () => ({
    Avatar: () => <div>Avatar</div>,
}));

describe('GlobalHeader sync feedback', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useUIStore.setState({
            isProfileMenuOpen: false,
            syncStatus: 'error',
            lastSyncAt: null,
            lastSyncError: 'Erreur test',
            pendingSyncTasks: 2,
            sidebarOpen: false,
            userName: 'Test',
            avatarConfig: { type: 'auto' },
        } as any);
    });

    it('offers a retry action when sync is in error', () => {
        render(<GlobalHeader isHomeSection={false} onNavigateSettings={vi.fn()} />);
        const retryButton = screen.getByLabelText('Erreur test');
        fireEvent.click(retryButton);
        expect(retryMock).toHaveBeenCalledTimes(1);
    });
});
