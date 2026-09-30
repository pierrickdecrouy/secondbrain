import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LLMMode = 'hybrid' | 'local' | 'cloud';

interface LLMState {
    mode: LLMMode;
    apiKey: string;
    cloudModel: string;
    extndBotEnabled: boolean;
    setMode: (mode: LLMMode) => void;
    setApiKey: (key: string) => void;
    setCloudModel: (model: string) => void;
    setExtndBotEnabled: (enabled: boolean) => void;
}

export const useLLMStore = create<LLMState>()(
    persist(
        (set) => ({
            mode: 'hybrid',
            apiKey: '',
            cloudModel: 'gemini-1.5-flash',
            extndBotEnabled: false,
            setMode: (mode) => set({ mode }),
            setApiKey: (apiKey) => set({ apiKey }),
            setCloudModel: (cloudModel) => set({ cloudModel }),
            setExtndBotEnabled: (extndBotEnabled) => set({ extndBotEnabled }),
        }),
        {
            name: 'llm-settings',
        }
    )
);
