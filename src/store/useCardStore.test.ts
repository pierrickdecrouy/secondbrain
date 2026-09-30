import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCardStore } from './useCardStore';

// Mock dependencies
vi.mock('../storage', () => ({
  saveCardsAsync: vi.fn().mockResolvedValue(undefined),
  loadCardsAsync: vi.fn().mockResolvedValue([]),
}));

vi.mock('../lib/firebase', () => ({
  auth: { currentUser: null },
  db: {},
}));

vi.mock('../services/cardSyncService', () => ({
  cardSyncService: {
    saveCard: vi.fn(),
    deleteCard: vi.fn(),
  }
}));

vi.mock('../searchIndex', () => ({
  updateIndex: vi.fn(),
  removeFromIndex: vi.fn(),
}));

vi.mock('../semanticSearch', () => ({
  buildCardEmbeddings: vi.fn(),
}));

describe('useCardStore', () => {
  beforeEach(() => {
    useCardStore.getState().clearStore();
    vi.clearAllMocks();
  });

  it('should initialize with empty cards and false isLoading after clearStore', () => {
    const state = useCardStore.getState();
    expect(state.cards).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  describe('setCards', () => {
    it('should set cards and save them by default', async () => {
      const mockCard = { id: '1', type: 'concept', title: 'Test', nodeType: 'card' } as any;
      
      useCardStore.getState().setCards([mockCard]);
      
      const state = useCardStore.getState();
      expect(state.cards).toHaveLength(1);
      expect(state.cards[0].id).toBe('1');
      
      // Verification of storage side effect
      const { saveCardsAsync } = await import('../storage');
      expect(saveCardsAsync).toHaveBeenCalledWith([mockCard]);
    });

    it('should NOT save cards when skipSave is true', async () => {
      const mockCard = { id: '2', type: 'concept', title: 'Test 2', nodeType: 'card' } as any;
      
      useCardStore.getState().setCards([mockCard], true);
      
      const state = useCardStore.getState();
      expect(state.cards).toHaveLength(1);
      
      const { saveCardsAsync } = await import('../storage');
      expect(saveCardsAsync).not.toHaveBeenCalled();
    });
  });

  describe('mergeRemoteCards', () => {
    it('should add new cards and update existing if remote updatedAt is newer', () => {
      const localCard = { id: '1', title: 'Local', updatedAt: 100 } as any;
      useCardStore.getState().setCards([localCard]);

      const remoteNewCard = { id: '2', title: 'Remote', updatedAt: 150 } as any;
      const remoteUpdatedCard = { id: '1', title: 'Remote Updated', updatedAt: 200 } as any;
      const remoteStaleCard = { id: '1', title: 'Remote Stale', updatedAt: 50 } as any;

      // Merge new and updated
      useCardStore.getState().mergeRemoteCards([remoteNewCard, remoteUpdatedCard], []);
      
      let state = useCardStore.getState();
      expect(state.cards).toHaveLength(2);
      expect(state.cards.find(c => c.id === '1')?.title).toBe('Remote Updated');

      // Attempt to merge a stale card - it should not overwrite local
      useCardStore.getState().mergeRemoteCards([remoteStaleCard], []);
      state = useCardStore.getState();
      expect(state.cards.find(c => c.id === '1')?.title).toBe('Remote Updated'); // unchanged
    });

    it('should remove deleted cards', () => {
      const localCard1 = { id: '1', title: 'Card 1' } as any;
      const localCard2 = { id: '2', title: 'Card 2' } as any;
      useCardStore.getState().setCards([localCard1, localCard2]);

      useCardStore.getState().mergeRemoteCards([], ['1']);
      
      const state = useCardStore.getState();
      expect(state.cards).toHaveLength(1);
      expect(state.cards[0].id).toBe('2');
    });
  });

  describe('deleteCards', () => {
    it('should remove cards and call deletion services', async () => {
      const card = { id: 'delete-me', title: 'Delete' } as any;
      useCardStore.getState().setCards([card]);
      
      useCardStore.getState().deleteCards(['delete-me']);
      
      expect(useCardStore.getState().cards).toHaveLength(0);
      
      const { cardSyncService } = await import('../services/cardSyncService');
      expect(cardSyncService.deleteCard).toHaveBeenCalledWith('delete-me');
    });
  });
});
