import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Pokemon, PokemonMove } from '../../types';
import { TYPE_COLORS } from '../../services/pokeService';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import {
    getLearnableMoves,
    hydrateMove,
    replaceMove,
    wouldSoftLock,
    LearnableEntry,
} from '../../utils/moveLearnset';
import { playMoveSfx } from '../../services/soundService';

/**
 * A team-wide move relearner. Free of charge (per design -- grinding got
 * removed elsewhere, so adding a money sink for QoL would be annoying).
 *
 * Flow:
 *   1. Pick a Pokemon tab on the left.
 *   2. Pick a "current" move slot on the middle panel.
 *   3. Pick a "new" move from the right pane (filtered to moves the mon can
 *      actually learn at its current level). Hydrated from PokeAPI on click.
 *   4. Confirm the swap.
 *
 * Guards:
 *   - "Forget" is blocked if it would leave the mon with zero damaging moves.
 *   - Can't relearn a move the mon already knows (those entries render as
 *     "learned" pills in the pool).
 */
export const MoveRelearner: React.FC<{
    team: Pokemon[];
    onApply: (monIndex: number, updated: Pokemon) => void;
    onClose: () => void;
}> = ({ team, onApply, onClose }) => {
    const [monIndex, setMonIndex] = useState(0);
    const [slotIndex, setSlotIndex] = useState<number | null>(null);
    const [pickedEntry, setPickedEntry] = useState<LearnableEntry | null>(null);
    const [pickedMove, setPickedMove] = useState<PokemonMove | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    useEscapeKey(onClose);

    const mon = team[monIndex];
    const learnable: LearnableEntry[] = useMemo(() => (mon ? getLearnableMoves(mon) : []), [mon]);
    const grouped = useMemo(() => {
        const g = new Map<number, LearnableEntry[]>();
        for (const e of learnable) {
            const arr = g.get(e.level) ?? [];
            arr.push(e);
            g.set(e.level, arr);
        }
        return Array.from(g.entries()).sort((a, b) => b[0] - a[0]);
    }, [learnable]);

    // Clear staged selections whenever the user picks a different Pokemon.
    useEffect(() => {
        setSlotIndex(null);
        setPickedEntry(null);
        setPickedMove(null);
        setError(null);
    }, [monIndex]);

    const handlePick = async (entry: LearnableEntry) => {
        if (entry.known) return;
        setPickedEntry(entry);
        setError(null);
        setLoading(true);
        try {
            const hydrated = await hydrateMove(entry);
            if (!hydrated) {
                setError(`Couldn't fetch ${entry.name} details.`);
                setPickedMove(null);
            } else {
                setPickedMove(hydrated);
            }
        } finally {
            setLoading(false);
        }
    };

    const softLock = slotIndex !== null && mon ? wouldSoftLock(mon, slotIndex) : false;

    const canConfirm =
        mon !== undefined &&
        pickedMove !== null &&
        ((slotIndex !== null && !softLock) || (slotIndex === null && mon.moves.length < 4));

    const handleConfirm = () => {
        if (!mon || !pickedMove) return;
        const targetSlot = slotIndex ?? mon.moves.length;
        const updated = replaceMove(mon, targetSlot, pickedMove);
        playMoveSfx(pickedMove.type || 'normal', pickedMove.name);
        onApply(monIndex, updated);
        setSlotIndex(null);
        setPickedEntry(null);
        setPickedMove(null);
    };

    if (!mon) {
        return (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 border-4 border-white p-6 text-white">
                    <p>No Pokemon in your team yet.</p>
                    <button
                        onClick={onClose}
                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 uppercase font-bold text-xs"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="bg-gray-900 border-4 border-yellow-400/70 rounded-xl w-full max-w-4xl h-[88vh] text-white shadow-2xl flex flex-col"
            >
                <header className="px-6 py-4 border-b-2 border-yellow-400/30 flex items-center justify-between">
                    <div>
                        <div className="text-[9px] tracking-[0.3em] text-yellow-300/80 uppercase">Move Relearner</div>
                        <div className="text-lg font-bold">Teach a new move — free of charge.</div>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-[10px] uppercase font-bold tracking-widest rounded shadow"
                    >
                        Close
                    </button>
                </header>

                <div className="flex-1 grid grid-cols-[180px_1fr_1.2fr] min-h-0">
                    {/* Team picker */}
                    <aside className="border-r border-white/10 p-3 overflow-y-auto custom-scrollbar space-y-2">
                        <div className="text-[8px] uppercase tracking-widest text-gray-400 mb-2">Party</div>
                        {team.map((p, i) => (
                            <button
                                key={i}
                                onClick={() => setMonIndex(i)}
                                className={`w-full flex items-center gap-2 p-2 rounded border-2 transition-all ${
                                    i === monIndex
                                        ? 'bg-yellow-500/20 border-yellow-400'
                                        : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                                }`}
                            >
                                <img
                                    src={p.sprites.front_default}
                                    alt={p.name}
                                    className="w-10 h-10 pixelated object-contain"
                                />
                                <div className="flex-1 text-left">
                                    <div className="text-[10px] font-bold uppercase truncate">{p.name}</div>
                                    <div className="text-[8px] text-gray-400">Lv {p.level}</div>
                                </div>
                            </button>
                        ))}
                    </aside>

                    {/* Current moveset */}
                    <section className="border-r border-white/10 p-4 overflow-y-auto custom-scrollbar">
                        <div className="text-[8px] uppercase tracking-widest text-gray-400 mb-3">
                            Current Moveset — pick a slot to replace
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {mon.moves.map((mv, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSlotIndex(i)}
                                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                                        i === slotIndex
                                            ? 'border-yellow-400 ring-2 ring-yellow-400/40'
                                            : 'border-transparent hover:border-white/20'
                                    }`}
                                    style={{ backgroundColor: `${TYPE_COLORS[(mv.type || 'normal').toLowerCase()] || '#555'}dd` }}
                                >
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="font-bold text-xs uppercase">{mv.name.replace(/-/g, ' ')}</span>
                                        <span className="text-[8px] uppercase opacity-80">{mv.type}</span>
                                    </div>
                                    <div className="flex gap-2 text-[9px] opacity-90">
                                        <span>PWR {mv.power || '—'}</span>
                                        <span>ACC {mv.accuracy ?? '—'}</span>
                                        <span>PP {mv.pp ?? '—'}</span>
                                    </div>
                                </button>
                            ))}
                            {mon.moves.length < 4 && (
                                <button
                                    onClick={() => setSlotIndex(null)}
                                    className={`p-3 rounded-lg border-2 border-dashed text-center text-[10px] uppercase tracking-widest ${
                                        slotIndex === null
                                            ? 'border-green-400 text-green-300'
                                            : 'border-gray-600 text-gray-400'
                                    }`}
                                >
                                    Add to empty slot ({4 - mon.moves.length} left)
                                </button>
                            )}
                        </div>
                        {softLock && (
                            <div className="mt-3 text-[10px] text-red-300 bg-red-900/40 border border-red-500/40 rounded p-2">
                                Can't forget this — it's the only damaging move left.
                            </div>
                        )}
                    </section>

                    {/* Learnable pool */}
                    <section className="p-4 overflow-y-auto custom-scrollbar">
                        <div className="text-[8px] uppercase tracking-widest text-gray-400 mb-3">
                            Learnable Pool — {learnable.length} moves available up to Lv {mon.level}
                        </div>
                        {learnable.length === 0 && (
                            <div className="text-[11px] text-gray-500 italic">No learnable moves recorded for this Pokemon.</div>
                        )}
                        <div className="space-y-4">
                            {grouped.map(([level, entries]) => (
                                <div key={level}>
                                    <div className="text-[8px] uppercase tracking-widest text-amber-300/80 mb-1">
                                        Level {level}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {entries.map((e) => {
                                            const isPicked = pickedEntry?.name === e.name && pickedEntry?.level === e.level;
                                            return (
                                                <button
                                                    key={`${e.name}-${e.level}`}
                                                    onClick={() => handlePick(e)}
                                                    disabled={e.known}
                                                    className={`p-2 rounded border text-left transition-all text-[10px] ${
                                                        e.known
                                                            ? 'bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed'
                                                            : isPicked
                                                            ? 'bg-green-700/40 border-green-400'
                                                            : 'bg-gray-800 border-gray-700 hover:border-white/40'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="font-bold uppercase truncate">{e.name.replace(/-/g, ' ')}</span>
                                                        {e.known && <span className="text-[8px] text-gray-500">LEARNED</span>}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Confirmation bar */}
                <footer className="px-6 py-4 border-t-2 border-yellow-400/30 bg-black/40 flex items-center gap-4">
                    <div className="flex-1 text-[10px]">
                        {error ? (
                            <span className="text-red-300">{error}</span>
                        ) : loading ? (
                            <span className="text-gray-400 animate-pulse">Fetching move details…</span>
                        ) : pickedMove ? (
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400 uppercase text-[8px] tracking-widest">Teach:</span>
                                <span
                                    style={{ backgroundColor: TYPE_COLORS[(pickedMove.type || 'normal').toLowerCase()] || '#555' }}
                                    className="px-2 py-1 rounded text-[9px] uppercase font-bold"
                                >
                                    {pickedMove.name.replace(/-/g, ' ')}
                                </span>
                                <span className="text-gray-400">PWR {pickedMove.power || '—'}</span>
                                <span className="text-gray-400">ACC {pickedMove.accuracy ?? '—'}</span>
                                <span className="text-gray-400">PP {pickedMove.pp ?? '—'}</span>
                            </div>
                        ) : (
                            <span className="text-gray-500">Pick a move from the pool on the right.</span>
                        )}
                    </div>
                    <button
                        disabled={!canConfirm}
                        onClick={handleConfirm}
                        className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:opacity-60 text-white font-bold uppercase text-[11px] tracking-widest rounded shadow-lg active:translate-y-0.5 transition-all"
                    >
                        Confirm Swap
                    </button>
                </footer>
            </motion.div>
        </div>
    );
};
