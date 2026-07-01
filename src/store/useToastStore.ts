import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  /** Duration in ms. 0 = persistent until manually dismissed. Default: 4000. */
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastState {
  toasts: Toast[];
  show: (message: string, variant?: ToastVariant, duration?: number, action?: { label: string; onClick: () => void }) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

let _counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  show: (message, variant = 'info', duration = 4000, action) => {
    const id = `toast-${Date.now()}-${_counter++}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, variant, duration, action }] }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }

    return id;
  },

  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  dismissAll: () => set({ toasts: [] }),
}));

/** Convenience helpers — usable outside of React (e.g. in store actions) */
export const toast = {
  success: (msg: string, duration?: number, action?: { label: string; onClick: () => void }) => useToastStore.getState().show(msg, 'success', duration, action),
  error:   (msg: string, duration?: number, action?: { label: string; onClick: () => void }) => useToastStore.getState().show(msg, 'error',   duration, action),
  info:    (msg: string, duration?: number, action?: { label: string; onClick: () => void }) => useToastStore.getState().show(msg, 'info',    duration, action),
  warning: (msg: string, duration?: number, action?: { label: string; onClick: () => void }) => useToastStore.getState().show(msg, 'warning', duration, action),
};
