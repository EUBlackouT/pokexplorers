import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Pokemon, StatBlock, MetaState } from '../../types';
import { ITEMS } from '../../services/itemData';
import { TYPE_COLORS } from '../../services/pokeService';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { describeMove } from '../../utils/moveDescriptions';
import { MenuBackdrop, MenuCard, BrandTitle, Panel, PushButton, CloseX } from '../ui/MenuKit';

// Rough cap most stats land under. Used to render proportional stat bars so
// relative strength reads at a glance ("my Attack is way higher than my Def").
const STAT_BAR_MAX = 200;

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

    const stats: { label: string; key: keyof StatBlock; color: string }[] = [
        { label: 'HP',  key: 'hp',              color: '#ef4444' },
        { label: 'ATK', key: 'attack',          color: '#f97316' },
        { label: 'DEF', key: 'defense',         color: '#eab308' },
        { label: 'SPA', key: 'special-attack',  color: '#3b82f6' },
        { label: 'SPD', key: 'special-defense', color: '#10b981' },
        { label: 'SPE', key: 'speed',           color: '#ec4899' },
    ];

    const battleItems = useMemo(() => {
        const list = (inventory.items as string[]).filter(
            (id) =>
                ITEMS[id]?.category === 'battle' ||
                ITEMS[id]?.category === 'healing' ||
                ITEMS[id]?.category === 'evolution'
        );
        if (inventory.potions > 0) list.push('potion');
        if (inventory.revives > 0) list.push('revive');
        if (inventory.rare_candy > 0) list.push('rare-candy');
        return list;
    }, [inventory]);

    const primaryType = pokemon.types[0] ?? 'normal';
    const secondaryType = pokemon.types[1] ?? primaryType;
    const primaryColor = TYPE_COLORS[primaryType] ?? '#64748b';
    const secondaryColor = TYPE_COLORS[secondaryType] ?? primaryColor;
    const statTotal = stats.reduce((acc, s) => acc + getBoostedStat(s.key, pokemon.stats[s.key]), 0);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 font-press-start">
            <MenuBackdrop accent={primaryColor} onClick={onClose} />

            {/* Item picker (stays above) */}
            {showItemPicker && (
                <div className="fixed inset-0 z-[120] bg-black/85 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-slate-900/95 border-2 border-amber-400/70 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl"
                    >
                        <h3 className="text-sm mb-4 text-center text-amber-300 uppercase tracking-[0.35em]">Select Item</h3>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {battleItems.length === 0 && (
                                <div className="text-center text-[10px] text-slate-500 py-8 uppercase tracking-widest">No battle items in inventory</div>
                            )}
                            {battleItems.map((itemId: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => { onGiveItem(itemId); setShowItemPicker(false); }}
                                    className="w-full p-3 bg-slate-800 hover:bg-slate-700 border border-white/10 hover:border-amber-400/60 rounded-lg flex items-center gap-3 transition-colors text-left"
                                >
                                    <img src={ITEMS[itemId].icon} className="w-7 h-7 object-contain shrink-0" alt={ITEMS[itemId].name} />
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[10px] uppercase font-bold tracking-wider truncate">{ITEMS[itemId].name}</div>
                                        <div className="text-[7px] text-slate-400 leading-tight line-clamp-2">{ITEMS[itemId].description}</div>
                                        <div className="text-[6px] text-cyan-300 font-bold mt-1 uppercase tracking-widest">
                                            {ITEMS[itemId].category === 'healing' || ITEMS[itemId].category === 'evolution' ? 'Use on Pokémon' : 'Give to hold'}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowItemPicker(false)} className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg mt-4 text-[10px] uppercase font-black tracking-widest">
                            Cancel
                        </button>
                    </motion.div>
                </div>
            )}

            <MenuCard maxWidth="max-w-4xl" className="max-h-[92vh] overflow-y-auto custom-scrollbar">
                <CloseX onClose={onClose} className="absolute top-3 right-3 z-20" />

                {/* Hero banner: sprite on a type-tinted gradient */}
                <div
                    className="relative px-6 pt-6 pb-4 border-b border-white/10 overflow-hidden"
                    style={{
                        background:
                            `linear-gradient(135deg, ${primaryColor}d0 0%, ${secondaryColor}b0 55%, rgba(15,23,42,0.95) 100%)`,
                    }}
                >
                    {/* Decorative radial glow behind the sprite */}
                    <div
                        className="absolute -top-10 -left-10 w-72 h-72 rounded-full opacity-60 pointer-events-none"
                        style={{ background: `radial-gradient(circle, ${primaryColor}aa 0%, transparent 70%)` }}
                    />

                    <div className="relative flex flex-col md:flex-row items-center gap-5">
                        {/* Sprite */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.05 }}
                            className="w-36 h-36 shrink-0 rounded-full border-4 border-black/40 flex items-center justify-center shadow-2xl"
                            style={{
                                background:
                                    `radial-gradient(circle at 30% 30%, ${primaryColor}dd, ${primaryColor}55 60%, rgba(2,6,23,0.9) 100%)`,
                            }}
                        >
                            <img
                                src={pokemon.sprites.front_default}
                                className="w-32 h-32 object-contain pixel-art drop-shadow-[0_6px_6px_rgba(0,0,0,0.5)]"
                                alt={pokemon.name}
                            />
                        </motion.div>

                        {/* Identity */}
                        <div className="flex-1 min-w-0 text-center md:text-left">
                            <div className="text-[9px] uppercase tracking-[0.4em] text-white/70 mb-1">
                                #{String(pokemon.id).padStart(3, '0')}
                            </div>
                            <BrandTitle size="lg" className="truncate">
                                {pokemon.name}
                            </BrandTitle>
                            <div className="flex items-center justify-center md:justify-start gap-2 mt-2 flex-wrap">
                                {pokemon.types.map((t) => (
                                    <span
                                        key={t}
                                        className="px-2.5 py-1 rounded-full text-[9px] uppercase tracking-[0.25em] font-black border border-black/30 shadow-md"
                                        style={{ backgroundColor: TYPE_COLORS[t] ?? '#64748b', color: '#0f172a' }}
                                    >
                                        {t}
                                    </span>
                                ))}
                                <span className="text-[10px] uppercase text-white/80 font-bold tracking-wider ml-2">Lv. {pokemon.level}</span>
                            </div>

                            {/* XP bar if available */}
                            {pokemon.maxXp > 0 && (
                                <div className="mt-3 max-w-xs mx-auto md:mx-0">
                                    <div className="flex justify-between text-[7px] uppercase tracking-widest text-white/70 mb-0.5">
                                        <span>Experience</span>
                                        <span>{pokemon.xp}/{pokemon.maxXp}</span>
                                    </div>
                                    <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-black/60">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-cyan-300 to-cyan-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (pokemon.xp / Math.max(1, pokemon.maxXp)) * 100)}%` }}
                                            transition={{ duration: 0.6 }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Body -- 2-column layout on md+ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-6">
                    {/* Left column: Held item + Ability + Nature */}
                    <div className="md:col-span-1 space-y-4">
                        <Panel title="Held Item" accent="#60a5fa">
                            {pokemon.heldItem ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                                        <img
                                            src={ITEMS[pokemon.heldItem.id]?.icon}
                                            className="w-9 h-9 object-contain"
                                            alt=""
                                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] uppercase font-black tracking-wider truncate">{pokemon.heldItem.name}</div>
                                        <button
                                            onClick={() => onGiveItem('')}
                                            className="text-[7px] text-rose-300 hover:text-rose-200 uppercase underline tracking-widest mt-0.5"
                                        >
                                            Take Item
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-[9px] text-slate-500 italic text-center py-3 uppercase tracking-widest">No item held</div>
                            )}
                            <button
                                onClick={() => setShowItemPicker(true)}
                                className="w-full py-2 mt-3 bg-blue-600 hover:bg-blue-500 text-[9px] rounded-lg uppercase font-black tracking-widest shadow transition-all active:translate-y-0.5"
                            >
                                {pokemon.heldItem ? 'Change Item' : 'Give Item'}
                            </button>
                        </Panel>

                        <Panel title="Ability" accent="#fbbf24">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-sm uppercase tracking-wide text-amber-200 font-black truncate">
                                    {pokemon.ability.name.replace(/-/g, ' ')}
                                </span>
                                {pokemon.ability.isHidden && (
                                    <span className="px-1.5 py-0.5 bg-purple-700/80 border border-purple-400 text-purple-100 text-[7px] uppercase tracking-widest rounded-full">Hidden</span>
                                )}
                                {pokemon.ability.category && (
                                    <span className="px-1.5 py-0.5 bg-slate-700 border border-slate-500 text-slate-200 text-[7px] uppercase tracking-widest rounded-full">{pokemon.ability.category}</span>
                                )}
                            </div>
                            {pokemon.ability.description ? (
                                <p className="text-[8px] text-slate-300 leading-relaxed italic border-l-2 border-amber-400/60 pl-2">
                                    {pokemon.ability.description}
                                </p>
                            ) : (
                                <p className="text-[8px] text-slate-500 italic">No description on record.</p>
                            )}
                            {pokemon.ability.tags && pokemon.ability.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {pokemon.ability.tags.slice(0, 5).map((t) => (
                                        <span key={t} className="text-[6px] text-cyan-300/90 uppercase tracking-[0.2em]">#{t}</span>
                                    ))}
                                </div>
                            )}
                        </Panel>

                        <Panel title="Nature" accent="#f472b6">
                            <div className="text-sm uppercase font-black tracking-wide">{pokemon.nature.name}</div>
                            {pokemon.nature.increased ? (
                                <div className="flex items-center justify-between gap-2 text-[8px] uppercase tracking-widest mt-2">
                                    <span className="text-emerald-300">▲ {pokemon.nature.increased.replace('-', ' ')}</span>
                                    <span className="text-rose-300">▼ {pokemon.nature.decreased?.replace('-', ' ')}</span>
                                </div>
                            ) : (
                                <div className="text-[8px] text-slate-500 italic mt-2 uppercase tracking-widest">Neutral nature</div>
                            )}
                        </Panel>
                    </div>

                    {/* Right column: Stats + Moves */}
                    <div className="md:col-span-2 space-y-4">
                        <Panel title="Stats" accent="#60a5fa" right={<span className="text-[8px] text-slate-400 uppercase tracking-widest">Total <span className="text-amber-300 font-black">{statTotal}</span></span>}>
                            <div className="space-y-1.5">
                                {stats.map((s) => {
                                    const base = pokemon.baseStats[s.key];
                                    const total = getBoostedStat(s.key, pokemon.stats[s.key]);
                                    const boosted = total > pokemon.stats[s.key];
                                    const isIncreased = pokemon.nature.increased === s.key;
                                    const isDecreased = pokemon.nature.decreased === s.key;
                                    const fill = Math.min(100, (total / STAT_BAR_MAX) * 100);
                                    return (
                                        <div key={s.key} className="grid grid-cols-[36px_1fr_auto] items-center gap-2">
                                            <div className={`text-[9px] font-black uppercase tracking-widest ${
                                                isIncreased ? 'text-emerald-300' : isDecreased ? 'text-rose-300' : 'text-slate-400'
                                            }`}>
                                                {s.label}
                                                {isIncreased && <span className="ml-0.5 text-[6px]">▲</span>}
                                                {isDecreased && <span className="ml-0.5 text-[6px]">▼</span>}
                                            </div>
                                            <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-black/60 relative">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${fill}%` }}
                                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                                    className="h-full rounded-full"
                                                    style={{
                                                        background: `linear-gradient(90deg, ${s.color}cc 0%, ${s.color} 100%)`,
                                                        boxShadow: `inset 0 0 6px rgba(0,0,0,0.35), 0 0 8px ${s.color}44`,
                                                    }}
                                                />
                                            </div>
                                            <div className={`text-[10px] font-black tabular-nums min-w-[3ch] text-right ${
                                                boosted ? 'text-cyan-300' : 'text-amber-200'
                                            }`}>
                                                {total}
                                                {boosted && <span className="ml-0.5 text-[6px] text-cyan-400">+</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* IV/EV micro-row -- compact, nerd-only info */}
                            <div className="grid grid-cols-6 gap-1 mt-3 pt-3 border-t border-white/10 text-center text-[7px] uppercase tracking-widest">
                                {stats.map((s) => (
                                    <div key={s.key}>
                                        <div className="text-slate-500">{s.label}</div>
                                        <div className="text-emerald-300 font-bold mt-0.5">IV {pokemon.ivs[s.key]}</div>
                                        <div className="text-orange-300 font-bold">EV {pokemon.evs[s.key]}</div>
                                        <div className="text-slate-400">Base {pokemon.baseStats[s.key]}</div>
                                    </div>
                                ))}
                            </div>
                        </Panel>

                        <Panel title="Moves" accent="#a78bfa">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {pokemon.moves.map((m, i) => {
                                    const desc = describeMove(m);
                                    const moveColor = TYPE_COLORS[m.type || 'normal'] ?? '#64748b';
                                    return (
                                        <div
                                            key={i}
                                            className="rounded-lg border border-white/10 p-2.5 overflow-hidden relative"
                                            style={{
                                                background: `linear-gradient(90deg, ${moveColor}28 0%, rgba(2,6,23,0.7) 100%)`,
                                            }}
                                        >
                                            {/* Left color rail */}
                                            <div
                                                className="absolute top-0 left-0 bottom-0 w-[4px]"
                                                style={{ background: moveColor }}
                                            />
                                            <div className="pl-2">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <div className="text-[10px] uppercase font-black tracking-wide truncate">{m.name.replace(/-/g, ' ')}</div>
                                                    <div className="shrink-0 text-right text-[7px] uppercase text-slate-300">
                                                        <div>Pwr <span className="text-amber-200 font-bold">{m.power || '—'}</span></div>
                                                        <div>Acc <span className="text-amber-200 font-bold">{m.accuracy || '—'}</span></div>
                                                        <div>PP <span className="text-amber-200 font-bold">{m.pp}/{m.pp}</span></div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mb-1.5">
                                                    <span className="px-1.5 py-[1px] rounded text-[7px] uppercase font-black tracking-widest border border-black/30" style={{ backgroundColor: moveColor, color: '#0f172a' }}>
                                                        {m.type}
                                                    </span>
                                                    <span className="px-1.5 py-[1px] rounded text-[7px] uppercase tracking-widest bg-black/40 text-slate-200 border border-white/10">
                                                        {m.damage_class}
                                                    </span>
                                                    {m.isFusion && (
                                                        <span className="px-1.5 py-[1px] rounded text-[7px] uppercase tracking-widest bg-fuchsia-900/60 text-fuchsia-200 border border-fuchsia-400/40">
                                                            Fusion
                                                        </span>
                                                    )}
                                                    {m.priority !== undefined && m.priority !== 0 && (
                                                        <span className={`px-1.5 py-[1px] rounded text-[7px] uppercase tracking-widest border ${m.priority > 0 ? 'bg-emerald-900/50 text-emerald-200 border-emerald-400/40' : 'bg-rose-900/50 text-rose-200 border-rose-400/40'}`}>
                                                            {m.priority > 0 ? `+${m.priority}` : m.priority} Pri
                                                        </span>
                                                    )}
                                                </div>
                                                {desc && (
                                                    <div className="text-[7px] text-slate-300 leading-relaxed italic border-l-2 border-white/10 pl-2">
                                                        {desc}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Panel>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <PushButton onClick={onClose} color="amber">Close Summary</PushButton>
                </div>
            </MenuCard>
        </div>
    );
};
