import React, { useState } from 'react';
import { Pokemon, StatBlock, MetaState } from '../../types';
import { ITEMS } from '../../services/itemData';
import { TYPE_COLORS } from '../../services/pokeService';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { describeMove } from '../../utils/moveDescriptions';

export const PokemonSummary: React.FC<{
    pokemon: Pokemon;
    inventory: any;
    upgrades: MetaState['upgrades'];
    onGiveItem: (itemId: string) => void;
    onClose: () => void;
}> = ({ pokemon, inventory, upgrades, onGiveItem, onClose }) => {
    const [showItemPicker, setShowItemPicker] = useState(false);
    useEscapeKey(() => { if (showItemPicker) setShowItemPicker(false); else onClose(); });

    const getBoostedStat = (key: keyof StatBlock, value: number) => {
        if (key === 'attack' || key === 'special-attack') return Math.floor(value * (1 + (upgrades.attackBoost * 0.05)));
        if (key === 'defense' || key === 'special-defense') return Math.floor(value * (1 + (upgrades.defenseBoost * 0.05)));
        if (key === 'speed') return Math.floor(value * (1 + (upgrades.speedBoost * 0.05)));
        return value;
    };

    const stats: { label: string; key: keyof StatBlock }[] = [
        { label: 'HP', key: 'hp' },
        { label: 'ATK', key: 'attack' },
        { label: 'DEF', key: 'defense' },
        { label: 'SPA', key: 'special-attack' },
        { label: 'SPD', key: 'special-defense' },
        { label: 'SPE', key: 'speed' },
    ];

    const battleItems = inventory.items.filter(
        (id: string) =>
            ITEMS[id]?.category === 'battle' ||
            ITEMS[id]?.category === 'healing' ||
            ITEMS[id]?.category === 'evolution'
    );
    if (inventory.potions > 0) battleItems.push('potion');
    if (inventory.revives > 0) battleItems.push('revive');
    if (inventory.rare_candy > 0) battleItems.push('rare-candy');

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 font-press-start overflow-y-auto">
            {showItemPicker && (
                <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-gray-800 border-4 border-white p-6 w-full max-w-md text-white">
                        <h3 className="text-sm mb-4 text-center text-yellow-400 uppercase">SELECT ITEM</h3>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {battleItems.length === 0 && <div className="text-center text-[10px] text-gray-500 py-8">NO BATTLE ITEMS IN INVENTORY</div>}
                            {battleItems.map((itemId: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => { onGiveItem(itemId); setShowItemPicker(false); }}
                                    className="w-full p-3 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded flex items-center gap-3 transition-colors"
                                >
                                    <img src={ITEMS[itemId].icon} className="w-6 h-6 object-contain" alt={ITEMS[itemId].name} />
                                    <div className="text-left">
                                        <div className="text-[10px] uppercase font-bold">{ITEMS[itemId].name}</div>
                                        <div className="text-[7px] text-gray-400">{ITEMS[itemId].description}</div>
                                        <div className="text-[6px] text-blue-400 font-bold mt-1">
                                            {ITEMS[itemId].category === 'healing' || ITEMS[itemId].category === 'evolution' ? 'USE ON POKEMON' : 'GIVE TO HOLD'}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowItemPicker(false)} className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded mt-4 text-[10px] uppercase font-bold">CANCEL</button>
                    </div>
                </div>
            )}

            <div className="bg-gray-800 border-4 border-white p-6 w-full max-w-2xl text-white relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-red-500 text-xl">X</button>

                <div className="flex flex-col md:flex-row gap-8 mb-8">
                    <div className="flex flex-col items-center bg-gray-700 p-4 rounded-xl border-2 border-gray-600">
                        <img src={pokemon.sprites.front_default} className="w-32 h-32 object-contain pixelated" alt={pokemon.name} />
                        <h2 className="text-xl text-yellow-400 uppercase mt-2">{pokemon.name}</h2>
                        <div className="text-xs text-gray-400">Lv. {pokemon.level}</div>
                        <div className="flex gap-2 mt-2">
                            {pokemon.types.map(t => (
                                <span key={t} style={{ backgroundColor: TYPE_COLORS[t] }} className="px-2 py-1 rounded text-[8px] uppercase font-bold border border-white/20">
                                    {t}
                                </span>
                            ))}
                        </div>

                        <div className="mt-6 w-full">
                            <h3 className="text-[8px] text-blue-400 mb-1 uppercase text-center">HELD ITEM</h3>
                            <div className="bg-black/30 p-2 rounded border border-white/10 flex flex-col items-center">
                                {pokemon.heldItem ? (
                                    <>
                                        <img src={ITEMS[pokemon.heldItem.id]?.icon} className="w-8 h-8 object-contain mb-1" alt={pokemon.heldItem.name} />
                                        <div className="text-[8px] uppercase font-bold text-center">{pokemon.heldItem.name}</div>
                                        <button
                                            onClick={() => onGiveItem('')}
                                            className="mt-2 text-[6px] text-red-400 hover:text-red-300 uppercase underline"
                                        >
                                            Take Item
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-[8px] text-gray-500 italic py-2">NONE</div>
                                )}
                                <button
                                    onClick={() => setShowItemPicker(true)}
                                    className="mt-2 w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-[8px] rounded uppercase font-bold transition-colors"
                                >
                                    {pokemon.heldItem ? 'CHANGE' : 'GIVE ITEM'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1">
                        <h3 className="text-sm text-blue-400 mb-4 border-b border-blue-400/30 pb-1">STATS</h3>
                        <div className="grid grid-cols-1 gap-2">
                            <div className="grid grid-cols-5 text-[8px] text-gray-500 font-bold uppercase mb-1">
                                <div className="col-span-1">Stat</div>
                                <div className="text-center">Base</div>
                                <div className="text-center">IV</div>
                                <div className="text-center">EV</div>
                                <div className="text-right">Total</div>
                            </div>
                            {stats.map(s => {
                                const isIncreased = pokemon.nature.increased === s.key;
                                const isDecreased = pokemon.nature.decreased === s.key;
                                return (
                                    <div key={s.key} className="grid grid-cols-5 items-center text-[10px] py-1 border-b border-white/5">
                                        <div className="col-span-1 text-gray-400 uppercase">{s.label}</div>
                                        <div className="text-center">{pokemon.baseStats[s.key]}</div>
                                        <div className="text-center text-green-400">{pokemon.ivs[s.key]}</div>
                                        <div className="text-center text-orange-400">{pokemon.evs[s.key]}</div>
                                        <div className={`text-right font-bold ${isIncreased ? 'text-green-400' : isDecreased ? 'text-red-400' : 'text-yellow-400'}`}>
                                            {getBoostedStat(s.key, pokemon.stats[s.key])}
                                            {isIncreased && <span className="text-[6px] ml-0.5">▲</span>}
                                            {isDecreased && <span className="text-[6px] ml-0.5">▼</span>}
                                            {getBoostedStat(s.key, pokemon.stats[s.key]) > pokemon.stats[s.key] && <span className="text-[6px] ml-0.5 text-blue-400 font-black">+</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-[10px] text-blue-400 mb-1 uppercase">Nature</h3>
                                <div className="text-xs uppercase">{pokemon.nature.name}</div>
                                {pokemon.nature.increased && (
                                    <div className="text-[8px] text-green-400 mt-1">
                                        + {pokemon.nature.increased.replace('-', ' ')} / - {pokemon.nature.decreased?.replace('-', ' ')}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-[10px] text-blue-400 mb-1 uppercase">Ability</h3>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-xs uppercase text-yellow-200 font-bold">{pokemon.ability.name.replace('-', ' ')}</span>
                                    {pokemon.ability.isHidden && (
                                        <span className="px-1.5 py-0.5 bg-purple-700/80 border border-purple-400 text-purple-100 text-[6px] uppercase tracking-widest rounded">Hidden</span>
                                    )}
                                    {pokemon.ability.category && (
                                        <span className="px-1.5 py-0.5 bg-gray-700 border border-gray-500 text-gray-200 text-[6px] uppercase tracking-widest rounded">{pokemon.ability.category}</span>
                                    )}
                                </div>
                                {pokemon.ability.description && (
                                    <div className="mt-2 p-2 bg-black/30 border border-white/10 rounded text-[8px] text-gray-300 leading-relaxed italic">
                                        {pokemon.ability.description}
                                    </div>
                                )}
                                {pokemon.ability.tags && pokemon.ability.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        {pokemon.ability.tags.slice(0, 4).map((t) => (
                                            <span key={t} className="text-[6px] text-cyan-300/90 uppercase tracking-widest">#{t}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm text-blue-400 mb-4 border-b border-blue-400/30 pb-1">MOVES</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {pokemon.moves.map((m, i) => {
                            const desc = describeMove(m);
                            return (
                                <div key={i} className="bg-gray-700/50 p-3 rounded border border-white/10 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs uppercase font-bold truncate">{m.name.replace(/-/g, ' ')}</div>
                                            <div className="flex gap-2 mt-1 flex-wrap">
                                                <span style={{ backgroundColor: TYPE_COLORS[m.type || 'normal'] }} className="px-1.5 py-0.5 rounded text-[6px] uppercase font-bold border border-white/20">
                                                    {m.type}
                                                </span>
                                                <span className="text-[6px] text-gray-300 uppercase bg-black/40 px-1.5 py-0.5 rounded border border-white/10">{m.damage_class}</span>
                                                {m.isFusion && <span className="text-[6px] text-fuchsia-300 uppercase bg-fuchsia-900/40 px-1.5 py-0.5 rounded border border-fuchsia-400/40">Fusion</span>}
                                                {m.priority !== undefined && m.priority !== 0 && (
                                                    <span className={`text-[6px] uppercase px-1.5 py-0.5 rounded border ${m.priority > 0 ? 'bg-emerald-900/40 border-emerald-400/40 text-emerald-200' : 'bg-rose-900/40 border-rose-400/40 text-rose-200'}`}>
                                                        {m.priority > 0 ? `+${m.priority}` : m.priority} pri
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-2">
                                            <div className="text-[8px] text-gray-400">PWR {m.power || '--'}</div>
                                            <div className="text-[8px] text-gray-400">ACC {m.accuracy || '--'}</div>
                                            <div className="text-[8px] text-gray-400">PP {m.pp}/{m.pp}</div>
                                        </div>
                                    </div>
                                    {desc && (
                                        <div className="text-[7px] text-gray-300 leading-relaxed bg-black/30 border border-white/5 rounded px-2 py-1.5 italic">
                                            {desc}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <button onClick={onClose} className="w-full py-4 bg-white text-black mt-8 hover:bg-yellow-400 transition-colors uppercase font-bold">CLOSE SUMMARY</button>
            </div>
        </div>
    );
};
