import React, { useState } from 'react';
import { Pokemon } from '../../types';
import { ITEMS } from '../../services/itemData';
import { PokemonSummary } from './PokemonSummary';
import { MoveRelearner } from './MoveRelearner';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { getPartyFloor, getPlayerLevelCap } from '../../utils/progression';
import { getBgmVolume, getSfxVolume, getMuted, setBgmVolume, setSfxVolume, setMuted } from '../../services/soundService';
import { formatSavedAt } from '../../utils/saveGame';

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
}> = ({ onClose, state, onSwap, onGiveItem, onSyncToCap, onApplyRelearn, onOpenLeaderboard, onSave, onExportSave, onImportSave, onDeleteSave, lastSavedAt }) => {
    const [selectedMon, setSelectedMon] = useState<Pokemon | null>(null);
    const [activeTab, setActiveTab] = useState<'party' | 'items' | 'settings'>('party');
    const [showRelearner, setShowRelearner] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [exportText, setExportText] = useState<string | null>(null);
    const [importText, setImportText] = useState<string>('');
    // Local state for the sliders so they feel immediate; we only push to the
    // sound service when the user actually drags, not every render.
    const [sfxVol, setSfxVolState] = useState<number>(getSfxVolume());
    const [bgmVol, setBgmVolState] = useState<number>(getBgmVolume());
    const [muted, setMutedState] = useState<boolean>(getMuted());
    // Disable Escape while a sub-screen is open, so Esc closes the inner screen
    // instead of bubbling up and dismissing the whole pause menu.
    useEscapeKey(onClose, !selectedMon && !showRelearner && !showImport && !exportText);

    const floor = getPartyFloor(state.badges, state.run?.maxDistanceReached ?? 0);
    const cap = getPlayerLevelCap(state.badges);
    const underFloor = state.team.filter((p: Pokemon) => p.level < floor).length;

    return (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
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
                    <div className="bg-gray-800 border-4 border-white p-6 w-full max-w-lg text-white">
                        <h3 className="text-sm mb-3 text-center text-yellow-400 uppercase">Save Export</h3>
                        <p className="text-[8px] text-gray-400 mb-2 uppercase">Copy this string and save it somewhere safe, or paste into Import on another device.</p>
                        <textarea
                            readOnly
                            value={exportText}
                            className="w-full h-40 p-2 text-[9px] font-mono bg-black/70 border border-white/20 rounded text-green-300 resize-none"
                            onFocus={(e) => e.currentTarget.select()}
                        />
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            <button
                                onClick={() => {
                                    try { navigator.clipboard.writeText(exportText); } catch { /* noop */ }
                                }}
                                className="py-2 bg-blue-600 hover:bg-blue-500 text-[10px] uppercase font-bold rounded"
                            >
                                Copy
                            </button>
                            <button
                                onClick={() => setExportText(null)}
                                className="py-2 bg-gray-600 hover:bg-gray-500 text-[10px] uppercase font-bold rounded"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showImport && (
                <div className="fixed inset-0 z-[120] bg-black/85 flex items-center justify-center p-4">
                    <div className="bg-gray-800 border-4 border-white p-6 w-full max-w-lg text-white">
                        <h3 className="text-sm mb-3 text-center text-yellow-400 uppercase">Save Import</h3>
                        <p className="text-[8px] text-red-300 mb-2 uppercase">Warning: this overwrites your current save.</p>
                        <textarea
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder="Paste exported save string here..."
                            className="w-full h-40 p-2 text-[9px] font-mono bg-black/70 border border-white/20 rounded text-green-300 resize-none placeholder:text-gray-600"
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
                                className="py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:opacity-60 text-[10px] uppercase font-bold rounded"
                            >
                                Load Save
                            </button>
                            <button
                                onClick={() => { setShowImport(false); setImportText(''); }}
                                className="py-2 bg-red-600 hover:bg-red-500 text-[10px] uppercase font-bold rounded"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-gray-800 border-4 border-white p-6 w-full max-w-lg text-white shadow-2xl flex flex-col h-[85vh]">
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setActiveTab('party')}
                        className={`flex-1 py-2 text-[10px] uppercase font-bold border-2 transition-all ${
                            activeTab === 'party'
                                ? 'bg-yellow-500 border-white text-black'
                                : 'bg-gray-700 border-gray-600 text-gray-400'
                        }`}
                    >
                        PARTY
                    </button>
                    <button
                        onClick={() => setActiveTab('items')}
                        className={`flex-1 py-2 text-[10px] uppercase font-bold border-2 transition-all ${
                            activeTab === 'items'
                                ? 'bg-yellow-500 border-white text-black'
                                : 'bg-gray-700 border-gray-600 text-gray-400'
                        }`}
                    >
                        ITEMS
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 py-2 text-[10px] uppercase font-bold border-2 transition-all ${
                            activeTab === 'settings'
                                ? 'bg-yellow-500 border-white text-black'
                                : 'bg-gray-700 border-gray-600 text-gray-400'
                        }`}
                    >
                        OPTIONS
                    </button>
                </div>

                {/* Progression strip -- always visible, explains where the player sits */}
                <div className="mb-4 bg-black/30 border border-white/10 rounded px-3 py-2 grid grid-cols-3 gap-2 text-[9px]">
                    <div>
                        <div className="text-gray-400 uppercase tracking-widest">Badges</div>
                        <div className="text-yellow-300 text-sm font-bold">{state.badges}</div>
                    </div>
                    <div>
                        <div className="text-gray-400 uppercase tracking-widest">Level Cap</div>
                        <div className="text-green-300 text-sm font-bold">{cap}</div>
                    </div>
                    <div>
                        <div className="text-gray-400 uppercase tracking-widest">Party Floor</div>
                        <div className="text-cyan-300 text-sm font-bold">{floor}</div>
                    </div>
                </div>

                {/* QoL actions */}
                <div className="mb-4 grid grid-cols-2 gap-2">
                    <button
                        onClick={onSyncToCap}
                        disabled={underFloor === 0}
                        className="py-2 bg-cyan-700 hover:bg-cyan-600 disabled:bg-gray-700 disabled:opacity-60 text-[9px] uppercase font-bold tracking-widest rounded shadow"
                        title="Snap every team member to the current party floor. Free."
                    >
                        Sync to Cap {underFloor > 0 && <span className="ml-1 text-yellow-300">({underFloor})</span>}
                    </button>
                    <button
                        onClick={() => setShowRelearner(true)}
                        className="py-2 bg-purple-700 hover:bg-purple-600 text-[9px] uppercase font-bold tracking-widest rounded shadow"
                    >
                        Move Relearner
                    </button>
                    {onOpenLeaderboard && (
                        <button
                            onClick={onOpenLeaderboard}
                            className="col-span-2 py-2 bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-600 hover:to-purple-600 text-[9px] uppercase font-bold tracking-widest rounded shadow"
                        >
                            Explorer Leaderboard
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {activeTab === 'settings' ? (
                        <div className="space-y-4 text-white">
                            <div className="bg-black/30 border border-white/10 rounded p-4 space-y-4">
                                <h3 className="text-[10px] text-blue-400 uppercase tracking-widest">Audio</h3>
                                <label className="block">
                                    <div className="flex justify-between text-[9px] uppercase text-gray-300 mb-1">
                                        <span>Music</span>
                                        <span className="text-yellow-300 font-bold">{Math.round(bgmVol * 100)}%</span>
                                    </div>
                                    <input
                                        type="range" min={0} max={1} step={0.05} value={bgmVol} disabled={muted}
                                        onChange={(e) => { const v = parseFloat(e.target.value); setBgmVolState(v); setBgmVolume(v); }}
                                        className="w-full accent-yellow-400"
                                    />
                                </label>
                                <label className="block">
                                    <div className="flex justify-between text-[9px] uppercase text-gray-300 mb-1">
                                        <span>Sound Effects</span>
                                        <span className="text-yellow-300 font-bold">{Math.round(sfxVol * 100)}%</span>
                                    </div>
                                    <input
                                        type="range" min={0} max={1} step={0.05} value={sfxVol} disabled={muted}
                                        onChange={(e) => { const v = parseFloat(e.target.value); setSfxVolState(v); setSfxVolume(v); }}
                                        className="w-full accent-yellow-400"
                                    />
                                </label>
                                <button
                                    onClick={() => { const next = !muted; setMutedState(next); setMuted(next); }}
                                    className={`w-full py-2 text-[10px] uppercase font-bold rounded transition-colors ${muted ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                                >
                                    {muted ? 'Unmute' : 'Mute All'}
                                </button>
                            </div>

                            <div className="bg-black/30 border border-white/10 rounded p-4 space-y-3">
                                <h3 className="text-[10px] text-blue-400 uppercase tracking-widest">Save Data</h3>
                                <div className="text-[9px] text-gray-400 uppercase tracking-wider">
                                    Last saved: <span className="text-yellow-300">{formatSavedAt(lastSavedAt ?? null)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => onSave && onSave()}
                                        disabled={!onSave}
                                        className="py-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:opacity-60 text-[9px] uppercase font-bold tracking-widest rounded shadow"
                                    >
                                        Save Now
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!onExportSave) return;
                                            const text = onExportSave();
                                            if (text) setExportText(text);
                                        }}
                                        disabled={!onExportSave}
                                        className="py-2 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-700 disabled:opacity-60 text-[9px] uppercase font-bold tracking-widest rounded shadow"
                                    >
                                        Export
                                    </button>
                                    <button
                                        onClick={() => setShowImport(true)}
                                        disabled={!onImportSave}
                                        className="py-2 bg-indigo-700 hover:bg-indigo-600 disabled:bg-gray-700 disabled:opacity-60 text-[9px] uppercase font-bold tracking-widest rounded shadow"
                                    >
                                        Import
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!onDeleteSave) return;
                                            if (window.confirm('Permanently delete your save? This cannot be undone.')) onDeleteSave();
                                        }}
                                        disabled={!onDeleteSave}
                                        className="py-2 bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:opacity-60 text-[9px] uppercase font-bold tracking-widest rounded shadow"
                                    >
                                        Erase
                                    </button>
                                </div>
                                <div className="text-[7px] text-gray-500 italic leading-relaxed">
                                    Autosave runs in the background every few seconds while exploring. Use Export to copy your save to another device; paste the string into Import on the new device.
                                </div>
                            </div>

                            <div className="bg-black/30 border border-white/10 rounded p-4 space-y-2">
                                <h3 className="text-[10px] text-blue-400 uppercase tracking-widest">Controls</h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[8px] text-gray-300 uppercase">
                                    <div>Move</div><div className="text-yellow-300 text-right">WASD / Arrows</div>
                                    <div>Interact</div><div className="text-yellow-300 text-right">Space / E</div>
                                    <div>Menu</div><div className="text-yellow-300 text-right">Enter</div>
                                    <div>Close / Cancel</div><div className="text-yellow-300 text-right">Esc</div>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'party' ? (
                        <div className="space-y-3">
                            {state.team.map((p: Pokemon, i: number) => {
                                const underLevel = p.level < floor;
                                return (
                                    <div
                                        key={i}
                                        className={`group relative bg-gray-700 hover:bg-gray-600 border-2 p-3 rounded-xl cursor-pointer transition-all flex items-center gap-4 ${
                                            underLevel
                                                ? 'border-cyan-400/50 hover:border-cyan-300'
                                                : 'border-gray-600 hover:border-yellow-400'
                                        }`}
                                    >
                                        <div
                                            className="w-12 h-12 flex items-center justify-center bg-black/20 rounded-lg"
                                            onClick={() => setSelectedMon(p)}
                                        >
                                            <img src={p.sprites.front_default} className="w-10 h-10 object-contain pixelated" alt={p.name} />
                                        </div>

                                        <div className="flex-1" onClick={() => setSelectedMon(p)}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold uppercase tracking-wide">{p.name}</span>
                                                <span className={`text-[10px] ${underLevel ? 'text-cyan-300' : 'text-gray-400'}`}>
                                                    Lv. {p.level}
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-black">
                                                <div
                                                    className={`h-full transition-all duration-500 ${
                                                        p.currentHp / p.maxHp > 0.5
                                                            ? 'bg-green-500'
                                                            : p.currentHp / p.maxHp > 0.2
                                                            ? 'bg-yellow-500'
                                                            : 'bg-red-500'
                                                    }`}
                                                    style={{ width: `${(p.currentHp / p.maxHp) * 100}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-1 text-[8px] text-gray-400 font-mono">
                                                <span>HP: {p.currentHp}/{p.maxHp}</span>
                                                <div className="flex gap-2">
                                                    {p.heldItem && <span className="text-blue-400">[{p.heldItem.name}]</span>}
                                                    <span>{p.status || 'OK'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSwap(0, i);
                                                }}
                                                disabled={i === 0}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-[10px] rounded uppercase font-bold shadow-md active:translate-y-0.5 transition-all"
                                            >
                                                LEAD
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedMon(p);
                                                }}
                                                className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-[10px] rounded uppercase font-bold shadow-md active:translate-y-0.5 transition-all"
                                            >
                                                STATS
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="bg-black/20 p-3 rounded border border-white/10 mb-4">
                                <div className="flex justify-between text-[10px] mb-1">
                                    <span className="text-gray-400 uppercase">Capture Permits:</span>
                                    <span className="text-yellow-400 font-bold">{state.run.capturePermits}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-400 uppercase">Potions:</span>
                                    <span className="text-yellow-400 font-bold">{state.inventory.potions}</span>
                                </div>
                            </div>

                            <h3 className="text-[8px] text-blue-400 mb-2 uppercase">Other Items</h3>
                            {state.inventory.items.length === 0 && (
                                <div className="text-center text-[10px] text-gray-500 py-8">INVENTORY EMPTY</div>
                            )}
                            {state.inventory.items.map((itemId: string, idx: number) => (
                                <div key={idx} className="bg-gray-700/50 p-2 rounded border border-white/5 flex items-center gap-3">
                                    <img src={ITEMS[itemId]?.icon} className="w-6 h-6 object-contain" alt={itemId} />
                                    <div className="flex-1">
                                        <div className="text-[9px] uppercase font-bold">{ITEMS[itemId]?.name || itemId}</div>
                                        <div className="text-[7px] text-gray-400 leading-tight">{ITEMS[itemId]?.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                    <button
                        onClick={onClose}
                        className="py-3 bg-red-600 hover:bg-red-500 text-white rounded font-bold uppercase text-xs tracking-widest shadow-lg"
                    >
                        CLOSE
                    </button>
                    <div className="bg-black/40 p-3 rounded flex items-center justify-center text-yellow-400 font-mono text-sm border border-white/10">
                        ${state.money}
                    </div>
                </div>
            </div>
        </div>
    );
};
