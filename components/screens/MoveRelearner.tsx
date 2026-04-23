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
import {
    MenuBackdrop,
    MenuCard,
    BrandTitle,
    BrandEyebrow,
    PushButton,
    CloseX,
    TypeBadge,
} from '../ui/MenuKit';

/**
 * Team-wide move relearner. Free of charge (grinding got removed elsewhere).
 * Three-pane layout: Party / Current Moveset / Learnable Pool.
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-press-start">
                <MenuBackdrop accent="#a78bfa" />
                <MenuCard maxWidth="max-w-md" className="p-8">
                    <BrandEyebrow color="#c4b5fd">Move Relearner</BrandEyebrow>
                    <p className="mt-3 text-sm text-slate-300">No Pokémon in your team yet.</p>
                    <div className="mt-6"><PushButton onClick={onClose} color="amber">Close</PushButton></div>
                </MenuCard>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-press-start">
            <MenuBackdrop accent="#a78bfa" />

            <MenuCard maxWidth="max-w-5xl" className="h-[90vh] max-h-[880px] flex flex-col">
                <CloseX onClose={onClose} className="absolute top-3 right-3 z-20" />

                {/* Header strip */}
                <div
                    className="relative flex-shrink-0 px-6 pt-5 pb-4 border-b border-white/5"
                    style={{
                        background: 'linear-gradient(90deg, rgba(168,85,247,0.4) 0%, rgba(96,165,250,0.15) 60%, transparent 100%)',
                    }}
                >
                    <BrandEyebrow color="#c4b5fd">Move Relearner</BrandEyebrow>
                    <BrandTitle size="md" className="mt-1">TEACH A MOVE</BrandTitle>
                    <p className="text-[9px] uppercase tracking-[0.35em] text-slate-400 mt-2">Free of charge — pick any move up to current level</p>
                </div>

                {/* Three-pane body */}
                <div className="flex-1 min-h-0 grid grid-cols-[180px_1fr_1.2fr]">
                    {/* Team picker */}
                    <aside className="border-r border-white/10 p-3 overflow-y-auto custom-scrollbar space-y-2 bg-black/20">
                        <div className="text-[8px] uppercase tracking-[0.35em] text-slate-400 mb-2">Party</div>
                        {team.map((p, i) => {
                            const isActive = i === monIndex;
                            const accent = TYPE_COLORS[p.types[0]] ?? '#64748b';
                            return (
                                <button
                                    key={p.id ?? i}
                                    onClick={() => setMonIndex(i)}
                                    className="w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-colors"
                                    style={{
                                        background: isActive
                                            ? `linear-gradient(90deg, ${accent}40 0%, rgba(2,6,23,0.9) 100%)`
                                            : 'rgba(2,6,23,0.4)',
                                        borderColor: isActive ? `${accent}aa` : 'rgba(255,255,255,0.08)',
                                    }}
                                >
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center border border-black/30 shrink-0"
                                        style={{
                                            background: `radial-gradient(circle at 30% 30%, ${accent}cc 0%, ${accent}55 60%, rgba(15,23,42,0.9) 100%)`,
                                        }}
                                    >
                                        <img
                                            src={p.sprites.front_default}
                                            alt={p.name}
                                            className="w-9 h-9 object-contain pixel-art"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[10px] font-black uppercase tracking-wider truncate">{p.name}</div>
                                        <div className="text-[8px] text-slate-400 uppercase">Lv {p.level}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </aside>

                    {/* Current moveset */}
                    <section className="border-r border-white/10 p-4 overflow-y-auto custom-scrollbar">
                        <div className="text-[8px] uppercase tracking-[0.35em] text-slate-400 mb-3">
                            Current Moveset <span className="text-slate-600">— tap to replace</span>
                        </div>
                        <div className="space-y-2">
                            {mon.moves.map((mv, i) => {
                                const typeColor = TYPE_COLORS[(mv.type || 'normal').toLowerCase()] || '#64748b';
                                const isPicked = i === slotIndex;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSlotIndex(i)}
                                        className="w-full p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden"
                                        style={{
                                            background: `linear-gradient(90deg, ${typeColor}cc 0%, ${typeColor}88 100%)`,
                                            borderColor: isPicked ? '#fbbf24' : 'rgba(0,0,0,0.25)',
                                            boxShadow: isPicked ? '0 0 0 3px rgba(251,191,36,0.35), 0 6px 16px rgba(0,0,0,0.35)' : '0 4px 12px rgba(0,0,0,0.25)',
                                        }}
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="font-black text-[11px] uppercase tracking-wide truncate text-black">
                                                {mv.name.replace(/-/g, ' ')}
                                            </span>
                                            <TypeBadge type={mv.type || 'normal'} size="xs" />
                                        </div>
                                        <div className="flex gap-3 text-[8px] uppercase font-bold text-black/75">
                                            <span>PWR {mv.power || '—'}</span>
                                            <span>ACC {mv.accuracy ?? '—'}</span>
                                            <span>PP {mv.pp ?? '—'}</span>
                                        </div>
                                    </button>
                                );
                            })}
                            {mon.moves.length < 4 && (
                                <button
                                    onClick={() => setSlotIndex(null)}
                                    className={`w-full p-3 rounded-xl border-2 border-dashed text-center text-[10px] uppercase tracking-widest font-black transition-colors ${
                                        slotIndex === null
                                            ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                                            : 'border-white/20 text-slate-400 hover:border-white/40'
                                    }`}
                                >
                                    + Empty slot ({4 - mon.moves.length} left)
                                </button>
                            )}
                        </div>
                        {softLock && (
                            <div className="mt-3 text-[9px] text-rose-200 bg-rose-900/40 border border-rose-500/40 rounded-lg p-2.5 uppercase tracking-wider">
                                Can't forget this — it's the only damaging move left.
                            </div>
                        )}
                    </section>

                    {/* Learnable pool */}
                    <section className="p-4 overflow-y-auto custom-scrollbar">
                        <div className="text-[8px] uppercase tracking-[0.35em] text-slate-400 mb-3">
                            Learnable Pool <span className="text-slate-600">— {learnable.length} moves up to Lv {mon.level}</span>
                        </div>
                        {learnable.length === 0 && (
                            <div className="text-[10px] text-slate-500 italic">No learnable moves recorded for this Pokémon.</div>
                        )}
                        <div className="space-y-4">
                            {grouped.map(([level, entries]) => (
                                <div key={level}>
                                    <div className="text-[8px] uppercase tracking-[0.3em] text-amber-300/80 mb-1.5">
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
                                                    className="p-2 rounded-lg border text-left transition-all text-[9px]"
                                                    style={{
                                                        background: e.known
                                                            ? 'rgba(15,23,42,0.4)'
                                                            : isPicked
                                                                ? 'linear-gradient(90deg, rgba(16,185,129,0.3) 0%, rgba(2,6,23,0.9) 100%)'
                                                                : 'rgba(2,6,23,0.6)',
                                                        borderColor: e.known
                                                            ? 'rgba(255,255,255,0.05)'
                                                            : isPicked
                                                                ? '#34d399'
                                                                : 'rgba(255,255,255,0.1)',
                                                        opacity: e.known ? 0.5 : 1,
                                                        cursor: e.known ? 'not-allowed' : 'pointer',
                                                    }}
                                                >
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="font-black uppercase truncate">{e.name.replace(/-/g, ' ')}</span>
                                                        {e.known && <span className="text-[7px] text-slate-500 uppercase tracking-widest">Learned</span>}
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
                <footer className="flex-shrink-0 px-6 py-4 border-t border-white/5 bg-black/30 flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-[220px] text-[10px]">
                        {error ? (
                            <span className="text-rose-300">{error}</span>
                        ) : loading ? (
                            <span className="text-slate-400 animate-pulse uppercase tracking-widest">Fetching move details…</span>
                        ) : pickedMove ? (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-slate-400 uppercase text-[8px] tracking-widest">Teach:</span>
                                <span
                                    className="px-2 py-1 rounded text-[10px] uppercase font-black tracking-wide border border-black/30"
                                    style={{ backgroundColor: TYPE_COLORS[(pickedMove.type || 'normal').toLowerCase()] || '#555', color: '#0f172a' }}
                                >
                                    {pickedMove.name.replace(/-/g, ' ')}
                                </span>
                                <span className="text-slate-400 text-[8px] uppercase tracking-widest">PWR {pickedMove.power || '—'} · ACC {pickedMove.accuracy ?? '—'} · PP {pickedMove.pp ?? '—'}</span>
                            </div>
                        ) : (
                            <span className="text-slate-500 uppercase tracking-widest">Pick a move from the pool →</span>
                        )}
                    </div>
                    <div className="w-48">
                        <motion.div whileTap={{ scale: 0.97 }}>
                            <PushButton onClick={handleConfirm} disabled={!canConfirm} color="emerald">
                                Confirm Swap
                            </PushButton>
                        </motion.div>
                    </div>
                </footer>
            </MenuCard>
        </div>
    );
};
