import type { UserCardProgress } from '../types';

/**
 * Common interface for scheduling algorithms.
 * Both the legacy SRS and the current FSRS scheduler implement this contract.
 *
 * The active scheduler is FSRS (see `fsrs.ts`).
 * The legacy SRS scheduler (`srs.ts`) is kept for reference and edge-case
 * compatibility (exam-mode interval capping) but must NOT be used for new
 * review logic.
 */
export interface IScheduler {
  /**
   * Compute the next review state for a card.
   *
   * @param current  Current progress state (null/undefined = new card).
   * @param feedback User rating. Convention: 1 = Again, 2 = Hard, 3 = Good, 4 = Easy.
   * @returns        Updated progress state to persist on the card.
   */
  schedule(
    current: Partial<UserCardProgress> | null | undefined,
    feedback: number,
  ): UserCardProgress;
}
