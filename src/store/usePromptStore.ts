import { create } from 'zustand';

interface PromptState {
    isOpen: boolean;
    title: string;
    defaultValue: string;
    resolve: ((value: string | null) => void) | null;
    
    openPrompt: (title: string, defaultValue?: string) => Promise<string | null>;
    closePrompt: (value: string | null) => void;
}

export const usePromptStore = create<PromptState>((set, get) => ({
    isOpen: false,
    title: '',
    defaultValue: '',
    resolve: null,
    
    openPrompt: (title, defaultValue = '') => {
        return new Promise((resolve) => {
            set({ isOpen: true, title, defaultValue, resolve });
        });
    },
    
    closePrompt: (value) => {
        const { resolve } = get();
        if (resolve) resolve(value);
        set({ isOpen: false, resolve: null });
    }
}));
