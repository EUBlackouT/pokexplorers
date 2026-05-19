import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export type ToastTier = 'info' | 'reward' | 'story' | 'warning' | 'danger';

export interface ToastEntry {
    id: number;
    message: string;
    tier: ToastTier;
    /** Optional kicker shown above the message in small caps. */
    kicker?: string;
    /** Lifetime in ms; if omitted defaults per-tier. */
    ttl?: number;
}

const TIER_DEFAULT_TTL: Record<ToastTier, number> = {
    info: 3000,
    reward: 4200,
    story: 5200,
    warning: 4600,
    danger: 5200,
};

const TIER_STYLES: Record<ToastTier, { bg: string; border: string; accent: string; icon: string }> = {
    info: {
        bg: 'bg-slate-900/90',
        border: 'border-slate-400/40',
        accent: 'text-slate-200',
        icon: '🧭',
    },
    reward: {
        bg: 'bg-gradient-to-br from-amber-900/95 to-amber-700/90',
        border: 'border-amber-300/70',
        accent: 'text-amber-200',
        icon: '✦',
    },
    story: {
        bg: 'bg-gradient-to-br from-indigo-900/95 to-purple-800/90',
        border: 'border-purple-300/60',
        accent: 'text-purple-200',
        icon: '◆',
    },
    // Warning & danger tiers were referenced from App.tsx (gauntlet,
    // rival, recovery paths) but never defined here, so TIER_STYLES
    // returned undefined and ToastItem crashed reading `style.bg`.
    warning: {
        bg: 'bg-gradient-to-br from-amber-700/90 to-orange-900/90',
        border: 'border-amber-400/70',
        accent: 'text-amber-100',
        icon: '⚠',
    },
    danger: {
        bg: 'bg-gradient-to-br from-rose-900/95 to-red-800/90',
        border: 'border-rose-400/70',
        accent: 'text-rose-100',
        icon: '⚡',
    },
};

/** Used by consumers to mount a toast on-demand. */
export const makeToast = (
    message: string,
    tier: ToastTier = 'info',
    opts: { kicker?: string; ttl?: number } = {}
): ToastEntry => ({
    id: Math.floor(Math.random() * 1e9) + Date.now(),
    message,
    tier,
    kicker: opts.kicker,
    ttl: opts.ttl,
});

const ToastItem: React.FC<{ toast: ToastEntry; onExpire: (id: number) => void }> = ({ toast, onExpire }) => {
    const { tier } = toast;
    // Defensive default: any unknown tier (older save files, future
    // typos, multiplayer payloads from a mismatched client) falls back
    // to 'info' instead of crashing the toast layer.
    const safeTier: ToastTier = (TIER_STYLES as any)[tier] ? tier : 'info';
    const ttl = toast.ttl ?? TIER_DEFAULT_TTL[safeTier];
    const style = TIER_STYLES[safeTier];
    const isStory = safeTier === 'story';
    const isDanger = safeTier === 'danger' || safeTier === 'warning';
    useEffect(() => {
        const t = setTimeout(() => onExpire(toast.id), ttl);
        return () => clearTimeout(t);
    }, [toast.id, ttl, onExpire]);
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -40, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -30, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className={[
                style.bg,
                style.border,
                'border-2 backdrop-blur-md rounded-xl shadow-xl shadow-black/40',
                'pl-3 pr-4 py-2.5 flex items-start gap-2 pointer-events-auto',
                // Improve readability and avoid oversized blocks on low-res screens.
                'w-[min(92vw,28rem)] sm:w-[min(72vw,30rem)]',
                isStory ? 'ring-1 ring-purple-200/25' : '',
                isDanger ? 'ring-1 ring-amber-200/20' : '',
            ].join(' ')}
        >
            <div className={`${style.accent} text-base leading-none mt-0.5 shrink-0`}>{style.icon}</div>
            <div className="flex-1 min-w-0">
                {toast.kicker && (
                    <div className={`${style.accent} text-[9px] font-bold tracking-[0.16em] uppercase leading-none mb-1`}>
                        {toast.kicker}
                    </div>
                )}
                <div
                    className={[
                        'text-white break-words whitespace-pre-line font-medium',
                        isStory ? 'text-[13px] leading-[1.45]' : 'text-[12px] leading-[1.35]',
                        // Prevent giant story toasts from swallowing the viewport.
                        'max-h-44 overflow-y-auto pr-1',
                    ].join(' ')}
                >
                    {toast.message}
                </div>
            </div>
        </motion.div>
    );
};

export const ToastStack: React.FC<{ toasts: ToastEntry[]; onExpire: (id: number) => void }> = ({
    toasts,
    onExpire,
}) => {
    const visibleToasts = toasts.slice(-3);
    return (
        <div className="fixed top-3 right-2 left-2 sm:top-4 sm:right-4 sm:left-auto z-[200] flex flex-col gap-2 pointer-events-none items-stretch sm:items-end">
            <AnimatePresence initial={false}>
                {visibleToasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onExpire={onExpire} />
                ))}
            </AnimatePresence>
        </div>
    );
};
