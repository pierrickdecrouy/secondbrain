import { useEffect, useRef } from 'react';

const FOCUSABLE_ELEMENTS = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(isActive: boolean) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isActive) return;
        
        const container = ref.current;
        if (!container) return;

        // Add a slight delay to allow the modal to render and become visible
        const timeoutId = setTimeout(() => {
            const focusableElements = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS));
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            const handleTabKey = (e: KeyboardEvent) => {
                if (e.key !== 'Tab') return;

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            };

            // Initially focus the first element only if we aren't already focused inside the container
            if (!container.contains(document.activeElement)) {
                firstElement.focus();
            }

            document.addEventListener('keydown', handleTabKey);

            return () => {
                document.removeEventListener('keydown', handleTabKey);
            };
        }, 10);

        return () => clearTimeout(timeoutId);
    }, [isActive]);

    return ref;
}
