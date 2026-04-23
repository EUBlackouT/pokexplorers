import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ActiveBounty } from '../../data/bounties';
import { isBountyComplete } from '../../data/bounties';
import { ITEMS } from '../../services/itemData';

interface Props {
    bounties: ActiveBounty[];
    onClaim: (bountyId: string) => void;
    onReroll: () => void;
    onClose: () => void;
    /** Remaining ms until the guild posts a free refresh. <= 0 means ready now. */
    rerollMsRemaining: number;
    rerollCost: number;
    playerMoney: number;
    /** Optional catch-combo snapshot for the footer strip. */
    comboInfo?: { count: number; speciesName: string; best: number };
}

const TIER_STYLES: Record<string, { ring: string; bg: string; chip: string; label: string }> = {
    common: {
        ring: 'ring-slate-500/60',
        bg: 'from-slate-800 to-slate-900',
        chip: 'bg-slate-700 text-slate-200',
        label: 'COMMON',
    },
    rare: {
        ring: 'ring-sky-400/70',
        bg: 'from-sky-900 to-blue-950',
        chip: 'bg-sky-600 text-sky-50',
        label: 'RARE',
    },
    epic: {
        ring: 'ring-fuchsia-400/80',
        bg: 'from-fuchsia-900 via-purple-950 to-indigo-950',
        chip: 'bg-fuchsia-500 text-fuchsia-50',
        label: 'EPIC',
    },
};

/**
 * Full-screen Bounty Board overlay. Lists the 3 active contracts with
 * progress + rewards, lets the player claim any completed one (cashing
 * in money + a held item), or blow some cash to reroll the slate.
 */
const formatCooldown = (ms: number): string => {
    if (ms <= 0) return 'READY';
    const totalSeconds = Math.ceil(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export const BountyBoard: React.FC<Props> = ({ bounties, onClaim, onReroll, onClose, rerollMsRemaining, rerollCost, playerMoney, comboInfo }) => {
    const freeReady = rerollMsRemaining <= 0;
    const canPay = playerMoney >= rerollCost;
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
        >
            <motion.div
                initial={{ y: 24, scale: 0.95, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 24, scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                className="relative w-full max-w-3xl max-h-[88vh] overflow-y-auto bg-gradient-to-br from-stone-900 via-stone-950 to-neutral-950 ring-2 ring-amber-500/50 rounded-2xl shadow-2xl p-6"
            >
                {/* Corkboard-style header */}
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <div className="text-[10px] tracking-[0.3em] text-amber-400 font-bold uppercase">Trainer's Guild</div>
                        <h2 className="text-2xl font-black text-amber-100 drop-shadow-[0_2px_0_rgba(0,0,0,0.4)]">Bounty Board</h2>
                        <p className="text-stone-400 text-[11px] mt-1 max-w-lg">
                            Pinned contracts. Finish them while you travel; come back to claim your cut.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-stone-400 hover:text-white transition px-3 py-1 rounded-lg border border-stone-700 hover:border-stone-500"
                    >
                        Close
                    </button>
                </div>

                {/* Bounty cards */}
                <div className="space-y-3">
                    <AnimatePresence initial={false}>
                        {bounties.map((b, idx) => {
                            const pct = Math.min(100, Math.floor((b.progress / b.targetCount) * 100));
                            const done = isBountyComplete(b);
                            const tier = TIER_STYLES[b.tier];
                            const rewardItem = b.rewardItemId ? ITEMS[b.rewardItemId] : undefined;
                            return (
                                <motion.div
                                    key={b.id}
                                    layout
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 12, scale: 0.95 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`relative bg-gradient-to-br ${tier.bg} ring-2 ${tier.ring} rounded-xl p-4 shadow-lg`}
                                >
                                    {done && (
                                        <div className="absolute -top-2 -right-2 bg-green-500 text-black font-black text-[10px] tracking-widest px-2 py-1 rounded shadow-lg rotate-3">
                                            READY TO CLAIM
                                        </div>
                                    )}

                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                <span className={`${tier.chip} text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded`}>{tier.label}</span>
                                                <span className="text-amber-200/90 text-xs font-semibold">
                                                    Reward: <span className="text-amber-100 font-bold">${b.rewardMoney.toLocaleString()}</span>
                                                </span>
                                                {rewardItem && (
                                                    <span className="text-emerald-200 text-xs inline-flex items-center gap-1">
                                                        +
                                                        <img
                                                            src={rewardItem.icon}
                                                            alt={rewardItem.name}
                                                            className="w-4 h-4"
                                                            style={{ imageRendering: 'pixelated' }}
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                        />
                                                        <span className="font-bold">{rewardItem.name}</span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-stone-100 text-[15px] font-semibold leading-tight">
                                                {b.description}
                                            </div>
                                            <div className="mt-2">
                                                <div className="h-2 w-full bg-stone-800 rounded overflow-hidden ring-1 ring-stone-700/60">
                                                    <div
                                                        className={`h-full transition-all ${done ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-amber-400 to-amber-600'}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-[10px] text-stone-400 mt-1 tabular-nums">
                                                    <span>{b.progress} / {b.targetCount}</span>
                                                    <span>{pct}%</span>
                                                </div>
                                            </div>
                                        </div>

                                        {done ? (
                                            <button
                                                onClick={() => onClaim(b.id)}
                                                className="self-center shrink-0 px-4 py-2 rounded-lg bg-gradient-to-b from-green-500 to-emerald-600 text-black font-black text-sm shadow-lg hover:scale-105 active:scale-95 transition ring-2 ring-green-300/70"
                                            >
                                                CLAIM
                                            </button>
                                        ) : (
                                            <div className="self-center shrink-0 text-[10px] text-stone-500 uppercase tracking-widest">In&nbsp;Progress</div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Optional: catch-combo strip. Gives context for the
                 *  catch_combo bounty type and rewards the player for any
                 *  active chain on the way back to the board. */}
                {comboInfo && comboInfo.count > 0 && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-stone-900/70 ring-1 ring-amber-500/30 px-3 py-2">
                        <div className="text-[10px] uppercase tracking-widest text-amber-300/80 font-black">Active Chain</div>
                        <div className="text-stone-200 text-sm font-semibold tabular-nums">
                            x{comboInfo.count}
                            <span className="text-stone-500 mx-1.5">·</span>
                            <span className="text-stone-300">{comboInfo.speciesName}</span>
                        </div>
                        {comboInfo.best > comboInfo.count && (
                            <div className="text-[10px] text-stone-500 tabular-nums">Best x{comboInfo.best}</div>
                        )}
                    </div>
                )}

                {/* Footer actions */}
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-stone-800 pt-4">
                    <div className="text-[11px] text-stone-400">
                        Wallet: <span className="text-amber-200 font-bold">${playerMoney.toLocaleString()}</span>
                        <span className="mx-2 text-stone-600">·</span>
                        <span className="text-stone-500">
                            Next free refresh:{' '}
                            <span className={`tabular-nums font-bold ${freeReady ? 'text-emerald-300' : 'text-stone-300'}`}>
                                {formatCooldown(rerollMsRemaining)}
                            </span>
                        </span>
                    </div>
                    <button
                        onClick={onReroll}
                        disabled={!freeReady && !canPay}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition
                            ${freeReady
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/50'
                                : canPay
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white ring-2 ring-indigo-400/50'
                                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}
                    >
                        {freeReady
                            ? 'Refresh Contracts (Free)'
                            : `Skip Queue — $${rerollCost.toLocaleString()}`}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
