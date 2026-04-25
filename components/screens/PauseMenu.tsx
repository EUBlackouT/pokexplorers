import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pokemon } from '../../types';
import { ITEMS } from '../../services/itemData';
import { TYPE_COLORS } from '../../services/pokeService';
import { PokemonSummary } from './PokemonSummary';
import { MoveRelearner } from './MoveRelearner';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { getPartyFloor, getPlayerLevelCap } from '../../utils/progression';
import { getBgmVolume, getSfxVolume, getMuted, setBgmVolume, setSfxVolume, setMuted } from '../../services/soundService';
import { formatSavedAt } from '../../utils/saveGame';
import {
    MenuBackdrop,
    MenuCard,
    BrandTitle,
    BrandEyebrow,
    Panel,
    PushButton,
    PillButton,
    StatPill,
    TypeBadge,
    PokeballWatermark,
    hpColor,
} from '../ui/MenuKit';

type TabId = 'party' | 'items' | 'settings';

const TAB_META: Record<TabId, { label: string; hint: string; icon: React.ReactNode }> = {
    party: {
        label: 'Party',
        hint: 'Your explorer team',
        icon: (
            <svg viewBox="0 0 24 24" className="w-full h-full" aria-hidden="true">
                <circle cx="12" cy="12" r="9" fill="#dc2626" />
                <path d="M3 12h18" stroke="#0f172a" strokeWidth="2" />
                <circle cx="12" cy="12" r="3.5" fill="#f9fafb" stroke="#0f172a" strokeWidth="2" />
            </svg>
        ),
    },
    items: {
        label: 'Bag',
        hint: 'Items & loot',
        icon: (
            <svg viewBox="0 0 24 24" className="w-full h-full" aria-hidden="true">
                <path d="M5 10h14v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.6" />
                <path d="M9 10V7a3 3 0 0 1 6 0v3" stroke="#0f172a" strokeWidth="1.6" fill="none" />
                <circle cx="12" cy="15" r="2" fill="#fef3c7" stroke="#0f172a" strokeWidth="1.2" />
            </svg>
        ),
    },
    settings: {
        label: 'Options',
        hint: 'Audio & save data',
        icon: (
            <svg viewBox="0 0 24 24" className="w-full h-full" aria-hidden="true">
                <circle cx="12" cy="12" r="3.2" fill="#60a5fa" stroke="#0f172a" strokeWidth="1.4" />
                <g stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round">
                    <line x1="12" y1="3" x2="12" y2="6" />
                    <line x1="12" y1="18" x2="12" y2="21" />
                    <line x1="3" y1="12" x2="6" y2="12" />
                    <line x1="18" y1="12" x2="21" y2="12" />
                    <line x1="5.5" y1="5.5" x2="7.6" y2="7.6" />
                    <line x1="16.4" y1="16.4" x2="18.5" y2="18.5" />
                    <line x1="5.5" y1="18.5" x2="7.6" y2="16.4" />
                    <line x1="16.4" y1="7.6" x2="18.5" y2="5.5" />
                </g>
            </svg>
        ),
    },
};

