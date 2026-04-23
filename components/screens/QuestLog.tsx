import React from 'react';
import { motion } from 'motion/react';
import { PlayerGlobalState } from '../../types';
import { MAIN_QUESTS } from '../../data/quests';

/**
 * Persistent quest tracker widget docked to the bottom-right of the
 * overworld. Designed to be quiet: dark glass panel with the Pokémon gold
 * accent pulled in through the progress bar and quest title.
 */
export const QuestLog: React.FC<{ state: PlayerGlobalState }> = ({ state }) => {
    const distance = Math.floor(Math.sqrt(state.chunkPos.x ** 2 + state.chunkPos.y ** 2));

    const currentQuest =
        MAIN_QUESTS.find((q) => q.id === state.meta.mainQuestProgress.currentQuestId) || MAIN_QUESTS[0];
    const questValue = currentQuest.type === 'distance' ? distance : state.badges;
    const progress = Math.min(100, (questValue / currentQuest.target) * 100);

    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            className="absolute bottom-6 right-6 z-40 w-72 rounded-2xl border border-white/10 overflow-hidden font-press-start shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
            style={{
                background: 'linear-gradient(160deg, rgba(30,41,59,0.92) 0%, rgba(2,6,23,0.95) 100%)',
                backdropFilter: 'blur(8px)',
            }}
        >
            {/* Top scanning line */}
            <motion.div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: 'linear-gradient(to right, transparent, #fbbf24, transparent)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
            />

            {/* Header strip with brand-gold title feel */}
            <div
                className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between"
                style={{
                    background: 'linear-gradient(90deg, rgba(251,191,36,0.2) 0%, rgba(60,90,166,0.15) 100%)',
                }}
            >
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-300 rounded-full shadow-[0_0_8px_#fbbf24] animate-pulse" />
                    <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-300">
                        Main Quest
                    </h3>
                </div>
                <div className="text-[7px] font-mono text-white/40 uppercase tracking-widest">#{currentQuest.id}</div>
            </div>

            <div className="p-4 space-y-3">
                <div>
                    <div
                        className="text-xs font-black uppercase tracking-tight mb-1"
                        style={{
                            color: '#ffcb05',
                            textShadow: '0 2px 0 #3c5aa6',
                            WebkitTextStroke: '0.8px #3c5aa6',
                            paintOrder: 'stroke fill',
                        }}
                    >
                        {currentQuest.title}
                    </div>
                    <div className="text-[8px] text-slate-400 leading-relaxed uppercase tracking-wider">
                        {currentQuest.desc}
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-end mb-1">
                        <div className="text-[9px] font-mono font-bold text-amber-300">
                            {questValue} / {currentQuest.target}
                            <span className="text-[7px] text-slate-500 ml-1">{currentQuest.type.toUpperCase()}</span>
                        </div>
                        <div className="text-[9px] font-mono font-black text-white">{Math.floor(progress)}%</div>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-black/60">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.9, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{
                                background: 'linear-gradient(90deg, #fbbf24 0%, #3c5aa6 100%)',
                                boxShadow: '0 0 8px rgba(251,191,36,0.6)',
                            }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                    <StatChip label="Badges" value={`${state.badges}/8`} accent="#fbbf24" />
                    <StatChip label="Depth" value={`${distance}m`} accent="#60a5fa" />
                </div>
            </div>
        </motion.div>
    );
};

const StatChip: React.FC<{ label: string; value: string; accent: string }> = ({ label, value, accent }) => (
    <div
        className="rounded-lg border border-white/10 px-2.5 py-1.5"
        style={{
            background: `linear-gradient(90deg, ${accent}18 0%, rgba(2,6,23,0.6) 100%)`,
        }}
    >
        <div className="text-[7px] font-black uppercase tracking-[0.25em] text-slate-400 mb-0.5">{label}</div>
        <div className="text-xs font-mono font-black" style={{ color: accent }}>{value}</div>
    </div>
);
