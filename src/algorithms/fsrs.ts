import { fsrs, Rating, State, createEmptyCard, generatorParameters } from 'ts-fsrs';
import type { Card as FSRSCard } from 'ts-fsrs';
import type { UserCardProgress } from '../types';

export type ReviewFeedback = 1 | 2 | 3 | 4; 
// UI maps: 1 = Again, 2 = Hard, 3 = Good, 4 = Easy
// Our review UI currently passes 1, 2, 3. 
// We will map: 1 -> Again, 2 -> Good, 3 -> Easy if we only have 3 buttons.
// Actually, let's map: 1 -> Again, 2 -> Hard, 3 -> Good for a 3-button layout, or better:
// 1 -> Again, 2 -> Good, 3 -> Easy. The UI says: 1=Je ne connais pas, 2=Moyen, 3=Je connais.
// "Moyen" = Good or Hard. Let's map 1->Again, 2->Hard, 3->Good, or just handle 1,2,3,4 natively.

// FSRS Instances with distinct retention targets
// Flashcards aim for strong memory retention (90%)
const fFlashcard = fsrs(generatorParameters({ enable_fuzz: true, request_retention: 0.9 }));
// Courses aim for spaced reading/verification, so a lower target generates much longer intervals
const fCourse = fsrs(generatorParameters({ enable_fuzz: true, request_retention: 0.7 }));
const stateToStatus = (state: State): UserCardProgress['status'] => {
    switch(state) {
        case State.New: return 'new';
        case State.Learning: return 'learning';
        case State.Review: return 'review';
        case State.Relearning: return 'relearning';
        default: return 'review';
    }
};

const statusToState = (status: UserCardProgress['status']): State => {
    switch(status) {
        case 'new': return State.New;
        case 'learning': return State.Learning;
        case 'review': return State.Review;
        case 'relearning': return State.Relearning;
        default: return State.New;
    }
};

const progressToFsrsCard = (progress?: Partial<UserCardProgress> | null): FSRSCard => {
    if (!progress || progress.status === 'new' || !progress.status) {
        return createEmptyCard(new Date());
    }

    return {
        due: progress.dueDate ? new Date(progress.dueDate) : new Date(),
        stability: progress.stability ?? 0,
        difficulty: progress.difficulty ?? 0,
        elapsed_days: 0, 
        scheduled_days: progress.interval ?? 0,
        reps: progress.reps ?? 0,
        lapses: progress.lapses ?? 0,
        state: statusToState(progress.status),
        last_review: progress.lastReview ? new Date(progress.lastReview) : new Date(),
    } as unknown as FSRSCard;
};

export function calculateFsrsProgress(
    current: Partial<UserCardProgress> | null | undefined,
    feedback: ReviewFeedback,
    isCourse: boolean = false
): UserCardProgress {
    const card = progressToFsrsCard(current);
    const now = new Date();
    
    const fInstance = isCourse ? fCourse : fFlashcard;
    const scheduling_cards = fInstance.repeat(card, now);
    
    // Map our feedback to FSRS Rating
    // 1 = ne connaît pas -> Again
    // 2 = moyen -> Hard
    // 3 = connaît -> Good
    // 4 = facile -> Easy
    let rating: Rating = Rating.Good;
    if (feedback === 1) rating = Rating.Again;
    else if (feedback === 2) rating = Rating.Hard;
    else if (feedback === 3) rating = Rating.Good;
    else if (feedback === 4) rating = Rating.Easy;

    const nextRecord = scheduling_cards[rating];
    const nextCard = nextRecord.card;

    const history = [...(current?.history || []), now.toISOString()];

    return {
        status: stateToStatus(nextCard.state),
        step: 0,
        dueDate: nextCard.due.toISOString(),
        interval: nextCard.scheduled_days,
        easeFactor: current?.easeFactor ?? 2.5, // Not used by FSRS, but kept for compatibility
        lapses: nextCard.lapses,
        isLeech: nextCard.lapses >= 8,
        algorithm: 'fsrs',
        stability: nextCard.stability,
        difficulty: nextCard.difficulty,
        reps: nextCard.reps,
        lastReview: nextCard.last_review?.toISOString() || now.toISOString(),
        history
    };
}

