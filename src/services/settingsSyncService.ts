import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useUIStore } from '../store/useUIStore';

let settingsUnsubscribe: Unsubscribe | null = null;
let isApplyingRemoteUpdate = false;

export const settingsSyncService = {
  /**
   * Pushes the current local settings to the cloud.
   */
  pushSettings: async (): Promise<void> => {
    if (!auth.currentUser || isApplyingRemoteUpdate) return;
    
    try {
      const state = useUIStore.getState();
      const settings = {
        isZenMode: state.isZenMode,
        sidebarCollapsed: state.sidebarCollapsed,
        avatarConfig: state.avatarConfig,
        updatedAt: Date.now()
      };

      const settingsRef = doc(db, `users/${auth.currentUser.uid}/settings`, 'ui');
      await setDoc(settingsRef, settings, { merge: true });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des paramètres:", error);
    }
  },

  /**
   * Starts listening to cloud settings and updates local store.
   */
  startSyncListener: (uid: string): void => {
    if (settingsUnsubscribe) {
      settingsUnsubscribe();
    }

    const settingsRef = doc(db, `users/${uid}/settings`, 'ui');
    
    settingsUnsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.metadata.hasPendingWrites || !docSnap.exists()) return;
      
      const remoteSettings = docSnap.data();
      if (remoteSettings) {
        // We set a flag to avoid pushing back what we just pulled
        isApplyingRemoteUpdate = true;
        
        useUIStore.setState((state) => ({
          isZenMode: remoteSettings.isZenMode ?? state.isZenMode,
          sidebarCollapsed: remoteSettings.sidebarCollapsed ?? state.sidebarCollapsed,
          avatarConfig: remoteSettings.avatarConfig ?? state.avatarConfig
        }));

        setTimeout(() => {
          isApplyingRemoteUpdate = false;
        }, 500);
      }
    }, (error) => {
      console.error("Erreur de synchronisation Firestore (paramètres):", error);
    });
    
    // Subscribe to local UI store changes to automatically push them
    useUIStore.subscribe((state, prevState) => {
       if (isApplyingRemoteUpdate) return;
       if (
         state.avatarConfig !== prevState.avatarConfig ||
         state.sidebarCollapsed !== prevState.sidebarCollapsed
       ) {
         settingsSyncService.pushSettings();
       }
    });
  },

  stopSyncListener: (): void => {
    if (settingsUnsubscribe) {
      settingsUnsubscribe();
      settingsUnsubscribe = null;
    }
  }
};
