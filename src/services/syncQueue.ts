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

import { getDB } from '../storage';

class SyncQueue {
  private isProcessing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.processQueue());
      // Check queue every 30 seconds
      setInterval(() => this.processQueue(), 30000);
      this.migrateFromLocalStorage();
    }
  }

  private async migrateFromLocalStorage() {
    try {
      const STORAGE_KEY = 'pharmabrain_sync_queue';
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const queue: SyncTask[] = JSON.parse(stored);
        if (queue.length > 0) {
          const db = getDB();
          await db.syncTasks.bulkAdd(queue);
        }
        localStorage.removeItem(STORAGE_KEY);
        this.processQueue();
      }
    } catch (e) {
      console.error('Migration failed', e);
    }
  }

  public async enqueueSaveCard(card: Card) {
    try {
      const db = getDB();
      // Remove existing save task for this card to avoid duplicates
      const existing = await db.syncTasks.toArray();
      const duplicate = existing.find(t => t.type === 'SAVE_CARD' && t.payload.id === card.id);
      if (duplicate) {
         await db.syncTasks.delete(duplicate.id);
      }
      
      const task: SyncTask = {
        id: crypto.randomUUID(),
        type: 'SAVE_CARD',
        payload: card,
        retryCount: 0,
        timestamp: Date.now()
      };
      await db.syncTasks.add(task);
      this.processQueue();
    } catch (err) {
      console.error('Enqueue Save failed', err);
    }
  }

  public async enqueueDeleteCard(cardId: string) {
    try {
      const db = getDB();
      const task: SyncTask = {
        id: crypto.randomUUID(),
        type: 'DELETE_CARD',
        payload: cardId,
        retryCount: 0,
        timestamp: Date.now()
      };
      await db.syncTasks.add(task);
      this.processQueue();
    } catch(err) {
      console.error('Enqueue Delete failed', err);
    }
  }

  public async processQueue() {
    if (this.isProcessing || !navigator.onLine) {
      return;
    }

    this.isProcessing = true;
    
    try {
      const db = getDB();
      const queue = await db.syncTasks.orderBy('timestamp').toArray();
      
      if (queue.length === 0) {
        this.isProcessing = false;
        return;
      }

      useUIStore.getState().setSyncStatus('pending');
      let allSuccess = true;

      for (const task of queue) {
        try {
          if (task.type === 'SAVE_CARD') {
            await cardSyncService.performSaveCard(task.payload);
          } else if (task.type === 'DELETE_CARD') {
            await cardSyncService.performDeleteCard(task.payload);
          }
          
          await db.syncTasks.delete(task.id);
        } catch (err: any) {
          console.error(`Failed to process task ${task.type}`, err);
          
          if (err.message === "CONFLICT_SERVER_NEWER") {
             await db.syncTasks.delete(task.id);
             continue;
          }

          allSuccess = false;
          task.retryCount++;
          if (task.retryCount > 10) {
            await db.syncTasks.delete(task.id);
          } else {
            await db.syncTasks.put(task);
          }
          
          break; // Stop processing rest of queue on network error
        }
      }

      const remaining = await db.syncTasks.count();
      if (allSuccess && remaining === 0) {
        useUIStore.getState().setSyncStatus('synced');
      } else {
        useUIStore.getState().setSyncStatus('error');
      }
    } catch (err) {
      console.error('ProcessQueue failed', err);
    } finally {
      this.isProcessing = false;
    }
  }
}

export const syncQueue = new SyncQueue();
