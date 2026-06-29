import { create } from 'zustand';
import type { PausedTask } from '../types';
import { loadSettingAsync, saveSettingAsync } from '../persistentSettings';

const PAUSED_TASKS_KEY = 'pharmabrain_paused_tasks_v1';

interface TaskStoreState {
    pausedTasks: PausedTask[];
    isLoaded: boolean;
    loadTasks: () => Promise<void>;
    handleAutoSaveTask: (task: PausedTask) => void;
    handleRemoveTask: (id: string) => void;
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
    pausedTasks: [],
    isLoaded: false,

    loadTasks: async () => {
        if (get().isLoaded) return;
        const storedTasks = await loadSettingAsync(PAUSED_TASKS_KEY, []);
        if (storedTasks && Array.isArray(storedTasks)) {
            set({ pausedTasks: storedTasks, isLoaded: true });
        } else {
            set({ isLoaded: true });
        }
    },

    handleAutoSaveTask: (task: PausedTask) => {
        set((state) => {
            const isCardEdit = task.type === 'card_edit';
            const editingCardId = isCardEdit ? (task.state.card as any)?.id : null;

            let filtered = state.pausedTasks.filter((t) => t.id !== task.id);

            // Prevent duplicates of the same card being edited
            if (isCardEdit && editingCardId) {
                filtered = filtered.filter(
                    (t) => t.type !== 'card_edit' || (t.state.card as any)?.id !== editingCardId
                );
            }

            const next = [task, ...filtered];
            saveSettingAsync(PAUSED_TASKS_KEY, next);
            return { pausedTasks: next };
        });
    },

    handleRemoveTask: (id: string) => {
        set((state) => {
            const next = state.pausedTasks.filter((t) => t.id !== id);
            saveSettingAsync(PAUSED_TASKS_KEY, next);
            return { pausedTasks: next };
        });
    },
}));
