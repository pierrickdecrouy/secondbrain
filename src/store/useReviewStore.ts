import { create } from 'zustand';

interface ReviewSessionData {
    cardIds: string[];
    title: string;
    initialIndex?: number;
}

interface ReviewState {
    reviewSession: ReviewSessionData | null;
    setReviewSession: (session: ReviewSessionData | null) => void;
}

export const useReviewStore = create<ReviewState>((set) => ({
    reviewSession: null,
    setReviewSession: (session) => set({ reviewSession: session }),
}));
