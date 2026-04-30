import type { UserCardProgress } from '../types';

export interface SRSConfig {
    learningSteps: number[];
    defaultEaseFactor: number;
    minEaseFactor: number;
    fuzzEnabled: boolean;
    examDate?: string | null;
    examModeEnabled?: boolean; // Intensify reviews when exam is ≤15 days away
    showContextHint?: boolean; // Show Mind Map breadcrumbs during review
}

export const DEFAULT_SRS_CONFIG: SRSConfig = {
    learningSteps: [1, 10], // minutes
    defaultEaseFactor: 2.5,
    minEaseFactor: 1.3,
    fuzzEnabled: true,
    examModeEnabled: false,
    showContextHint: true // Contextual Recall enabled by default
};

// Helper to get the due date string (UTC)
const getDueDate = (days: number): string => {
    const date = new Date();
    // Rollover at 4 AM logic:
    // If current hour is < 4, we consider it "yesterday" for spacing purposes
    if (date.getHours() < 4) {
        date.setDate(date.getDate() - 1);
    }
    date.setDate(date.getDate() + days);
    return date.toISOString();
};

const getDueTime = (minutes: number): string => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutes);
    return date.toISOString();
};

export interface SRSResult {
    status: 'learning' | 'review' | 'suspended';
    step: number;
    dueDate: string;
    interval: number;
    easeFactor: number;
    lapses: number;
    isLeech?: boolean;
}

/**
 * Compute how many days until the exam. Returns null if no date is set.
 */