export const PauseMenu: React.FC<{
    onClose: () => void;
    state: any;
    onSwap: (a: number, b: number) => void;
    onGiveItem: (mon: Pokemon, itemId: string) => void;
    onSyncToCap: () => void;
    onApplyRelearn: (monIndex: number, updated: Pokemon) => void;
    onOpenLeaderboard?: () => void;
    onSave?: () => void;
    onExportSave?: () => string | null;
    onImportSave?: (payload: string) => boolean;
    onDeleteSave?: () => void;
    lastSavedAt?: number | null;
    /** Optional: opens the PC / Pokemon Storage screen. When provided, the
     *  Bag tab shows a "PC" shortcut tile so players can manage box
     *  Pokemon without finding a Center. Useful in the field but it's
     *  optional so callers that don't pass it just hide the button. */
    onOpenStorage?: () => void;
}> = ({ onClose, state, onSwap, onGiveItem, onSyncToCap, onApplyRelearn, onOpenLeaderboard, onSave, onExportSave, onImportSave, onDeleteSave, lastSavedAt, onOpenStorage }) => {
    const [selectedMon, setSelectedMon] = useState<Pokemon | null>(null);
    const [activeTab, setActiveTab] = useState<TabId>('party');
    const [showRelearner, setShowRelearner] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [exportText, setExportText] = useState<string | null>(null);
    const [importText, setImportText] = useState<string>('');
    const [sfxVol, setSfxVolState] = useState<number>(getSfxVolume());
    const [bgmVol, setBgmVolState] = useState<number>(getBgmVolume());
    const [muted, setMutedState] = useState<boolean>(getMuted());

    useEscapeKey(onClose, !selectedMon && !showRelearner && !showImport && !exportText);

    const floor = getPartyFloor(state.badges, state.run?.maxDistanceReached ?? 0);
    const cap = getPlayerLevelCap(state.badges);
    const underFloor = state.team.filter((p: Pokemon) => p.level < floor).length;

    // Group inventory items by category for a nicer Bag tab.
    const groupedItems = useMemo(() => {
        const groups: Record<string, string[]> = {};
        (state.inventory.items as string[]).forEach((id) => {
            const cat = ITEMS[id]?.category ?? 'misc';
            (groups[cat] ||= []).push(id);
        });
        return groups;
    }, [state.inventory.items]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-press-start">
            <MenuBackdrop />

            {/* Sub-screens stay above */}
            {selectedMon && (
                <PokemonSummary
                    pokemon={selectedMon}
                    inventory={state.inventory}
                    upgrades={state.meta.upgrades}
                    onGiveItem={(itemId) => onGiveItem(selectedMon, itemId)}
                    onClose={() => setSelectedMon(null)}
                />
            )}
            {showRelearner && (
                <MoveRelearner
                    team={state.team}
                    onApply={onApplyRelearn}
                    onClose={() => setShowRelearner(false)}
                />
            )}

            {exportText && (
                <div className="fixed inset-0 z-[120] bg-black/85 flex items-center justify-center p-4">
                    <div className="bg-slate-900/95 border-2 border-amber-400/70 rounded-2xl p-6 w-full max-w-lg text-white shadow-2xl">
                        <h3 className="text-sm mb-3 text-center text-amber-300 uppercase tracking-widest">Save Export</h3>
                        <p className="text-[9px] text-slate-400 mb-2 uppercase tracking-wider">Copy this string and keep it safe, or paste into Import on another device.</p>
                        <textarea
                            readOnly
                            value={exportText}
                            className="w-full h-40 p-2 text-[9px] font-mono bg-black/70 border border-white/20 rounded-lg text-emerald-300 resize-none"
                            onFocus={(e) => e.currentTarget.select()}
                        />
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            <button
                                onClick={() => { try { navigator.clipboard.writeText(exportText); } catch { /* noop */ } }}
                                className="py-2 bg-blue-600 hover:bg-blue-500 text-[10px] uppercase font-bold rounded-lg tracking-widest"
                            >
                                Copy
                            </button>
                            <button
                                onClick={() => setExportText(null)}
                                className="py-2 bg-slate-700 hover:bg-slate-600 text-[10px] uppercase font-bold rounded-lg tracking-widest"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showImport && (
                <div className="fixed inset-0 z-[120] bg-black/85 flex items-center justify-center p-4">
                    <div className="bg-slate-900/95 border-2 border-rose-400/70 rounded-2xl p-6 w-full max-w-lg text-white shadow-2xl">
                        <h3 className="text-sm mb-3 text-center text-rose-300 uppercase tracking-widest">Save Import</h3>
                        <p className="text-[9px] text-rose-300/80 mb-2 uppercase tracking-wider">Warning: this overwrites your current save.</p>
                        <textarea
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder="Paste exported save string here..."
                            className="w-full h-40 p-2 text-[9px] font-mono bg-black/70 border border-white/20 rounded-lg text-emerald-300 resize-none placeholder:text-slate-600"
                        />
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            <button
                                onClick={() => {
                                    if (!onImportSave) return;
                                    const ok = onImportSave(importText);
                                    if (ok) { setShowImport(false); setImportText(''); }
                                    else window.alert('Import failed -- save string is invalid or corrupted.');
                                }}
                                disabled={!importText.trim()}
                                className="py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:opacity-60 text-[10px] uppercase font-bold rounded-lg tracking-widest"
                            >
                                Load Save
                            </button>
                            <button
                                onClick={() => { setShowImport(false); setImportText(''); }}
                                className="py-2 bg-rose-600 hover:bg-rose-500 text-[10px] uppercase font-bold rounded-lg tracking-widest"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <MenuCard maxWidth="max-w-3xl" className="h-[90vh] max-h-[860px] flex flex-col">
                {/* Decorative top-band -- the "trainer card" strip */}
                <div className="relative flex-shrink-0 px-6 pt-5 pb-4 border-b border-white/5"
                    style={{
                        background:
                            'linear-gradient(90deg, rgba(60,90,166,0.55) 0%, rgba(60,90,166,0.1) 50%, rgba(220,38,38,0.35) 100%)',
                    }}
                >
                    <PokeballWatermark className="absolute top-4 right-4 w-14 h-14" />

                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <BrandEyebrow>Trainer Card</BrandEyebrow>
                            <BrandTitle size="md" className="mt-1">POKÉ EXPLORER</BrandTitle>
                            <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-slate-300 mt-2">
                                <span className="text-amber-300">${state.money.toLocaleString()}</span>
                                <span className="text-slate-600">·</span>
                                <span>{state.team.length}/6 party</span>
                                <span className="text-slate-600">·</span>
                                <span>{state.badges} badge{state.badges === 1 ? '' : 's'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progression strip */}
                <div className="flex-shrink-0 px-6 py-3 grid grid-cols-3 gap-3 border-b border-white/5">
                    <StatPill label="Badges" value={state.badges} accent="#ffcb05" />
                    <StatPill label="Level Cap" value={cap} accent="#34d399" />
                    <StatPill label="Party Floor" value={floor} accent="#38bdf8" />
                </div>

                {/* QoL actions */}
                <div className="flex-shrink-0 px-6 py-3 grid grid-cols-2 gap-2 border-b border-white/5">
                    <PillButton
                        onClick={onSyncToCap}
                        disabled={underFloor === 0}
                        color="cyan"
                        title="Snap every team member to the current party floor. Free."
                    >
                        <span className="flex items-center justify-center gap-2">
                            <span>Sync to Cap</span>
                            {underFloor > 0 && (
                                <span className="px-1.5 py-0.5 bg-amber-400 text-black rounded-full text-[8px]">+{underFloor}</span>
                            )}
                        </span>
                    </PillButton>
                    <PillButton onClick={() => setShowRelearner(true)} color="purple">
                        Move Relearner
                    </PillButton>
                    {onOpenLeaderboard && (
                        <PillButton onClick={onOpenLeaderboard} color="indigo" fullSpan>
                            <span className="flex items-center justify-center gap-2">
                                <span>★</span> Explorer Leaderboard <span>★</span>
                            </span>
                        </PillButton>
                    )}
                </div>

                {/* Tab bar */}
                <div className="flex-shrink-0 px-6 pt-4 flex gap-2">
                    {(Object.keys(TAB_META) as TabId[]).map((id) => {
                        const isActive = activeTab === id;
                        return (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`relative flex-1 px-3 py-2.5 rounded-t-xl border-2 border-b-0 transition-all group ${
                                    isActive
                                        ? 'bg-slate-800/90 border-amber-400/70'
                                        : 'bg-slate-900/60 border-transparent hover:border-white/10 hover:bg-slate-800/50'
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="tab-accent"
                                        className="absolute -top-0.5 left-3 right-3 h-[3px] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 rounded-full"
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5">{TAB_META[id].icon}</div>
                                    <div className="text-left">
                                        <div className={`text-[10px] uppercase font-black tracking-wider ${isActive ? 'text-amber-200' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                            {TAB_META[id].label}
                                        </div>
                                        <div className={`text-[7px] uppercase tracking-widest ${isActive ? 'text-slate-300' : 'text-slate-600 group-hover:text-slate-400'}`}>
                                            {TAB_META[id].hint}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Tab content area */}
                <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6 custom-scrollbar bg-slate-800/30">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                        >
                            {activeTab === 'party' && (
                                <div className="space-y-2.5">
                                    {state.team.map((p: Pokemon, i: number) => {
                                        const ratio = p.currentHp / Math.max(1, p.maxHp);
                                        const underLevel = p.level < floor;
                                        const typeAccent = TYPE_COLORS[p.types[0]] ?? '#475569';
                                        return (
                                            <motion.div
                                                key={p.id ?? i}
                                                whileHover={{ scale: 1.01, y: -1 }}
                                                onClick={() => setSelectedMon(p)}
                                                className="relative p-3 rounded-xl border border-white/10 cursor-pointer overflow-hidden group"
                                                style={{
                                                    background:
                                                        `linear-gradient(90deg, ${typeAccent}28 0%, rgba(15,23,42,0.9) 55%, rgba(2,6,23,0.95) 100%)`,
                                                }}
                                            >
                                                {/* Lead indicator ribbon */}
                                                {i === 0 && (
                                                    <div className="absolute top-0 right-0 px-2 py-0.5 text-[7px] font-black uppercase tracking-widest bg-amber-400 text-black rounded-bl-lg">
                                                        Lead
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-4">
                                                    {/* Sprite on type-tinted circle */}
                                                    <div
                                                        className="relative w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-2 border-black/40 shadow-lg"
                                                        style={{
                                                            background:
                                                                `radial-gradient(circle at 30% 30%, ${typeAccent}cc 0%, ${typeAccent}66 55%, rgba(15,23,42,0.9) 100%)`,
                                                        }}
                                                    >
                                                        <img src={p.sprites.front_default} className="w-14 h-14 object-contain pixel-art drop-shadow-md" alt={p.name} />
                                                        {p.status && p.status !== 'OK' && (
                                                            <div className="absolute -bottom-1 -right-1 px-1.5 py-[1px] bg-rose-500 text-white text-[7px] font-black uppercase rounded-full border border-black/50">
                                                                {p.status}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Name + HP column */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-end justify-between gap-2">
                                                            <div className="text-sm uppercase font-black tracking-wide truncate text-white">
                                                                {p.name}
                                                            </div>
                                                            <div className={`text-[10px] font-bold whitespace-nowrap ${underLevel ? 'text-cyan-300' : 'text-amber-200'}`}>
                                                                Lv. {p.level}
                                                                {underLevel && <span className="ml-1 text-[7px] text-cyan-400">↑ syncable</span>}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                            {p.types.map((t) => <TypeBadge key={t} type={t} />)}
                                                            {p.heldItem && (
                                                                <span className="flex items-center gap-1 text-[8px] text-blue-200 bg-blue-900/50 border border-blue-400/30 px-1.5 py-[2px] rounded-full uppercase tracking-wider">
                                                                    <img
                                                                        src={ITEMS[p.heldItem.id]?.icon}
                                                                        className="w-3 h-3 object-contain"
                                                                        alt=""
                                                                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                                                    />
                                                                    {p.heldItem.name}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="mt-2">
                                                            <div className="flex justify-between text-[8px] font-mono text-slate-300 mb-0.5">
                                                                <span>HP</span>
                                                                <span className="text-slate-400">{p.currentHp} / {p.maxHp}</span>
                                                            </div>
                                                            <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-black">
                                                                <motion.div
                                                                    className={`h-full bg-gradient-to-r ${hpColor(ratio)}`}
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${ratio * 100}%` }}
                                                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action buttons */}
                                                    <div className="flex flex-col gap-1.5 shrink-0">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onSwap(0, i); }}
                                                            disabled={i === 0}
                                                            className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg shadow-md transition-all bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:opacity-40 active:translate-y-0.5"
                                                        >
                                                            Lead
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedMon(p); }}
                                                            className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg shadow-md bg-amber-500 hover:bg-amber-400 text-black active:translate-y-0.5 transition-all"
                                                        >
                                                            Summary
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}

                            {activeTab === 'items' && (
                                <div className="space-y-4">
                                    {/* PC shortcut: lets players manage box Pokemon */}
                                    {/* without travelling to a Pokemon Center. */}
                                    {onOpenStorage && (
                                        <button
                                            onClick={() => { onOpenStorage(); onClose(); }}
                                            className="w-full bg-gradient-to-r from-blue-700/70 to-purple-700/70 border border-blue-300/40 hover:border-blue-200 rounded-xl p-3 flex items-center gap-3 transition-colors text-left"
                                        >
                                            <div className="w-12 h-12 flex-none rounded-lg bg-blue-950/80 border border-blue-300/40 flex items-center justify-center text-2xl">
                                                💾
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[10px] uppercase font-black tracking-wider text-blue-100">Pokemon Storage</div>
                                                <div className="text-[8px] text-blue-300/80 mt-0.5">
                                                    {(() => {
                                                        const stored = (state.boxes ?? []).reduce((sum: number, b: any) => sum + (b.slots?.filter((s: any) => !!s).length ?? 0), 0);
                                                        return `${stored} stored · Open the PC`;
                                                    })()}
                                                </div>
                                            </div>
                                            <div className="text-[8px] text-blue-200 uppercase tracking-widest">Open</div>
                                        </button>
                                    )}

                                    {/* Quick resources block */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <ResourceTile label="Capture Permits" value={state.run.capturePermits} accent="#f59e0b" />
                                        <ResourceTile label="Potions" value={state.inventory.potions} accent="#60a5fa" />
                                        <ResourceTile label="Revives" value={state.inventory.revives ?? 0} accent="#f472b6" />
                                        <ResourceTile label="Rare Candy" value={state.inventory.rare_candy ?? 0} accent="#c084fc" />
                                    </div>

                                    {/* Grouped items */}
                                    {Object.keys(groupedItems).length === 0 && (
                                        <div className="bg-black/40 border border-white/10 rounded-xl p-8 text-center text-[10px] text-slate-500 uppercase tracking-widest">
                                            Your bag is empty.
                                        </div>
                                    )}
                                    {(Object.entries(groupedItems) as [string, string[]][]).map(([cat, ids]) => (
                                        <div key={cat}>
                                            <h3 className="text-[9px] text-cyan-300 uppercase tracking-[0.4em] mb-2">{cat}</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {ids.map((id, idx) => (
                                                    <div
                                                        key={`${id}-${idx}`}
                                                        className="bg-slate-900/70 border border-white/10 rounded-lg p-2 flex items-center gap-3 hover:border-amber-400/50 transition-colors"
                                                    >
                                                        <div className="w-9 h-9 rounded-md bg-slate-800/70 border border-white/10 flex items-center justify-center shrink-0">
                                                            <img
                                                                src={ITEMS[id]?.icon}
                                                                className="w-7 h-7 object-contain"
                                                                alt=""
                                                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[9px] uppercase font-bold tracking-wider truncate text-white">
                                                                {ITEMS[id]?.name ?? id}
                                                            </div>
                                                            <div className="text-[7px] text-slate-400 leading-tight line-clamp-2">
                                                                {ITEMS[id]?.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="space-y-3">
                                    {/* Audio */}
                                    <Panel accent="#60a5fa" title="Audio">
                                        <Slider
                                            label="Music"
                                            value={bgmVol}
                                            disabled={muted}
                                            onChange={(v) => { setBgmVolState(v); setBgmVolume(v); }}
                                        />
                                        <Slider
                                            label="Sound Effects"
                                            value={sfxVol}
                                            disabled={muted}
                                            onChange={(v) => { setSfxVolState(v); setSfxVolume(v); }}
                                        />
                                        <button
                                            onClick={() => { const next = !muted; setMutedState(next); setMuted(next); }}
                                            className={`w-full mt-1 py-2 text-[10px] uppercase font-black tracking-widest rounded-lg transition-colors ${muted ? 'bg-rose-600 hover:bg-rose-500' : 'bg-slate-700 hover:bg-slate-600'}`}
                                        >
                                            {muted ? 'Unmute' : 'Mute All'}
                                        </button>
                                    </Panel>

                                    {/* Save data */}
                                    <Panel accent="#34d399" title="Save Data">
                                        <div className="text-[8px] text-slate-400 uppercase tracking-widest mb-2">
                                            Last saved <span className="text-amber-300 font-bold">{formatSavedAt(lastSavedAt ?? null)}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <PillButton onClick={() => onSave?.()} disabled={!onSave} color="emerald">Save Now</PillButton>
                                            <PillButton
                                                onClick={() => {
                                                    if (!onExportSave) return;
                                                    const text = onExportSave();
                                                    if (text) setExportText(text);
                                                }}
                                                disabled={!onExportSave}
                                                color="blue"
                                            >
                                                Export
                                            </PillButton>
                                            <PillButton onClick={() => setShowImport(true)} disabled={!onImportSave} color="indigo">Import</PillButton>
                                            <PillButton
                                                onClick={() => {
                                                    if (!onDeleteSave) return;
                                                    if (window.confirm('Permanently delete your save? This cannot be undone.')) onDeleteSave();
                                                }}
                                                disabled={!onDeleteSave}
                                                color="rose"
                                            >
                                                Erase
                                            </PillButton>
                                        </div>
                                        <div className="text-[7px] text-slate-500 italic leading-relaxed mt-3">
                                            Autosave runs in the background every few seconds while exploring. Use Export to copy your save to another device; paste the string into Import on the new device.
                                        </div>
                                    </Panel>

                                    {/* Controls */}
                                    <Panel accent="#f472b6" title="Controls">
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[9px] uppercase tracking-wider">
                                            <ControlRow k="Move" v="WASD / Arrows" />
                                            <ControlRow k="Interact" v="Space / E" />
                                            <ControlRow k="Menu" v="Enter" />
                                            <ControlRow k="Close" v="Esc" />
                                        </div>
                                    </Panel>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer resume button */}
                <div className="flex-shrink-0 px-6 py-4 border-t border-white/5 bg-black/20">
                    <PushButton onClick={onClose} color="amber">
                        Resume Adventure
                    </PushButton>
                </div>
            </MenuCard>
        </div>
    );
};

// ------------- local helpers -----------------------------------------------

const ResourceTile: React.FC<{ label: string; value: React.ReactNode; accent: string }> = ({ label, value, accent }) => (
    <div
        className="rounded-xl border border-white/10 px-3 py-2 flex items-center justify-between"
        style={{
            background: `linear-gradient(90deg, ${accent}20 0%, rgba(2,6,23,0.6) 100%)`,
        }}
    >
        <div className="text-[9px] uppercase tracking-[0.25em] text-slate-300">{label}</div>
        <div className="text-lg font-black" style={{ color: accent }}>{value}</div>
    </div>
);

const Slider: React.FC<{ label: string; value: number; disabled?: boolean; onChange: (v: number) => void }> = ({ label, value, disabled, onChange }) => (
    <label className="block mb-2">
        <div className="flex justify-between text-[9px] uppercase tracking-widest text-slate-300 mb-1">
            <span>{label}</span>
            <span className="text-amber-300 font-bold">{Math.round(value * 100)}%</span>
        </div>
        <input
            type="range" min={0} max={1} step={0.05} value={value} disabled={disabled}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full accent-amber-400 disabled:opacity-40"
        />
    </label>
);

const ControlRow: React.FC<{ k: string; v: string }> = ({ k, v }) => (
    <>
        <div className="text-slate-400">{k}</div>
        <div className="text-amber-200 text-right">{v}</div>
    </>
);
