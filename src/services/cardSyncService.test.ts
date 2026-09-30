import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cardSyncService } from './cardSyncService';
import { syncQueue } from './syncQueue';
import { getDoc, setDoc, deleteDoc } from 'firebase/firestore';

// Mock Firebase implementations
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, path, id) => ({ path, id })),
  setDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  getDoc: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(),
}));

vi.mock('../lib/firebase', () => ({
  auth: { currentUser: { uid: 'user1' } },
  db: {},
  prepareForFirebase: vi.fn(card => card),
}));

vi.mock('./syncQueue', () => ({
  syncQueue: {
    enqueueSaveCard: vi.fn(),
    enqueueDeleteCard: vi.fn(),
  }
}));

vi.mock('../store/useCardStore', () => ({
  useCardStore: {
    getState: vi.fn(() => ({})),
  }
}));

describe('cardSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('public methods', () => {
    it('should enqueue save operations rather than executing directly', () => {
      const card = { id: 'c1', title: 'Test' } as any;
      cardSyncService.saveCard(card);
      
      expect(syncQueue.enqueueSaveCard).toHaveBeenCalledWith(card);
      // Ensure we don't accidentally call setDoc directly here
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should enqueue delete operations', () => {
      cardSyncService.deleteCard('c1');
      expect(syncQueue.enqueueDeleteCard).toHaveBeenCalledWith('c1');
    });
  });

  describe('performSaveCard', () => {
    it('should save the card if server version does not exist', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false
      } as any);

      const card = { id: 'c1', title: 'New Card', updatedAt: 100 } as any;
      await cardSyncService.performSaveCard(card);
      
      expect(getDoc).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(), 
        expect.objectContaining({ id: 'c1', title: 'New Card' })
      );
    });

    it('should save the card if local version is newer than server version', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ updatedAt: 50 })
      } as any);

      const card = { id: 'c1', title: 'Updated Card', updatedAt: 100 } as any;
      await cardSyncService.performSaveCard(card);
      
      expect(setDoc).toHaveBeenCalled();
    });

    it('should SKIP save if server version is newer', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ updatedAt: 200 }) // Server is newer
      } as any);

      const card = { id: 'c1', title: 'Stale Local Card', updatedAt: 100 } as any;
      
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await cardSyncService.performSaveCard(card);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Server card is newer'));
      expect(setDoc).not.toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('performDeleteCard', () => {
    it('should directly call deleteDoc on Firestore', async () => {
      await cardSyncService.performDeleteCard('c1');
      
      expect(deleteDoc).toHaveBeenCalled();
    });
  });
});