export function daysUntilExam(examDate?: string | null): number | null {
    if (!examDate) return null;
    const exam = new Date(examDate);
    if (isNaN(exam.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    exam.setHours(0, 0, 0, 0);
    return Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Applies the "Exam Mode" modifier to a computed SRS result.
 * When the exam is within 15 days, intervals are halved (min 1) to intensify revision.
 */
export function applyExamModifier(result: SRSResult, days: number): SRSResult {
    if (days > 15 || days <= 0) return result;

    if (result.status === 'review') {
        const newInterval = Math.max(1, Math.floor(result.interval / 2));
        return {
            ...result,
            interval: newInterval,
            dueDate: getDueDate(newInterval),
        };
    }

    if (result.status === 'learning') {
        // Shorten learning steps by 50% (min 1 minute)
        return {
            ...result,
            dueDate: getDueTime(Math.max(1, Math.floor(
                (new Date(result.dueDate).getTime() - Date.now()) / 60000 / 2
            ))),
        };
    }

    return result;
}

export const calculateSrsData = (
    progress: Partial<UserCardProgress> | null | undefined,
    rating: number, // 1: Again/Oubli, 2: Hard/Difficile, 3: Good/Bien, 4: Easy/Facile
    customConfig: Partial<SRSConfig> = {}
): SRSResult => {
    const config = { ...DEFAULT_SRS_CONFIG, ...customConfig };
    const { learningSteps, defaultEaseFactor, minEaseFactor, fuzzEnabled } = config;

    let {
        interval = 0,
        easeFactor = defaultEaseFactor,
        status = 'new',
        step = 0,
        lapses = 0,
    } = progress || {};

    if (status === 'review' && interval < 2 && easeFactor > 1.5) {
        const minExpectedInterval = Math.max(2, Math.round(easeFactor));
        console.warn(`SRS Data Recovery: interval=${interval} too low for EF=${easeFactor}. Recalculating to ${minExpectedInterval}`);
        interval = minExpectedInterval;
    }

    let result: SRSResult = { status: 'learning', step: 0, dueDate: getDueTime(learningSteps[0]), interval: 0, easeFactor, lapses };

    if (status === 'new' || status === 'learning') {
        // En phase d'apprentissage, on ne modifie pas l'Ease Factor (EF).
        // On modifie juste l'étape (step) ou on passe en review.
        switch (rating) {
            case 1: // Oubli / Again
                result = {
                    status: 'learning',
                    step: 0,
                    easeFactor, // EF inchangé
                    dueDate: getDueTime(learningSteps[0]),
                    interval: 0,
                    lapses: lapses
                };
                break;
            case 2: // Difficile / Hard
                result = {
                    status: 'learning',
                    step: status === 'learning' ? step : 0,
                    easeFactor, // EF inchangé
                    dueDate: getDueTime(learningSteps[step] || learningSteps[0]),
                    interval: 0,
                    lapses: lapses
                };
                break;
            case 3: // Bien / Good
                const nextStep = step + 1;
                if (nextStep >= learningSteps.length) {
                    result = {
                        status: 'review',
                        step: 0,
                        easeFactor, // EF inchangé
                        interval: 1,
                        dueDate: getDueDate(1),
                        lapses: lapses
                    };
                } else {
                    result = {
                        status: 'learning',
                        step: nextStep,
                        easeFactor,
                        dueDate: getDueTime(learningSteps[nextStep]),
                        interval: 0,
                        lapses: lapses
                    };
                }
                break;
            case 4: // Facile / Easy
                result = {
                    status: 'review',
                    step: 0,
                    easeFactor, // EF inchangé
                    interval: 4,
                    dueDate: getDueDate(4),
                    lapses: lapses
                };
                break;
            default:
                result = { status: 'learning', step: 0, dueDate: getDueTime(learningSteps[0]), interval: 0, easeFactor, lapses };
        }
    }
    else if (status === 'review') {
        if (rating === 1) { // Lapse / Oubli
            const newLapses = lapses + 1;

            if (newLapses >= 8) {
                // Leech
                result = {
                    status: 'suspended',
                    step: 0,
                    easeFactor: minEaseFactor,
                    interval: 0,
                    dueDate: getDueTime(learningSteps[0]),
                    lapses: newLapses,
                    isLeech: true
                };
            } else {
                result = {
                    status: 'learning',
                    step: 0,
                    easeFactor: Math.max(minEaseFactor, easeFactor - 0.20),
                    interval: 0,
                    dueDate: getDueTime(learningSteps[0]),
                    lapses: newLapses,
                    isLeech: false
                };
            }
        } else {
            // Successful Review
            let newEaseFactor = easeFactor;
            let newInterval: number;

            switch (rating) {
                case 2: // Hard / Difficile
                    newEaseFactor = Math.max(minEaseFactor, easeFactor - 0.15);
                    newInterval = Math.round(interval * 1.2);
                    break;
                case 3: // Good / Bien
                    newInterval = Math.round(interval * easeFactor);
                    break;
                case 4: // Easy / Facile
                    newEaseFactor = easeFactor + 0.15;
                    newInterval = Math.round(interval * newEaseFactor * 1.3);
                    break;
                default:
                    newInterval = Math.round(interval * easeFactor);
                    break;
            }

            if (newInterval <= interval) {
                newInterval = interval + 1;
            }

            // Fuzz
            if (fuzzEnabled && newInterval > 4) {
                let fuzz = Math.round(newInterval * 0.10);
                if (newInterval < 20) fuzz = Math.min(fuzz, 2);
                else fuzz = Math.min(fuzz, 7);

                fuzz = Math.max(1, fuzz);
                const randomFuzz = Math.round((Math.random() - 0.5) * fuzz * 2);
                newInterval = Math.max(interval + 1, newInterval + randomFuzz);
            }

            result = {
                interval: newInterval,
                easeFactor: newEaseFactor,
                status: 'review',
                step: 0,
                dueDate: getDueDate(newInterval),
                lapses: lapses
            };
        }
    }

    // Apply Exam Mode modifier if enabled and exam is within 15 days
    if (config.examModeEnabled && config.examDate) {
        const days = daysUntilExam(config.examDate);
        if (days !== null && days > 0 && days <= 15) {
            result = applyExamModifier(result, days);
        }
    }

    return result;
};
