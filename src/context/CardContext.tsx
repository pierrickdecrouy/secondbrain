import type { ReactNode } from 'react';
import { useCardStore } from '../store/useCardStore';

export function CardProvider({ children }: { children: ReactNode }) {
  // We keep this as a no-op wrapper so main.tsx doesn't break
  return <>{children}</>;
}

export function useCards() {
  return useCardStore();
}
