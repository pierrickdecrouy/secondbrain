import type { ReactNode } from 'react';
import { useUIStore } from '../store/useUIStore';

// We keep UIProvider as a no-op wrapper so we don't have to rewrite main.tsx immediately
export function UIProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useUI() {
  // This proxies to the store. 
  // It returns the whole store state, which mimics Context behavior (re-renders on any change).
  // Components should progressively migrate to using useUIStore(state => state.property) directly.
  return useUIStore();
}
