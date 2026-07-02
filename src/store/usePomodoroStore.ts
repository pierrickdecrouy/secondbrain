import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroSettings {
    focus: number; // minutes
    shortBreak: number;
    longBreak: number;
}

interface PomodoroState {
    timeLeft: number; // seconds
    isRunning: boolean;
    mode: PomodoroMode;
    settings: PomodoroSettings;
    showModal: boolean;
    cycleCount: number;
    
    start: () => void;
    pause: () => void;
    reset: () => void;
    tick: () => void;
    updateSettings: (settings: Partial<PomodoroSettings>) => void;
    openModal: () => void;
    closeModal: () => void;
}

export const usePomodoroStore = create<PomodoroState>()(
    persist(
        (set, get) => ({
            timeLeft: 25 * 60,
            isRunning: false,
            mode: 'focus',
            settings: {
                focus: 25,
                shortBreak: 5,
                longBreak: 15,
            },
            showModal: false,
            cycleCount: 0,

            start: () => set({ isRunning: true }),
            pause: () => set({ isRunning: false }),
            
            reset: () => {
                const { mode, settings } = get();
                const minutes = mode === 'focus' ? settings.focus : 
                              mode === 'shortBreak' ? settings.shortBreak : settings.longBreak;
                set({ isRunning: false, timeLeft: minutes * 60 });
            },

            tick: () => {
                const state = get();
                if (!state.isRunning) return;

                if (state.timeLeft > 0) {
                    set({ timeLeft: state.timeLeft - 1 });
                } else {
                    // Timer ended
                    // Play sound and notification
                    new Audio('/bell.mp3').play().catch(() => {});
                    if (Notification.permission === 'granted') {
                        new Notification('Pomodoro', {
                            body: state.mode === 'focus' ? 'Session terminée, place à la pause !' : 'Pause terminée, au travail !',
                            icon: '/Logo-mark.svg' // assuming there's an icon
                        });
                    } else if (Notification.permission !== 'denied') {
                        Notification.requestPermission();
                    }

                    // Auto switch
                    let newMode: PomodoroMode = 'focus';
                    let newCycleCount = state.cycleCount;

                    if (state.mode === 'focus') {
                        newCycleCount += 1;
                        if (newCycleCount % 4 === 0) {
                            newMode = 'longBreak';
                        } else {
                            newMode = 'shortBreak';
                        }
                    } else {
                        // Was on break, go back to focus
                        newMode = 'focus';
                        // Keep cycleCount
                    }

                    const newMinutes = newMode === 'focus' ? state.settings.focus :
                                     newMode === 'shortBreak' ? state.settings.shortBreak : state.settings.longBreak;

                    set({
                        mode: newMode,
                        cycleCount: newCycleCount,
                        timeLeft: newMinutes * 60,
                        isRunning: false // Wait for user to start the next cycle (or could auto-start based on a setting)
                    });
                }
            },

            updateSettings: (newSettings) => {
                set((state) => {
                    const settings = { ...state.settings, ...newSettings };
                    // If not running and in focus mode (or another mode), update the time left to reflect new settings
                    let timeLeft = state.timeLeft;
                    if (!state.isRunning) {
                        const minutes = state.mode === 'focus' ? settings.focus :
                                      state.mode === 'shortBreak' ? settings.shortBreak : settings.longBreak;
                        timeLeft = minutes * 60;
                    }
                    return { settings, timeLeft };
                });
            },

            openModal: () => set({ showModal: true }),
            closeModal: () => set({ showModal: false })
        }),
        {
            name: 'pomodoro-storage',
            partialize: (state) => ({ settings: state.settings }) // only persist settings
        }
    )
);
