import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export type ToastTier = 'info' | 'reward' | 'story';

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
    info: 1800,
    reward: 2600,
    story: 3200,
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
    const ttl = toast.ttl ?? TIER_DEFAULT_TTL[tier];
    const style = TIER_STYLES[tier];
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
            className={`${style.bg} ${style.border} border-2 backdrop-blur-md pl-3 pr-4 py-2 rounded-lg shadow-xl shadow-black/40 flex items-start gap-2 max-w-xs pointer-events-auto`}
        >
            <div className={`${style.accent} text-base leading-none mt-0.5`}>{style.icon}</div>
            <div className="flex-1 min-w-0">
                {toast.kicker && (
                    <div className={`${style.accent} text-[8px] font-bold tracking-[0.2em] uppercase leading-none mb-1`}>
                        {toast.kicker}
                    </div>
                )}
                <div className="text-white text-[11px] leading-snug break-words">{toast.message}</div>
            </div>
        </motion.div>
    );
};

export const ToastStack: React.FC<{ toasts: ToastEntry[]; onExpire: (id: number) => void }> = ({
    toasts,
    onExpire,
}) => {
    return (
        <div className="fixed top-4 left-4 z-[200] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence initial={false}>
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onExpire={onExpire} />
                ))}
            </AnimatePresence>
        </div>
    );
};
