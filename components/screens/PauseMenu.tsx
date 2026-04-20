import React, { useState } from 'react';
import { Pokemon } from '../../types';
import { ITEMS } from '../../services/itemData';
import { PokemonSummary } from './PokemonSummary';
import { useEscapeKey } from '../../hooks/useEscapeKey';

export const PauseMenu: React.FC<{
    onClose: () => void;
    state: any;
    onSwap: (a: number, b: number) => void;
    onGiveItem: (mon: Pokemon, itemId: string) => void;
}> = ({ onClose, state, onSwap, onGiveItem }) => {
    const [selectedMon, setSelectedMon] = useState<Pokemon | null>(null);
    const [activeTab, setActiveTab] = useState<'party' | 'items'>('party');
    useEscapeKey(onClose, !selectedMon);

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

            <div className="bg-gray-800 border-4 border-white p-6 w-full max-w-lg text-white shadow-2xl flex flex-col h-[80vh]">
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('party')}
                        className={`flex-1 py-2 text-[10px] uppercase font-bold border-2 transition-all ${activeTab === 'party' ? 'bg-yellow-500 border-white text-black' : 'bg-gray-700 border-gray-600 text-gray-400'}`}
                    >
                        PARTY
                    </button>
                    <button
                        onClick={() => setActiveTab('items')}
                        className={`flex-1 py-2 text-[10px] uppercase font-bold border-2 transition-all ${activeTab === 'items' ? 'bg-yellow-500 border-white text-black' : 'bg-gray-700 border-gray-600 text-gray-400'}`}
                    >
                        ITEMS
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {activeTab === 'party' ? (
                        <div className="space-y-3">
                            {state.team.map((p: Pokemon, i: number) => (
                                <div
                                    key={i}
                                    className="group relative bg-gray-700 hover:bg-gray-600 border-2 border-gray-600 hover:border-yellow-400 p-3 rounded-xl cursor-pointer transition-all flex items-center gap-4"
                                >
                                    <div className="w-12 h-12 flex items-center justify-center bg-black/20 rounded-lg" onClick={() => setSelectedMon(p)}>
                                        <img src={p.sprites.front_default} className="w-10 h-10 object-contain pixelated" alt={p.name} />
                                    </div>

                                    <div className="flex-1" onClick={() => setSelectedMon(p)}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold uppercase tracking-wide">{p.name}</span>
                                            <span className="text-[10px] text-gray-400">Lv. {p.level}</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-black">
                                            <div
                                                className={`h-full transition-all duration-500 ${p.currentHp / p.maxHp > 0.5 ? 'bg-green-500' : p.currentHp / p.maxHp > 0.2 ? 'bg-yellow-500' : 'bg-red-500'}`}
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
                                            onClick={(e) => { e.stopPropagation(); onSwap(0, i); }}
                                            disabled={i === 0}
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-[10px] rounded uppercase font-bold shadow-md active:translate-y-0.5 transition-all"
                                        >
                                            LEAD
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedMon(p); }}
                                            className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-[10px] rounded uppercase font-bold shadow-md active:translate-y-0.5 transition-all"
                                        >
                                            STATS
                                        </button>
                                    </div>
                                </div>
                            ))}
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
                            {state.inventory.items.length === 0 && <div className="text-center text-[10px] text-gray-500 py-8">INVENTORY EMPTY</div>}
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

                <div className="mt-8 grid grid-cols-2 gap-4">
                    <button onClick={onClose} className="py-3 bg-red-600 hover:bg-red-500 text-white rounded font-bold uppercase text-xs tracking-widest shadow-lg">CLOSE</button>
                    <div className="bg-black/40 p-3 rounded flex items-center justify-center text-yellow-400 font-mono text-sm border border-white/10">
                        ${state.money}
                    </div>
                </div>
            </div>
        </div>
    );
};
