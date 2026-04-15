import type { UserCardProgress } from '../types';

export type ReviewFeedback = 1 | 2 | 3; // 1 = ne connaît pas, 2 = moyen, 3 = connaît

export interface FSRSConfig {
    learningMinutes: number;
    mediumIntervalMultiplier: number;
    knownIntervalMultiplier: number;
    difficultyStepUp: number;
    difficultyStepDown: number;
    stabilityGain: number;
    stabilityLoss: number;
}

export const DEFAULT_FSRS_CONFIG: FSRSConfig = {
    learningMinutes: 10,
    mediumIntervalMultiplier: 0.85,
    knownIntervalMultiplier: 1.9,
    difficultyStepUp: 1.1,
    difficultyStepDown: 0.35,
    stabilityGain: 0.22,
    stabilityLoss: 0.55
};
const DIFFICULTY_SCALE_SIZE = 11; // distance from 0 for a 1..10 difficulty scale
const LEECH_THRESHOLD = 8;

const nowIso = () => new Date().toISOString();
const addMinutesIso = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();
const addDaysIso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const normalizeProgress = (progress?: Partial<UserCardProgress> | null): UserCardProgress => {
    const interval = Math.max(0, Number(progress?.interval ?? 0));
    const difficulty = clamp(Number(progress?.difficulty ?? 5), 1, 10);
    const stability = Math.max(0.2, Number(progress?.stability ?? (interval > 0 ? interval : 1)));
    return {
        status: progress?.status ?? 'new',
        step: Number(progress?.step ?? 0),
        dueDate: progress?.dueDate ?? nowIso(),
        interval,
        easeFactor: Number(progress?.easeFactor ?? 2.5),
        lapses: Number(progress?.lapses ?? 0),
        isLeech: Boolean(progress?.isLeech),
        algorithm: 'fsrs',
        difficulty,
        stability,
        reps: Number(progress?.reps ?? 0),
        lastReview: progress?.lastReview ?? null
    };
};

export function calculateFsrsProgress(
    current: Partial<UserCardProgress> | null | undefined,
    feedback: ReviewFeedback,
    customConfig: Partial<FSRSConfig> = {}
): UserCardProgress {
    const config = { ...DEFAULT_FSRS_CONFIG, ...customConfig };
    const progress = normalizeProgress(current);

    let difficulty = progress.difficulty ?? 5;
    let stability = progress.stability ?? 1;
    let lapses = progress.lapses ?? 0;
    const reps = (progress.reps ?? 0) + 1;

    if (feedback === 1) {
        difficulty = clamp(difficulty + config.difficultyStepUp, 1, 10);
        stability = Math.max(0.2, stability * config.stabilityLoss);
        lapses += 1;
        return {
            ...progress,
            algorithm: 'fsrs',
            status: 'learning',
            step: 0,
            interval: 0,
            dueDate: addMinutesIso(config.learningMinutes),
            difficulty,
            stability,
            reps,
            lapses,
            lastReview: nowIso(),
            isLeech: lapses >= LEECH_THRESHOLD
        };
    }

    const difficultyShift = feedback === 2 ? config.difficultyStepDown * 0.5 : config.difficultyStepDown;
    difficulty = clamp(difficulty - difficultyShift, 1, 10);

    const retrievabilityBonus = (DIFFICULTY_SCALE_SIZE - difficulty) / 10;
    const growth = 1 + config.stabilityGain * retrievabilityBonus * (feedback === 3 ? 1.25 : 0.85);
    stability = Math.max(0.2, stability * growth);

    const targetInterval = feedback === 3
        ? Math.max(1, Math.round(stability * config.knownIntervalMultiplier))
        : Math.max(1, Math.round(stability * config.mediumIntervalMultiplier));

    return {
        ...progress,
        algorithm: 'fsrs',
        status: 'review',
        step: 0,
        interval: targetInterval,
        dueDate: addDaysIso(targetInterval),
        difficulty,
        stability,
        reps,
        lastReview: nowIso(),
        isLeech: lapses >= LEECH_THRESHOLD
    };
}
