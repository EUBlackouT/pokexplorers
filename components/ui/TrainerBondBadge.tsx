import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
    bond?: { stacks: number; lastFightDistance: number };
    /** Current run distance, used to render a "decays in N chunks" hint
     *  so the player can read at a glance how soon the bond will tick
     *  down by one pip. The decay window mirrors TRAINER_BOND_DECAY_
     *  DISTANCE in App.tsx (4 chunks per pip). */
    currentDistance: number;
}

/**
 * Trainer Bond HUD badge, anchored just below the catch-chain badge.
 *
 * Hidden at 0 stacks. Each pip = +8% XP, +8% money, +5pp held-item drop
 * chance. Stacks build by defeating trainers in the overworld (cap 10)
 * and decay 1 pip every 4 chunks of new distance traveled without a
 * trainer fight, so passive farming via wild encounters can't sustain
 * the bond.
 *
 * Color tiers: bronze (1-2), silver (3-4), gold (5-7), legendary (8-10).
 */
export const TrainerBondBadge: React.FC<Props> = ({ bond, currentDistance }) => {
    if (!bond || bond.stacks <= 0) return null;

    const tier =
        bond.stacks >= 8 ? 'legendary' :
        bond.stacks >= 5 ? 'gold'      :
        bond.stacks >= 3 ? 'silver'    :
        'bronze';

    const tierColors: Record<string, { bg: string; ring: string; text: string; glow: string }> = {
        bronze:    { bg: 'from-amber-800 to-orange-900',    ring: 'ring-amber-500/60', text: 'text-amber-100',  glow: 'shadow-amber-700/40' },
        silver:    { bg: 'from-slate-400 to-slate-600',     ring: 'ring-slate-200/70', text: 'text-slate-50',    glow: 'shadow-slate-300/50' },
        gold:      { bg: 'from-yellow-500 to-amber-600',    ring: 'ring-yellow-200/80',text: 'text-yellow-50',   glow: 'shadow-yellow-400/60' },
        legendary: { bg: 'from-rose-500 via-orange-500 to-yellow-400', ring: 'ring-orange-200/90', text: 'text-white', glow: 'shadow-orange-400/70' },
    };
    const colors = tierColors[tier];

    const xpBonus = bond.stacks * 8;
    const TRAINER_BOND_DECAY_DISTANCE = 4;
    const drift = Math.max(0, currentDistance - bond.lastFightDistance);
    const chunksUntilDecay = Math.max(0, TRAINER_BOND_DECAY_DISTANCE - (drift % TRAINER_BOND_DECAY_DISTANCE));

    return (
        <AnimatePresence>
            <motion.div
                key={`bond-${bond.stacks}`}
                initial={{ opacity: 0, y: -8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className="absolute top-24 right-3 z-40 select-none pointer-events-none"
            >
                <div className={`bg-gradient-to-br ${colors.bg} ${colors.text} ring-2 ${colors.ring} shadow-xl ${colors.glow} rounded-xl px-3 py-2 backdrop-blur-sm`}>
                    <div className="flex items-center gap-2">
                        <div className="text-[9px] uppercase tracking-[0.15em] opacity-75 font-black">Bond</div>
                        <motion.div
                            key={bond.stacks}
                            initial={{ scale: 1.5, rotate: -8 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                            className="font-black text-xl tabular-nums leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                        >
                            x{bond.stacks}
                        </motion.div>
                    </div>
                    <div className="text-[9px] opacity-80 font-semibold mt-0.5 tracking-wider uppercase">
                        +{xpBonus}% XP / Cash
                    </div>
                    <div className="text-[8px] opacity-55 mt-0.5 tracking-wider uppercase">
                        Decays in {chunksUntilDecay} chunk{chunksUntilDecay === 1 ? '' : 's'}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
