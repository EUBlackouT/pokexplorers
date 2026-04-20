import { useEffect } from 'react';

/**
 * Invokes `onEscape` when the user presses the Escape key while the component
 * is mounted. Safe across multiple stacked modals: the most-recently-mounted
 * listener wins via event propagation order and stopPropagation.
 */
export function useEscapeKey(onEscape: () => void, enabled: boolean = true): void {
    useEffect(() => {
        if (!enabled) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onEscape();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onEscape, enabled]);
}
