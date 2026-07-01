import type { Card } from '../types';
import { cardSyncService } from './cardSyncService';
import { useUIStore } from '../store/useUIStore';

export interface SyncTask {
  id: string; // unique task id
  type: 'SAVE_CARD' | 'DELETE_CARD';
  payload: any;
  retryCount: number;
  timestamp: number;
}

class SyncQueue {
  private queue: SyncTask[] = [];
  private isProcessing = false;
  private readonly STORAGE_KEY = 'pharmabrain_sync_queue';

  constructor() {
    this.loadQueue();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.processQueue());
      // Check queue every 30 seconds
      setInterval(() => this.processQueue(), 30000);
    }
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load sync queue', e);
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.error('Failed to save sync queue', e);
    }
  }

  public enqueueSaveCard(card: Card) {
    // Remove existing save task for this card to avoid duplicates
    this.queue = this.queue.filter(t => !(t.type === 'SAVE_CARD' && t.payload.id === card.id));
    this.queue.push({
      id: crypto.randomUUID(),
      type: 'SAVE_CARD',
      payload: card,
      retryCount: 0,
      timestamp: Date.now()
    });
    this.saveQueue();
    this.processQueue();
  }

  public enqueueDeleteCard(cardId: string) {
    this.queue.push({
      id: crypto.randomUUID(),
      type: 'DELETE_CARD',
      payload: cardId,
      retryCount: 0,
      timestamp: Date.now()
    });
    this.saveQueue();
    this.processQueue();
  }

  public async processQueue() {
    if (this.isProcessing || this.queue.length === 0 || !navigator.onLine) {
      return;
    }

    this.isProcessing = true;
    useUIStore.getState().setSyncStatus('pending');

    let allSuccess = true;

    // Process a copy of the queue
    const tasksToProcess = [...this.queue];
    
    for (const task of tasksToProcess) {
      try {
        if (task.type === 'SAVE_CARD') {
          await cardSyncService.performSaveCard(task.payload);
        } else if (task.type === 'DELETE_CARD') {
          await cardSyncService.performDeleteCard(task.payload);
        }
        
        // Remove from queue on success
        this.queue = this.queue.filter(t => t.id !== task.id);
        this.saveQueue();
      } catch (err: any) {
        console.error(`Failed to process task ${task.type}`, err);
        
        // If conflict (newer server version), we drop the task because server is already ahead
        if (err.message === "CONFLICT_SERVER_NEWER") {
           this.queue = this.queue.filter(t => t.id !== task.id);
           this.saveQueue();
           continue;
        }

        allSuccess = false;
        const taskIndex = this.queue.findIndex(t => t.id === task.id);
        if (taskIndex >= 0) {
          this.queue[taskIndex].retryCount++;
          // Give up after 10 retries
          if (this.queue[taskIndex].retryCount > 10) {
            this.queue = this.queue.filter(t => t.id !== task.id);
          }
          this.saveQueue();
        }
        
        // Stop processing rest of queue on network error to preserve order and avoid spam
        break;
      }
    }

    this.isProcessing = false;
    
    if (allSuccess && this.queue.length === 0) {
      useUIStore.getState().setSyncStatus('synced');
    } else {
      useUIStore.getState().setSyncStatus('error');
    }
  }
}

export const syncQueue = new SyncQueue();
