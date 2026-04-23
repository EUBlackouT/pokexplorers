import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
    combo?: { speciesId: number; speciesName: string; count: number; best: number };
}

/**
 * Persistent catch-chain HUD badge, anchored top-right of the overworld.
 *
 * Hidden when no chain is active (count === 0 or undefined). The color/tier
 * shifts at each reward milestone (5 / 10 / 20 / 30 / 50) so the player
 * gets a visible "leveling up" cue without opening a menu.
 */
export const CatchComboBadge: React.FC<Props> = ({ combo }) => {
    if (!combo || combo.count <= 0) return null;

    const tier =
        combo.count >= 50 ? 'mythic' :
        combo.count >= 30 ? 'legendary' :
        combo.count >= 20 ? 'epic' :
        combo.count >= 10 ? 'rare' :
        combo.count >= 5  ? 'uncommon' :
        'common';

    const tierColors: Record<string, { bg: string; ring: string; text: string; glow: string }> = {
        common:    { bg: 'from-slate-700 to-slate-800',  ring: 'ring-slate-400/50', text: 'text-slate-100',    glow: 'shadow-slate-500/30' },
        uncommon:  { bg: 'from-green-700 to-emerald-800',ring: 'ring-emerald-400/60', text: 'text-emerald-100',glow: 'shadow-emerald-500/40' },
        rare:      { bg: 'from-sky-700 to-blue-800',     ring: 'ring-sky-400/70',   text: 'text-sky-100',      glow: 'shadow-sky-500/50' },
        epic:      { bg: 'from-fuchsia-700 to-purple-800',ring: 'ring-fuchsia-400/70', text: 'text-fuchsia-50',glow: 'shadow-fuchsia-500/50' },
        legendary: { bg: 'from-amber-600 to-orange-700', ring: 'ring-amber-300/80', text: 'text-amber-50',     glow: 'shadow-amber-500/60' },
        mythic:    { bg: 'from-rose-600 via-fuchsia-600 to-indigo-700', ring: 'ring-rose-300/90', text: 'text-white', glow: 'shadow-rose-400/70' },
    };
    const colors = tierColors[tier];

    // Next-milestone hint so the player knows what they're working toward.
    const milestones = [5, 10, 20, 30, 50];
    const nextMilestone = milestones.find(m => m > combo.count);

    return (
        <AnimatePresence>
            <motion.div
                key={`combo-${combo.speciesId}`}
                initial={{ opacity: 0, y: -12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`absolute top-3 right-3 z-40 select-none pointer-events-none`}
            >
                <div className={`bg-gradient-to-br ${colors.bg} ${colors.text} ring-2 ${colors.ring} shadow-xl ${colors.glow} rounded-xl px-3 py-2 backdrop-blur-sm`}>
                    <div className="flex items-center gap-2">
                        <div className="text-[9px] uppercase tracking-[0.15em] opacity-70 font-black">Chain</div>
                        <motion.div
                            key={combo.count}
                            initial={{ scale: 1.6, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                            className="font-black text-2xl tabular-nums leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                        >
                            x{combo.count}
                        </motion.div>
                    </div>
                    <div className="text-[10px] opacity-80 font-semibold mt-0.5 max-w-[120px] truncate">
                        {combo.speciesName}
                    </div>
                    {nextMilestone !== undefined && (
                        <div className="text-[8px] opacity-55 mt-1 tracking-wider uppercase">
                            Next bonus: x{nextMilestone}
                        </div>
                    )}
                    {combo.best > combo.count && (
                        <div className="text-[8px] opacity-55 tracking-wider uppercase">
                            Best: x{combo.best}
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
