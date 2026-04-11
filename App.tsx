
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Pokemon, PokemonMove, GamePhase, BattleState, PlayerGlobalState, Coordinate, TrainerData, WeatherType, TerrainType, StatBlock, StatStages, MetaState } from './types';
import { NEW_ABILITIES } from './data/abilities';
import { NEW_MOVES } from './data/moves';
import { getFusionMove } from './data/fusionChart';
import { motion, AnimatePresence } from 'motion/react';
import { 
    getWildPokemon, 
    calculateDamage, 
    gainExperience, 
    checkEvolution, 
    evolvePokemon, 
    fetchPokemon, 
    getDamageMultiplier, 
    calculateAccuracy,
    applySecondaryEffect,
    handleStatusTurn,
    handleEndOfTurnStatus,
    calculateStatsFull,
    getEvolutionTarget,
    TYPE_COLORS
} from './services/pokeService';
import { playSound, playCry, playMoveSfx, playFaintSfx, playLevelUpSfx, playBGM, stopBGM, BGM_TRACKS } from './services/soundService';
import { MAPS, generateRiftMap, generateChunk, generateCaveMap, generatePuzzleMap, CHUNK_SIZE } from './services/mapData';
import { ITEMS } from './services/itemData';
import { generateBattleBackground } from './services/imageService';
import { multiplayer, NetworkPayload } from './services/multiplayer';
import { HealthBar } from './components/HealthBar';
import { PokemonSprite } from './components/PokemonSprite';
import { StarterSelect } from './components/StarterSelect';
import { Overworld } from './components/Overworld';

// --- Helper Components ---
const toPascalCase = (str: string) => str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');

interface ActionButtonProps { label: string; onClick: () => void; disabled: boolean; color: string; subLabel?: string; pulse?: boolean; }
const ActionButton: React.FC<ActionButtonProps> = ({ label, onClick, disabled, color, subLabel, pulse }) => (
    <button onClick={onClick} disabled={disabled} className={`${color} w-full py-3 rounded-xl shadow-[0_4px_0_rgba(0,0,0,0.3)] text-white font-bold text-xs uppercase tracking-wide border-b-4 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group ${pulse ? 'animate-pulse' : ''}`}>
      <span className="relative z-10">{label}</span>{subLabel && <span className="block text-[8px] opacity-80 relative z-10">{subLabel}</span>}
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </button>
);

interface MoveButtonProps { move: PokemonMove; onClick: () => void; disabled: boolean; type: string; }
const MoveButton: React.FC<MoveButtonProps> = ({ move, onClick, disabled, type }) => {
  const color = TYPE_COLORS[type.toLowerCase()] || '#777';
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      style={{ backgroundColor: color, borderColor: `${color}88` }}
      className="w-full py-3 md:py-4 rounded-xl shadow-[0_4px_0_rgba(0,0,0,0.3)] text-white font-bold text-[10px] md:text-xs uppercase border-b-4 active:border-b-0 active:translate-y-1 transition-all"
    >
      <div className="flex flex-col items-center">
        <span>{move.name.replace('-', ' ')}</span>
        <span className="text-[8px] opacity-80">{type}</span>
      </div>
    </button>
  );
};

const MoveVFX = ({ vfx }: { vfx: NonNullable<BattleState['vfx']> }) => {
    const { type, target, index, damage, isCrit, isMiss, isSuperEffective, isNotVeryEffective } = vfx;
    const colors: Record<string, string> = {
        fire: 'bg-red-600',
        water: 'bg-blue-500',
        electric: 'bg-yellow-400',
        grass: 'bg-green-500',
        ice: 'bg-blue-200',
        fighting: 'bg-orange-800',
        normal: 'bg-white',
        poison: 'bg-purple-600',
        psychic: 'bg-pink-500',
        ghost: 'bg-violet-800',
        dragon: 'bg-indigo-700',
        steel: 'bg-slate-400',
        fairy: 'bg-pink-300',
        bug: 'bg-lime-500',
        rock: 'bg-stone-600',
        ground: 'bg-amber-700',
        flying: 'bg-sky-300',
        'stat-up': 'bg-red-500',
        'stat-down': 'bg-blue-500',
        burn: 'bg-red-600',
        freeze: 'bg-blue-300',
        paralysis: 'bg-yellow-400',
        poison_status: 'bg-purple-600',
        sleep: 'bg-gray-400'
    };

    if (damage !== undefined) {
        return (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100]">
                <motion.div
                    initial={{ y: 0, opacity: 0, scale: 0.5 }}
                    animate={{ y: -100, opacity: [0, 1, 1, 0], scale: [0.5, 1.5, 1.5, 1] }}
                    transition={{ duration: 1, times: [0, 0.2, 0.8, 1] }}
                    className="flex flex-col items-center"
                >
                    {isCrit && (
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                            className="text-yellow-400 font-black text-xl uppercase italic drop-shadow-md mb-1"
                        >
                            CRITICAL HIT!
                        </motion.div>
                    )}
                    <div className={`text-6xl font-black italic ${isCrit ? 'text-yellow-400 scale-125' : 'text-white'} drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]`}>
                        {damage}
                    </div>
                    <div className="flex gap-2 mt-2">
                        {isSuperEffective && <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">Super Effective!</span>}
                        {isNotVeryEffective && <span className="bg-gray-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">Not very effective...</span>}
                    </div>
                </motion.div>
            </div>
        );
    }

    if (isMiss) {
        return (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100]">
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 20, opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8 }}
                    className="text-4xl font-black text-gray-400 uppercase italic drop-shadow-lg"
                >
                    MISS!
                </motion.div>
            </div>
        );
    }

    if (type === 'stat-up' || type === 'stat-down') {
        return (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                    initial={{ y: type === 'stat-up' ? 20 : -20, opacity: 0, scale: 0.5 }}
                    animate={{ y: type === 'stat-up' ? -40 : 40, opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col items-center"
                >
                    <div className={`text-4xl font-black ${type === 'stat-up' ? 'text-red-500' : 'text-blue-500'} drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]`}>
                        {type === 'stat-up' ? '▲▲▲' : '▼▼▼'}
                    </div>
                </motion.div>
            </div>
        );
    }

    if (['burn', 'freeze', 'paralysis', 'poison_status', 'sleep'].includes(type)) {
        return (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [1, 2.5, 0], opacity: [0, 1, 0], rotate: [0, 180, 360] }}
                    transition={{ duration: 1 }}
                    className={`w-32 h-32 rounded-full blur-2xl ${colors[type] || 'bg-white'} opacity-60`}
                />
                <motion.div
                    initial={{ y: 0, opacity: 0 }}
                    animate={{ y: -50, opacity: [0, 1, 0] }}
                    transition={{ duration: 1 }}
                    className="absolute text-2xl font-black uppercase italic text-white drop-shadow-lg"
                >
                    {type.replace('_status', '').toUpperCase()}!
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 2, 0], opacity: [1, 0.8, 0] }}
            transition={{ duration: 0.5 }}
            className={`absolute z-50 w-32 h-32 rounded-full blur-xl ${colors[type] || 'bg-white'}`}
        />
    );
};

const EmoteOverlay = ({ emote }: { emote: string | null }) => { if (!emote) return null; return <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-50 animate-bounce text-6xl">{emote}</div>; };

const SyncGauge = ({ value, label, color }: { value: number, label: string, color: 'yellow' | 'red' }) => {
    const safeValue = isNaN(value) ? 0 : value;
    const isFull = safeValue >= 100;

    return (
        <div className="relative z-50 pointer-events-none mb-1">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
            >
                <AnimatePresence>
                    {isFull && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.1, 1] }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className={`absolute -inset-6 ${color === 'yellow' ? 'bg-yellow-500/20' : 'bg-red-500/20'} blur-3xl rounded-full`}
                        />
                    )}
                </AnimatePresence>
                
                <div className={`p-2 transition-all duration-500 min-w-[180px]`}>
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${color === 'yellow' ? 'bg-yellow-400 text-black' : 'bg-red-600 text-white'} shadow-lg border border-white/20 transform -rotate-2`}>
                                <span className="text-[10px] font-black italic">S</span>
                            </div>
                            <div className="flex flex-col">
                                <motion.span 
                                    animate={isFull ? { scale: [1, 1.05, 1] } : {}}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className={`text-[9px] font-black uppercase tracking-[0.2em] ${color === 'yellow' ? 'text-yellow-400' : 'text-red-400'} drop-shadow-[0_2px_4px_rgba(0,0,0,1)]`}
                                >
                                    {label}
                                </motion.span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[7px] text-white/60 font-bold tracking-widest uppercase drop-shadow-md">Sync Link</span>
                                    <div className={`h-[1px] w-8 ${color === 'yellow' ? 'bg-yellow-400/20' : 'bg-red-400/20'}`}></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1 px-1">
                            <motion.span 
                                key={Math.floor(safeValue)}
                                initial={{ y: -5, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className={`text-lg font-black ${color === 'yellow' ? 'text-yellow-400' : 'text-red-400'} italic tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,1)]`}
                            >
                                {Math.floor(safeValue)}
                            </motion.span>
                            <span className={`text-[8px] font-bold ${color === 'yellow' ? 'text-yellow-500' : 'text-red-500'} drop-shadow-md`}>%</span>
                        </div>
                    </div>
                    
                    <div className="relative h-3 bg-black/40 backdrop-blur-sm rounded-full overflow-hidden border border-white/10 p-[1.5px] shadow-lg">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${safeValue}%` }}
                            transition={{ type: 'spring', stiffness: 40, damping: 12 }}
                            className={`h-full rounded-full relative overflow-hidden
                                ${isFull 
                                    ? (color === 'yellow' ? 'bg-gradient-to-r from-yellow-400 via-orange-300 to-white' : 'bg-gradient-to-r from-red-600 via-red-400 to-white') 
                                    : (color === 'yellow' ? 'bg-gradient-to-r from-yellow-600 to-orange-500' : 'bg-gradient-to-r from-red-800 to-red-500')
                                }`}
                        >
                            <motion.div 
                                animate={{ x: ['-100%', '400%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-1/4 skew-x-[45deg]"
                            />
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const MetaMenu = ({ state, setState, onBack }: { state: PlayerGlobalState, setState: React.Dispatch<React.SetStateAction<PlayerGlobalState>>, onBack: () => void }) => {
    const upgrades = [
        { id: 'startingMoney', name: 'Amulet Coin', desc: 'Start with more money', cost: 5, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/amulet-coin.png' },
        { id: 'attackBoost', name: 'Muscle Band', desc: '+5% Damage per level', cost: 10, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/muscle-band.png' },
        { id: 'defenseBoost', name: 'Focus Band', desc: '-5% Damage taken per level', cost: 10, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/focus-band.png' },
        { id: 'speedBoost', name: 'Swift Wing', desc: '+5% Speed per level', cost: 10, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/swift-wing.png' },
        { id: 'critBoost', name: 'Scope Lens', desc: '+2% Crit chance per level', cost: 15, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/scope-lens.png' },
        { id: 'healingBoost', name: 'Shell Bell', desc: '+5% Healing effectiveness', cost: 12, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/shell-bell.png' },
        { id: 'xpMultiplier', name: 'Lucky Egg', desc: 'Earn more XP from battles', cost: 8, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lucky-egg.png' },
        { id: 'startingPermits', name: 'Permit Bag', desc: 'Start with more Capture Permits', cost: 15, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png' },
        { id: 'captureBoost', name: 'Catching Charm', desc: '+5% Catch rate per level', cost: 15, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/catching-charm.png' },
        { id: 'essenceMultiplier', name: 'Relic Gold', desc: '+10% Essence earned per level', cost: 20, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/relic-gold.png' },
        { id: 'shinyChance', name: 'Shiny Charm', desc: 'Higher shiny encounter rate', cost: 12, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/shiny-charm.png' },
        { id: 'lootQuality', name: 'Dowsing Machine', desc: 'Better items from battle drops', cost: 10, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dowsing-machine.png' },
        { id: 'riftStability', name: 'Timer Ball', desc: 'Slower overworld level scaling', cost: 20, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/timer-ball.png' },
        { id: 'mercenaryGuild', name: 'Choice Band', desc: 'Start with random held items', cost: 15, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/choice-band.png' },
        { id: 'evolutionaryInsight', name: 'Member Card', desc: 'Cheaper items in all shops', cost: 12, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/member-card.png' },
    ];

    const getUpgradeCost = (baseCost: number, level: number) => {
        return Math.floor(baseCost * Math.pow(1.6, level));
    };

    const packs = [
        { id: 'sinnoh', name: 'Sinnoh Pack', desc: 'Unlock Turtwig, Chimchar, Piplup', cost: 25, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lunar-wing.png' },
        { id: 'johto', name: 'Johto Pack', desc: 'Unlock Chikorita, Cyndaquil, Totodile', cost: 25, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rainbow-wing.png' },
        { id: 'hoenn', name: 'Hoenn Pack', desc: 'Unlock Treecko, Torchic, Mudkip', cost: 25, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/red-orb.png' },
        { id: 'pseudo', name: 'Dragon Den', desc: 'Unlock Dratini, Larvitar, Bagon', cost: 50, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dragon-fang.png' },
        { id: 'mythic', name: 'Mythical Rift', desc: 'Unlock Mew, Celebi, Jirachi', cost: 100, icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/azure-flute.png' },
    ];

    const buyUpgrade = (id: string, cost: number) => {
        if (state.meta.riftEssence < cost) return;
        setState(prev => ({
            ...prev,
            meta: {
                ...prev.meta,
                riftEssence: prev.meta.riftEssence - cost,
                upgrades: {
                    ...prev.meta.upgrades,
                    [id]: (prev.meta.upgrades[id as keyof typeof prev.meta.upgrades] || 0) + 1
                }
            }
        }));
        playSound('levelUp');
    };

    const buyPack = (id: string, cost: number) => {
        if (state.meta.riftEssence < cost || state.meta.unlockedPacks.includes(id)) return;
        setState(prev => ({
            ...prev,
            meta: {
                ...prev.meta,
                riftEssence: prev.meta.riftEssence - cost,
                unlockedPacks: [...prev.meta.unlockedPacks, id]
            }
        }));
        playSound('levelUp');
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans flex flex-col items-center overflow-y-auto relative">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#3b0764_0%,transparent_70%)]"></div>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full animate-pulse delay-700"></div>
            </div>

            <div className="max-w-6xl w-full z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                            Rift Upgrades
                        </h2>
                        <p className="text-gray-500 text-xs md:text-sm mt-2 uppercase tracking-[0.3em] font-bold">Temporal Enhancement Terminal</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                            <span className="text-xl">💎</span>
                        </div>
                        <div>
                            <div className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Available Essence</div>
                            <div className="text-2xl font-mono font-bold">{state.meta.riftEssence}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Upgrades Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
                            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/40">Permanent Enhancements</h3>
                            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {upgrades.map(u => {
                                const level = state.meta.upgrades[u.id as keyof typeof state.meta.upgrades] || 0;
                                const currentCost = getUpgradeCost(u.cost, level);
                                const canAfford = state.meta.riftEssence >= currentCost;

                                return (
                                    <div key={u.id} className="group relative bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl overflow-hidden">
                                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <img src={u.icon} alt="" className="w-16 h-16 grayscale" referrerPolicy="no-referrer" />
                                        </div>
                                        
                                        <div className="flex items-start gap-4 relative z-10">
                                            <div className="w-14 h-14 bg-black/40 rounded-xl flex items-center justify-center border border-white/5 shadow-inner p-2">
                                                <img src={u.icon} alt={u.name} className="w-10 h-10 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" referrerPolicy="no-referrer" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-sm font-black uppercase tracking-tight text-white group-hover:text-purple-400 transition-colors">{u.name}</h4>
                                                    <span className="text-[10px] font-mono font-bold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded">LVL {level}</span>
                                                </div>
                                                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{u.desc}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex items-center justify-between gap-4 relative z-10">
                                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${Math.min(100, (level / 10) * 100)}%` }}></div>
                                            </div>
                                            <button 
                                                onClick={() => buyUpgrade(u.id, currentCost)}
                                                disabled={!canAfford}
                                                className={`
                                                    px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all
                                                    ${canAfford 
                                                        ? 'bg-white text-black hover:bg-purple-400 hover:text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                                                        : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'}
                                                `}
                                            >
                                                {currentCost} <span className="text-[8px]">ESSENCE</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Packs Column */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
                            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/40">Starter Packs</h3>
                            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
                        </div>

                        <div className="space-y-4">
                            {packs.map(p => {
                                const isUnlocked = state.meta.unlockedPacks.includes(p.id);
                                const canAfford = state.meta.riftEssence >= p.cost;

                                return (
                                    <div key={p.id} className={`
                                        group relative overflow-hidden rounded-2xl border transition-all duration-500
                                        ${isUnlocked 
                                            ? 'bg-emerald-500/10 border-emerald-500/30' 
                                            : 'bg-white/5 border-white/10 hover:border-white/30'}
                                    `}>
                                        <div className="p-5 flex items-center gap-4">
                                            <div className={`
                                                w-16 h-16 rounded-2xl flex items-center justify-center p-3 transition-transform duration-500 group-hover:scale-110
                                                ${isUnlocked ? 'bg-emerald-500/20' : 'bg-black/40'}
                                            `}>
                                                <img src={p.icon} alt={p.name} className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`text-sm font-black uppercase tracking-tight ${isUnlocked ? 'text-emerald-400' : 'text-white'}`}>{p.name}</h4>
                                                <p className="text-[10px] text-gray-500 mt-1">{p.desc}</p>
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => buyPack(p.id, p.cost)}
                                            disabled={isUnlocked || !canAfford}
                                            className={`
                                                w-full py-3 text-[10px] font-black uppercase tracking-widest transition-all
                                                ${isUnlocked 
                                                    ? 'bg-emerald-500/20 text-emerald-400 cursor-default' 
                                                    : canAfford 
                                                        ? 'bg-white text-black hover:bg-emerald-400 hover:text-white' 
                                                        : 'bg-white/5 text-white/20 cursor-not-allowed'}
                                            `}
                                        >
                                            {isUnlocked ? '✓ Unlocked' : `Unlock for ${p.cost} Essence`}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-16 flex justify-center">
                    <button 
                        onClick={onBack} 
                        className="group relative px-12 py-4 bg-white text-black font-black uppercase tracking-[0.3em] text-xs hover:bg-purple-500 hover:text-white transition-all rounded-full overflow-hidden shadow-2xl"
                    >
                        <span className="relative z-10">Return to Terminal</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </button>
                </div>
            </div>
        </div>
    );
};

const MAIN_QUESTS = [
    { id: 'q1', title: 'The First Step', desc: 'Reach distance 10 from the origin.', target: 10, type: 'distance' },
    { id: 'q2', title: 'Badge Collector', desc: 'Defeat a Gym Leader and earn your first badge.', target: 1, type: 'badges' },
    { id: 'q3', title: 'Rift Explorer', desc: 'Reach distance 50 from the origin.', target: 50, type: 'distance' },
    { id: 'q4', title: 'Elite Trainer', desc: 'Collect 4 badges to prove your strength.', target: 4, type: 'badges' },
    { id: 'q5', title: 'Master of the Rift', desc: 'Collect all 8 badges and reach distance 100.', target: 8, type: 'badges' },
    { id: 'q6', title: 'Legendary Hunter', desc: 'Reach distance 200 and find a Legendary Pokemon.', target: 200, type: 'distance' },
    { id: 'q7', title: 'Rift Conqueror', desc: 'Reach distance 500. The ultimate challenge.', target: 500, type: 'distance' },
    { id: 'q8', title: 'Infinite Voyager', desc: 'Reach distance 1000. Become a legend.', target: 1000, type: 'distance' },
];

const QuestLog = ({ state }: { state: PlayerGlobalState }) => {
    const distance = Math.floor(Math.sqrt(state.chunkPos.x ** 2 + state.chunkPos.y ** 2));
    
    const currentQuest = MAIN_QUESTS.find(q => q.id === state.meta.mainQuestProgress.currentQuestId) || MAIN_QUESTS[0];
    const questValue = currentQuest.type === 'distance' ? distance : state.badges;
    const progress = Math.min(100, (questValue / currentQuest.target) * 100);

    return (
        <div className="absolute bottom-6 right-6 z-40 w-72 bg-black/60 backdrop-blur-xl border border-white/10 p-5 rounded-3xl text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden group">
            {/* Animated Scanning Line */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-[scan_3s_linear_infinite] opacity-50"></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]"></div>
                        <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Main Quest</h3>
                    </div>
                    <div className="text-[8px] font-mono text-white/40">ID: {currentQuest.id}</div>
                </div>

                <div className="space-y-4">
                    <div>
                        <div className="text-xs font-black uppercase tracking-tight mb-1">{currentQuest.title}</div>
                        <div className="text-[9px] text-gray-400 leading-relaxed uppercase font-bold tracking-wider italic">{currentQuest.desc}</div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <div className="text-[10px] font-mono font-bold text-blue-400">
                                {questValue} / {currentQuest.target} 
                                <span className="text-[8px] text-gray-600 ml-1">{currentQuest.type.toUpperCase()}</span>
                            </div>
                            <div className="text-[10px] font-mono font-bold">{Math.floor(progress)}%</div>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                            <div className="text-[8px] font-black uppercase text-gray-500 mb-1">Total Badges</div>
                            <div className="text-xs font-mono font-bold text-yellow-400">{state.badges} / 8</div>
                        </div>
                        <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                            <div className="text-[8px] font-black uppercase text-gray-500 mb-1">Rift Depth</div>
                            <div className="text-xs font-mono font-bold text-blue-400">{distance}m</div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes scan {
                    0% { transform: translateY(0); opacity: 0; }
                    50% { opacity: 0.5; }
                    100% { transform: translateY(160px); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

const PerkSelect = ({ onSelect }: { onSelect: (perk: string) => void }) => {
    const perks = [
        { id: 'vampirism', name: 'Vampirism', desc: 'Heal 10% HP on every hit', icon: '🧛' },
        { id: 'swiftness', name: 'Swiftness', desc: 'Permanent +1 Speed in battle', icon: '👟' },
        { id: 'scholar', name: 'Scholar', desc: 'Double XP from all sources', icon: '🎓' },
        { id: 'juggernaut', name: 'Juggernaut', desc: '+20% Max HP for all team', icon: '🛡️' },
        { id: 'berserker', name: 'Berserker', desc: '+20% Damage when below 50% HP', icon: '🪓' },
    ];

    // Pick 3 random perks
    const [choices] = useState(() => {
        const shuffled = [...perks].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    });

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="max-w-5xl w-full">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-7xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-yellow-600">
                        Rift Anomaly Detected
                    </h2>
                    <p className="text-gray-500 text-xs md:text-sm uppercase tracking-[0.5em] font-black mt-4">Select a Temporal Perk</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {choices.map((p, i) => (
                        <motion.button
                            key={p.id}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => onSelect(p.id)}
                            className="group relative bg-white/5 border border-white/10 rounded-[2rem] p-10 text-center transition-all duration-500 hover:bg-white/10 hover:border-yellow-400/50 hover:scale-105 hover:shadow-[0_0_50px_rgba(234,179,8,0.2)] overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="text-7xl mb-8 transform group-hover:scale-110 transition-transform duration-500">{p.icon}</div>
                            <div className="text-2xl font-black text-white mb-4 uppercase tracking-tighter group-hover:text-yellow-400 transition-colors">{p.name}</div>
                            <div className="text-xs text-gray-500 leading-relaxed font-medium">{p.desc}</div>
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const OnlineMenu = ({ onBack, onStartGame }: { onBack: () => void, onStartGame: () => void }) => {
     const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
    const [roomId, setRoomId] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const generateRoomId = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setRoomId(result);
    };

    const joinRoom = async () => {
        if (roomId.length < 4) { setErrorMsg("Enter valid room ID."); return; }
        setStatus('connecting');
        setErrorMsg('');
        try {
            await multiplayer.initialize(roomId.toUpperCase());
            setStatus('connected');
            onStartGame();
        } catch (e) { 
            setErrorMsg('Connection failed. Server might be down.'); 
            setStatus('idle'); 
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white p-4 md:p-12 font-sans flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e3a8a_0%,transparent_70%)]"></div>
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full animate-pulse"></div>
            </div>

            <div className="max-w-md w-full z-10 bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                        Multiplayer
                    </h2>
                    <p className="text-gray-500 text-[10px] uppercase tracking-[0.4em] font-bold mt-2">Rift Synchronization Terminal</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Room ID</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                                placeholder="ENTER CODE"
                                className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-center text-xl font-mono font-bold tracking-[0.5em] focus:outline-none focus:border-blue-500 transition-colors"
                            />
                            <button 
                                onClick={generateRoomId}
                                className="w-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-xl transition-all"
                            >
                                🎲
                            </button>
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase p-3 rounded-xl text-center">
                            {errorMsg}
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={joinRoom}
                            disabled={status === 'connecting' || roomId.length < 4}
                            className={`
                                w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg
                                ${status === 'connecting' || roomId.length < 4
                                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'}
                            `}
                        >
                            {status === 'connecting' ? 'Syncing...' : 'Connect to Rift'}
                        </button>
                        <button 
                            onClick={onBack}
                            className="w-full py-4 text-gray-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                        >
                            Return to Menu
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ShopMenu = ({ onClose, money, inventory, onBuy, discount = 0 }: { onClose: () => void, money: number, inventory: any, onBuy: (item: string, price: number) => void, discount?: number }) => {
    const [activeTab, setActiveTab] = useState<'all' | 'pokeball' | 'healing' | 'battle' | 'evolution'>('all');
    
    const shopItems = Object.values(ITEMS).map(item => ({
        ...item,
        price: Math.floor(item.price * (1 - discount))
    })).filter(item => activeTab === 'all' || item.category === activeTab);

    return (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-8">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-4xl text-white flex flex-col h-[85vh] shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/5 blur-[100px] rounded-full -ml-32 -mb-32"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 relative z-10">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                            Poké Mart
                        </h2>
                        <p className="text-gray-500 text-[10px] uppercase tracking-[0.4em] font-bold mt-2">Authorized Supply Terminal</p>
                    </div>
                    
                    <div className="bg-white/5 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/10 flex items-center gap-4">
                        <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                            <span className="text-xl">💰</span>
                        </div>
                        <div>
                            <div className="text-[10px] text-yellow-500 font-black uppercase tracking-widest">Credits</div>
                            <div className="text-2xl font-mono font-bold">${money}</div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide relative z-10">
                    {['all', 'pokeball', 'healing', 'battle', 'evolution'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all border ${
                                activeTab === tab 
                                ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                                : 'bg-white/5 border-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                    {shopItems.map(item => (
                        <button 
                            key={item.id}
                            onClick={() => onBuy(item.id, item.price)}
                            disabled={money < item.price}
                            className={`group relative p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between overflow-hidden ${
                                money >= item.price 
                                ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]' 
                                : 'bg-white/5 border-white/5 opacity-40 cursor-not-allowed'
                            }`}
                        >
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-16 h-16 bg-black/40 rounded-xl flex items-center justify-center p-3 border border-white/5 group-hover:scale-110 transition-transform duration-500">
                                    <img src={item.icon} className="w-12 h-12 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" alt={item.name} referrerPolicy="no-referrer" />
                                </div>
                                <div className="text-left">
                                    <div className="font-black uppercase text-xs tracking-tight group-hover:text-blue-400 transition-colors">{item.name}</div>
                                    <div className="text-[9px] text-gray-500 max-w-[180px] leading-relaxed mt-1 line-clamp-2">{item.description}</div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="text-[8px] font-black uppercase text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
                                            Owned: {
                                                item.id === 'poke-ball' ? inventory.pokeballs : 
                                                item.id === 'potion' ? inventory.potions : 
                                                item.id === 'revive' ? inventory.revives :
                                                item.id === 'rare-candy' ? inventory.rare_candy :
                                                inventory.items.filter((i: string) => i === item.id).length
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right relative z-10">
                                <div className="text-xl font-mono font-bold text-white group-hover:text-yellow-400 transition-colors">${item.price}</div>
                                <div className="text-[8px] font-black uppercase text-gray-600 mt-1">Purchase</div>
                            </div>

                            {/* Hover Background Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-blue-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </button>
                    ))}
                </div>
                
                <div className="mt-8 flex justify-center relative z-10">
                    <button 
                        onClick={onClose} 
                        className="group relative px-16 py-4 bg-white text-black font-black uppercase tracking-[0.4em] text-xs hover:bg-red-600 hover:text-white transition-all rounded-full overflow-hidden shadow-2xl"
                    >
                        <span className="relative z-10">Close Terminal</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </button>
                </div>
            </div>
        </div>
    );
};
const PokemonSummary = ({ pokemon, inventory, upgrades, onGiveItem, onClose }: { pokemon: Pokemon, inventory: any, upgrades: MetaState['upgrades'], onGiveItem: (itemId: string) => void, onClose: () => void }) => {
    const [showItemPicker, setShowItemPicker] = useState(false);
    
    const getBoostedStat = (key: keyof StatBlock, value: number) => {
        if (key === 'attack' || key === 'special-attack') return Math.floor(value * (1 + (upgrades.attackBoost * 0.05)));
        if (key === 'defense' || key === 'special-defense') return Math.floor(value * (1 + (upgrades.defenseBoost * 0.05)));
        if (key === 'speed') return Math.floor(value * (1 + (upgrades.speedBoost * 0.05)));
        return value;
    };

    const stats: { label: string, key: keyof StatBlock }[] = [
        { label: 'HP', key: 'hp' },
        { label: 'ATK', key: 'attack' },
        { label: 'DEF', key: 'defense' },
        { label: 'SPA', key: 'special-attack' },
        { label: 'SPD', key: 'special-defense' },
        { label: 'SPE', key: 'speed' },
    ];

    const battleItems = inventory.items.filter((id: string) => ITEMS[id]?.category === 'battle' || ITEMS[id]?.category === 'healing' || ITEMS[id]?.category === 'evolution');
    if (inventory.potions > 0) {
        battleItems.push('potion');
    }
    if (inventory.revives > 0) {
        battleItems.push('revive');
    }
    if (inventory.rare_candy > 0) {
        battleItems.push('rare-candy');
    }

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
                                <div className="text-xs uppercase">{pokemon.ability.name.replace('-', ' ')}</div>
                                {pokemon.ability.isHidden && <div className="text-[8px] text-purple-400 mt-1">HIDDEN ABILITY</div>}
                                {pokemon.ability.description && <div className="text-[7px] text-gray-400 mt-1 leading-tight">{pokemon.ability.description}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm text-blue-400 mb-4 border-b border-blue-400/30 pb-1">MOVES</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {pokemon.moves.map((m, i) => (
                            <div key={i} className="bg-gray-700/50 p-3 rounded border border-white/10 flex justify-between items-center">
                                <div>
                                    <div className="text-xs uppercase font-bold">{m.name.replace('-', ' ')}</div>
                                    <div className="flex gap-2 mt-1">
                                        <span style={{ backgroundColor: TYPE_COLORS[m.type || 'normal'] }} className="px-1.5 py-0.5 rounded text-[6px] uppercase font-bold">
                                            {m.type}
                                        </span>
                                        <span className="text-[6px] text-gray-400 uppercase">{m.damage_class}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[8px] text-gray-400">PWR: {m.power || '--'}</div>
                                    <div className="text-[8px] text-gray-400">ACC: {m.accuracy || '--'}</div>
                                    <div className="text-[8px] text-gray-400">PP: {m.pp}/{m.pp}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={onClose} className="w-full py-4 bg-white text-black mt-8 hover:bg-yellow-400 transition-colors uppercase font-bold">CLOSE SUMMARY</button>
            </div>
        </div>
    );
};

const PauseMenu = ({ onClose, state, onSwap, onGiveItem }: any) => {
    const [selectedMon, setSelectedMon] = useState<Pokemon | null>(null);
    const [activeTab, setActiveTab] = useState<'party' | 'items'>('party');

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

// Utility for async delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function App() {
  console.log('App Rendering: Start');
  const [phase, setPhase] = useState<GamePhase>(GamePhase.MENU);
  const [playerState, setPlayerState] = useState<PlayerGlobalState>({
      name: 'Jonathan', // Default name from user email
      // Start at 9,9 (Center of room) to avoid spawning in wall
      team: [], position: { x: 9, y: 9 }, p2Position: { x: 10, y: 9 }, mapId: 'house_player',
      chunkPos: { x: 0, y: 0 },
      money: 500, badges: 0, inventory: { pokeballs: 0, potions: 5, revives: 2, rare_candy: 0, items: [] as string[] }, defeatedTrainers: [], storyFlags: [],
      discoveredChunks: [], discoveryPoints: 0,
      meta: {
          riftEssence: 0,
          unlockedStarters: [1, 4, 7, 25, 133],
          unlockedPacks: [],
          mainQuestProgress: {
              currentQuestId: 'q1',
              completedQuests: []
          },
          upgrades: {
              startingMoney: 0,
              attackBoost: 0,
              defenseBoost: 0,
              xpMultiplier: 0,
              startingPermits: 0,
              shinyChance: 0,
              lootQuality: 0,
              riftStability: 0,
              mercenaryGuild: 0,
              evolutionaryInsight: 0,
              speedBoost: 0,
              critBoost: 0,
              healingBoost: 0,
              captureBoost: 0,
              essenceMultiplier: 0
          }
      },
      run: {
          isNuzlocke: true,
          capturePermits: 2, // Start with 2 permits
          totalCaptures: 0,
          hasDied: false,
          distanceReached: 0,
          maxDistanceReached: 0,
          badgesEarned: 0,
          perks: []
      }
  });
  const [battleState, setBattleState] = useState<BattleState>({
    playerTeam: [], 
    enemyTeam: [], 
    turn: 1, 
    phase: 'loading', 
    logs: [], 
    pendingMoves: [],
    activePlayerIndex: 0, 
    comboMeter: 0, 
    enemyComboMeter: 0,
    ui: { selectionMode: 'MOVE', selectedMove: null },
    isTrainerBattle: false, 
    weather: 'none',
    terrain: 'none',
    playerHazards: [],
    enemyHazards: [],
    reflectTurns: 0,
    enemyReflectTurns: 0,
    lightScreenTurns: 0,
    enemyLightScreenTurns: 0,
    auroraVeilTurns: 0,
    enemyAuroraVeilTurns: 0,
    backgroundUrl: undefined,
    battleStreak: 0
  });
  const [caveLayouts, setCaveLayouts] = useState<Record<string, number[][]>>({});
  const [riftLayout, setRiftLayout] = useState<number[][] | null>(null);
  const [loadedChunks, setLoadedChunks] = useState<Record<string, any>>({});
  const [isPaused, setIsPaused] = useState(false);
  const [networkRole, setNetworkRole] = useState<'none' | 'host' | 'client'>('none');
  const [currentEmote, setCurrentEmote] = useState<string | null>(null);
  const [comboVfx, setComboVfx] = useState<boolean>(false);
  const [dialogue, setDialogue] = useState<string[] | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanCooldown, setScanCooldown] = useState(0);
  // Using a beautiful atmospheric gradient to avoid "real-life" photo issues and ensure it works for everyone
  const [menuBgUrl] = useState<string>('');

  const [challengeState, setChallengeState] = useState<{
      type: 'speed' | 'stealth' | 'none';
      endTime?: number;
      npcId?: string;
      isActive: boolean;
  }>({ type: 'none', isActive: false });

  const battleStateRef = useRef<BattleState | null>(null);
  const networkRoleRef = useRef<'none' | 'host' | 'client'>('none');
  const phaseRef = useRef<GamePhase>(GamePhase.MENU);
  const isHostRef = useRef(false);

  const [remotePlayers, setRemotePlayers] = useState<Map<string, any>>(new Map());
  const [battleChallenge, setBattleChallenge] = useState<{ challengerId: string, playerInfo: any } | null>(null);
  const [isMultiplayerBattle, setIsMultiplayerBattle] = useState(false);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [battleId, setBattleId] = useState<string | null>(null);
  const [isBattleLead, setIsBattleLead] = useState(false);
  const [remoteBattleActions, setRemoteBattleActions] = useState<any[]>([]);
  const [currentWeather, setCurrentWeather] = useState<WeatherType>('none');
  async function handleGiveItem(pokemon: Pokemon, itemId: string) {
      const item = ITEMS[itemId];
      if (!item) return;

      if (item.category === 'healing' || item.id === 'rare-candy') {
          let evolvedMon: Pokemon | null = null;
          
          setPlayerState(prev => {
              const newTeam = [...prev.team];
              const monIdx = newTeam.findIndex(p => p.id === pokemon.id && p.name === pokemon.name);
              if (monIdx === -1) return prev;

              const p = { ...newTeam[monIdx] };
              let newHp = p.currentHp;
              let newStatus = p.status;
              let leveledUp = false;
              
              if (itemId === 'potion') newHp = Math.min(p.maxHp, p.currentHp + 20);
              else if (itemId === 'super-potion') newHp = Math.min(p.maxHp, p.currentHp + 60);
              else if (itemId === 'hyper-potion') newHp = Math.min(p.maxHp, p.currentHp + 120);
              else if (itemId === 'max-potion') newHp = p.maxHp;
              else if (itemId === 'full-restore') { newHp = p.maxHp; newStatus = undefined; }
              else if (itemId === 'full-heal') { newStatus = undefined; }
              else if (itemId === 'revive' && p.isFainted) { newHp = Math.floor(p.maxHp / 2); p.isFainted = false; }
              else if (itemId === 'rare-candy') {
                  p.level = Math.min(100, p.level + 1);
                  p.stats = calculateStatsFull(p.baseStats, p.ivs, p.evs, p.level, p.nature);
                  p.maxHp = p.stats.hp;
                  p.currentHp = p.maxHp;
                  leveledUp = true;
              }
              
              p.currentHp = newHp;
              p.status = newStatus;
              newTeam[monIdx] = p;
              
              const newInventory = { ...prev.inventory };
              if (itemId === 'potion') newInventory.potions = Math.max(0, newInventory.potions - 1);
              else if (itemId === 'revive') newInventory.revives = Math.max(0, newInventory.revives - 1);
              else if (itemId === 'rare-candy') newInventory.rare_candy = Math.max(0, newInventory.rare_candy - 1);
              else {
                  const idx = newInventory.items.indexOf(itemId);
                  if (idx > -1) {
                      const updatedItems = [...newInventory.items];
                      updatedItems.splice(idx, 1);
                      newInventory.items = updatedItems;
                  }
              }
              
              return { ...prev, team: newTeam, inventory: newInventory };
          });

          playSound('levelUp');
          
          // Check for level-up evolution if rare candy was used
          if (itemId === 'rare-candy') {
              const canEvolve = await checkEvolution(pokemon);
              if (canEvolve) {
                  const evo = await evolvePokemon(pokemon);
                  setPlayerState(prev => ({
                      ...prev,
                      team: prev.team.map(p => p.id === pokemon.id ? evo : p)
                  }));
                  setDialogue([`${pokemon.name} evolved into ${evo.name}!`]);
              }
          }
          return;
      }

      if (item.category === 'evolution') {
          const targetId = await getEvolutionTarget(pokemon, itemId);
          if (targetId) {
              const evo = await evolvePokemon(pokemon, itemId); 
              
              setPlayerState(prev => {
                  const newInventory = { ...prev.inventory };
                  const idx = newInventory.items.indexOf(itemId);
                  if (idx > -1) {
                      const updatedItems = [...newInventory.items];
                      updatedItems.splice(idx, 1);
                      newInventory.items = updatedItems;
                  }
                  return {
                      ...prev,
                      team: prev.team.map(p => p.id === pokemon.id ? evo : p),
                      inventory: newInventory
                  };
              });
              playSound('levelUp');
              setDialogue([`${pokemon.name} evolved into ${evo.name}!`]);
          } else {
              setDialogue([`It had no effect...`]);
          }
          return;
      }

      setPlayerState(prev => {
          const newTeam = prev.team.map(p => {
              if (p.id === pokemon.id && p.name === pokemon.name) {
                  const oldItem = p.heldItem;
                  const newItem = itemId ? { id: itemId, name: ITEMS[itemId].name } : undefined;
                  
                  // Return old item to inventory if any
                  const newItems = [...prev.inventory.items];
                  if (oldItem) newItems.push(oldItem.id);
                  // Remove new item from inventory
                  if (itemId) {
                      const idx = newItems.indexOf(itemId);
                      if (idx > -1) newItems.splice(idx, 1);
                  }
                  
                  return { ...p, heldItem: newItem };
              }
              return p;
          });
          
          // Also update inventory
          const newInventory = { ...prev.inventory };
          const oldItem = pokemon.heldItem;
          if (oldItem) newInventory.items = [...newInventory.items, oldItem.id];
          if (itemId) {
              const idx = newInventory.items.indexOf(itemId);
              if (idx > -1) {
                  const updatedItems = [...newInventory.items];
                  updatedItems.splice(idx, 1);
                  newInventory.items = updatedItems;
              }
          }

          return { ...prev, team: newTeam, inventory: newInventory };
      });
      playSound('levelUp');
  };




  function handleScan() {
    if (scanCooldown > 0) return;
    setIsScanning(true);
    setScanCooldown(15); // 15s cooldown
    setTimeout(() => setIsScanning(false), 5000); // 5s duration
    playSound('https://www.soundjay.com/button/sounds/button-16.mp3'); // Scan sound
    
    // Discovery Reward: Finding hidden items or points
    const roll = Math.random();
    if (roll < 0.7) { // Increased probability from 0.6 to 0.7
        const isRare = Math.random() < 0.1; // 10% chance for rare treasure
        const bonusMoney = isRare ? (Math.floor(Math.random() * 20000) + 15000) : (Math.floor(Math.random() * 10000) + 5000);
        const bonusPoints = isRare ? (Math.floor(Math.random() * 50) + 30) : (Math.floor(Math.random() * 20) + 10);
        const hasItem = Math.random() < 0.8;
        
        let itemMsg = "";
        let itemToGive: keyof typeof playerState.inventory | 'capturePermits' | 'riftEssence' | null = null;
        let countToGive = 0;

        if (hasItem) {
            const itemRoll = Math.random();
            
            if (itemRoll < 0.1) {
                itemToGive = 'rare_candy';
                countToGive = isRare ? 5 : 2;
            } else if (itemRoll < 0.3) {
                itemToGive = 'revives';
                countToGive = isRare ? 8 : 3;
            } else if (itemRoll < 0.6) {
                itemToGive = 'capturePermits';
                countToGive = isRare ? 3 : 1;
            } else {
                itemToGive = 'riftEssence';
                countToGive = isRare ? 25 : 10;
            }

            if (itemToGive === 'capturePermits') {
                itemMsg = ` and ${countToGive} CAPTURE PERMITS`;
            } else if (itemToGive === 'riftEssence') {
                itemMsg = ` and ${countToGive} RIFT ESSENCE`;
            } else {
                itemMsg = ` and ${countToGive} ${itemToGive.toUpperCase()}`;
            }
        }

        setPlayerState(prev => {
            const newInventory = { ...prev.inventory };
            let newRiftEssence = prev.meta.riftEssence;
            let newPermits = prev.run.capturePermits;

            if (itemToGive === 'capturePermits') {
                newPermits += countToGive;
            } else if (itemToGive === 'riftEssence') {
                newRiftEssence += countToGive;
            } else if (itemToGive) {
                newInventory[itemToGive] = (newInventory[itemToGive] || 0) + countToGive;
            }
            
            return { 
                ...prev, 
                money: prev.money + bonusMoney, 
                discoveryPoints: prev.discoveryPoints + bonusPoints,
                inventory: newInventory,
                meta: { ...prev.meta, riftEssence: newRiftEssence },
                run: { ...prev.run, capturePermits: newPermits },
                nextEncounterRare: isRare ? true : prev.nextEncounterRare
            };
        });
        const prefix = isRare ? "RARE DISCOVERY! " : "Scan complete! ";
        const rareMsg = isRare ? " A rare aura has been detected!" : "";
        setDialogue([prefix, `Found hidden cache: $${bonusMoney}, ${bonusPoints} Discovery Points${itemMsg}!${rareMsg}`]);
    } else {
        setDialogue(["Scan complete.", "No hidden treasures detected in the immediate vicinity."]);
    }
  };



  function startMultiplayerBattle(id: string, oppId: string, oppInfo: any, isLead: boolean) {
    setBattleId(id);
    setOpponentId(oppId);
    setIsBattleLead(isLead);
    setIsMultiplayerBattle(true);
    
    // Initialize battle state with opponent's team
    setBattleState(prev => ({
        ...prev,
        playerTeam: playerState.team,
        enemyTeam: oppInfo.team,
        isTrainerBattle: true,
        phase: 'player_input',
        logs: [`Battle started with ${oppInfo.name}!`]
    }));
    setPhase(GamePhase.BATTLE);
  };

  function handleChallengeResponse(accept: boolean) {
    if (!battleChallenge) return;
    if (accept) {
        multiplayer.send({
            type: 'BATTLE_ACCEPT',
            payload: {
                challengerId: battleChallenge.challengerId,
                acceptorInfo: { name: playerState.name, team: playerState.team },
                challengerInfo: battleChallenge.playerInfo
            }
        });
    }
    setBattleChallenge(null);
  };



  function handleRunEnd() {
      const distance = Math.floor(Math.sqrt(playerState.chunkPos.x ** 2 + playerState.chunkPos.y ** 2));
      let essenceAwarded = Math.floor(distance / 2) + (playerState.badges * 5);
      if (playerState.meta.upgrades.essenceMultiplier > 0) {
          essenceAwarded = Math.floor(essenceAwarded * (1 + playerState.meta.upgrades.essenceMultiplier * 0.1));
      }
      
      setDialogue([
          "YOUR EXPEDITION HAS ENDED.",
          `You reached a distance of ${distance} KM.`,
          `You earned ${playerState.badges} Badges.`,
          `RIFT ESSENCE EARNED: ${essenceAwarded}`
      ]);

      setPlayerState(prev => {
          const startingPermits = 2 + (prev.meta.upgrades.startingPermits || 0);
          const startingMoney = 500 + (prev.meta.upgrades.startingMoney * 1000);
          
          // Mercenary Guild: Start with random items
          const items: string[] = [];
          if (prev.meta.upgrades.mercenaryGuild > 0) {
              const pool = ['choice-band', 'life-orb', 'leftovers', 'focus-sash', 'expert-belt'];
              for (let i = 0; i < prev.meta.upgrades.mercenaryGuild; i++) {
                  items.push(pool[Math.floor(Math.random() * pool.length)]);
              }
          }

          return {
              ...prev,
              meta: {
                  ...prev.meta,
                  riftEssence: prev.meta.riftEssence + essenceAwarded
              },
              run: {
                  isNuzlocke: true,
                  capturePermits: startingPermits,
                  totalCaptures: 0,
                  hasDied: false,
                  distanceReached: 0,
                  maxDistanceReached: 0,
                  badgesEarned: 0,
                  perks: []
              },
              team: [], 
              money: startingMoney,
              badges: 0,
              chunkPos: { x: 0, y: 0 },
              position: { x: 9, y: 9 },
              mapId: 'house_player',
              inventory: { pokeballs: 0, potions: 5, revives: 0, rare_candy: 0, items: items },
              defeatedTrainers: [],
              discoveredChunks: [],
              discoveryPoints: 0
          };
      });
      setPhase(GamePhase.MENU);
  };

  const activePlayer = battleState.playerTeam[battleState.activePlayerIndex];
  const isTargeting = battleState.ui.selectionMode === 'TARGET';
  const isBagMode = battleState.ui.selectionMode === 'ITEM';
  const isSwitchMode = battleState.ui.selectionMode === 'SWITCH';
  


  function queueAction(targetIndex: number, item?: string, move?: PokemonMove, isFusion?: boolean, switchIndex?: number, forcedActorIndex?: number) {
      if (battleState.mustSwitch) {
          if (switchIndex !== undefined) {
              setBattleState(prev => {
                  const newTeam = [...prev.playerTeam];
                  const actorIdx = prev.switchingActorIdx;
                  const temp = newTeam[actorIdx];
                  newTeam[actorIdx] = newTeam[switchIndex];
                  newTeam[switchIndex] = temp;
                  
                  const nextMustSwitch = newTeam.some((p, i) => i < 2 && p.isFainted && newTeam.slice(2).some(bp => !bp.isFainted));
                  const nextSwitchingIdx = newTeam.findIndex((p, i) => i < 2 && p.isFainted && newTeam.slice(2).some(bp => !bp.isFainted));

                  return {
                      ...prev,
                      playerTeam: newTeam,
                      mustSwitch: nextMustSwitch,
                      switchingActorIdx: nextSwitchingIdx,
                      activePlayerIndex: nextMustSwitch ? nextSwitchingIdx : 0,
                      ui: { selectionMode: nextMustSwitch ? 'SWITCH' : 'MOVE', selectedMove: null }
                  };
              });
              return;
          }
      }

      if (isMultiplayerBattle) {
          const currentActorIndex = forcedActorIndex !== undefined ? forcedActorIndex : battleState.activePlayerIndex;
          const actor = battleState.playerTeam[currentActorIndex];
          let speed = actor.stats.speed * (1 + playerState.meta.upgrades.speedBoost * 0.05);
          if (actor.status === 'paralysis') speed *= 0.5;
          const priority = (item || switchIndex !== undefined) ? 6 : (move?.priority || 0);
          
          const action = { actorIndex: currentActorIndex, targetIndex, move, item, isPlayer: true, isFusion, speed, priority, switchIndex };
          
          setBattleState(prev => {
              const newPending = [...prev.pendingMoves, action];
              const livingPlayers = prev.playerTeam.filter(p => !p.isFainted).length;
              const activePlayerCount = Math.min(2, livingPlayers);
              
              if (newPending.length >= activePlayerCount) {
                  multiplayer.send({
                      type: 'BATTLE_ACTION',
                      payload: {
                          battleId,
                          targetId: opponentId,
                          action: newPending
                      }
                  });
                  const nextPhase = remoteBattleActions.length > 0 ? 'execution' : 'waiting_for_opponent';
                  return { 
                      ...prev, 
                      pendingMoves: newPending, 
                      phase: nextPhase as any, 
                      activePlayerIndex: 0,
                      logs: nextPhase === 'waiting_for_opponent' ? [...prev.logs, "Waiting for opponent..."] : prev.logs 
                  };
              } else {
                  let nextIndex = prev.activePlayerIndex + 1;
                  while (nextIndex < prev.playerTeam.length && prev.playerTeam[nextIndex].isFainted) nextIndex++;
                  if (nextIndex >= 2) {
                      multiplayer.send({
                          type: 'BATTLE_ACTION',
                          payload: {
                              battleId,
                              targetId: opponentId,
                              action: newPending
                          }
                      });
                      const nextPhase = remoteBattleActions.length > 0 ? 'execution' : 'waiting_for_opponent';
                      return { 
                          ...prev, 
                          pendingMoves: newPending, 
                          phase: nextPhase as any, 
                          activePlayerIndex: 0,
                          logs: nextPhase === 'waiting_for_opponent' ? [...prev.logs, "Waiting for opponent..."] : prev.logs 
                      };
                  }
                  return { ...prev, pendingMoves: newPending, activePlayerIndex: nextIndex };
              }
          });
          return;
      }
      const currentActorIndex = forcedActorIndex !== undefined ? forcedActorIndex : battleState.activePlayerIndex;
      const actor = battleState.playerTeam[currentActorIndex];

      if (switchIndex !== undefined) {
          if (actor.trappedTurns && actor.trappedTurns > 0) {
              setBattleState(prev => ({ ...prev, ui: { ...prev.ui, selectionMode: 'MOVE' }, logs: [...prev.logs, `${actor.name} is trapped and cannot switch!`] }));
              return;
          }
          // Shadow Tagger Ability
          const opponentWithShadowTagger = battleState.enemyTeam.find(mon => mon && !mon.isFainted && mon.ability.name === 'ShadowTagger' && mon.currentHp > actor.currentHp);
          if (opponentWithShadowTagger) {
              setBattleState(prev => ({ ...prev, ui: { ...prev.ui, selectionMode: 'MOVE' }, logs: [...prev.logs, `${actor.name} is trapped by ${opponentWithShadowTagger.name}'s Shadow Tagger!`] }));
              return;
          }
      }

      const isFusionMove = isFusion || battleState.ui.isFusionNext;
      if (move && isFusionMove) {
          move.isFusion = true;
      }

      // Choice Item Lock
      if (actor.heldItem?.id.startsWith('choice-') && actor.choiceMove && move && move.name !== actor.choiceMove) {
          setBattleState(prev => ({ ...prev, ui: { ...prev.ui, selectionMode: 'MOVE' }, logs: [...prev.logs, `${actor.name} is locked into ${actor.choiceMove} by its ${actor.heldItem?.name}!`] }));
          return;
      }

      // Assault Vest Lock
      if (actor.heldItem?.id === 'assault-vest' && move && move.damage_class === 'status') {
          setBattleState(prev => ({ ...prev, ui: { ...prev.ui, selectionMode: 'MOVE' }, logs: [...prev.logs, `${actor.name} cannot use status moves with an Assault Vest!`] }));
          return;
      }
      
      let speed = (actor?.stats.speed || 0) * (1 + playerState.meta.upgrades.speedBoost * 0.05);
      if (actor.status === 'paralysis') speed *= 0.5;
      if (actor.heldItem?.id === 'choice-scarf') speed *= 1.5;
      if (actor.heldItem?.id === 'lagging-tail') speed *= 0.5;
      if (actor.heldItem?.id === 'iron-ball') speed *= 0.5;
      
      // Shared Nerves: When user is paralyzed, ally's Speed is doubled
      const allyIdx = 1 - currentActorIndex;
      const ally = battleState.playerTeam[allyIdx];
      // Slipstream: Speed +1 after Flying move
      if (actor.ability.name === 'Slipstream' && actor.lastMoveName?.toLowerCase().includes('flying')) {
          speed *= 1.5;
      }

      // Threat Matrix: Speed increased by 50% if opponent has higher Attack or Sp. Atk
      if (actor.ability.name === 'ThreatMatrix') {
          const opponents = battleState.enemyTeam.filter(o => o && !o.isFainted);
          const hasHigherOffense = opponents.some(o => o.stats.attack > actor.stats.attack || o.stats.specialAttack > actor.stats.specialAttack);
          if (hasHigherOffense) speed *= 1.5;
      }

      let priority = (item || switchIndex !== undefined) ? 6 : (move?.priority || 0);
      
      // Thunderous Step: Electric moves +1 priority at full HP
      if (actor.ability.name === 'ThunderousStep' && move?.type === 'Electric' && actor.currentHp === actor.maxHp) {
          priority += 1;
      }
      
      // Sound Channel: Sound moves +1 priority
      if (actor.ability.name === 'SoundChannel' && move?.isSound) {
          priority += 1;
      }

      // Link Conduit Ability (Backline)
      const backline = battleState.playerTeam.filter(p => p && !p.isFainted && p.id !== actor.id);
      if (backline.some(p => p.ability.name === 'LinkConduit') && move?.name.toLowerCase().includes('link')) {
          priority += 1;
      }

      if (actor.nextMovePriorityBoost && move) {
          priority += 1;
          actor.nextMovePriorityBoost = false; // Reset
      }

      const action = { actorIndex: currentActorIndex, targetIndex, move, item, isPlayer: true, isFusion: isFusionMove, speed, priority, switchIndex };
      setBattleState(prev => {
          const newPending = [...prev.pendingMoves, action];
          const livingPlayers = prev.playerTeam.filter(p => !p.isFainted).length;
          const activePlayerCount = Math.min(2, livingPlayers);
          
          if (newPending.length >= activePlayerCount) return { ...prev, pendingMoves: newPending, phase: 'execution', activePlayerIndex: 0, ui: { selectionMode: 'MOVE', selectedMove: null, isFusionNext: false } };
          let nextIndex = prev.activePlayerIndex + 1;
          while (nextIndex < prev.playerTeam.length && prev.playerTeam[nextIndex].isFainted) nextIndex++;
          
          if (nextIndex >= 2) return { ...prev, pendingMoves: newPending, phase: 'execution', activePlayerIndex: 0, ui: { selectionMode: 'MOVE', selectedMove: null, isFusionNext: false } };
          
          return { ...prev, pendingMoves: newPending, activePlayerIndex: nextIndex, ui: { selectionMode: 'MOVE', selectedMove: null, isFusionNext: false } };
      });
  };

  function handleTargetSelect(targetIndex: number) {
      if (battleState.ui.selectionMode === 'TARGET') {
          if (battleState.ui.selectedItem === 'combo') queueAction(targetIndex, 'combo');
          else if (battleState.ui.selectedMove) queueAction(targetIndex, undefined, battleState.ui.selectedMove);
          else queueAction(targetIndex, 'pokeball');
      }
  };

  function handleRun() {
      if (battleState.isTrainerBattle) {
          setBattleState(prev => ({...prev, logs: [...prev.logs, "Can't run from a trainer battle!"]}));
      } else {
          const canAlwaysRun = playerState.team.some(p => p.heldItem?.id === 'smoke-ball' && !p.isFainted);
          if (canAlwaysRun) {
              setPhase(GamePhase.OVERWORLD);
              setDialogue(["Got away safely using the Smoke Ball!"]);
          } else {
              setPhase(GamePhase.OVERWORLD);
              setDialogue(["Got away safely!"]);
          }
      }
  };



  function handleInteraction(playerNum: 1 | 2) {
      if (networkRole === 'client' && playerNum === 1) return; 
      const pos = playerNum === 1 ? playerState.position : playerState.p2Position;
      
      let currentMap;
      if (playerState.mapId.startsWith('chunk_')) {
          currentMap = loadedChunks[playerState.mapId];
      } else {
          currentMap = MAPS[playerState.mapId];
      }
      if (!currentMap) return;

      const checkDirs = [{x:0, y:0}, {x:0, y:-1}, {x:0, y:1}, {x:-1, y:0}, {x:1, y:0}];
      
      for (const offset of checkDirs) {
          const targetX = pos.x + offset.x;
          const targetY = pos.y + offset.y;
          const key = `${targetX},${targetY}`;
          
          const layout = (playerState.mapId === 'rift' && riftLayout) ? riftLayout : 
                         (playerState.mapId.startsWith('cave_') && caveLayouts[playerState.mapId]) ? caveLayouts[playerState.mapId] :
                         currentMap.layout;
          const itemFlag = `item_${playerState.mapId}_${targetX}_${targetY}`;
          
          if (layout && layout[targetY] && layout[targetY][targetX] !== undefined) {
              const tile = layout[targetY][targetX];
              
              // Item Ball
              if (tile === 12 && !playerState.storyFlags.includes(itemFlag)) {
                  const roll = Math.random();
                  let randomItem: keyof typeof playerState.inventory | 'riftEssence' = 'potions';
                  let qty = Math.floor(Math.random() * 3) + 1;
                  
                  if (roll < 0.4) randomItem = 'potions';
                  else if (roll < 0.7) randomItem = 'revives';
                  else {
                      randomItem = 'riftEssence';
                      qty = Math.floor(Math.random() * 5) + 5;
                  }

                  setPlayerState(prev => {
                      if (randomItem === 'riftEssence') {
                          return {
                              ...prev,
                              meta: { ...prev.meta, riftEssence: prev.meta.riftEssence + qty },
                              storyFlags: [...prev.storyFlags, itemFlag]
                          };
                      }
                      return {
                          ...prev,
                          inventory: { ...prev.inventory, [randomItem]: (prev.inventory[randomItem as keyof typeof prev.inventory] || 0) + qty },
                          storyFlags: [...prev.storyFlags, itemFlag]
                      };
                  });
                  setDialogue([`You found ${qty} ${randomItem === 'riftEssence' ? 'RIFT ESSENCE' : randomItem.toUpperCase()}!`, `Put it in your Bag.`]);
                  return;
              }

              // Berry Tree
              if (tile === 56 && !playerState.storyFlags.includes(itemFlag)) {
                  const qty = Math.floor(Math.random() * 2) + 1;
                  setPlayerState(prev => ({
                      ...prev,
                      inventory: { ...prev.inventory, potions: prev.inventory.potions + qty },
                      storyFlags: [...prev.storyFlags, itemFlag]
                  }));
                  setDialogue([`You picked ${qty} Berries!`, `They work just like Potions.`]);
                  return;
              }

              // Healing Spring
              if (tile === 66) {
                  setPlayerState(prev => ({ ...prev, team: prev.team.map(p => ({ ...p, currentHp: p.maxHp, isFainted: false })) }));
                  setDialogue(["Your team was fully healed by the spring!"]);
                  return;
              }

              // Weather Shrine
              if (tile === 65) {
                  const weathers: WeatherType[] = ['rain', 'sun', 'sand', 'hail'];
                  const next = weathers[Math.floor(Math.random() * weathers.length)];
                  setCurrentWeather(next);
                  setDialogue([`The shrine glows with a strange light...`, `The weather has changed to ${next.toUpperCase()}!`]);
                  return;
              }

              // Power Shrine
              if (tile === 67 && !playerState.storyFlags.includes(itemFlag)) {
                  setPlayerState(prev => ({
                      ...prev,
                      inventory: { ...prev.inventory, potions: prev.inventory.potions + 3 },
                      storyFlags: [...prev.storyFlags, itemFlag]
                  }));
                  setDialogue(["The stone pulses with energy...", "You found 3 Potions!"]);
                  return;
              }
          }

          if (currentMap.npcs?.[key]) {
              const npc = currentMap.npcs[key];
              
              if (npc.name === "Fisherman" && !playerState.storyFlags.includes('has_rod')) {
                  setDialogue(["You look like a natural!", "Take this Old Rod. Use it near water!"]);
                  setPlayerState(prev => ({ ...prev, storyFlags: [...prev.storyFlags, 'has_rod'] }));
                  return;
              }

              if (npc.challenge) {
                  const challengeKey = `challenge_${npc.id}`;
                  if (playerState.storyFlags.includes(challengeKey)) {
                      setDialogue(["You've already completed my challenge!", "Good luck on your journey!"]);
                  } else {
                      setDialogue([
                          `CHALLENGE: ${npc.challenge.type.toUpperCase()} ${npc.challenge.target}`,
                          npc.dialogue[0],
                          "Would you like to accept? (Press Enter to continue)"
                      ]);
                      
                      // For now, let's simplify: if it's a battle challenge, start battle.
                      // If it's collect, check inventory.
                      if (npc.challenge.type === 'battle') {
                          startBattle(1, true, true, {
                              id: npc.id,
                              name: npc.name,
                              sprite: npc.sprite,
                              level: 15,
                              team: [npc.challenge.target as any],
                              isGymLeader: false,
                              reward: 500,
                              dialogue: "Let's see what you've got!",
                              winDialogue: "Impressive!"
                          });
                          setPlayerState(prev => ({ ...prev, storyFlags: [...prev.storyFlags, challengeKey] }));
                      } else if (npc.challenge.type === 'speed') {
                          setChallengeState({
                              type: 'speed',
                              isActive: true,
                              endTime: Date.now() + (npc.challenge.timeLimit || 15) * 1000,
                              npcId: npc.id
                          });
                          setDialogue(["GO! Reach the edge of the region!"]);
                      } else if (npc.challenge.type === 'stealth') {
                          setChallengeState({
                              type: 'stealth',
                              isActive: true,
                              npcId: npc.id
                          });
                          setDialogue(["Move carefully. Don't let the guards see you!"]);
                      } else if (npc.challenge.type === 'type_trial') {
                          const requiredType = npc.challenge.requiredType || 'normal';
                          const allMatch = playerState.team.every(p => p.types.includes(requiredType));
                          if (allMatch) {
                              setDialogue([`You have mastered the ${requiredType.toUpperCase()} type!`, "Take this reward."]);
                              setPlayerState(prev => ({ ...prev, storyFlags: [...prev.storyFlags, challengeKey] }));
                          } else {
                              setDialogue([`I only speak to those who master the ${requiredType.toUpperCase()} type.`, "Come back with a team of only that type!"]);
                          }
                      } else if (npc.challenge.type === 'collect') {
                          if (npc.name === 'Trader') {
                              // Trade lead pokemon for reward
                              const lead = playerState.team[0];
                              setDialogue([`You traded your ${lead.name}!`, `You received ${npc.challenge.reward.name}!`]);
                              setPlayerState(prev => ({
                                  ...prev,
                                  team: [npc.challenge!.reward, ...prev.team.slice(1)],
                                  storyFlags: [...prev.storyFlags, challengeKey]
                              }));
                              return;
                          }
                          // Check if player has the item (e.g. potions)
                          if (playerState.inventory.potions >= 5) {
                              setDialogue(["Amazing! You collected enough items.", `Here is your reward: ${npc.challenge.reward.name}!`]);
                              setPlayerState(prev => ({
                                  ...prev,
                                  team: [...prev.team, npc.challenge!.reward],
                                  inventory: { ...prev.inventory, potions: prev.inventory.potions - 5 },
                                  storyFlags: [...prev.storyFlags, challengeKey]
                              }));
                          } else {
                              setDialogue(["I need 5 Potions to see if you're worthy.", "Come back when you have them!"]);
                          }
                      }
                  }
              } else if (npc.name === 'Gambler') {
                  const win = Math.random() > 0.5;
                  const bet = 100;
                  setDialogue(npc.dialogue.concat(win ? [`You won the coin toss! Got $${bet*2}.`] : [`You lost the toss... Lost $${bet}.`]));
                  setPlayerState(prev => ({ ...prev, money: prev.money + (win ? bet : -bet) }));
              } else {
                  setDialogue(npc.dialogue);
              }
              return;
          }
          if (currentMap.interactables?.[key]) { 
              const interactable = currentMap.interactables[key];
              
              // Special interactable logic: Statue Riddle
              if (interactable.text.some(t => t.includes("creature of the deep"))) {
                  const leadPokemon = playerState.team[0];
                  if (leadPokemon && leadPokemon.types.includes('water')) {
                      setDialogue(["The statue glows blue!", "You received a Mystic Water! (+$1000)"]);
                      setPlayerState(prev => ({ ...prev, money: prev.money + 1000, storyFlags: [...prev.storyFlags, `riddle_${key}`] }));
                      return;
                  }
              }

              setDialogue(interactable.text); 
              
              // Hidden item mechanic
              if (interactable.text.some(t => t.toLowerCase().includes("found a hidden")) && !playerState.storyFlags.includes(itemFlag)) {
                  setPlayerState(prev => ({
                      ...prev,
                      inventory: { ...prev.inventory, potions: prev.inventory.potions + 1 },
                      storyFlags: [...prev.storyFlags, itemFlag]
                  }));
              }
              return; 
          }

          // Fishing Logic
          if (layout[targetY][targetX] === 3 && playerState.storyFlags.includes('has_rod')) {
              const roll = Math.random();
              if (roll < 0.3) {
                  setDialogue(["Something bit!", "A wild Magikarp appeared!"]);
                  startBattle(1, false, false); // Wild battle
              } else {
                  setDialogue(["Not even a nibble..."]);
              }
              return;
          }

          // Co-op Puzzle Logic
          if (layout[targetY][targetX] === 68) { // Rift Portal / Puzzle Switch
              const p1OnSwitch = playerState.position.x === targetX && playerState.position.y === targetY;
              const p2OnSwitch = playerState.p2Position.x === targetX && playerState.p2Position.y === targetY;
              
              // Find the other switch
              let otherSwitch: Coordinate | null = null;
              for (const [k, n] of Object.entries(currentMap.npcs || {})) {
                  const npc = n as any;
                  if (npc.id.startsWith('switch_') && k !== key) {
                      const [ox, oy] = k.split(',').map(Number);
                      otherSwitch = { x: ox, y: oy };
                      break;
                  }
              }

              const p1OnOther = otherSwitch && playerState.position.x === otherSwitch.x && playerState.position.y === otherSwitch.y;
              const p2OnOther = otherSwitch && playerState.p2Position.x === otherSwitch.x && playerState.p2Position.y === otherSwitch.y;

              if ((p1OnSwitch && p2OnOther) || (p2OnSwitch && p1OnOther)) {
                  setDialogue(["The rift stabilizes!", "A secret path has opened!"]);
                  // Open the gate (tile 21)
                  const [sx, sy] = key.split(',').map(Number);
                  const gateX = sx + (otherSwitch!.x - sx) / 2;
                  const gateY = sy - 1;
                  
                  if (playerState.mapId.startsWith('chunk_')) {
                      const newLayout = [...currentMap.layout.map((r: any) => [...r])];
                      if (newLayout[gateY]) newLayout[gateY][gateX] = 4; // Path
                      setLoadedChunks(prev => ({
                          ...prev,
                          [playerState.mapId]: { ...currentMap, layout: newLayout }
                      }));
                  }
                  return;
              } else {
                  setDialogue(["The rift is unstable...", "It seems to require two souls to stabilize."]);
                  return;
              }
          }
      }
  };

  async function handleMapMove(newPos: Coordinate, playerNum: 1 | 2) {
      if (dialogue) return; 
      
      let currentMap;
      if (playerState.mapId.startsWith('chunk_')) {
          currentMap = loadedChunks[playerState.mapId];
          if (!currentMap) {
              const [,cx,cy] = playerState.mapId.split('_');
              currentMap = generateChunk(parseInt(cx), parseInt(cy), playerState.meta.upgrades.riftStability);
              setLoadedChunks(prev => ({ ...prev, [currentMap.id]: currentMap }));
          }
      } else {
          currentMap = MAPS[playerState.mapId];
      }
      if (!currentMap) return;

      const layout = (playerState.mapId === 'rift' && riftLayout) ? riftLayout : 
                     (playerState.mapId.startsWith('cave_') && caveLayouts[playerState.mapId]) ? caveLayouts[playerState.mapId] :
                     currentMap.layout;
      
      if (playerState.mapId.startsWith('cave_') && !caveLayouts[playerState.mapId]) {
          const seed = parseInt(playerState.mapId.split('_').slice(1).join(''));
          const newCave = generateCaveMap(seed);
          setCaveLayouts(prev => ({ ...prev, [playerState.mapId]: newCave }));
          return;
      }
      if (playerState.mapId.startsWith('chunk_')) {
          let ncx = playerState.chunkPos.x;
          let ncy = playerState.chunkPos.y;
          let nx = newPos.x;
          let ny = newPos.y;
          let transitioned = false;

          if (nx < 0) { ncx--; nx = CHUNK_SIZE - 1; transitioned = true; }
          else if (nx >= CHUNK_SIZE) { ncx++; nx = 0; transitioned = true; }
          
          if (ny < 0) { ncy--; ny = CHUNK_SIZE - 1; transitioned = true; }
          else if (ny >= CHUNK_SIZE) { ncy++; ny = 0; transitioned = true; }

          if (transitioned) {
              const nextDist = Math.sqrt(ncx*ncx + ncy*ncy);
              const distFloor = Math.floor(nextDist);
              
              let permitsEarned = 0;
              if (distFloor > playerState.run.maxDistanceReached && distFloor % 5 === 0 && distFloor > 0) {
                  permitsEarned = 1;
              }

              if (distFloor === 50 && playerState.badges < 8) {
                  setDialogue(["A powerful Rift Barrier blocks the way.", "You need 8 Badges to enter the Rift Core."]);
                  return;
              }

              const nextChunkId = `chunk_${ncx}_${ncy}`;
              
              // Move both players to the new chunk
              // Calculate relative position for the other player
              let p1x = playerState.position.x;
              let p1y = playerState.position.y;
              let p2x = playerState.p2Position.x;
              let p2y = playerState.p2Position.y;

              if (playerNum === 1) {
                  p1x = nx; p1y = ny;
                  // If P1 moved East, P2 should also be shifted West relative to P1
                  if (newPos.x >= CHUNK_SIZE) p2x -= CHUNK_SIZE;
                  else if (newPos.x < 0) p2x += CHUNK_SIZE;
                  if (newPos.y >= CHUNK_SIZE) p2y -= CHUNK_SIZE;
                  else if (newPos.y < 0) p2y += CHUNK_SIZE;
              } else {
                  p2x = nx; p2y = ny;
                  if (newPos.x >= CHUNK_SIZE) p1x -= CHUNK_SIZE;
                  else if (newPos.x < 0) p1x += CHUNK_SIZE;
                  if (newPos.y >= CHUNK_SIZE) p1y -= CHUNK_SIZE;
                  else if (newPos.y < 0) p1y += CHUNK_SIZE;
              }

              // Discovery XP & Landmark Logic
              if (!playerState.discoveredChunks.includes(nextChunkId)) {
                  const dist = Math.sqrt(ncx*ncx + ncy*ncy);
                  const isLandmark = ncx % 5 === 0 && ncy % 5 === 0 && (ncx !== 0 || ncy !== 0);
                  const discoveryXp = (100 + Math.floor(dist * 20)) * (isLandmark ? 8 : 1); // Increased XP
                  const playerLevelCap = 15 + playerState.badges * 10;
                  const avgLevel = playerState.team.length > 0 ? playerState.team.reduce((a, b) => a + b.level, 0) / playerState.team.length : 0;
                  
                  const updatedTeam = await Promise.all(playerState.team.map(async (p) => {
                      if (p.isFainted) return p;
                      const r = await gainExperience(p, discoveryXp, playerLevelCap, avgLevel);
                      return r.mon;
                  }));

                  let landmarkMsg = "";
                  let bonusMoney = 0;
                  let bonusPoints = isLandmark ? 25 : 5; // Increased points
                  if (isLandmark) {
                      landmarkMsg = " This is a MAJOR LANDMARK!";
                      bonusMoney = 10000; // Increased money
                  }

                  setPlayerState(prev => ({
                      ...prev,
                      mapId: nextChunkId,
                      chunkPos: { x: ncx, y: ncy },
                      position: { x: p1x, y: p1y },
                      p2Position: { x: p2x, y: p2y },
                      money: prev.money + bonusMoney,
                      discoveredChunks: [...prev.discoveredChunks, nextChunkId],
                      discoveryPoints: prev.discoveryPoints + bonusPoints,
                      team: updatedTeam,
                      run: {
                          ...prev.run,
                          maxDistanceReached: Math.max(prev.run.maxDistanceReached, distFloor),
                          capturePermits: prev.run.capturePermits + permitsEarned
                      }
                  }));
                  
                  const msgs = [`Discovered ${nextChunkId.toUpperCase()}!${landmarkMsg}`, `Your team gained ${isLandmark ? 'MASSIVE ' : ''}Discovery XP!${bonusMoney > 0 ? ` Found $${bonusMoney}!` : ''}`];
                  if (permitsEarned > 0) msgs.push("You earned a Capture Permit for reaching a distance milestone!");
                  setDialogue(msgs);
                  return;
              }

              if (!loadedChunks[nextChunkId]) {
                  const nextChunk = generateChunk(ncx, ncy, playerState.meta.upgrades.riftStability);
                  setLoadedChunks(prev => ({ ...prev, [nextChunkId]: nextChunk }));
              }
              
              setPlayerState(prev => ({
                  ...prev,
                  mapId: nextChunkId,
                  chunkPos: { x: ncx, y: ncy },
                  position: { x: p1x, y: p1y },
                  p2Position: { x: p2x, y: p2y },
                  run: {
                      ...prev.run,
                      maxDistanceReached: Math.max(prev.run.maxDistanceReached, distFloor),
                      capturePermits: prev.run.capturePermits + permitsEarned
                  }
              }));
              
              if (permitsEarned > 0) setDialogue(["You earned a Capture Permit for reaching a distance milestone!"]);
              
              // Story trigger
              const dist = Math.sqrt(ncx*ncx + ncy*ncy);
              if (dist > 10 && !playerState.storyFlags.includes('mid_game_story')) {
                  setDialogue(["The air feels different here...", "The monsters are getting stronger."]);
                  setPlayerState(p => ({ ...p, storyFlags: [...p.storyFlags, 'mid_game_story'] }));
              }
              return;
          }
      }

      if (!layout || newPos.y < 0 || newPos.y >= layout.length || !layout[newPos.y] || newPos.x < 0 || newPos.x >= layout[newPos.y].length) return;
      
      // Handle Portals
      if (currentMap.portals && currentMap.portals[`${newPos.x},${newPos.y}`]) {
          const [targetMap, tx, ty] = currentMap.portals[`${newPos.x},${newPos.y}`].split(',');
          setPlayerState(prev => ({
              ...prev,
              mapId: targetMap,
              position: { x: parseInt(tx), y: parseInt(ty) },
              p2Position: { x: parseInt(tx), y: parseInt(ty) }
          }));
          return;
      }

      const tileType = layout[newPos.y][newPos.x];
      const pos = playerNum === 1 ? playerState.position : playerState.p2Position;
      
      // Challenge Logic
      if (challengeState.isActive) {
          if (challengeState.type === 'speed') {
              if (Date.now() > (challengeState.endTime || 0)) {
                  setChallengeState({ type: 'none', isActive: false });
                  setDialogue(["Time's up! You failed the speed challenge."]);
                  return;
              }
              // Check if reached edge
              if (newPos.x === 0 || newPos.x === CHUNK_SIZE - 1 || newPos.y === 0 || newPos.y === CHUNK_SIZE - 1) {
                  setChallengeState({ type: 'none', isActive: false });
                  setDialogue(["Incredible speed!", "You won the challenge!"]);
                  // Reward logic here
                  setPlayerState(prev => ({ ...prev, storyFlags: [...prev.storyFlags, `challenge_${challengeState.npcId}`] }));
              }
          } else if (challengeState.type === 'stealth') {
              // Check guards line of sight
              if (currentMap.npcs) {
                  for (const [k, n] of Object.entries(currentMap.npcs)) {
                      const npc = n as any;
                      if (npc.name === 'Guard') {
                          const [gx, gy] = k.split(',').map(Number);
                          // Simple LOS check
                          let seen = false;
                          if (npc.facing === 'up' && newPos.x === gx && newPos.y < gy && gy - newPos.y < 5) seen = true;
                          if (npc.facing === 'down' && newPos.x === gx && newPos.y > gy && newPos.y - gy < 5) seen = true;
                          if (npc.facing === 'left' && newPos.y === gy && newPos.x < gx && gx - newPos.x < 5) seen = true;
                          if (npc.facing === 'right' && newPos.y === gy && newPos.x > gx && newPos.x - gx < 5) seen = true;
                          
                          if (seen) {
                              setChallengeState({ type: 'none', isActive: false });
                              setDialogue(["HALT! You were spotted!", "The stealth challenge failed."]);
                              return;
                          }
                      }
                  }
              }
              // Check if reached treasure (statue or something)
              if (tileType === 22 || tileType === 12) {
                  setChallengeState({ type: 'none', isActive: false });
                  setDialogue(["You reached the treasure unseen!", "A true master of stealth."]);
                  setPlayerState(prev => ({ ...prev, storyFlags: [...prev.storyFlags, `challenge_${challengeState.npcId}`] }));
              }
          }
      }

      // Mining Mechanic (Rock Smashing)
      if (tileType === 24) { // Rock
          const roll = Math.random();
          if (roll < 0.2) {
              setDialogue(["You smashed the rock!", "Found a Hard Stone! (+$500)"]);
              setPlayerState(prev => ({ ...prev, money: prev.money + 500 }));
              return;
          }
      }

      // Rare Spawn Notification
      if (Math.random() < 0.02 && !playerState.nextEncounterRare) {
          setDialogue(["A rare aura surrounds this area...", "A powerful Pokemon might be nearby!"]);
          setPlayerState(prev => ({ ...prev, nextEncounterRare: true }));
      }

      // Solid tiles
      const walls = [1, 3, 11, 23, 24, 30, 31, 32, 33, 34, 35, 40, 41, 42, 43, 44, 45, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 80, 81, 82, 83, 85];
      
      // Boulder Logic
      if (tileType === 71) { // Boulder
          const dx = newPos.x - pos.x;
          const dy = newPos.y - pos.y;
          const behindX = newPos.x + dx;
          const behindY = newPos.y + dy;
          
          if (layout[behindY] && (layout[behindY][behindX] === 0 || layout[behindY][behindX] === 72 || layout[behindY][behindX] === 70)) {
              // Move boulder
              const newLayout = [...layout.map(row => [...row])];
              if (layout[behindY][behindX] === 72) {
                  newLayout[behindY][behindX] = 4; // Filled hole becomes path
                  setDialogue(["The boulder fell into the hole!"]);
              } else {
                  newLayout[behindY][behindX] = 71;
              }
              newLayout[newPos.y][newPos.x] = 0;
              
              if (playerState.mapId.startsWith('chunk_')) {
                  setLoadedChunks(prev => ({ ...prev, [playerState.mapId]: { ...prev[playerState.mapId], layout: newLayout } }));
              } else {
                  // Handle static maps if needed
              }
              // Don't move player yet, just push
              return;
          }
          return; // Blocked
      }

      if (walls.includes(tileType)) return;

      // Ice Logic (Slippery)
      if (tileType === 70) {
          const dx = newPos.x - pos.x;
          const dy = newPos.y - pos.y;
          let slidePos = { ...newPos };
          while (true) {
              const nextX = slidePos.x + dx;
              const nextY = slidePos.y + dy;
              if (!layout[nextY] || layout[nextY][nextX] === undefined) break;
              const nextTile = layout[nextY][nextX];
              if (walls.includes(nextTile) || nextTile === 71) break;
              slidePos = { x: nextX, y: nextY };
              if (nextTile !== 70) break; // Stopped on non-ice
          }
          newPos = slidePos;
      }

      // Ledge logic (One-way South)
      if (tileType === 14) {
          if (newPos.y <= pos.y) return; // Can't walk up or sideways into a ledge
          // If jumping down, we move an extra tile to clear it
          const jumpPos = { x: newPos.x, y: newPos.y + 1 };
          if (layout[jumpPos.y] && !walls.includes(layout[jumpPos.y][jumpPos.x])) {
              newPos = jumpPos;
          } else {
              return; // Blocked below ledge
          }
      }

      const portalKey = `${newPos.x},${newPos.y}`;
      if (currentMap.portals[portalKey]) {
          const portalDest = currentMap.portals[portalKey];
          if (portalDest === "PREV_POS") {
              // Simple back logic
              setPlayerState(prev => ({ ...prev, mapId: `chunk_${prev.chunkPos.x}_${prev.chunkPos.y}`, position: { x: 10, y: 11 } }));
              return;
          }
          const [targetMapId, targetX, targetY] = portalDest.split(',');
          if (targetMapId === 'rift') setRiftLayout(generateRiftMap());
          if (targetMapId.startsWith('puzzle_')) {
              const [, type, seed] = targetMapId.split('_');
              if (!loadedChunks[targetMapId]) {
                  const puzzleMap = generatePuzzleMap(type as any, parseInt(seed));
                  setLoadedChunks(prev => ({ ...prev, [targetMapId]: puzzleMap }));
              }
          }
          
          let nextChunkPos = playerState.chunkPos;
          if (targetMapId.startsWith('chunk_')) {
              const [,cx,cy] = targetMapId.split('_');
              nextChunkPos = { x: parseInt(cx), y: parseInt(cy) };
              setCurrentWeather('none'); // Reset weather on chunk change
              if (!loadedChunks[targetMapId]) {
                  const nextChunk = generateChunk(nextChunkPos.x, nextChunkPos.y, playerState.meta.upgrades.riftStability);
                  setLoadedChunks(prev => ({ ...prev, [targetMapId]: nextChunk }));
              }
          }

          setPlayerState(prev => ({ 
              ...prev, 
              mapId: targetMapId, 
              chunkPos: nextChunkPos,
              position: { x: parseInt(targetX), y: parseInt(targetY) }, 
              p2Position: { x: parseInt(targetX) + 1, y: parseInt(targetY) } 
          }));
          return;
      }

      const trainerKey = `${newPos.x},${newPos.y}`;
      const trainerData = currentMap.trainers?.[trainerKey];
      if (trainerData && !playerState.defeatedTrainers.includes(trainerData.id)) { startBattle(0, false, true, trainerData); return; }

      // Level Cap Logic
      const badgeCount = playerState.badges.length;
      const levelCap = 10 + badgeCount * 10;

      const updatedTeam = playerState.team.map(p => {
          if (p.currentHp <= 0) return p;
          // Small XP gain for exploration
          if (p.level < levelCap) {
              let xpMult = 1;
              if (p.heldItem?.id === 'lucky-egg') xpMult = 1.5;
              const newXp = p.xp + (1 * xpMult);
              if (newXp >= p.maxXp) {
                  return { ...p, level: p.level + 1, xp: 0, maxXp: (p.level + 1) * 100, maxHp: p.maxHp + 10, currentHp: p.currentHp + 10 };
              }
              return { ...p, xp: newXp };
          }
          return p;
      });

      if (tileType === 74) { // Puzzle Reward
          const rewardKey = `reward_${playerState.mapId}_${newPos.x}_${newPos.y}`;
          if (!playerState.storyFlags.includes(rewardKey)) {
              setDialogue(["You found a rare item!", "It's a Choice Band!"]);
              setPlayerState(prev => ({ ...prev, storyFlags: [...prev.storyFlags, rewardKey], money: prev.money + 5000 }));
              return;
          }
      }

      if (playerNum === 1) setPlayerState(prev => ({ ...prev, position: newPos, team: updatedTeam })); else setPlayerState(prev => ({ ...prev, p2Position: newPos }));
      if (tileType === 5) { setPlayerState(prev => ({ ...prev, team: prev.team.map(p => ({ ...p, currentHp: p.maxHp, isFainted: false })) })); setDialogue(["Team healed!"]); }
      if (tileType === 10) setPhase(GamePhase.SHOP);
      
      let encounterRateMult = 1;
      if (playerState.team[0]?.heldItem?.id === 'cleanse-tag') encounterRateMult = 0.5;

      if (tileType === 2 && Math.random() < (0.15 * encounterRateMult)) {
          startBattle(2, playerState.nextEncounterRare || false, false, undefined, currentMap.biome, tileType);
          if (playerState.nextEncounterRare) setPlayerState(prev => ({ ...prev, nextEncounterRare: false }));
      }
      else if (tileType === 19 && Math.random() < (0.15 * encounterRateMult)) {
          startBattle(3, true, false, undefined, currentMap.biome, tileType);
      }
  };

  const startBattle = async (enemyCount: number, isBoss: boolean, isTrainer: boolean, trainerData?: TrainerData, biome?: string, tileType?: number) => {
    setPhase(GamePhase.BATTLE);
      // --- SYNC BOOST ABILITY ---
      let initialCombo = 0;
      playerState.team.slice(0, 2).forEach(p => {
          if (p.ability.name === 'SyncBoost') initialCombo += 10;
      });
      setBattleState(prev => ({ ...prev, phase: 'player_input', logs: isTrainer ? ["Trainer Battle!"] : ["Wild Encounter!"], isTrainerBattle: isTrainer, currentTrainerId: trainerData?.id, backgroundUrl: undefined, comboMeter: initialCombo }));
    try {
      let currentMap;
      if (playerState.mapId.startsWith('chunk_')) {
          currentMap = loadedChunks[playerState.mapId];
      } else {
          currentMap = MAPS[playerState.mapId];
      }
      if (!currentMap) return;

      const bgUrl = await generateBattleBackground(biome || currentMap.biome || 'forest', tileType);
      console.log('Setting Battle Background URL:', bgUrl);
      
      // Calculate Difficulty Scaling
      const distance = Math.floor(Math.sqrt(playerState.chunkPos.x ** 2 + playerState.chunkPos.y ** 2));
      const stabilityMult = 1 - (playerState.meta.upgrades.riftStability * 0.1);
      const difficulty = 1 + (Math.pow(distance / 20, 1.2) * 0.15 + Math.pow(playerState.badges, 1.1) * 0.1) * stabilityMult;

      // Set background immediately
      setBattleState(prev => ({ ...prev, backgroundUrl: bgUrl }));
      
      let initialWeather = currentWeather;
      if (initialWeather === 'none') {
          if (currentMap.biome === 'lake') initialWeather = 'rain';
          else if (currentMap.biome === 'desert') initialWeather = 'sand';
          else if (currentMap.biome === 'snow') initialWeather = 'hail';
      }

      let enemies: Pokemon[];
      if (trainerData) {
          if (trainerData.isGymLeader) {
              const { fetchCompetitivePokemon } = await import('./services/pokeService');
              // Gym Leaders always have at least 2 pokemon for 2v2
              enemies = await Promise.all(trainerData.team.map(id => fetchCompetitivePokemon(id, trainerData.level)));
              // Competitive pokemon don't use the standard fetchPokemon difficulty boost by default, 
              // but we can apply a multiplier to their stats here if needed.
              enemies.forEach(e => {
                  Object.keys(e.stats).forEach(stat => {
                      e.stats[stat as keyof StatBlock] = Math.floor(e.stats[stat as keyof StatBlock] * difficulty);
                  });
                  e.currentHp = e.maxHp = e.stats.hp;
              });
          } else {
              enemies = await Promise.all(trainerData.team.map(id => fetchPokemon(id, trainerData.level, true, 0, difficulty)));
          }
      } else {
          // Wild level cap: 10 + badges * 10
          const wildCap = 10 + playerState.badges * 10;
          const minLvl = Math.min(wildCap, currentMap.wildLevelRange[0]);
          const maxLvl = Math.min(wildCap, currentMap.wildLevelRange[1]);
          enemies = await getWildPokemon(enemyCount, [minLvl, maxLvl], biome, tileType, playerState.meta.upgrades.shinyChance, difficulty);
          if (isBoss) {
              enemies.forEach(e => { 
                  e.level += 5; 
                  e.maxHp *= 1.5; 
                  e.currentHp = e.maxHp;
              });
          }
      }
      
      // Play cries only on summon
      enemies.slice(0, 2).forEach((e, i) => {
          setTimeout(() => playCry(e.id, e.name), i * 400);
      });
      playerState.team.slice(0, 2).forEach((p, i) => {
          setTimeout(() => playCry(p.id, p.name), (enemies.length > 0 ? 800 : 0) + i * 400);
      });

      // In 2v2, only the first 2 pokemon are out. 
      // If enemy has 2+, it's a double battle.
      const isDouble = enemies.length >= 2;
      const playerTeam = JSON.parse(JSON.stringify(playerState.team));
      // Mark fainted for those not in the first 2 if it's a double battle? 
      // Actually, the UI only shows the first 2 living ones usually.
      // But the current UI maps over the whole team.
      // I'll limit the active ones.
      
      // --- WEATHER & ENTRY ABILITIES ---
      let startWeather = initialWeather;
      let startLogs = isTrainer ? [`Trainer ${trainerData.name} wants to battle!`] : [`A wild ${enemies[0].name} appeared!`];
      const allInitial = [...playerTeam.slice(0, 2), ...enemies.slice(0, 2)];
      
      let startTailwind = 0;
      let startEnemyTailwind = 0;
      
      let startAegis = 0;
      let startEnemyAegis = 0;
      let playerSyncBoost = 0;
      let enemySyncBoost = 0;
      
      allInitial.forEach((p, idx) => {
          const isPlayer = idx < 2;
          if (p.ability.name === 'Drizzle') startWeather = 'rain';
          if (p.ability.name === 'Drought') startWeather = 'sun';
          if (p.ability.name === 'SandStream') startWeather = 'sand';
          if (p.ability.name === 'SnowWarning') startWeather = 'hail';
          if (p.ability.name === 'ArcSurge') startWeather = 'electric';
          if (p.ability.name === 'Ashstorm') startWeather = 'ashstorm';
          
          if (p.ability.name === 'MysticFog') {
              startLogs.push(`${p.name}'s Mystic Fog lowered everyone's accuracy!`);
              allInitial.forEach(mon => {
                  if (mon.statStages) mon.statStages.accuracy = Math.max(-6, (mon.statStages.accuracy || 0) - 1);
              });
          }

          if (p.ability.name === 'Jetstream') {
              if (isPlayer) startTailwind = 2;
              else startEnemyTailwind = 2;
              startLogs.push(`${p.name}'s Jetstream whipped up a tailwind!`);
          }

          if (p.ability.name === 'AegisField') {
              if (isPlayer) startAegis = 1;
              else startEnemyAegis = 1;
              startLogs.push(`${p.name}'s Aegis Field is protecting the team!`);
          }

          if (p.ability.name === 'SyncBoost') {
              if (isPlayer) playerSyncBoost += 10;
              else enemySyncBoost += 10;
              startLogs.push(`${p.name}'s Sync Boost charged the gauge!`);
          }

          if (p.ability.name === 'VenomousAura' && Math.random() < 0.3) {
              const targets = isPlayer ? enemies.slice(0, 2) : playerTeam.slice(0, 2);
              targets.forEach(t => {
                  if (!t.status && !t.types.includes('poison') && !t.types.includes('steel')) {
                      t.status = 'poison';
                      startLogs.push(`${t.name} was poisoned by ${p.name}'s Venomous Aura!`);
                  }
              });
          }
      });

      let firstActive = 0;
      while (firstActive < playerTeam.length && playerTeam[firstActive].isFainted) firstActive++;

      setBattleState({
        playerTeam, enemyTeam: enemies,
        turn: 1, phase: 'player_input', logs: startLogs, pendingMoves: [], activePlayerIndex: firstActive, ui: { selectionMode: 'MOVE', selectedMove: null },
        isTrainerBattle: isTrainer, comboMeter: Math.min(100, initialCombo + playerSyncBoost), enemyComboMeter: Math.min(100, enemySyncBoost), currentTrainerId: trainerData?.id, weather: startWeather, terrain: 'none', backgroundUrl: bgUrl,
        weatherTurns: startWeather !== 'none' ? 5 : 0,
        tailwindTurns: startTailwind,
        enemyTailwindTurns: startEnemyTailwind,
        aegisFieldTurns: startAegis,
        enemyAegisFieldTurns: startEnemyAegis
      });
    } catch (e) { setPhase(GamePhase.OVERWORLD); }
  };
   const checkBerries = (p: Pokemon, logs: string[]) => {
      if (p.isFainted) return;
      
      const isPlayer = battleState.playerTeam.some(mon => mon && mon.id === p.id);
      const team = isPlayer ? battleState.playerTeam : battleState.enemyTeam;
      const ally = team.find(mon => mon && !mon.isFainted && mon.id !== p.id);

      if (p.heldItem?.id === 'sitrus-berry' && p.currentHp <= p.maxHp / 2) {
          const heal = Math.floor(p.maxHp / 4);
          p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
          logs.push(`${p.name} consumed its Sitrus Berry and restored HP!`);
          
          // Symmetry Ability: Share berry effect with ally
          if (p.ability.name === 'Symmetry' && ally) {
              ally.currentHp = Math.min(ally.maxHp, ally.currentHp + heal);
              logs.push(`${ally.name} also restored HP due to Symmetry!`);
          }
          
          // Stash Ability: Copy ally's berry
          if (ally && ally.ability.name === 'Stash' && !ally.heldItem) {
              ally.heldItem = { ...p.heldItem };
              logs.push(`${ally.name}'s Stash copied ${p.name}'s ${p.heldItem.name}!`);
          }
          
          p.heldItem = undefined;
      }
      if (p.heldItem?.id === 'oran-berry' && p.currentHp <= p.maxHp / 2) {
          const heal = 10;
          p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
          logs.push(`${p.name} consumed its Oran Berry and restored HP!`);
          p.heldItem = undefined;
      }
      if (p.heldItem?.id === 'pecha-berry' && (p.status === 'poison' || p.status === 'toxic')) {
          p.status = undefined;
          logs.push(`${p.name} consumed its Pecha Berry and cured its poison!`);
          p.heldItem = undefined;
      }
      if (p.heldItem?.id === 'cheri-berry' && p.status === 'paralysis') {
          p.status = undefined;
          logs.push(`${p.name} consumed its Cheri Berry and cured its paralysis!`);
          p.heldItem = undefined;
      }
      if (p.heldItem?.id === 'chesto-berry' && p.status === 'sleep') {
          p.status = undefined;
          logs.push(`${p.name} consumed its Chesto Berry and woke up!`);
          p.heldItem = undefined;
      }
      if (p.heldItem?.id === 'rawst-berry' && p.status === 'burn') {
          p.status = undefined;
          logs.push(`${p.name} consumed its Rawst Berry and cured its burn!`);
          p.heldItem = undefined;
      }
      if (p.heldItem?.id === 'aspear-berry' && p.status === 'freeze') {
          p.status = undefined;
          logs.push(`${p.name} consumed its Aspear Berry and defrosted!`);
          p.heldItem = undefined;
      }
      if (p.heldItem?.id === 'persim-berry' && p.confusionTurns && p.confusionTurns > 0) {
          p.confusionTurns = 0;
          logs.push(`${p.name} consumed its Persim Berry and cured its confusion!`);
          p.heldItem = undefined;
      }
      if (p.heldItem?.id === 'lum-berry' && (p.status || (p.confusionTurns && p.confusionTurns > 0))) {
          const oldStatus = p.status || 'confusion';
          p.status = undefined;
          p.confusionTurns = 0;
          logs.push(`${p.name} consumed its Lum Berry and cured its ${oldStatus}!`);

          // Symmetry Ability: Share berry effect with ally
          if (p.ability.name === 'Symmetry' && ally) {
              ally.status = undefined;
              ally.confusionTurns = 0;
              logs.push(`${ally.name} was also cured due to Symmetry!`);
          }

          // Stash Ability: Copy ally's berry
          if (ally && ally.ability.name === 'Stash' && !ally.heldItem) {
              ally.heldItem = { ...p.heldItem };
              logs.push(`${ally.name}'s Stash copied ${p.name}'s ${p.heldItem.name}!`);
          }

          p.heldItem = undefined;
      }
  };

  const applyHazards = (p: Pokemon, isPlayer: boolean, hazards: string[], tempLogs: string[]) => {
      if (p.isFainted) return;
      if (p.heldItem?.id === 'heavy-duty-boots') return;
      if (p.ability.name === 'HazardEater') {
          const heal = Math.floor(p.maxHp / 8);
          p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
          tempLogs.push(`${p.name}'s Hazard Eater restored its HP!`);
          return;
      }
      if (hazards.includes('Stealth Rock')) {
          const effectiveness = getDamageMultiplier('Rock', p, undefined, 'none', 'none');
          const damage = Math.floor(p.maxHp * 0.125 * effectiveness);
          p.currentHp = Math.max(0, p.currentHp - damage);
          tempLogs.push(`${p.name} was hurt by the Stealth Rocks!`);
      }
      if (hazards.includes('Spikes')) {
          const spikesCount = hazards.filter(h => h === 'Spikes').length;
          const damageMult = spikesCount === 1 ? 0.125 : (spikesCount === 2 ? 0.166 : 0.25);
          if (!p.types.includes('flying') && p.ability.name !== 'Levitate' && p.heldItem?.id !== 'heavy-duty-boots') {
              const damage = Math.floor(p.maxHp * damageMult);
              p.currentHp = Math.max(0, p.currentHp - damage);
              tempLogs.push(`${p.name} was hurt by the Spikes!`);
          }
      }
      if (hazards.includes('Toxic Spikes') && !p.status) {
          if (!p.types.includes('flying') && p.ability.name !== 'Levitate' && p.heldItem?.id !== 'heavy-duty-boots') {
              if (p.types.includes('poison')) {
                  setBattleState(prev => ({
                      ...prev,
                      [isPlayer ? 'playerHazards' : 'enemyHazards']: (prev[isPlayer ? 'playerHazards' : 'enemyHazards'] || []).filter(h => h !== 'Toxic Spikes')
                  }));
                  tempLogs.push(`${p.name} absorbed the Toxic Spikes!`);
              } else if (!p.types.includes('steel')) {
                  const tsCount = hazards.filter(h => h === 'Toxic Spikes').length;
                  p.status = tsCount === 1 ? 'poison' : 'toxic';
                  tempLogs.push(`${p.name} was poisoned by the Toxic Spikes!`);
              }
          }
      }
      if (hazards.includes('Sticky Web')) {
          if (!p.types.includes('flying') && p.ability.name !== 'Levitate' && p.heldItem?.id !== 'heavy-duty-boots') {
              if (p.statStages) {
                  p.statStages.speed = Math.max(-6, (p.statStages.speed || 0) - 1);
                  tempLogs.push(`${p.name} was caught in the Sticky Web!`);
              }
          }
      }
  };

  async function executeTurn() {
    try {
    const { pendingMoves, playerTeam, enemyTeam } = battleState;
    console.log('--- Executing Turn ---');
    console.log('Pending Moves:', pendingMoves);
    
    // Enemy AI - Limit to first 2 active slots
    let enemyMoves: any[] = [];
    if (isMultiplayerBattle) {
        if (remoteBattleActions.length === 0) {
            console.log("Waiting for remote action...");
            return;
        }
        enemyMoves = remoteBattleActions;
    } else {
        enemyMoves = enemyTeam.slice(0, 2).map((mon, i) => {
       if(mon.isFainted) return null;

       // Check for Fusion Charge
       if (battleState.enemyFusionChargeActive) {
           const partnerIndex = enemyTeam.findIndex((p, idx) => idx !== i && idx < 2 && !p.isFainted);
           if (partnerIndex !== -1) {
               const partner = enemyTeam[partnerIndex];
               const fMove = getFusionMove(mon.types[0], partner.types[0]);
               if (fMove) {
                   const moveData: PokemonMove = {
                       name: fMove.name,
                       url: '',
                       power: fMove.power,
                       accuracy: fMove.accuracy,
                       type: fMove.resultType,
                       damage_class: fMove.category.toLowerCase() as any,
                       isFusion: true
                   };
                   return { actorIndex: i, targetIndex: Math.floor(Math.random() * Math.min(2, playerTeam.length)), move: moveData, isPlayer: false, isFusion: true, speed: 999, priority: 0 };
               }
           }
       }

       const valid = mon.moves.filter(m=>m.pp && m.pp>0);
       let move = valid.length>0 ? valid[Math.floor(Math.random()*valid.length)] : {name:'struggle', url:'', power:50, type:'normal', damage_class:'physical', priority: 0};
       
       if (mon.heldItem?.id.startsWith('choice-') && mon.choiceMove) {
           const lockedMove = mon.moves.find(m => m.name === mon.choiceMove);
           if (lockedMove && lockedMove.pp && lockedMove.pp > 0) {
               move = lockedMove;
           } else {
               move = {name:'struggle', url:'', power:50, type:'normal', damage_class:'physical', priority: 0};
           }
       }
       
       // Speed reduction from paralysis
       let speed = mon.stats.speed;
       if (mon.status === 'paralysis') speed *= 0.5;
       if (mon.heldItem?.id === 'choice-scarf') speed *= 1.5;
       if (mon.heldItem?.id === 'lagging-tail') speed *= 0.5;
       if (mon.heldItem?.id === 'iron-ball') speed *= 0.5;

       // Shared Nerves: When user is paralyzed, ally's Speed is doubled
       const allyIdx = 1 - i;
       const ally = enemyTeam[allyIdx];
       if (ally && !ally.isFainted && ally.status === 'paralysis' && mon.ability.name === 'SharedNerves') {
           speed *= 2;
       }

       // Cooldown Cover: Speed doubled while ally is recharging
       if (ally && !ally.isFainted && ally.mustRecharge && mon.ability.name === 'CooldownCover') {
           speed *= 2;
       }

       // Threat Matrix: Speed increased by 50% if opponent has higher Attack or Sp. Atk
       if (mon.ability.name === 'ThreatMatrix') {
           const opponents = playerTeam.filter(o => o && !o.isFainted);
           const hasHigherOffense = opponents.some(o => o.stats.attack > mon.stats.attack || o.stats.specialAttack > mon.stats.specialAttack);
           if (hasHigherOffense) speed *= 1.5;
       }

       let priority = move.priority || 0;
       
       // Thunderous Step Ability
       if (mon.ability.name === 'ThunderousStep' && mon.currentHp === mon.maxHp && move.type === 'Electric') {
           priority += 1;
       }

       // Link Conduit Ability (Backline)
       const backline = enemyTeam.filter(p => p && !p.isFainted && p.id !== mon.id);
       if (backline.some(p => p.ability.name === 'LinkConduit') && move.name.toLowerCase().includes('link')) {
           priority += 1;
       }

       if (mon.nextMovePriorityBoost) {
           priority += 1;
           mon.nextMovePriorityBoost = false; // Reset
       }

       return { actorIndex: i, targetIndex: Math.floor(Math.random() * Math.min(2, playerTeam.length)), move, isPlayer: false, speed, priority };
    }).filter(m => m !== null);
    }

    console.log('Enemy Moves:', enemyMoves);

    const fullQueue = [...pendingMoves, ...enemyMoves].map(action => {
        const team = action.isPlayer ? playerTeam : enemyTeam;
        const actor = team[action.actorIndex];
        if (actor.heldItem?.id === 'quick-claw' && Math.random() < 0.2) {
            return { ...action, quickClawActivated: true };
        }
        return action;
    }).sort((a,b) => {
         if (a.priority !== b.priority) return b.priority - a.priority;
         if (a.quickClawActivated && !b.quickClawActivated) return -1;
         if (!a.quickClawActivated && b.quickClawActivated) return 1;
         if (battleState.trickRoomTurns && battleState.trickRoomTurns > 0) {
             return a.speed - b.speed;
         }
         return b.speed - a.speed;
     });

    console.log('Full Queue:', fullQueue);
    
    let tempPTeam = JSON.parse(JSON.stringify(playerTeam));
    let tempETeam = JSON.parse(JSON.stringify(enemyTeam));
    let tempLogs = [...battleState.logs];

    // Reset turn flags
    tempPTeam.forEach((p: Pokemon) => { if (p) { p.hasMovedThisTurn = false; p.tookDamageThisTurn = false; p.isProtected = false; } });
    tempETeam.forEach((p: Pokemon) => { if (p) { p.hasMovedThisTurn = false; p.tookDamageThisTurn = false; p.isProtected = false; } });

    // Synergy Check: If both players use moves of the same type, they get a boost
    const playerActions = pendingMoves.filter(m => m.isPlayer && m.move);
    if (playerActions.length === 2) {
        const a1 = playerActions[0];
        const a2 = playerActions[1];
        if (a1.move && a2.move && a1.move.type === a2.move.type && a1.move.type !== 'normal') {
            tempLogs.push(`SYNERGY! ${a1.move.type.toUpperCase()} moves are boosted!`);
            // Boost power for this turn - Reduced from 1.08 to 1.05 to prevent dominance
            a1.move = { ...a1.move, power: (a1.move.power || 0) * 1.05 };
            a2.move = { ...a2.move, power: (a2.move.power || 0) * 1.05 };
        }
    }

    let gameOver = false;
    let victory = false;

    // Helper to update React state mid-loop and wait
    const syncState = async (ms: number = 300) => {
         setBattleState(prev => ({ ...prev, playerTeam: tempPTeam, enemyTeam: tempETeam, logs: tempLogs.slice(-6), vfx: prev.vfx }));
         await delay(ms); 
    }

    const setVFX = async (type: string, target: 'player' | 'enemy', index: number) => {
        setBattleState(prev => ({ ...prev, vfx: { type, target, index } }));
        await delay(500);
        setBattleState(prev => ({ ...prev, vfx: null }));
    }

    const setDamageVFX = async (target: 'player' | 'enemy', index: number, damage: number, isCrit: boolean, effectiveness: number) => {
        const isSuper = effectiveness > 1;
        const isNotVery = effectiveness < 1 && effectiveness > 0;
        
        setBattleState(prev => ({ 
            ...prev, 
            vfx: { 
                type: 'damage', 
                target, 
                index, 
                damage, 
                isCrit, 
                isSuperEffective: isSuper, 
                isNotVeryEffective: isNotVery 
            },
            screenShake: damage > 20 // Shake on significant hits
        }));
        await delay(800);
        setBattleState(prev => ({ ...prev, vfx: null, screenShake: false }));
    }

    for (const action of fullQueue as any[]) {
            // Re-check game state
            if (tempPTeam.every((p: Pokemon) => p.isFainted)) { gameOver = true; break; }
            if (tempETeam.every((p: Pokemon) => p.isFainted)) { victory = true; break; }
            
            let actor = action.isPlayer ? tempPTeam[action.actorIndex] : tempETeam[action.actorIndex];
            if (!actor) {
                console.warn(`Actor at index ${action.actorIndex} is undefined. Skipping action.`);
                continue;
            }
            if (actor.isFainted) continue;

            if (actor.mustRecharge) {
                actor.mustRecharge = false;
                tempLogs.push(`${actor.name} must recharge!`);
                await syncState(800);
                continue;
            }

            if (actor.isFlinching) {
                actor.isFlinching = false;
                tempLogs.push(`${actor.name} flinched and couldn't move!`);
                await syncState(800);
                continue;
            }

            actor.hasMovedThisTurn = true;
            actor.isDestinyBondActive = false;

            if (actor.chargingMove) {
                action.move = actor.chargingMove;
                actor.chargingMove = undefined;
                actor.isInvulnerable = false;
                tempLogs.push(`${actor.name} executed ${action.move.name}!`);
            }

            // Handle Switch Action
            if (action.switchIndex !== undefined) {
                const isPlayer = action.isPlayer;
                const activeTeam = isPlayer ? tempPTeam : tempETeam;
                const oldMon = activeTeam[action.actorIndex];
                const newMon = activeTeam[action.switchIndex];
                
                tempLogs.push(`${oldMon.name}, come back!`);
                
                // Trapped check
                if (oldMon.isTrapped && oldMon.isTrapped > 0 && oldMon.ability.name !== 'PhaseStep') {
                    tempLogs.push(`${oldMon.name} is trapped and cannot switch!`);
                    await syncState(800);
                    continue;
                }

                // Regenerator Ability
                if (oldMon.ability.name === 'Regenerator' && !oldMon.isFainted) {
                    const heal = Math.floor(oldMon.maxHp / 3);
                    oldMon.currentHp = Math.min(oldMon.maxHp, oldMon.currentHp + heal);
                    tempLogs.push(`${oldMon.name}'s Regenerator restored its HP!`);
                }

                // Reset stats and turn-based effects when switching out (unless Baton Pass)
                if (!battleState.isBatonPass) {
                    oldMon.statStages = {
                        attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0, accuracy: 0, evasion: 0
                    };
                    oldMon.toxicTurns = 0;
                    oldMon.isProtected = false;
                    oldMon.isInvulnerable = false;
                    oldMon.isTrapped = 0;
                    oldMon.confusionTurns = 0;
                    oldMon.isLeechSeeded = false;
                    oldMon.isCursed = false;
                    oldMon.isNightmareActive = false;
                    oldMon.perishTurns = undefined;
                    oldMon.futureSightTurns = undefined;
                    oldMon.hasMovedThisTurn = false;
                    oldMon.tookDamageThisTurn = false;
                    oldMon.isDestinyBondActive = false;
                    oldMon.ignoresProtect = false;
                    oldMon.usedSacrificialGuard = false;
                    oldMon.usedTrickMirror = false;
                    oldMon.usedBackdraftClause = false;
                    oldMon.substituteHp = 0;
                } else {
                    // Copy effects to newMon (Baton Pass)
                    newMon.statStages = { ...oldMon.statStages };
                    newMon.confusionTurns = oldMon.confusionTurns;
                    newMon.isLeechSeeded = oldMon.isLeechSeeded;
                    newMon.substituteHp = oldMon.substituteHp;
                    newMon.isCursed = oldMon.isCursed;
                    newMon.perishTurns = oldMon.perishTurns;
                    newMon.isNightmareActive = oldMon.isNightmareActive;
                    newMon.isTrapped = oldMon.isTrapped;
                    
                    // Reset oldMon anyway for future use
                    oldMon.statStages = { attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0, accuracy: 0, evasion: 0 };
                    oldMon.toxicTurns = 0;
                    oldMon.isProtected = false;
                    oldMon.isInvulnerable = false;
                    oldMon.isTrapped = 0;
                    oldMon.confusionTurns = 0;
                    oldMon.isLeechSeeded = false;
                    oldMon.isCursed = false;
                    oldMon.isNightmareActive = false;
                    oldMon.perishTurns = undefined;
                    oldMon.futureSightTurns = undefined;
                    oldMon.substituteHp = 0;
                }
                
                // Clear Baton Pass flag
                setBattleState(prev => ({ ...prev, isBatonPass: false }));

                // Tag Cleanse: When user switches out, its ally's status is cured
                if (oldMon.ability.name === 'TagCleanse') {
                    const allyIdx = 1 - action.actorIndex;
                    const ally = activeTeam[allyIdx];
                    if (ally && !ally.isFainted && ally.status) {
                        ally.status = undefined;
                        tempLogs.push(`${oldMon.name}'s Tag Cleanse cured ${ally.name}'s status!`);
                    }
                }

                tempLogs.push(`Go, ${newMon.name}!`);
                
                // Swap in the team array
                const newTeam = [...activeTeam];
                const temp = newTeam[action.actorIndex];
                newTeam[action.actorIndex] = newTeam[action.switchIndex];
                newTeam[action.switchIndex] = temp;
                
                if (isPlayer) tempPTeam = newTeam;
                else tempETeam = newTeam;

                // Healing Wish / Lunar Dance
                if (isPlayer && battleState.isHealingWishActive) {
                    newMon.currentHp = newMon.maxHp;
                    newMon.status = undefined;
                    tempLogs.push(`${newMon.name} was healed by the Healing Wish!`);
                    setBattleState(prev => ({ ...prev, isHealingWishActive: false }));
                }
                if (isPlayer && battleState.isLunarDanceActive) {
                    newMon.currentHp = newMon.maxHp;
                    newMon.status = undefined;
                    tempLogs.push(`${newMon.name} was healed by the Lunar Dance!`);
                    setBattleState(prev => ({ ...prev, isLunarDanceActive: false }));
                }
                if (!isPlayer && battleState.enemyIsHealingWishActive) {
                    newMon.currentHp = newMon.maxHp;
                    newMon.status = undefined;
                    tempLogs.push(`${newMon.name} was healed by the Healing Wish!`);
                    setBattleState(prev => ({ ...prev, enemyIsHealingWishActive: false }));
                }
                if (!isPlayer && battleState.enemyIsLunarDanceActive) {
                    newMon.currentHp = newMon.maxHp;
                    newMon.status = undefined;
                    tempLogs.push(`${newMon.name} was healed by the Lunar Dance!`);
                    setBattleState(prev => ({ ...prev, enemyIsLunarDanceActive: false }));
                }
                
                playCry(newMon.id, newMon.name);
                await syncState(500);

                // Arc Surge Ability
                if (newMon.ability.name === 'ArcSurge') {
                    setBattleState(prev => ({
                        ...prev,
                        [isPlayer ? 'electricSquallTurns' : 'enemyElectricSquallTurns']: 1
                    }));
                    tempLogs.push(`${newMon.name}'s Arc Surge created an electric squall!`);
                    
                    // Damage flying types
                    const foes = isPlayer ? tempETeam : tempPTeam;
                    foes.forEach(f => {
                        if (f && !f.isFainted && f.types.includes('flying')) {
                            const damage = Math.floor(f.maxHp / 8);
                            f.currentHp = Math.max(0, f.currentHp - damage);
                            tempLogs.push(`${f.name} was buffeted by the electric squall!`);
                        }
                    });
                }

                // Jetstream Ability
                if (newMon.ability.name === 'Jetstream' && !newMon.hasUsedJetstream) {
                    setBattleState(prev => ({
                        ...prev,
                        [isPlayer ? 'tailwindTurns' : 'enemyTailwindTurns']: 1
                    }));
                    newMon.hasUsedJetstream = true;
                    tempLogs.push(`${newMon.name}'s Jetstream set a one-turn Tailwind!`);
                }

                // Venomous Aura Ability
                if (newMon.ability.name === 'VenomousAura') {
                    const foes = isPlayer ? tempETeam : tempPTeam;
                    foes.forEach(f => {
                        if (f && !f.isFainted && !f.status && Math.random() < 0.3) {
                            f.status = 'poison';
                            tempLogs.push(`${newMon.name}'s Venomous Aura poisoned ${f.name}!`);
                        }
                    });
                }
                
                // Antibody Relay: When switching in, if ally is poisoned, cure it and boost own stats
                if (newMon.ability.name === 'AntibodyRelay') {
                    const allyIdx = 1 - action.actorIndex;
                    const ally = activeTeam[allyIdx];
                    if (ally && !ally.isFainted && ally.status === 'poison') {
                        ally.status = undefined;
                        if (newMon.statStages) {
                            newMon.statStages.attack = Math.min(6, (newMon.statStages.attack || 0) + 1);
                            newMon.statStages['special-attack'] = Math.min(6, (newMon.statStages['special-attack'] || 0) + 1);
                        }
                        tempLogs.push(`${newMon.name}'s Antibody Relay cured ${ally.name} and boosted its own stats!`);
                    }
                }
                
                const p = newMon;
                // --- HAZARDS ---
                applyHazards(newMon, isPlayer, isPlayer ? (battleState.playerHazards || []) : (battleState.enemyHazards || []), tempLogs);

                // --- ENTRY ABILITIES ON SWITCH ---
                if (p.ability.name === 'Drizzle') { tempLogs.push(`${p.name}'s Drizzle summoned rain!`); setBattleState(prev => ({ ...prev, weather: 'rain', weatherTurns: 5 })); }
                if (p.ability.name === 'Drought') { tempLogs.push(`${p.name}'s Drought summoned sun!`); setBattleState(prev => ({ ...prev, weather: 'sun', weatherTurns: 5 })); }
                if (p.ability.name === 'SandStream') { tempLogs.push(`${p.name}'s Sand Stream summoned a sandstorm!`); setBattleState(prev => ({ ...prev, weather: 'sand', weatherTurns: 5 })); }
                if (p.ability.name === 'SnowWarning') { tempLogs.push(`${p.name}'s Snow Warning summoned snow!`); setBattleState(prev => ({ ...prev, weather: 'hail', weatherTurns: 5 })); }
                if (p.ability.name === 'ArcSurge') { tempLogs.push(`${p.name}'s Arc Surge summoned an electric squall!`); setBattleState(prev => ({ ...prev, weather: 'electric', weatherTurns: 5 })); }
                if (p.ability.name === 'Ashstorm') { tempLogs.push(`${p.name}'s Ashstorm summoned an ashstorm!`); setBattleState(prev => ({ ...prev, weather: 'ashstorm', weatherTurns: 5 })); }
                
                if (p.ability.name === 'Jetstream') {
                    setBattleState(prev => ({ ...prev, tailwindTurns: 2 }));
                    tempLogs.push(`${p.name}'s Jetstream whipped up a tailwind!`);
                }
                if (p.ability.name === 'SyncBoost') {
                    setBattleState(prev => ({ ...prev, comboMeter: Math.min(100, prev.comboMeter + 10) }));
                    tempLogs.push(`${p.name}'s Sync Boost charged the Sync Gauge!`);
                }
                if (p.ability.name === 'AegisField' || p.ability.name === 'BacklineGuard') {
                    if (isPlayer) setBattleState(prev => ({ ...prev, aegisFieldTurns: 1 }));
                    else setBattleState(prev => ({ ...prev, enemyAegisFieldTurns: 1 }));
                    tempLogs.push(`${p.name}'s ${p.ability.name} is protecting the team!`);
                }
                if (p.ability.name === 'HazardEater') {
                    // Simplified: heal on switch-in
                    const heal = Math.floor(p.maxHp / 8);
                    p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
                    tempLogs.push(`${p.name}'s Hazard Eater restored its HP!`);
                }
                if (p.ability.name === 'TagCleanse') {
                    if (p.status) {
                        p.status = undefined;
                        tempLogs.push(`${p.name}'s Tag Cleanse cured its status!`);
                    }
                }
                if (p.ability.name === 'QuietZone') {
                    setBattleState(prev => ({ ...prev, quietZoneTurns: 5 }));
                    tempLogs.push(`${p.name}'s Quiet Zone silenced the battlefield!`);
                }
                if (p.ability.name === 'ArcSurge') {
                    if (isPlayer) setBattleState(prev => ({ ...prev, electricSquallTurns: 1 }));
                    else setBattleState(prev => ({ ...prev, enemyElectricSquallTurns: 1 }));
                    tempLogs.push(`${p.name}'s Arc Surge created an electric squall!`);
                    const targets = isPlayer ? tempETeam.slice(0, 2) : tempPTeam.slice(0, 2);
                    targets.forEach(t => {
                        if (t && !t.isFainted && t.types.includes('flying')) {
                            t.currentHp = Math.max(0, t.currentHp - Math.floor(t.maxHp / 8));
                            tempLogs.push(`${t.name} was hurt by the electric squall!`);
                        }
                    });
                }
                if (p.ability.name === 'Jetstream') {
                    if (isPlayer) setBattleState(prev => ({ ...prev, tailwindTurns: 1 }));
                    else setBattleState(prev => ({ ...prev, enemyTailwindTurns: 1 }));
                    tempLogs.push(`${p.name}'s Jetstream set a tailwind!`);
                }
                if (p.ability.name === 'AegisField') {
                    if (isPlayer) setBattleState(prev => ({ ...prev, aegisFieldTurns: 1 }));
                    else setBattleState(prev => ({ ...prev, enemyAegisFieldTurns: 1 }));
                    tempLogs.push(`${p.name}'s Aegis Field protects the team!`);
                }
                if (p.ability.name === 'RuneWard') {
                    if (isPlayer) setBattleState(prev => ({ ...prev, runeWardTurns: 5 }));
                    else setBattleState(prev => ({ ...prev, enemyRuneWardTurns: 5 }));
                    tempLogs.push(`${p.name}'s Rune Ward protects the team from stat drops!`);
                }
                if (p.ability.name === 'MysticFog') {
                    setBattleState(prev => ({ ...prev, mysticFogActive: true }));
                    tempLogs.push(`${p.name}'s Mystic Fog lowered Accuracy for everyone!`);
                    [...tempPTeam, ...tempETeam].forEach(t => {
                        if (t && !t.isFainted && t.statStages) {
                            t.statStages.accuracy = Math.max(-6, (t.statStages.accuracy || 0) - 1);
                        }
                    });
                }
                if (p.ability.name === 'SyncBoost') {
                    if (isPlayer) setBattleState(prev => ({ ...prev, comboMeter: Math.min(100, prev.comboMeter + 10) }));
                    else setBattleState(prev => ({ ...prev, enemyComboMeter: Math.min(100, prev.enemyComboMeter + 10) }));
                    tempLogs.push(`${p.name}'s Sync Boost charged the gauge!`);
                }
                if (p.ability.name === 'VenomousAura') {
                    tempETeam.slice(0, 2).forEach(t => {
                        if (!t.status && !t.isFainted && !t.types.includes('poison') && !t.types.includes('steel')) {
                            t.status = 'poison';
                            tempLogs.push(`${t.name} was poisoned by ${p.name}'s Venomous Aura!`);
                        }
                    });
                }
                if (p.ability.name === 'MysticFog') {
                    setBattleState(prev => ({ ...prev, mysticFogActive: true }));
                    tempLogs.push(`${p.name}'s Mystic Fog lowered Accuracy for everyone!`);
                    [...tempPTeam, ...tempETeam].forEach(t => {
                        if (t && !t.isFainted && t.statStages) {
                            t.statStages.accuracy = Math.max(-6, (t.statStages.accuracy || 0) - 1);
                        }
                    });
                }
                if (p.ability.name === 'Intimidate') {
                    const targets = isPlayer ? tempETeam.slice(0, 2) : tempPTeam.slice(0, 2);
                    targets.forEach(t => {
                        if (!t.isFainted && t.statStages) {
                            t.statStages.attack = Math.max(-6, (t.statStages.attack || 0) - 1);
                            tempLogs.push(`${p.name}'s Intimidate lowered ${t.name}'s Attack!`);
                            if (t.heldItem?.id === 'adrenaline-orb') {
                                t.statStages.speed = Math.min(6, (t.statStages.speed || 0) + 1);
                                tempLogs.push(`${t.name}'s Adrenaline Orb boosted its Speed!`);
                                t.heldItem = undefined;
                            }
                        }
                    });
                }
                if (p.ability.name === 'RuneWard') {
                    if (isPlayer) setBattleState(prev => ({ ...prev, runeWardTurns: 5 }));
                    else setBattleState(prev => ({ ...prev, enemyRuneWardTurns: 5 }));
                    tempLogs.push(`${p.name}'s Rune Ward protects the team from stat drops!`);
                }
                if (p.ability.name === 'MysticHusk' && p.currentHp >= p.maxHp * 0.75) {
                    tempLogs.push(`${p.name}'s Mystic Husk is active!`);
                }
                if (p.ability.name === 'TideTurner' && battleState.weather === 'rain') {
                    if (p.statStages) {
                        p.statStages.speed = Math.min(6, (p.statStages.speed || 0) + 1);
                        tempLogs.push(`${p.name}'s Tide Turner raised its Speed!`);
                    }
                }
                if (p.ability.name === 'GloomWard') {
                    tempLogs.push(`${p.name}'s Gloom Ward protects it from confusion and sleep!`);
                }
                if (p.ability.name === 'ScaleAegis') {
                    tempLogs.push(`${p.name}'s Scale Aegis protects its Defense!`);
                }
                if ((p.ability.name === 'Protosynthesis' || p.ability.name === 'QuarkDrive') && p.heldItem?.id === 'booster-energy') {
                    tempLogs.push(`${p.name}'s Booster Energy activated!`);
                    p.heldItem = undefined;
                    p.isBoosterEnergyActive = true;
                }
                if (p.ability.name === 'ThreatMatrix') {
                    const targets = isPlayer ? tempETeam.slice(0, 2) : tempPTeam.slice(0, 2);
                    targets.forEach(t => {
                        if (!t.isFainted) {
                            const moves = t.moves.map(m => m.name).join(', ');
                            tempLogs.push(`${p.name}'s Threat Matrix revealed ${t.name}'s moves: ${moves}`);
                        }
                    });
                }
                if (p.ability.name === 'QuietZone') {
                    setBattleState(prev => ({ ...prev, quietZoneTurns: 5 }));
                    tempLogs.push(`${p.name}'s Quiet Zone silenced the battlefield!`);
                }
                if (p.ability.name === 'BacklineGuard') {
                    if (isPlayer) setBattleState(prev => ({ ...prev, playerBacklineGuard: true }));
                    else setBattleState(prev => ({ ...prev, enemyBacklineGuard: true }));
                    tempLogs.push(`${p.name}'s Backline Guard is protecting the team!`);
                }
                if (p.ability.name === 'PartnerBoost') {
                    const allyIdx = 1 - action.actorIndex;
                    const ally = activeTeam[allyIdx];
                    if (ally && !ally.isFainted && ally.statStages) {
                        const stats: (keyof StatStages)[] = ['attack', 'defense', 'special-attack', 'special-defense', 'speed'];
                        const highestStat = stats.reduce((a, b) => (ally.stats[a] > ally.stats[b] ? a : b));
                        ally.statStages[highestStat] = Math.min(6, (ally.statStages[highestStat] || 0) + 1);
                        tempLogs.push(`${p.name}'s Partner Boost raised ${ally.name}'s ${highestStat}!`);
                    }
                }
                if (p.ability.name === 'ShieldWall') {
                    const allyIdx = 1 - action.actorIndex;
                    const ally = activeTeam[allyIdx];
                    [p, ally].forEach(mon => {
                        if (mon && !mon.isFainted && mon.statStages) {
                            mon.statStages.defense = Math.min(6, (mon.statStages.defense || 0) + 1);
                            mon.statStages['special-defense'] = Math.min(6, (mon.statStages['special-defense'] || 0) + 1);
                        }
                    });
                    tempLogs.push(`${p.name}'s Shield Wall boosted the team's defenses!`);
                }
                if (p.ability.name === 'Vanguard') {
                    if (p.statStages) {
                        p.statStages.attack = Math.min(6, (p.statStages.attack || 0) + 1);
                        p.statStages.speed = Math.min(6, (p.statStages.speed || 0) + 1);
                    }
                    tempLogs.push(`${p.name}'s Vanguard boosted its Attack and Speed!`);
                }
                if (p.ability.name === 'BatteryPack') {
                    const allyIdx = 1 - action.actorIndex;
                    const ally = activeTeam[allyIdx];
                    if (ally && !ally.isFainted && ally.statStages) {
                        ally.statStages['special-attack'] = Math.min(6, (ally.statStages['special-attack'] || 0) + 1);
                        tempLogs.push(`${p.name}'s Battery Pack boosted ${ally.name}'s Sp. Atk!`);
                    }
                }
                if (p.ability.name === 'SmogLung') {
                    const foes = isPlayer ? tempETeam : tempPTeam;
                    foes.slice(0, 2).forEach(f => {
                        if (f && !f.isFainted && f.statStages) {
                            f.statStages.attack = Math.max(-6, (f.statStages.attack || 0) - 1);
                            tempLogs.push(`${p.name}'s Smog Lung lowered ${f.name}'s Attack!`);
                        }
                    });
                }
                await syncState(1000);
                continue;
            }

            if (actor.isFlinching) {
                tempLogs.push(`${actor.name} flinched and couldn't move!`);
                await syncState(800);
                continue;
            }

            // 1. Handle Status Turn (Sleep, Freeze, Paralyze, Confusion)
            const statusCheck = handleStatusTurn(actor);
            if (statusCheck.msg) {
                tempLogs.push(statusCheck.msg);
                await syncState(800);
            }
            checkBerries(actor, tempLogs);
            if (statusCheck.damage) {
                actor.currentHp = Math.max(0, actor.currentHp - statusCheck.damage);
                actor.animationState = 'damage';
                await syncState(500);
                actor.animationState = 'idle';
            }
            if (actor.statusTurns) actor.statusTurns--;
            if (actor.confusionTurns) actor.confusionTurns--;

            if (!statusCheck.canMove) {
                continue;
            }

            if (action.item) {
                const item = ITEMS[action.item];
                if (item && item.category === 'pokeball') {
                    const target = tempETeam[action.targetIndex];
                    if (!target) {
                        tempLogs.push("Target not found!");
                        continue;
                    }
                    if (target.isFainted) { tempLogs.push("Cannot capture fainted!"); continue; }
                    if (battleState.isTrainerBattle) { tempLogs.push("Cannot capture a trainer's Pokémon!"); continue; }
                    
                    if (playerState.run.capturePermits <= 0) {
                        tempLogs.push("No Capture Permits remaining!");
                        continue;
                    }

                    tempLogs.push(`Using a Capture Permit on ${target.name}...`);
                    playMoveSfx('normal');
                    
                    await syncState(1000);

                    let catchMultiplier = 1;
                    // Special balls still give bonuses if you happen to have them from other sources, 
                    // but standard Poké Balls are now just Permits
                    if (action.item === 'great-ball') catchMultiplier = 1.5;
                    else if (action.item === 'ultra-ball') catchMultiplier = 2;
                    else if (action.item === 'master-ball') catchMultiplier = 255;

                    let catchRate = ((3 * target.maxHp - 2 * target.currentHp) * 45 * catchMultiplier) / (3 * target.maxHp) * (target.status ? 1.5 : 1);
                    
                    // Rift Upgrade Capture Boost
                    if (action.isPlayer) {
                        catchRate *= (1 + (playerState.meta.upgrades.captureBoost * 0.05));
                    }
                    
                    if (Math.random() * 255 < catchRate || action.item === 'master-ball') {
                        playCry(target.id, target.name);
                        tempLogs.push(`Gotcha! ${target.name} was caught!`);
                        target.isFainted = true;
                        
                        setPlayerState(prev => ({
                            ...prev,
                            run: {
                                ...prev.run,
                                capturePermits: prev.run.capturePermits - 1,
                                totalCaptures: prev.run.totalCaptures + 1
                            }
                        }));

                        // Catch XP Bonus for the whole team - Massively boosted to encourage catching over grinding
                        const catchXp = Math.floor((target.baseStats.hp * target.level) * 12);
                        const playerLevelCap = 15 + playerState.badges * 10;
                        const avgLevel = playerState.team.reduce((a, b) => a + b.level, 0) / playerState.team.length;
                        
                        for (const p of tempPTeam) {
                            if (!p.isFainted) {
                                const r = await gainExperience(p, catchXp, playerLevelCap, avgLevel);
                                Object.assign(p, r.mon);
                            }
                        }

                        const newMon = JSON.parse(JSON.stringify(target));
                        newMon.isFainted = false;
                        newMon.currentHp = newMon.maxHp;
                        newMon.status = undefined;
                        
                        setPlayerState(prev => {
                            if (prev.team.length < 6) {
                                return { ...prev, team: [...prev.team, newMon] };
                            }
                            return prev;
                        });

                        if (tempETeam.every((p: Pokemon) => p.isFainted)) {
                            victory = true;
                            await syncState(500);
                            break;
                        }
                        await syncState(500);
                    } else {
                        tempLogs.push(`Argh! ${target.name} broke free!`);
                        await syncState(500);
                    }
                    continue;
                }
                if (item && item.category === 'healing') {
                    let healAmount = 0;
                    let cureStatus = false;
                    
                    if (action.item === 'potion') healAmount = 20;
                    else if (action.item === 'super-potion') healAmount = 60;
                    else if (action.item === 'hyper-potion') healAmount = 120;
                    else if (action.item === 'max-potion') healAmount = actor.maxHp;
                    else if (action.item === 'full-restore') { healAmount = actor.maxHp; cureStatus = true; }
                    
                    if (action.isPlayer && healAmount > 0 && healAmount < actor.maxHp) {
                        healAmount = Math.floor(healAmount * (1 + (playerState.meta.upgrades.healingBoost * 0.05)));
                    }
                    
                    actor.currentHp = Math.min(actor.maxHp, actor.currentHp + healAmount);
                    if (cureStatus) actor.status = undefined;
                    
                    tempLogs.push(`${actor.name} used ${item.name} and restored HP!`);
                    
                    // Decrement inventory
                    setPlayerState(prev => {
                        const newInv = { ...prev.inventory };
                        if (action.item === 'potion') newInv.potions = Math.max(0, newInv.potions - 1);
                        else {
                            const idx = newInv.items.indexOf(action.item!);
                            if (idx > -1) {
                                const updatedItems = [...newInv.items];
                                updatedItems.splice(idx, 1);
                                newInv.items = updatedItems;
                            }
                        }
                        return { ...prev, inventory: newInv };
                    });

                    await syncState(800);
                    continue;
                }

                console.warn(`Unknown item action: ${action.item}. Skipping.`);
                continue;
            }

            // Flinch check
            if (actor.isFlinching) {
                tempLogs.push(`${actor.name} flinched and couldn't move!`);
                actor.isFlinching = false;
                await syncState(800);
                continue;
            }

            if (!action.move) {
                console.warn("Action has no move. Skipping.");
                continue;
            }

            // Move Logic
            actor.lastMoveMissed = false;
            const targetTeam = action.isPlayer ? tempETeam : tempPTeam;
            const isBothFoes = action.move.target === 'Both foes' || action.move.target === 'all-opponents';
            const targetsToHit = isBothFoes ? targetTeam.filter((t: Pokemon) => !t.isFainted) : [targetTeam[action.targetIndex]];
            
            if (targetsToHit.length === 0 || targetsToHit.every(t => !t || t.isFainted)) {
                tempLogs.push(`${actor.name}'s attack missed!`);
                actor.lastMoveMissed = true;
                
                // Mirror Focus
                if (actor.ability.name === 'MirrorFocus') {
                    actor.nextMoveBoosts = { ...actor.nextMoveBoosts, damageMult: 1.5 };
                    tempLogs.push(`${actor.name}'s Mirror Focus boosted its next move!`);
                }

                // Gauge Throttle Ability
                if (actor.ability.name === 'GaugeThrottle') {
                    setBattleState(prev => ({ ...prev, [action.isPlayer ? 'comboMeter' : 'enemyComboMeter']: Math.min(100, (action.isPlayer ? prev.comboMeter : prev.enemyComboMeter) + 5) }));
                    tempLogs.push(`${actor.name}'s Gauge Throttle generated Sync energy!`);
                }

                await syncState(500);
                continue;
            }

            // Sparkjump Ability
            if (actor.ability.name === 'Sparkjump' && (action.move.priority || 0) > 0) {
                if (actor.statStages) {
                    actor.statStages.speed = Math.min(6, (actor.statStages.speed || 0) + 1);
                    tempLogs.push(`${actor.name}'s Sparkjump raised its Speed!`);
                }
            }

            // Hot-Blooded Ability
            if (actor.ability.name === 'HotBlooded' && actor.status === 'burn') {
                const heal = Math.floor(actor.maxHp / 16);
                actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                tempLogs.push(`${actor.name}'s Hot-Blooded restored its HP from the burn!`);
            }

            tempLogs.push(`${actor.name} used ${action.move.name}!`);
            const previousMove = actor.lastMoveName;
            actor.lastMoveName = action.move.name;
            await delay(500);

            // Sealed Move Check
            if (actor.sealedMoveName === action.move.name && actor.sealedTurns && actor.sealedTurns > 0) {
                tempLogs.push(`${actor.name}'s ${action.move.name} is sealed and cannot be used!`);
                await syncState(800);
                continue;
            }

            for (let tIdx = 0; tIdx < targetsToHit.length; tIdx++) {
                let target = targetsToHit[tIdx];
                if (!target || target.isFainted) continue;

                // Determine if moving first relative to targets
                const currentActionIndex = (fullQueue as any[]).indexOf(action);
                const targetsHaveMoved = targetsToHit.some(t => {
                    const targetAction = (fullQueue as any[]).find(a => {
                        const isTargetPlayer = !action.isPlayer;
                        const team = isTargetPlayer ? tempPTeam : tempETeam;
                        return a.isPlayer === isTargetPlayer && team[a.actorIndex] === t;
                    });
                    if (!targetAction) return false;
                    return (fullQueue as any[]).indexOf(targetAction) < currentActionIndex;
                });
                const movingFirst = !targetsHaveMoved;

                // 2. Accuracy Check
                const hits = calculateAccuracy(actor, target, action.move, action.isPlayer, tempPTeam, tempETeam, battleState.weather, movingFirst);
                if (!hits) {
                    tempLogs.push(`${actor.name}'s attack missed ${target.name}!`);
                    actor.lastMoveMissed = true;

                    // Blunder Policy
                    if (actor.heldItem?.id === 'blunder-policy' && actor.statStages) {
                        actor.statStages.speed = Math.min(6, (actor.statStages.speed || 0) + 2);
                        tempLogs.push(`${actor.name}'s Blunder Policy sharply raised its Speed!`);
                        actor.heldItem = undefined;
                    }
                    
                    // Mirror Focus
                    if (actor.ability.name === 'MirrorFocus') {
                        actor.nextMoveBoosts = { ...actor.nextMoveBoosts, damageMult: 1.5 };
                        tempLogs.push(`${actor.name}'s Mirror Focus boosted its next move!`);
                    }

                    // Gauge Throttle Ability
                    if (actor.ability.name === 'GaugeThrottle') {
                        setBattleState(prev => ({ ...prev, [action.isPlayer ? 'comboMeter' : 'enemyComboMeter']: Math.min(100, (action.isPlayer ? prev.comboMeter : prev.enemyComboMeter) + 5) }));
                        tempLogs.push(`${actor.name}'s Gauge Throttle generated Sync energy!`);
                    }

                    await syncState(500);
                    continue;
                }

                // Start Attack Animation (Immutable update)
                const actorIdx = action.actorIndex;
                if (action.isPlayer) {
                    tempPTeam[actorIdx] = { ...tempPTeam[actorIdx], animationState: 'attack' };
                    actor = tempPTeam[actorIdx];
                } else {
                    tempETeam[actorIdx] = { ...tempETeam[actorIdx], animationState: 'attack' };
                    actor = tempETeam[actorIdx];
                }
                
                playMoveSfx(action.move.type);
                const realTargetIndex = targetTeam.findIndex(mon => mon === target);
                await setVFX(action.move.type, action.isPlayer ? 'enemy' : 'player', realTargetIndex);
                await syncState(400); // Wait for attack

                // Iron Blood Ability (Immunity)
                if (target.ability.name === 'IronBlood' && action.move?.type === 'Poison') {
                    tempLogs.push(`${target.name}'s Iron Blood absorbed the poison!`);
                    const heal = Math.floor(target.maxHp / 16);
                    target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
                    await syncState(500);
                    continue;
                }

                const res = calculateDamage(
                    actor, 
                    target, 
                    action.move, 
                    battleState.weather, 
                    battleState.terrain,
                    action.isPlayer ? battleState.comboMeter : battleState.enemyComboMeter,
                    action.isPlayer ? battleState.enemyComboMeter : battleState.comboMeter,
                    action.isPlayer,
                    battleState.tailwindTurns || 0,
                    battleState.enemyTailwindTurns || 0,
                    battleState.aegisFieldTurns || 0,
                    battleState.enemyAegisFieldTurns || 0,
                    movingFirst,
                    tempPTeam,
                    tempETeam,
                    battleState,
                    playerState.meta.upgrades.attackBoost,
                    playerState.meta.upgrades.defenseBoost,
                    playerState.meta.upgrades.speedBoost,
                    playerState.meta.upgrades.critBoost
                );

                // BackdraftClause Ability
                if (res.wasBlockedByProtect && action.isFusion && actor.ability.name === 'BackdraftClause' && !actor.usedBackdraftClause) {
                    actor.usedBackdraftClause = true;
                    actor.ignoresProtect = true;
                    setBattleState(prev => {
                        if (action.isPlayer) return { ...prev, comboMeter: Math.min(100, prev.comboMeter + 20) };
                        else return { ...prev, enemyComboMeter: Math.min(100, prev.enemyComboMeter + 20) };
                    });
                    tempLogs.push(`${actor.name}'s Backdraft Clause activated! Next Link move ignores Protect!`);
                }

                if (res.wasBlockedByProtect) {
                    tempLogs.push(`${target.name} protected itself!`);
                    continue;
                }

                if (res.damage === 0 && action.move.damage_class !== 'status') {
                    tempLogs.push(`It had no effect on ${target.name}!`);
                    continue;
                }

                if (res.damage > 0) {
                    target.tookDamageThisTurn = true;
                }

                let numHits = (res.hits || 1);
                if (actor.ability.name === 'ThreeHitWonder') {
                    numHits = 3;
                }
                let totalDamage = 0;

                // Harmony Engine: Link Gauge gains +20 on hit if allies share primary type
                if (actor.ability.name === 'HarmonyEngine') {
                    const allyIdx = 1 - actorIdx;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted && ally.types[0] === actor.types[0]) {
                        setBattleState(prev => {
                            if (action.isPlayer) {
                                const newMeter = Math.min(100, prev.comboMeter + 20);
                                return { ...prev, comboMeter: newMeter, fusionChargeActive: newMeter === 100 };
                            } else {
                                const newMeter = Math.min(100, prev.enemyComboMeter + 20);
                                return { ...prev, enemyComboMeter: newMeter, enemyFusionChargeActive: newMeter === 100 };
                            }
                        });
                        tempLogs.push(`${actor.name}'s Harmony Engine boosted the Sync Gauge!`);
                    }
                }

                // Sour Sap Ability: Grass moves may lower Sp. Def
                if (actor.ability.name === 'SourSap' && action.move.type === 'grass' && Math.random() < 0.2) {
                    if (target.statStages) {
                        target.statStages['special-defense'] = Math.max(-6, (target.statStages['special-defense'] || 0) - 1);
                        tempLogs.push(`${actor.name}'s Sour Sap lowered ${target.name}'s Sp. Def!`);
                    }
                }

                // Blinding Sand Ability: In Sandstorm, moves may lower Accuracy
                if (actor.ability.name === 'BlindingSand' && battleState.weather === 'sand' && Math.random() < 0.1) {
                    if (target.statStages) {
                        target.statStages.accuracy = Math.max(-6, (target.statStages.accuracy || 0) - 1);
                        tempLogs.push(`${actor.name}'s Blinding Sand lowered ${target.name}'s Accuracy!`);
                    }
                }

                // Contact Abilities
                const makesContact = action.move.category === 'physical'; // Simplified contact check
                if (makesContact) {
                    // Heavy Stance Ability
                    if (target.ability.name === 'HeavyStance') {
                        if (target.statStages) {
                            target.statStages.speed = Math.max(-6, (target.statStages.speed || 0) - 1);
                            target.statStages.defense = Math.min(6, (target.statStages.defense || 0) + 1);
                            tempLogs.push(`${target.name}'s Heavy Stance traded Speed for Defense!`);
                        }
                    }

                    // Frostbite Skin Ability
                    if (target.ability.name === 'FrostbiteSkin' && !target.status && Math.random() < 0.2) {
                        target.status = 'freeze';
                        tempLogs.push(`${target.name}'s Frostbite Skin froze ${actor.name}!`);
                    }

                    // Wound Leak Ability
                    if (target.ability.name === 'WoundLeak') {
                        const recoil = Math.floor(actor.maxHp / 16);
                        actor.currentHp = Math.max(0, actor.currentHp - recoil);
                        tempLogs.push(`${actor.name} took recoil from ${target.name}'s Wound Leak!`);
                    }

                    // Static Charge Ability
                    if (target.ability.name === 'StaticCharge' && !actor.status && Math.random() < 0.3) {
                        actor.status = 'paralysis';
                        tempLogs.push(`${actor.name} was paralyzed by ${target.name}'s Static Charge!`);
                    }

                    // Flame Body Ability
                    if (target.ability.name === 'FlameBody' && !actor.status && Math.random() < 0.3) {
                        actor.status = 'burn';
                        tempLogs.push(`${actor.name} was burned by ${target.name}'s Flame Body!`);
                    }

                    // Iron Barbs / Rough Skin Ability
                    if (target.ability.name === 'IronBarbs' || target.ability.name === 'RoughSkin') {
                        const dmg = Math.floor(actor.maxHp / 8);
                        actor.currentHp = Math.max(0, actor.currentHp - dmg);
                        tempLogs.push(`${actor.name} was hurt by ${target.name}'s ${target.ability.name}!`);
                    }

                    // Gooey / Tangling Hair Ability
                    if (target.ability.name === 'Gooey' || target.ability.name === 'TanglingHair') {
                        if (actor.statStages) {
                            actor.statStages.speed = Math.max(-6, (actor.statStages.speed || 0) - 1);
                            tempLogs.push(`${actor.name}'s Speed was lowered by ${target.name}'s ${target.ability.name}!`);
                        }
                    }

                    // Mummy Ability
                    if (target.ability.name === 'Mummy' && actor.heldItem?.id !== 'ability-shield') {
                        actor.ability = { ...target.ability };
                        tempLogs.push(`${actor.name}'s ability became Mummy!`);
                    }

                    // Wandering Spirit Ability
                    if (target.ability.name === 'WanderingSpirit' && actor.heldItem?.id !== 'ability-shield' && target.heldItem?.id !== 'ability-shield') {
                        const tempAbility = { ...actor.ability };
                        actor.ability = { ...target.ability };
                        target.ability = tempAbility;
                        tempLogs.push(`${actor.name} swapped abilities with ${target.name}!`);
                    }
                }

                // Cursed Body Ability
                if (target.ability.name === 'CursedBody' && Math.random() < 0.3) {
                    // Simplified: just log for now
                    tempLogs.push(`${target.name}'s Cursed Body is ready to disable!`);
                }

                // Ammo Share: Extra hit from ally if multi-hit move
                let finalNumHits = numHits;
                if (numHits > 1 && actor.ability.name === 'AmmoShare') {
                    const allyIdx = 1 - actorIdx;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted) {
                        finalNumHits += 1;
                        tempLogs.push(`${ally.name} joined in with Ammo Share!`);
                    }
                }

                for (let h = 0; h < finalNumHits; h++) {
                    // Spread damage reduction
                    let finalDamage = res.damage;
                    if (isBothFoes && targetsToHit.length > 1) {
                        finalDamage = Math.floor(finalDamage * 0.75);
                    }
                    
                    // FossilDrive Ability
                    if (actor.ability.name === 'FossilDrive' && action.move?.type === 'Rock') {
                        tempLogs.push(`${actor.name}'s Fossil Drive powered up the move!`);
                    }

                    // RuneDrive Ability
                    if (actor.ability.name === 'RuneDrive' && action.move?.type === 'Fairy') {
                        tempLogs.push(`${actor.name}'s Rune Drive powered up the move!`);
                    }

                    // Relentless Ability
                    if (actor.ability.name === 'Relentless') {
                        const boost = 1 + (h * 0.1);
                        finalDamage = Math.floor(finalDamage * boost);
                    }

                    // Reset Attack, Start Damage (Immutable update)
                    if (action.isPlayer) {
                        tempPTeam[actorIdx] = { ...tempPTeam[actorIdx], animationState: 'idle' };
                        actor = tempPTeam[actorIdx];
                        tempETeam[realTargetIndex] = { ...tempETeam[realTargetIndex], animationState: 'damage', incomingAttackType: action.move.type };
                        target = tempETeam[realTargetIndex];
                    } else {
                        tempETeam[actorIdx] = { ...tempETeam[actorIdx], animationState: 'idle' };
                        actor = tempETeam[actorIdx];
                        tempPTeam[realTargetIndex] = { ...tempPTeam[realTargetIndex], animationState: 'damage', incomingAttackType: action.move.type };
                        target = tempPTeam[realTargetIndex];
                    }

                    // Lag Shock Ability (Handled in status application)
                    // Crossfire Burn Ability (Handled in status application)

                    if (target.substituteHp) {
                        const subDamage = Math.min(target.substituteHp, finalDamage);
                        target.substituteHp -= subDamage;
                        if (target.substituteHp <= 0) {
                            target.substituteHp = undefined;
                            tempLogs.push(`${target.name}'s substitute broke!`);
                        } else {
                            tempLogs.push(`${target.name}'s substitute took the hit!`);
                        }
                        finalDamage = 0;
                    }

                    // Survival Logic (Focus Band, Sturdy, Focus Sash, Withstand)
                    if (finalDamage >= target.currentHp && target.currentHp > 0) {
                        let survives = false;
                        let reason = '';
                        if (target.heldItem?.id === 'focus-band' && Math.random() < 0.1) {
                            survives = true;
                            reason = 'Focus Band';
                        }
                        if (target.ability.name === 'Sturdy' && target.currentHp === target.maxHp) {
                            survives = true;
                            reason = 'Sturdy';
                        }
                        if (target.heldItem?.id === 'focus-sash' && target.currentHp === target.maxHp) {
                            survives = true;
                            reason = 'Focus Sash';
                            target.heldItem = undefined; // Consume
                        }
                        if (target.ability.name === 'Withstand' && target.currentHp === target.maxHp) {
                            survives = true;
                            reason = 'Withstand';
                        }

                        if (survives) {
                            finalDamage = target.currentHp - 1;
                            tempLogs.push(`${target.name} endured the hit with its ${reason}!`);
                        }
                    }

                    // SacrificialGuard Ability
                    const targetAllyIdx = 1 - realTargetIndex;
                    const targetAlly = action.isPlayer ? tempETeam[targetAllyIdx] : tempPTeam[targetAllyIdx];
                    let damageTarget = target;
                    if (finalDamage >= target.currentHp && targetAlly && !targetAlly.isFainted && targetAlly.ability.name === 'SacrificialGuard' && !targetAlly.usedSacrificialGuard) {
                        damageTarget = targetAlly;
                        targetAlly.usedSacrificialGuard = true;
                        tempLogs.push(`${targetAlly.name}'s Sacrificial Guard took the hit for ${target.name}!`);
                    }
                    
                    damageTarget.currentHp = Math.max(0, damageTarget.currentHp - finalDamage);
                    totalDamage += finalDamage;
                    
                    // Trigger Damage VFX
                    if (finalDamage > 0) {
                        await setDamageVFX(
                            !action.isPlayer ? 'enemy' : 'player',
                            realTargetIndex,
                            finalDamage,
                            res.isCritical,
                            res.effectiveness
                        );
                    } else if (res.damage === 0 && action.move.damage_class !== 'status') {
                        setBattleState(prev => ({ 
                            ...prev, 
                            vfx: { type: 'miss', target: !action.isPlayer ? 'enemy' : 'player', index: realTargetIndex, isMiss: true } 
                        }));
                        await delay(600);
                        setBattleState(prev => ({ ...prev, vfx: null }));
                    }

                    checkBerries(target, tempLogs);

                    // Air Balloon Popping
                    if (target.heldItem?.id === 'air-balloon' && finalDamage > 0) {
                        tempLogs.push(`${target.name}'s Air Balloon popped!`);
                        target.heldItem = undefined;
                    }

                    // Weakness Policy
                    if (target.heldItem?.id === 'weakness-policy' && res.effectiveness > 1 && finalDamage > 0 && !target.isFainted) {
                        if (target.statStages) {
                            target.statStages.attack = Math.min(6, (target.statStages.attack || 0) + 2);
                            target.statStages['special-attack'] = Math.min(6, (target.statStages['special-attack'] || 0) + 2);
                            tempLogs.push(`${target.name}'s Weakness Policy sharply boosted its Attack and Sp. Atk!`);
                            target.heldItem = undefined;
                        }
                    }

                    // Eject Button
                    if (target.heldItem?.id === 'eject-button' && finalDamage > 0 && !target.isFainted) {
                        tempLogs.push(`${target.name} is switched out by its Eject Button!`);
                        target.heldItem = undefined;
                        if (action.isPlayer) {
                            setBattleState(prev => ({ ...prev, enemySwitching: true, enemySwitchingMonIndex: realTargetIndex }));
                        } else {
                            setBattleState(prev => ({ ...prev, mustSwitch: true, switchingActorIdx: realTargetIndex }));
                        }
                    }

                    // Red Card
                    if (target.heldItem?.id === 'red-card' && finalDamage > 0 && !actor.isFainted) {
                        tempLogs.push(`${target.name} showed the Red Card to ${actor.name}!`);
                        target.heldItem = undefined;
                        if (action.isPlayer) {
                            setBattleState(prev => ({ ...prev, mustSwitch: true, switchingActorIdx: action.actorIndex }));
                        } else {
                            setBattleState(prev => ({ ...prev, enemySwitching: true, enemySwitchingMonIndex: action.actorIndex }));
                        }
                    }

                    // Rocky Helmet
                    if (target.heldItem?.id === 'rocky-helmet' && action.move.contact && finalDamage > 0 && actor.heldItem?.id !== 'protective-pads' && actor.heldItem?.id !== 'punching-glove') {
                        const helmetDmg = Math.floor(actor.maxHp / 6);
                        actor.currentHp = Math.max(0, actor.currentHp - helmetDmg);
                        tempLogs.push(`${actor.name} was hurt by ${target.name}'s Rocky Helmet!`);
                    }

                    // Drain logic
                    if (action.move.meta?.drain && finalDamage > 0) {
                        let drainAmount = Math.floor(finalDamage * action.move.meta.drain / 100);
                        if (drainAmount > 0) {
                            if (actor.heldItem?.id === 'big-root') {
                                drainAmount = Math.floor(drainAmount * 1.3);
                            }
                            actor.currentHp = Math.min(actor.maxHp, actor.currentHp + drainAmount);
                            tempLogs.push(`${actor.name} drained energy from ${target.name}!`);
                        } else if (drainAmount < 0) {
                            actor.currentHp = Math.max(0, actor.currentHp + drainAmount);
                            tempLogs.push(`${actor.name} took recoil damage!`);
                        }
                    }

                    // Healing logic (for moves like Recover)
                    if (action.move.meta?.healing && action.move.damage_class === 'status') {
                        let healAmount = Math.floor(actor.maxHp * action.move.meta.healing / 100);
                        if (action.isPlayer) {
                            healAmount = Math.floor(healAmount * (1 + (playerState.meta.upgrades.healingBoost * 0.05)));
                        }
                        if (healAmount > 0) {
                            actor.currentHp = Math.min(actor.maxHp, actor.currentHp + healAmount);
                            tempLogs.push(`${actor.name} restored its HP!`);
                        }
                    }

                    // Split Agony: Ally takes 10% of damage, user takes 20% less (handled in calcDamage)
                    if (target.ability.name === 'SplitAgony') {
                        const allyIdx = 1 - realTargetIndex;
                        const ally = (!action.isPlayer) ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                        if (ally && !ally.isFainted) {
                            const allyDmg = Math.floor(finalDamage * 0.1);
                            ally.currentHp = Math.max(0, ally.currentHp - allyDmg);
                            tempLogs.push(`${ally.name} took some damage from Split Agony!`);
                        }
                    }

                    // Battery Ability
                    if (actor.ability.name === 'Battery' && finalDamage > 0) {
                        if (action.isPlayer) {
                            setBattleState(prev => ({ ...prev, comboMeter: Math.min(100, prev.comboMeter + 5) }));
                        } else {
                            setBattleState(prev => ({ ...prev, enemyComboMeter: Math.min(100, prev.enemyComboMeter + 5) }));
                        }
                        tempLogs.push(`${actor.name}'s Battery charged the Sync Gauge!`);
                    }

                    // Sparkjump Ability
                    if (actor.ability.name === 'Sparkjump' && (action.move.priority || 0) > 0) {
                        if (actor.statStages) {
                            actor.statStages.speed = Math.min(6, (actor.statStages.speed || 0) + 1);
                            tempLogs.push(`${actor.name}'s Sparkjump boosted its Speed!`);
                        }
                    }

                    // Wardrum Ability
                    if (actor.ability.name === 'Wardrum' && action.move.type === 'Fighting') {
                        const allyIdx = 1 - actorIdx;
                        const ally = (action.isPlayer) ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                        if (ally && !ally.isFainted && ally.statStages) {
                            ally.statStages.attack = Math.min(6, (ally.statStages.attack || 0) + 1);
                            tempLogs.push(`${actor.name}'s Wardrum boosted ${ally.name}'s Attack!`);
                        }
                    }

                    // RuneBloom Ability
                    if (actor.ability.name === 'RuneBloom' && action.move.type === 'Fairy' && action.move.damage_class === 'status') {
                        if (actor.statStages) {
                            actor.statStages.speed = Math.min(6, (actor.statStages.speed || 0) + 1);
                            tempLogs.push(`${actor.name}'s RuneBloom boosted its Speed!`);
                        }
                    }

                    // Heavy Stance Ability
                    if (target.ability.name === 'HeavyStance' && action.move.contact && finalDamage > 0) {
                        if (target.statStages) {
                            target.statStages.speed = Math.max(-6, (target.statStages.speed || 0) - 1);
                            target.statStages.defense = Math.min(6, (target.statStages.defense || 0) + 1);
                            tempLogs.push(`${target.name}'s Heavy Stance traded Speed for Defense!`);
                        }
                    }

                    // Frostbite Skin Ability
                    if (target.ability.name === 'FrostbiteSkin' && action.move.contact && finalDamage > 0 && !actor.status) {
                        if (Math.random() < 0.2) {
                            actor.status = 'frostbite';
                            tempLogs.push(`${actor.name} was frostbitten by ${target.name}'s Frostbite Skin!`);
                        }
                    }

                    // ThornField Ability
                    if (target.ability.name === 'ThornField' && action.move.category === 'physical' && finalDamage > 0) {
                        const recoil = Math.floor(finalDamage / 8);
                        actor.currentHp = Math.max(0, actor.currentHp - recoil);
                        tempLogs.push(`${actor.name} was hurt by ${target.name}'s Thorn Field!`);
                    }

                    // SpikeCloak Ability
                    if (target.ability.name === 'SpikeCloak' && action.move.contact && finalDamage > 0) {
                        const recoil = Math.floor(finalDamage / 8);
                        actor.currentHp = Math.max(0, actor.currentHp - recoil);
                        tempLogs.push(`${actor.name} was hurt by ${target.name}'s Spike Cloak!`);
                        if (actor.statStages && Math.random() < 0.3) {
                            actor.statStages.speed = Math.max(-6, (actor.statStages.speed || 0) - 1);
                            tempLogs.push(`${actor.name}'s Speed fell!`);
                        }
                    }

                    // Iron Blood Ability
                    if (target.ability.name === 'IronBlood' && action.move.type === 'Poison') {
                        const heal = Math.floor(target.maxHp / 4);
                        target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
                        tempLogs.push(`${target.name}'s Iron Blood absorbed the poison!`);
                        finalDamage = 0; // Already handled in multiplier but double check
                    }

                    // Contact Charge Ability
                    if (actor.ability.name === 'ItemShatter' && action.move?.contact) {
                        if (target.heldItem) {
                            tempLogs.push(`${actor.name} shattered ${target.name}'s ${target.heldItem.name}!`);
                            target.heldItem = undefined;
                        }
                    }

                    // Life Steal Ability
                    if (actor.ability.name === 'LifeSteal' && action.move?.contact) {
                        const heal = Math.floor(actor.maxHp / 16);
                        actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                        tempLogs.push(`${actor.name}'s Life Steal restored its HP!`);
                    }

                    // Shimmer Hide Ability
                    if (actor.ability.name === 'ShimmerHide' && action.move?.type === 'Fairy' && res.isCritical) {
                        if (target.statStages) {
                            target.statStages.attack = Math.max(-6, (target.statStages.attack || 0) - 1);
                            tempLogs.push(`${actor.name}'s Shimmer Hide lowered ${target.name}'s Attack!`);
                        }
                    }

                    // Hollow Echo Ability
                    if (actor.ability.name === 'HollowEcho' && action.move?.type === 'Ghost' && res.isCritical) {
                        tempLogs.push(`${actor.name}'s Hollow Echo drained ${target.name}'s energy!`);
                    }

                    // Decay Touch Ability
                    if (target.ability.name === 'DecayTouch' && action.move?.contact) {
                        if (actor.statStages) {
                            actor.statStages.attack = Math.max(-6, (actor.statStages.attack || 0) - 1);
                            tempLogs.push(`${target.name}'s Decay Touch lowered ${actor.name}'s Attack!`);
                        }
                    }

                    // Venom Spite Ability
                if (target.ability.name === 'VenomSpite' && target.status === 'poison' && res.damage > 0) {
                    if (actor.statStages) {
                        actor.statStages['special-defense'] = Math.max(-6, (actor.statStages['special-defense'] || 0) - 1);
                        tempLogs.push(`${target.name}'s Venom Spite lowered ${actor.name}'s Sp. Def!`);
                    }
                }

                // Wound Leak Ability
                    if (target.ability.name === 'WoundLeak' && action.move?.contact) {
                        const recoil = Math.floor(actor.maxHp / 16);
                        actor.currentHp = Math.max(0, actor.currentHp - recoil);
                        tempLogs.push(`${actor.name} was hurt by ${target.name}'s Wound Leak!`);
                    }

                    // Razor Tread Ability
                    if (actor.ability.name === 'RazorTread' && action.move?.isSlicing && Math.random() < 0.3) {
                        if (target.statStages) {
                            target.statStages.defense = Math.max(-6, (target.statStages.defense || 0) - 1);
                            tempLogs.push(`${actor.name}'s Razor Tread lowered ${target.name}'s Defense!`);
                        }
                    }

                    // Pressure Point Ability
                    if (target.ability.name === 'PressurePoint' && res.effectiveness > 1) {
                        // PP reduction is hard to implement without move state, but we can log it
                        tempLogs.push(`${target.name}'s Pressure Point drained ${actor.name}'s energy!`);
                    }
                    
                    // Whirlpool Heart Ability
                    if (actor.ability.name === 'WhirlpoolHeart' && action.move?.type === 'water') {
                        const allyIdx = 1 - actorIdx;
                        const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                        if (ally && !ally.isFainted) {
                            const heal = Math.floor(res.damage / 4);
                            ally.currentHp = Math.min(ally.maxHp, ally.currentHp + heal);
                            tempLogs.push(`${actor.name}'s Whirlpool Heart healed ${ally.name}!`);
                        }
                    }

                    // Amber Core Ability
                    if (actor.ability.name === 'AmberCore' && action.move?.type === 'bug') {
                        const heal = Math.floor(res.damage / 4);
                        actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                        tempLogs.push(`${actor.name}'s Amber Core restored its HP!`);
                    }

                    // Torrent Sync Ability
                    if (actor.ability.name === 'TorrentSync' && action.move?.type === 'water') {
                        const allyIdx = 1 - actorIdx;
                        const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                        if (ally && !ally.isFainted) {
                            ally.nextMoveDamageBoost = true;
                            tempLogs.push(`${actor.name}'s Torrent Sync boosted ${ally.name}!`);
                        }
                    }

                    // Storm Rider Ability
                    if (target.ability.name === 'StormRider' && action.move?.type === 'electric' && battleState.weather === 'rain') {
                        if (target.statStages) {
                            target.statStages.speed = Math.min(6, (target.statStages.speed || 0) + 1);
                            tempLogs.push(`${target.name}'s Storm Rider boosted its Speed!`);
                        }
                    }

                    // Life Steal Ability
                    if (actor.ability.name === 'LifeSteal' && action.move?.contact) {
                        const heal = Math.floor(actor.maxHp / 16);
                        actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                        tempLogs.push(`${actor.name} stole life with Life Steal!`);
                    }

                    // Frostbite Skin Ability
                    if (target.ability.name === 'FrostbiteSkin' && action.move?.contact && Math.random() < 0.2) {
                        if (!actor.status) {
                            actor.status = 'freeze';
                            tempLogs.push(`${actor.name} was frozen by ${target.name}'s Frostbite Skin!`);
                        }
                    }

                    // Contact Charge Ability
                    if (target.ability.name === 'ContactCharge' && action.move?.contact) {
                        setBattleState(prev => {
                            if (action.isPlayer) {
                                const newMeter = Math.min(100, prev.enemyComboMeter + 5);
                                return { ...prev, enemyComboMeter: newMeter, enemyFusionChargeActive: newMeter === 100 };
                            } else {
                                const newMeter = Math.min(100, prev.comboMeter + 5);
                                return { ...prev, comboMeter: newMeter, fusionChargeActive: newMeter === 100 };
                            }
                        });
                    }

                    // Panel Breaker Ability
                    if (actor.ability.name === 'PanelBreaker') {
                        // In this game, we don't have screens yet, but we can log it
                        tempLogs.push(`${actor.name}'s Panel Breaker shattered the defenses!`);
                    }

                    // Heavy Stance Ability
                    if (actor.ability.name === 'HeavyStance') {
                        if (target.statStages) {
                            target.statStages.speed = Math.max(-6, (target.statStages.speed || 0) - 1);
                            tempLogs.push(`${actor.name}'s Heavy Stance lowered ${target.name}'s Speed!`);
                        }
                    }

                    // Wardrum Ability
                    if (actor.ability.name === 'Wardrum') {
                        setBattleState(prev => ({ ...prev, [action.isPlayer ? 'comboMeter' : 'enemyComboMeter']: Math.min(100, (action.isPlayer ? prev.comboMeter : prev.enemyComboMeter) + 2) }));
                        tempLogs.push(`${actor.name}'s Wardrum generated Sync energy!`);
                    }

                    // Link Saver Ability
                    if (actor.ability.name === 'LinkSaver' && action.move.name.toLowerCase().includes('link') && Math.random() < 0.5) {
                        tempLogs.push(`${actor.name}'s Link Saver saved Sync energy!`);
                        // Logic to prevent gauge consumption would go here if we had a consumption step
                    }

                    if (numHits > 1) {
                        await syncState(200);
                        if (target.currentHp === 0) break;
                    }
                }
                
                // TrickMirror Ability
                let realActor = actor;
                let realTarget = target;
                if (action.move.damage_class === 'status' && target.ability.name === 'TrickMirror' && !target.usedTrickMirror) {
                    target.usedTrickMirror = true;
                    tempLogs.push(`${target.name}'s Trick Mirror reflected the move!`);
                    realActor = target;
                    realTarget = actor;
                }

                const sec = applySecondaryEffect(realActor, realTarget, action.move, battleState.weather, battleState.terrain);

                // Link Conduit Ability
                if (actor.ability.name === 'LinkConduit' && Math.random() < 0.5) {
                    if (action.isPlayer) {
                        setBattleState(prev => ({ ...prev, comboMeter: Math.min(100, prev.comboMeter + 5) }));
                    } else {
                        setBattleState(prev => ({ ...prev, enemyComboMeter: Math.min(100, prev.enemyComboMeter + 5) }));
                    }
                    tempLogs.push(`${actor.name}'s Link Conduit charged the Sync Gauge!`);
                }

                // Item Shatter Ability
                if (actor.ability.name === 'ItemShatter' && target.heldItem && Math.random() < 0.3) {
                    tempLogs.push(`${actor.name}'s Item Shatter destroyed ${target.name}'s ${target.heldItem.name}!`);
                    target.heldItem = undefined;
                }

                // Armor Melt Ability
                if (actor.ability.name === 'ArmorMelt' && Math.random() < 0.3) {
                    if (target.statStages) {
                        target.statStages.defense = Math.max(-6, (target.statStages.defense || 0) - 1);
                        tempLogs.push(`${actor.name}'s Armor Melt lowered ${target.name}'s Defense!`);
                    }
                }
                
                // Sync Pulse Ability
                if (actor.ability.name === 'SyncPulse') {
                    const allyIdx = 1 - action.actorIndex;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted && ally.statStages) {
                        const stats: (keyof StatStages)[] = ['attack', 'defense', 'special-attack', 'special-defense', 'speed'];
                        const randomStat = stats[Math.floor(Math.random() * stats.length)];
                        ally.statStages[randomStat] = Math.min(6, (ally.statStages[randomStat] || 0) + 1);
                        tempLogs.push(`${actor.name}'s Sync Pulse raised ${ally.name}'s ${randomStat}!`);
                    }
                }

                // Synchrony Tax Ability
                if (actor.ability.name === 'SynchronyTax') {
                    setBattleState(prev => {
                        if (action.isPlayer) {
                            return { ...prev, enemyComboMeter: Math.max(0, prev.enemyComboMeter - 5) };
                        } else {
                            return { ...prev, comboMeter: Math.max(0, prev.comboMeter - 5) };
                        }
                    });
                    tempLogs.push(`${actor.name}'s Synchrony Tax drained the enemy's Sync Gauge!`);
                }

                // Aftershock Ability
                if (actor.ability.name === 'Aftershock' && action.move?.type.toLowerCase() === 'electric') {
                    const extraDamage = Math.floor(target.maxHp / 16);
                    target.currentHp = Math.max(0, target.currentHp - extraDamage);
                    tempLogs.push(`${target.name} was hurt by the Aftershock!`);
                }

                // Slipstream Ability
                if (actor.ability.name === 'Slipstream' && action.move?.type.toLowerCase() === 'flying' && actor.statStages) {
                    actor.statStages.speed = Math.min(6, (actor.statStages.speed || 0) + 1);
                    tempLogs.push(`${actor.name}'s Slipstream boosted its Speed!`);
                }

                // Cavern Roar Ability
                if (actor.ability.name === 'CavernRoar' && action.move?.isSound && Math.random() < 0.2 && target.statStages) {
                    target.statStages.defense = Math.max(-6, (target.statStages.defense || 0) - 1);
                    tempLogs.push(`${actor.name}'s Cavern Roar lowered ${target.name}'s Defense!`);
                }

                // Type Twist Ability
                if (target.ability.name === 'TypeTwist' && action.move?.type) {
                    target.types = [action.move.type];
                    tempLogs.push(`${target.name}'s Type Twist changed its type to ${action.move.type}!`);
                }

                // Panel Breaker Ability
                if (actor.ability.name === 'PanelBreaker') {
                    // Simplified: break Aegis Field
                    if (action.isPlayer && battleState.enemyAegisFieldTurns > 0) {
                        setBattleState(prev => ({ ...prev, enemyAegisFieldTurns: 0 }));
                        tempLogs.push(`${actor.name}'s Panel Breaker shattered the enemy's Aegis Field!`);
                    } else if (!action.isPlayer && battleState.aegisFieldTurns > 0) {
                        setBattleState(prev => ({ ...prev, aegisFieldTurns: 0 }));
                        tempLogs.push(`${actor.name}'s Panel Breaker shattered the team's Aegis Field!`);
                    }
                }

                // Spectator’s Roar Ability
                if (actor.ability.name === 'SpectatorSRoar' && res.isCritical) {
                    const allyIdx = 1 - action.actorIndex;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (actor.statStages) actor.statStages.speed = Math.min(6, (actor.statStages.speed || 0) + 1);
                    if (ally && !ally.isFainted && ally.statStages) ally.statStages.speed = Math.min(6, (ally.statStages.speed || 0) + 1);
                    tempLogs.push(`${actor.name}'s Spectator’s Roar boosted Speed!`);
                }

                // Gladiator’s Spirit Ability
                if (actor.ability.name === 'GladiatorSSpirit' && target.currentHp === 0) {
                    if (actor.statStages) actor.statStages.defense = Math.min(6, (actor.statStages.defense || 0) + 1);
                    tempLogs.push(`${actor.name}'s Gladiator’s Spirit raised its Defense!`);
                    
                    const allyIdx = 1 - action.actorIndex;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted) {
                        ally.nextMoveBoosts = { ...ally.nextMoveBoosts, healAtEnd: true };
                        tempLogs.push(`${ally.name} will be healed by Gladiator's Spirit at the end of the turn!`);
                    }
                }

                // Coalescence Ability
                if (actor.ability.name === 'Coalescence' && action.isFusion) {
                    const heal = Math.floor(actor.maxHp * 0.25);
                    actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                    tempLogs.push(`${actor.name}'s Coalescence restored its HP!`);
                }

                // Link Pivot Ability
                if (actor.ability.name === 'LinkPivot' && action.isFusion) {
                    // Simplified: switch after fusion
                    tempLogs.push(`${actor.name}'s Link Pivot is ready to switch!`);
                }

                // Fuse Insurance Ability
                if (actor.ability.name === 'FuseInsurance' && action.isFusion && actor.currentHp === 0) {
                    actor.currentHp = 1;
                    tempLogs.push(`${actor.name} endured the hit with Fuse Insurance!`);
                }

                if (res.hits && res.hits > 1) {
                    tempLogs.push(`Hit ${res.hits} times!`);
                }

                if (res.recoil && res.recoil > 0) {
                    actor.currentHp = Math.max(0, actor.currentHp - res.recoil);
                    tempLogs.push(`${actor.name} is hurt by recoil!`);

                    // Recoil Bond: Ally heals for half of recoil damage
                    if (actor.ability.name === 'RecoilBond') {
                        const allyIdx = 1 - action.actorIndex;
                        const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                        if (ally && !ally.isFainted) {
                            const heal = Math.floor(res.recoil / 2);
                            ally.currentHp = Math.min(ally.maxHp, ally.currentHp + heal);
                            tempLogs.push(`${actor.name}'s Recoil Bond healed ${ally.name}!`);
                        }
                    }
                }

                if (sec.drain && totalDamage > 0) {
                    const heal = Math.floor(totalDamage * sec.drain);
                    actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                    tempLogs.push(`${actor.name} drained energy!`);
                }

                // --- APPLY SECONDARY EFFECTS ---
                if (sec.taunt) {
                    target.isTaunted = 3;
                    tempLogs.push(`${target.name} was taunted!`);
                }
                if (sec.encore) {
                    target.isEncored = 3;
                    target.encoredMove = target.lastMoveName;
                    tempLogs.push(`${target.name} was encored!`);
                }
                if (sec.disable) {
                    target.isDisabled = 4;
                    target.disabledMove = target.lastMoveName;
                    tempLogs.push(`${target.name}'s ${target.lastMoveName} was disabled!`);
                }
                if (sec.torment) {
                    target.isTormented = true;
                    tempLogs.push(`${target.name} was tormented!`);
                }
                if (sec.healBlock) {
                    target.isHealBlocked = 5;
                    tempLogs.push(`${target.name} was heal blocked!`);
                }
                if (sec.embargo) {
                    target.isEmbargoed = 5;
                    tempLogs.push(`${target.name} was embargoed!`);
                }
                if (sec.magnetRise) {
                    actor.isMagnetRaised = 5;
                    tempLogs.push(`${actor.name} levitated with Magnet Rise!`);
                }
                if (sec.telekinesis) {
                    target.isTelekinesised = 3;
                    tempLogs.push(`${target.name} was lifted by Telekinesis!`);
                }
                if (sec.ingrain) {
                    actor.isIngrained = true;
                    tempLogs.push(`${actor.name} planted its roots!`);
                }
                if (sec.aquaRing) {
                    actor.isAquaRinged = true;
                    tempLogs.push(`${actor.name} surrounded itself with a veil of water!`);
                }
                if (sec.imprison) {
                    actor.isImprisoned = true;
                    tempLogs.push(`${actor.name} imprisoned its foes!`);
                }
                if (sec.gravity) {
                    setBattleState(prev => ({ ...prev, gravityTurns: 5 }));
                    tempLogs.push(`Gravity intensified!`);
                }
                if (sec.healWish || sec.lunarDance) {
                    actor.currentHp = 0;
                    actor.isFainted = true;
                    actor.isHealingWishActive = true;
                    if (sec.lunarDance) actor.isLunarDanceActive = true;
                    tempLogs.push(`${actor.name} sacrificed itself!`);
                }
                if (sec.memento) {
                    actor.currentHp = 0;
                    actor.isFainted = true;
                    if (target.statStages) {
                        target.statStages.attack = Math.max(-6, (target.statStages.attack || 0) - 2);
                        target.statStages['special-attack'] = Math.max(-6, (target.statStages['special-attack'] || 0) - 2);
                    }
                    tempLogs.push(`${actor.name} sacrificed itself to lower ${target.name}'s stats!`);
                }
                if (sec.typeChange) {
                    actor.types = sec.typeChange;
                    tempLogs.push(`${actor.name}'s type changed to ${sec.typeChange.join('/')}!`);
                }
                if (sec.targetTypeChange) {
                    target.types = sec.targetTypeChange;
                    tempLogs.push(`${target.name}'s type changed to ${sec.targetTypeChange.join('/')}!`);
                }
                if (sec.batonPass) {
                    if (action.isPlayer) setBattleState(prev => ({ ...prev, isBatonPass: true, playerSwitching: true, switchingMonIndex: actorIdx }));
                    else setBattleState(prev => ({ ...prev, enemyIsBatonPass: true, enemySwitching: true, enemySwitchingMonIndex: actorIdx }));
                }
                if (sec.pivot) {
                    if (action.isPlayer) setBattleState(prev => ({ ...prev, playerSwitching: true, switchingMonIndex: actorIdx }));
                    else setBattleState(prev => ({ ...prev, enemySwitching: true, enemySwitchingMonIndex: actorIdx }));
                }

                // Life Orb Recoil
                if (actor.heldItem?.id === 'life-orb' && totalDamage > 0 && actor.ability.name !== 'MagicGuard') {
                    const loRecoil = Math.floor(actor.maxHp / 10);
                    actor.currentHp = Math.max(0, actor.currentHp - loRecoil);
                    tempLogs.push(`${actor.name} was hurt by its Life Orb!`);
                }

                // Shell Bell
                if (actor.heldItem?.id === 'shell-bell' && totalDamage > 0) {
                    const heal = Math.floor(totalDamage / 8);
                    actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                    tempLogs.push(`${actor.name} restored HP with its Shell Bell!`);
                }

                // Metronome Item
                if (actor.heldItem?.id === 'metronome') {
                    if (previousMove === action.move.name) {
                        actor.metronomeCount = Math.min(5, (actor.metronomeCount || 0) + 1);
                    } else {
                        actor.metronomeCount = 0;
                    }
                }

                // King's Rock / Razor Fang
                if ((actor.heldItem?.id === 'kings-rock' || actor.heldItem?.id === 'razor-fang') && totalDamage > 0 && Math.random() < 0.1) {
                    targetsToHit.forEach(t => {
                        if (!t.isFainted) t.isFlinching = true;
                    });
                    tempLogs.push(`${actor.name}'s ${actor.heldItem.name} caused flinching!`);
                }
                
                // Battery Ability
                if (target.ability.name === 'Battery') {
                    setBattleState(prev => {
                        if (action.isPlayer) {
                            const newMeter = Math.min(100, prev.enemyComboMeter + 5);
                            return { ...prev, enemyComboMeter: newMeter, enemyFusionChargeActive: newMeter === 100 };
                        } else {
                            const newMeter = Math.min(100, prev.comboMeter + 5);
                            return { ...prev, comboMeter: newMeter, fusionChargeActive: newMeter === 100 };
                        }
                    });
                }

                // Sparkjump Ability
                if (actor.ability.name === 'Sparkjump' && action.move?.priority && action.move.priority > 0) {
                    if (actor.statStages) {
                        actor.statStages.speed = Math.min(6, (actor.statStages.speed || 0) + 1);
                        tempLogs.push(`${actor.name}'s Sparkjump raised its Speed!`);
                    }
                }

                // Whirlpool Heart Ability
                if (actor.ability.name === 'WhirlpoolHeart' && action.move?.type.toLowerCase() === 'water') {
                    const allyIdx = 1 - action.actorIndex;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted) {
                        const heal = Math.floor(ally.maxHp / 16);
                        ally.currentHp = Math.min(ally.maxHp, ally.currentHp + heal);
                        tempLogs.push(`${actor.name}'s Whirlpool Heart healed its ally!`);
                    }
                }

                // Amber Core Ability
                if (actor.ability.name === 'AmberCore' && action.move?.type.toLowerCase() === 'bug') {
                    const heal = Math.floor(actor.maxHp / 16);
                    actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                    tempLogs.push(`${actor.name}'s Amber Core restored its HP!`);
                }

                // --- COMBO METER UPDATE ---
                setBattleState(prev => {
                    if (action.isFusion) {
                        if (action.isPlayer) return { ...prev, comboMeter: 0, fusionChargeActive: false };
                        else return { ...prev, enemyComboMeter: 0, enemyFusionChargeActive: false };
                    }
                    
                    let boost = 10;
                    
                    // Harmony Engine: If both allies share a primary type, boost more
                    if (actor.ability.name === 'HarmonyEngine') {
                        const allyIdx = 1 - action.actorIndex;
                        const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                        if (ally && !ally.isFainted && ally.types[0] === actor.types[0]) {
                            boost += 20;
                        } else {
                            boost += 5;
                        }
                    }
                    
                    let pulseChance = 0.3;
                    if (actor.ability.name === 'Amplifier') pulseChance = 0.6;
                    if (actor.ability.name === 'SyncPulse' && Math.random() < pulseChance) boost += 10;
                    
                    if (action.isPlayer) {
                        const newMeter = Math.min(100, prev.comboMeter + boost);
                        return { ...prev, comboMeter: newMeter, fusionChargeActive: newMeter === 100 };
                    } else {
                        const newMeter = Math.min(100, prev.enemyComboMeter + boost);
                        return { ...prev, enemyComboMeter: newMeter, enemyFusionChargeActive: newMeter === 100 };
                    }
                });

                // Wardrum Ability
                if (actor.ability.name === 'Wardrum' && action.move?.type === 'Fighting' && Math.random() < 0.3) {
                    const allyIdx = 1 - actorIdx;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted && ally.statStages) {
                        ally.statStages.attack = Math.min(6, (ally.statStages.attack || 0) + 1);
                        tempLogs.push(`${actor.name}'s Wardrum raised ${ally.name}'s Attack!`);
                    }
                }

                // Sour Sap Ability
                if (actor.ability.name === 'SourSap' && action.move?.type === 'Grass' && Math.random() < 0.2) {
                    if (target.statStages) {
                        target.statStages['special-defense'] = Math.max(-6, (target.statStages['special-defense'] || 0) - 1);
                        tempLogs.push(`${actor.name}'s Sour Sap lowered ${target.name}'s Sp. Def!`);
                    }
                }

                if (target.ability.name === 'HeavyStance' && action.move?.contact) {
                    if (target.statStages) {
                        target.statStages.speed = Math.max(-6, (target.statStages.speed || 0) - 1);
                        target.statStages.defense = Math.min(6, (target.statStages.defense || 0) + 1);
                        tempLogs.push(`${target.name}'s Heavy Stance raised Defense but lowered Speed!`);
                    }
                }

                // Crosswind Move Effect
                if (action.move?.name === 'Crosswind') {
                    if (action.isPlayer) setBattleState(prev => ({ ...prev, tailwindTurns: 4 }));
                    else setBattleState(prev => ({ ...prev, enemyTailwindTurns: 4 }));
                    tempLogs.push(`A tailwind started blowing!`);
                }

                // Gravebind Move Effect
                if (action.move?.name === 'Gravebind') {
                    let turns = 4;
                    if (actor.heldItem?.id === 'grip-claw') turns = 7;
                    target.trappedTurns = turns;
                    if (target.lastMoveName) {
                        target.sealedMoveName = target.lastMoveName;
                        target.sealedTurns = 2;
                        tempLogs.push(`${target.name} was trapped and its ${target.lastMoveName} was sealed!`);
                    } else {
                        tempLogs.push(`${target.name} was trapped!`);
                    }
                }

                // Soul Resonance Move Effect
                if (action.move?.name === 'Soul Resonance') {
                    const allyIdx = 1 - action.actorIndex;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted) {
                        const allyHeal = Math.floor(ally.maxHp * 0.25);
                        ally.currentHp = Math.min(ally.maxHp, ally.currentHp + allyHeal);
                        tempLogs.push(`${ally.name} was healed by Soul Resonance!`);
                    }
                    const selfHeal = Math.floor(actor.maxHp * 0.15);
                    actor.currentHp = Math.min(actor.maxHp, actor.currentHp + selfHeal);
                    tempLogs.push(`${actor.name} was healed by Soul Resonance!`);
                }

                // Eclipse Beam Move Effect
                if (action.move?.name === 'Eclipse Beam') {
                    if (battleState.trickRoomTurns && battleState.trickRoomTurns > 0) {
                        setBattleState(prev => ({ ...prev, trickRoomTurns: 0, tailwindTurns: 4 }));
                        tempLogs.push("Trick Room ended! Tailwind started blowing!");
                    } else if (battleState.tailwindTurns && battleState.tailwindTurns > 0) {
                        setBattleState(prev => ({ ...prev, tailwindTurns: 0, trickRoomTurns: 5 }));
                        tempLogs.push("Tailwind ended! Trick Room started!");
                    } else {
                        setBattleState(prev => ({ ...prev, trickRoomTurns: 5 }));
                        tempLogs.push("Trick Room started!");
                    }

                    // Room Service
                    [...tempPTeam, ...tempETeam].forEach(mon => {
                        if (mon && !mon.isFainted && mon.heldItem?.id === 'room-service' && mon.statStages) {
                            mon.statStages.speed = Math.max(-6, (mon.statStages.speed || 0) - 1);
                            tempLogs.push(`${mon.name}'s Room Service lowered its Speed!`);
                            mon.heldItem = undefined;
                        }
                    });
                }

                // End of Action: Track Link
                actor.lastMoveWasLink = action.isFusion;

                // Crystal Memory Ability
                if (actor.ability.name === 'CrystalMemory' && Math.random() < 0.3) {
                    tempLogs.push(`${actor.name}'s Crystal Memory restored its energy!`);
                }

                // Throat Spray
                if (actor.heldItem?.id === 'throat-spray' && action.move?.isSound) {
                    if (actor.statStages) {
                        actor.statStages['special-attack'] = Math.min(6, (actor.statStages['special-attack'] || 0) + 1);
                        tempLogs.push(`${actor.name}'s Throat Spray boosted its Sp. Atk!`);
                        actor.heldItem = undefined;
                    }
                }

                // Choice Item Lock
                if (actor.heldItem?.id.startsWith('choice-') && !actor.choiceMove && action.move) {
                    actor.choiceMove = action.move.name;
                }

                // Sync Pulse Ability
                if (actor.ability.name === 'SyncPulse' && action.isFusion) {
                    const allyIdx = 1 - actorIdx;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted) {
                        ally.nextMoveDamageBoost = true;
                        tempLogs.push(`${actor.name}'s Sync Pulse boosted ${ally.name}'s next move!`);
                    }
                }
                
                // Handle Fainting
                if (target.currentHp === 0 && !target.isFainted) {
                    target.isFainted = true;
                    playFaintSfx();
                    tempLogs.push(`${target.name} fainted!`);

                    // Destiny Bond
                    if (target.isDestinyBondActive && !actor.isFainted) {
                        actor.currentHp = 0;
                        actor.isFainted = true;
                        tempLogs.push(`${actor.name} took ${target.name} with it!`);
                    }
                    
                    const targetAllyIdx = 1 - realTargetIndex;
                    const targetAlly = (!action.isPlayer) ? tempPTeam[targetAllyIdx] : tempETeam[targetAllyIdx];

                    // Carry Over Ability: Pass item to ally on faint
                    if (target.ability.name === 'CarryOver') {
                        if (target.heldItem) {
                            if (targetAlly && !targetAlly.isFainted && !targetAlly.heldItem) {
                                targetAlly.heldItem = target.heldItem;
                                tempLogs.push(`${target.name}'s Carry Over passed its ${target.heldItem.name} to ${targetAlly.name}!`);
                                target.heldItem = undefined;
                            }
                        }
                        if (target.statStages) {
                            if (targetAlly && !targetAlly.isFainted && targetAlly.statStages) {
                                Object.keys(target.statStages).forEach(s => {
                                    const stat = s as keyof StatStages;
                                    targetAlly.statStages![stat] = Math.min(6, Math.max(-6, (targetAlly.statStages![stat] || 0) + (target.statStages![stat] || 0)));
                                });
                                tempLogs.push(`${target.name}'s Carry Over passed stats to ${targetAlly.name}!`);
                            }
                        }
                    }

                    // Moxie Ability
                    if (actor.ability.name === 'Moxie' && actor.statStages) {
                        actor.statStages.attack = Math.min(6, (actor.statStages.attack || 0) + 1);
                        tempLogs.push(`${actor.name}'s Moxie raised its Attack!`);
                    }

                    // Reckless Tempo Ability
                    if (actor.ability.name === 'RecklessTempo' && !actor.isFainted) {
                        if (actor.statStages) {
                            actor.statStages.speed = Math.min(6, (actor.statStages.speed || 0) + 1);
                            tempLogs.push(`${actor.name}'s Reckless Tempo raised its Speed!`);
                        }
                    }

                    // Soul Link Ability
                    if (targetAlly && !targetAlly.isFainted && targetAlly.ability.name === 'SoulLink') {
                        const heal = Math.floor(targetAlly.maxHp * 0.25);
                        targetAlly.currentHp = Math.min(targetAlly.maxHp, targetAlly.currentHp + heal);
                        tempLogs.push(`${targetAlly.name}'s Soul Link restored its HP!`);
                    }

                    // Grim Recovery Ability
                    if (actor.ability.name === 'GrimRecovery' && target.status) {
                        const heal = Math.floor(actor.maxHp / 4);
                        actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                        tempLogs.push(`${actor.name}'s Grim Recovery restored its HP!`);
                    }

                    // Feedback Ability
                    if (actor.ability.name === 'Feedback' && !actor.isFainted) {
                        setBattleState(prev => {
                            if (action.isPlayer) {
                                const newMeter = Math.min(100, prev.comboMeter + 20);
                                return { ...prev, comboMeter: newMeter, fusionChargeActive: newMeter === 100 };
                            } else {
                                const newMeter = Math.min(100, prev.enemyComboMeter + 20);
                                return { ...prev, enemyComboMeter: newMeter, enemyFusionChargeActive: newMeter === 100 };
                            }
                        });
                        tempLogs.push(`${actor.name}'s Feedback boosted the Sync Gauge!`);
                    }

                    // Grudge Engine Ability
                    if (targetAlly && !targetAlly.isFainted && targetAlly.ability.name === 'GrudgeEngine') {
                        targetAlly.nextMoveBoosts = { ...targetAlly.nextMoveBoosts, critRate: 1 };
                        tempLogs.push(`${targetAlly.name}'s Grudge Engine boosted its critical hit rate!`);
                    }

                    // Spirit Tether Ability
                    if (target.ability.name === 'SpiritTether' && targetAlly && !targetAlly.isFainted) {
                        const heal = Math.floor(targetAlly.maxHp * 0.5);
                        targetAlly.currentHp = Math.min(targetAlly.maxHp, targetAlly.currentHp + heal);
                        tempLogs.push(`${target.name}'s Spirit Tether restored ${targetAlly.name}'s HP!`);
                    }

                    // Ashen Body Ability
                    if (target.ability.name === 'AshenBody') {
                        const foes = action.isPlayer ? tempETeam : tempPTeam;
                        foes.forEach(f => {
                            if (f && !f.isFainted && !f.status && !f.types.includes('fire')) {
                                f.status = 'burn';
                                tempLogs.push(`${f.name} was burned by ${target.name}'s Ashen Body!`);
                            }
                        });
                    }

                    // Death Wail Ability
                    if (target.ability.name === 'DeathWail') {
                        const foes = action.isPlayer ? tempETeam : tempPTeam;
                        foes.forEach(f => {
                            if (f && !f.isFainted && f.statStages) {
                                f.statStages.attack = Math.max(-6, (f.statStages.attack || 0) - 1);
                                tempLogs.push(`${target.name}'s Death Wail lowered ${f.name}'s Attack!`);
                            }
                        });
                    }

                    // Gave Pact Ability
                    if (target.ability.name === 'GavePact' && targetAlly && !targetAlly.isFainted) {
                        const heal = Math.floor(targetAlly.maxHp * 0.25);
                        targetAlly.currentHp = Math.min(targetAlly.maxHp, targetAlly.currentHp + heal);
                        tempLogs.push(`${target.name}'s Gave Pact healed ${targetAlly.name}!`);
                    }

                    // Aftermath Ability
                    if (target.ability.name === 'Aftermath' && makesContact && !actor.isFainted) {
                        const dmg = Math.floor(actor.maxHp / 4);
                        actor.currentHp = Math.max(0, actor.currentHp - dmg);
                        tempLogs.push(`${actor.name} was hurt by ${target.name}'s Aftermath!`);
                    }

                    // Innards Out Ability
                    if (target.ability.name === 'InnardsOut' && !actor.isFainted) {
                        // Simplified: use last damage dealt
                        const dmg = totalDamage;
                        actor.currentHp = Math.max(0, actor.currentHp - dmg);
                        tempLogs.push(`${actor.name} was hurt by ${target.name}'s Innards Out!`);
                    }
                    
                    // Grudge Engine Ability
                    if (targetAlly && !targetAlly.isFainted && targetAlly.ability.name === 'GrudgeEngine') {
                        tempLogs.push(`${targetAlly.name}'s Grudge Engine is revving up!`);
                    }

                    // Final Spark Ability
                    if (target.ability.name === 'FinalSpark') {
                        const foes = action.isPlayer ? tempETeam : tempPTeam;
                        const dmg = Math.floor(target.maxHp * 0.25);
                        foes.forEach(f => {
                            if (f && !f.isFainted) {
                                f.currentHp = Math.max(0, f.currentHp - dmg);
                                tempLogs.push(`${f.name} was hit by ${target.name}'s Final Spark!`);
                            }
                        });
                    }

                    // Sacrifice Ability
                    if (target.ability.name === 'Sacrifice' && targetAlly && !targetAlly.isFainted && targetAlly.statStages) {
                        Object.keys(targetAlly.statStages).forEach(s => {
                            const stat = s as keyof StatStages;
                            targetAlly.statStages![stat] = 6;
                        });
                        tempLogs.push(`${target.name}'s Sacrifice maxed ${targetAlly.name}'s stats!`);
                    }

                    // Vengeance Ability
                    if (target.ability.name === 'Vengeance' && targetAlly && !targetAlly.isFainted) {
                        targetAlly.nextMoveDamageBoost = true;
                        tempLogs.push(`${target.name}'s Vengeance boosted ${targetAlly.name}'s next move!`);
                    }

                    // Fuse Insurance Ability
                    if (target.ability.name === 'FuseInsurance' && action.isFusion && targetAlly && !targetAlly.isFainted) {
                        const heal = Math.floor(targetAlly.maxHp * 0.5);
                        targetAlly.currentHp = Math.min(targetAlly.maxHp, targetAlly.currentHp + heal);
                        tempLogs.push(`${target.name}'s Fuse Insurance restored ${targetAlly.name}'s HP!`);
                    }

                    if (action.isPlayer && !actor.isFainted) {
                        // Massively boosted XP to reduce grinding as requested (reaching cap in ~2 battles)
                        // Added Streak Bonus: +10% per streak point (max +100%)
                        const streakBonus = 1 + Math.min(1, battleState.battleStreak * 0.1);
                        let itemXpMult = 1;
                        if (actor.heldItem?.id === 'lucky-egg') itemXpMult = 1.5;
                        const xpGain = Math.floor((target.baseStats.hp * target.level) * 25 * streakBonus * (1 + playerState.meta.upgrades.xpMultiplier) * itemXpMult);
                        const playerLevelCap = 15 + playerState.badges * 10;
                        const avgLevel = playerState.team.reduce((a, b) => a + b.level, 0) / playerState.team.length;
                        const r = await gainExperience(actor, xpGain, playerLevelCap, avgLevel);
                        if (r.leveledUp) {
                            playLevelUpSfx();
                            tempLogs.push(`${actor.name} grew to Lv. ${r.mon.level}!`);
                            Object.assign(actor, r.mon); 
                            if(r.newMoves.length) tempLogs.push(`${actor.name} learned ${r.newMoves.join(', ')}!`);
                            const canEvo = await checkEvolution(actor);
                            if(canEvo) {
                                const evo = await evolvePokemon(actor);
                                Object.assign(actor, evo);
                                tempLogs.push(`What? ${actor.name} is evolving!`);
                            }
                            await syncState(1000);
                        } else {
                            actor.xp = r.mon.xp;
                        }
                    }
                }
                
                if (res.effectiveness > 1) tempLogs.push("It's super effective!");
                if (res.effectiveness < 1 && res.effectiveness > 0) tempLogs.push("It's not very effective...");
                if (res.isCritical) tempLogs.push("Critical hit!");
                
                await syncState(800); // Wait for hit anim

                // Reset Damage Animation
                if (action.isPlayer) {
                    tempETeam[realTargetIndex] = { ...tempETeam[realTargetIndex], animationState: 'idle', incomingAttackType: undefined };
                    target = tempETeam[realTargetIndex];
                } else {
                    tempPTeam[realTargetIndex] = { ...tempPTeam[realTargetIndex], animationState: 'idle', incomingAttackType: undefined };
                    target = tempPTeam[realTargetIndex];
                }

                if (sec.charge && !actor.chargingMove) {
                    actor.chargingMove = action.move;
                    if (sec.invulnerable) actor.isInvulnerable = true;
                    tempLogs.push(`${actor.name} is charging ${action.move.name}!`);
                    await syncState(800);
                    continue;
                }

                if (sec.forceOut) {
                    const isPlayerTarget = !action.isPlayer;
                    const targetTeam = isPlayerTarget ? tempPTeam : tempETeam;
                    const nextIdx = targetTeam.findIndex((p, i) => i > 1 && !p.isFainted); // Find someone in the backline
                    if (nextIdx !== -1) {
                        const old = targetTeam[realTargetIndex];
                        targetTeam[realTargetIndex] = targetTeam[nextIdx];
                        targetTeam[nextIdx] = old;
                        tempLogs.push(`${old.name} was forced out! ${targetTeam[realTargetIndex].name} came in!`);
                        playCry(targetTeam[realTargetIndex].id, targetTeam[realTargetIndex].name);
                    } else {
                        tempLogs.push(`But there was no one to switch in!`);
                    }
                }

                if (sec.forceSwitch) {
                    if (action.isPlayer) {
                        setBattleState(prev => ({ 
                            ...prev, 
                            mustSwitch: true, 
                            switchingActorIdx: action.actorIndex,
                            isBatonPass: sec.batonPass
                        }));
                        tempLogs.push(`${realActor.name} is switching out!`);
                    } else {
                        const team = tempETeam;
                        const backline = team.slice(2).filter(p => !p.isFainted);
                        if (backline.length > 0) {
                            const nextIdx = team.indexOf(backline[0]);
                            const oldMon = team[action.actorIndex];
                            const newMon = team[nextIdx];
                            
                            if (sec.batonPass) {
                                newMon.statStages = { ...oldMon.statStages };
                                newMon.confusionTurns = oldMon.confusionTurns;
                                newMon.isLeechSeeded = oldMon.isLeechSeeded;
                                newMon.substituteHp = oldMon.substituteHp;
                            }
                            
                            // Swap
                            team[action.actorIndex] = newMon;
                            team[nextIdx] = oldMon;
                            tempLogs.push(`Enemy ${oldMon.name} switched out! Enemy ${newMon.name} came in!`);
                            playCry(newMon.id, newMon.name);
                        }
                    }
                }

                if (sec.itemRemoval) {
                    realTarget.heldItem = undefined;
                    tempLogs.push(`${realTarget.name}'s item was knocked off!`);
                }

                if (sec.recharge) {
                    realActor.mustRecharge = true;
                }

                if (sec.selfDamage) {
                    const damage = Math.floor(realActor.maxHp * sec.selfDamage);
                    realActor.currentHp = Math.max(0, realActor.currentHp - damage);
                    tempLogs.push(`${realActor.name} was hurt by its ${action.move.name}!`);
                }

                if (sec.selfDestruct) {
                    realActor.currentHp = 0;
                    realActor.isFainted = true;
                    tempLogs.push(`${realActor.name} fainted from self-destruction!`);
                }

                if (sec.taunt) {
                    realTarget.isTaunted = sec.taunt;
                    tempLogs.push(`${realTarget.name} was taunted!`);
                }
                if (sec.encore) {
                    realTarget.isEncored = sec.encore;
                    tempLogs.push(`${realTarget.name} was encored!`);
                }
                if (sec.disable) {
                    realTarget.isDisabled = sec.disable;
                    realTarget.disabledMoveName = action.move?.name;
                    tempLogs.push(`${realTarget.name}'s ${action.move?.name} was disabled!`);
                }
                if (sec.torment) {
                    realTarget.isTormented = true;
                    tempLogs.push(`${realTarget.name} was tormented!`);
                }
                if (sec.healBlock) {
                    realTarget.isHealBlocked = sec.healBlock;
                    tempLogs.push(`${realTarget.name} was heal blocked!`);
                }
                if (sec.embargo) {
                    realTarget.isEmbargoed = sec.embargo;
                    tempLogs.push(`${realTarget.name} was embargoed!`);
                }
                if (sec.magnetRise) {
                    realActor.isMagnetRaised = sec.magnetRise;
                    tempLogs.push(`${realActor.name} raised itself with electromagnetism!`);
                }
                if (sec.telekinesis) {
                    realTarget.isTelekinesised = sec.telekinesis;
                    tempLogs.push(`${realTarget.name} was lifted by telekinesis!`);
                }
                if (sec.ingrain) {
                    realActor.isIngrained = true;
                    tempLogs.push(`${realActor.name} planted its roots!`);
                }
                if (sec.aquaRing) {
                    realActor.isAquaRinged = true;
                    tempLogs.push(`${realActor.name} surrounded itself with a veil of water!`);
                }
                if (sec.imprison) {
                    realActor.isImprisoned = true;
                    tempLogs.push(`${realActor.name} imprisoned its foes!`);
                }
                if (sec.gravity) {
                    setBattleState(prev => ({ ...prev, gravityTurns: 5 }));
                    tempLogs.push(`Gravity intensified!`);
                }

                if (sec.healWish) {
                    realActor.currentHp = 0;
                    if (action.isPlayer) setBattleState(prev => ({ ...prev, isHealingWishActive: true }));
                    else setBattleState(prev => ({ ...prev, enemyIsHealingWishActive: true }));
                    tempLogs.push(`${realActor.name} sacrificed itself for the team!`);
                }
                if (sec.lunarDance) {
                    realActor.currentHp = 0;
                    if (action.isPlayer) setBattleState(prev => ({ ...prev, isLunarDanceActive: true }));
                    else setBattleState(prev => ({ ...prev, enemyIsLunarDanceActive: true }));
                    tempLogs.push(`${realActor.name} sacrificed itself for the team!`);
                }

                if (sec.batonPass) {
                    if (action.isPlayer) {
                        setBattleState(prev => ({ ...prev, isBatonPass: true, mustSwitch: true, switchingActorIdx: action.actorIndex }));
                    } else {
                        setBattleState(prev => ({ ...prev, enemyIsBatonPass: true, enemySwitching: true, enemySwitchingMonIndex: action.actorIndex }));
                    }
                    tempLogs.push(`${realActor.name} is switching out!`);
                }
                if (sec.pivot) {
                    if (action.isPlayer) {
                        setBattleState(prev => ({ ...prev, mustSwitch: true, switchingActorIdx: action.actorIndex }));
                    } else {
                        setBattleState(prev => ({ ...prev, enemySwitching: true, enemySwitchingMonIndex: action.actorIndex }));
                    }
                    tempLogs.push(`${realActor.name} is switching out!`);
                }

                if (sec.wish) {
                    if (action.isPlayer) setBattleState(prev => ({ ...prev, wishTurns: 2 }));
                    else setBattleState(prev => ({ ...prev, enemyWishTurns: 2 }));
                    tempLogs.push(`${realActor.name} made a wish!`);
                }
                if (sec.yawn) {
                    realTarget.isYawned = 2;
                    tempLogs.push(`${realTarget.name} became drowsy!`);
                }
                if (sec.status === 'freeze') {
                    realTarget.status = 'freeze';
                    tempLogs.push(`${realTarget.name} was frozen solid!`);
                    // Trigger Status VFX
                    setBattleState(prev => ({ 
                        ...prev, 
                        vfx: { 
                            type: 'freeze', 
                            target: !action.isPlayer ? 'player' : 'enemy', 
                            index: realTargetIndex 
                        } 
                    }));
                }
                if (sec.typeChange) {
                    realActor.types = sec.typeChange;
                    tempLogs.push(`${realActor.name}'s type changed to ${sec.typeChange.join('/')}!`);
                }
                if (sec.targetTypeChange) {
                    realTarget.types = sec.targetTypeChange;
                    tempLogs.push(`${realTarget.name}'s type changed to ${sec.targetTypeChange.join('/')}!`);
                }

                if (sec.statusClear) {
                    if (sec.statusClear === 'self') {
                        realActor.status = undefined;
                        tempLogs.push(`${realActor.name} cleared its status!`);
                    } else {
                        const team = action.isPlayer ? tempPTeam : tempETeam;
                        team.forEach((p: Pokemon) => { if (p) p.status = undefined; });
                        tempLogs.push(`The team's status conditions were cleared!`);
                    }
                }

                if (sec.tailwind) {
                    if (action.isPlayer) setBattleState(prev => ({ ...prev, tailwindTurns: 4 }));
                    else setBattleState(prev => ({ ...prev, enemyTailwindTurns: 4 }));
                    tempLogs.push(`A tailwind started blowing!`);
                }
                if (sec.trickRoom) {
                    setBattleState(prev => ({ ...prev, trickRoomTurns: 5 }));
                    tempLogs.push(`Trick Room was set!`);
                }

                if (sec.leechSeed) {
                    if (realTarget.types.includes('grass')) {
                        tempLogs.push(`It doesn't affect ${realTarget.name}!`);
                    } else if (realTarget.isLeechSeeded) {
                        tempLogs.push(`${realTarget.name} is already seeded!`);
                    } else {
                        realTarget.isLeechSeeded = true;
                        tempLogs.push(`${realTarget.name} was seeded!`);
                    }
                }

                if (sec.substitute) {
                    if (realActor.substituteHp) {
                        tempLogs.push(`${realActor.name} already has a substitute!`);
                    } else {
                        const cost = Math.floor(realActor.maxHp / 4);
                        if (realActor.currentHp > cost) {
                            realActor.currentHp -= cost;
                            realActor.substituteHp = cost;
                            tempLogs.push(`${realActor.name} created a substitute!`);
                        } else {
                            tempLogs.push(`But it didn't have enough HP!`);
                        }
                    }
                }

                if (sec.copyStats) {
                    if (realTarget.statStages) {
                        realActor.statStages = { ...realTarget.statStages };
                        tempLogs.push(`${realActor.name} copied ${realTarget.name}'s stat changes!`);
                    }
                }

                if (sec.reverseStats) {
                    if (realTarget.statStages) {
                        Object.keys(realTarget.statStages).forEach(s => {
                            const stat = s as keyof StatStages;
                            realTarget.statStages![stat] = -(realTarget.statStages![stat] || 0);
                        });
                        tempLogs.push(`${realTarget.name}'s stat changes were reversed!`);
                    }
                }

                if (sec.setHp !== undefined) {
                    realTarget.currentHp = Math.min(realTarget.maxHp, sec.setHp);
                    tempLogs.push(`${realTarget.name}'s HP was set!`);
                }

                if (sec.hpFraction !== undefined) {
                    const damage = Math.floor(realTarget.maxHp * sec.hpFraction);
                    realTarget.currentHp = Math.max(0, realTarget.currentHp - damage);
                    tempLogs.push(`${realTarget.name} lost HP!`);
                }

                if (sec.bellyDrum) {
                    const cost = Math.floor(realActor.maxHp / 2);
                    if (realActor.currentHp > cost && realActor.statStages) {
                        realActor.currentHp -= cost;
                        realActor.statStages.attack = 6;
                        tempLogs.push(`${realActor.name} cut its own HP and maximized its Attack!`);
                    } else {
                        tempLogs.push(`But it failed!`);
                    }
                }

                if (sec.destinyBond) {
                    realActor.isDestinyBondActive = true;
                    tempLogs.push(`${realActor.name} is trying to take its foe with it!`);
                }

                if (sec.perishSong) {
                    [...tempPTeam.slice(0, 2), ...tempETeam.slice(0, 2)].forEach(p => {
                        if (p && !p.isFainted) {
                            p.perishTurns = 4;
                        }
                    });
                    tempLogs.push(`All Pokémon that heard the song will faint in three turns!`);
                }

                if (sec.futureSight) {
                    realTarget.futureSightTurns = 3;
                    realTarget.futureSightDamage = 100; // Simplified base damage
                    tempLogs.push(`${realActor.name} foresaw an attack!`);
                }

                if (sec.itemSteal) {
                    if (realTarget.heldItem && !realActor.heldItem) {
                        realActor.heldItem = realTarget.heldItem;
                        realTarget.heldItem = undefined;
                        tempLogs.push(`${realActor.name} stole ${realTarget.name}'s ${realActor.heldItem.name}!`);
                    }
                }

                if (sec.curse) {
                    realTarget.isCursed = true;
                    tempLogs.push(`${realTarget.name} was cursed!`);
                }

                if (sec.clearStats) {
                    [...tempPTeam, ...tempETeam].forEach((p: Pokemon) => {
                        if (p && p.statStages) {
                            p.statStages = { attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0, accuracy: 0, evasion: 0 };
                        }
                    });
                    tempLogs.push(`All stat changes were eliminated!`);
                }

                if (sec.healing) {
                    const heal = Math.floor(realActor.maxHp * sec.healing);
                    realActor.currentHp = Math.min(realActor.maxHp, realActor.currentHp + heal);
                    tempLogs.push(`${realActor.name} restored its HP!`);
                }

                if (sec.itemSwap) {
                    const tempItem = realActor.heldItem;
                    realActor.heldItem = realTarget.heldItem;
                    realTarget.heldItem = tempItem;
                    tempLogs.push(`${realActor.name} and ${realTarget.name} swapped items!`);
                }

                if (sec.reflect) {
                    const duration = actor.heldItem?.id === 'light-clay' ? 8 : 5;
                    if (action.isPlayer) setBattleState(prev => ({ ...prev, reflectTurns: duration }));
                    else setBattleState(prev => ({ ...prev, enemyReflectTurns: duration }));
                    tempLogs.push(`Reflect raised Defense!`);
                }
                if (sec.lightScreen) {
                    const duration = actor.heldItem?.id === 'light-clay' ? 8 : 5;
                    if (action.isPlayer) setBattleState(prev => ({ ...prev, lightScreenTurns: duration }));
                    else setBattleState(prev => ({ ...prev, enemyLightScreenTurns: duration }));
                    tempLogs.push(`Light Screen raised Special Defense!`);
                }
                if (sec.auroraVeil) {
                    const duration = actor.heldItem?.id === 'light-clay' ? 8 : 5;
                    if (action.isPlayer) setBattleState(prev => ({ ...prev, auroraVeilTurns: duration }));
                    else setBattleState(prev => ({ ...prev, enemyAuroraVeilTurns: duration }));
                    tempLogs.push(`Aurora Veil raised Defense and Special Defense!`);
                }

                if (sec.protect) {
                    actor.isProtected = true;
                    tempLogs.push(`${actor.name} protected itself!`);
                }

                if (sec.weatherChange) {
                    let duration = 5;
                    if (actor.heldItem?.id === 'damp-rock' && sec.weatherChange === 'rain') duration = 8;
                    if (actor.heldItem?.id === 'heat-rock' && sec.weatherChange === 'sun') duration = 8;
                    if (actor.heldItem?.id === 'smooth-rock' && sec.weatherChange === 'sand') duration = 8;
                    if (actor.heldItem?.id === 'icy-rock' && (sec.weatherChange === 'hail' || sec.weatherChange === 'snow')) duration = 8;
                    setBattleState(prev => ({ ...prev, weather: sec.weatherChange as WeatherType, weatherTurns: duration }));
                    tempLogs.push(`The weather changed to ${sec.weatherChange}!`);
                }
                if (sec.terrainChange) {
                    const duration = actor.heldItem?.id === 'terrain-extender' ? 8 : 5;
                    setBattleState(prev => ({ ...prev, terrain: sec.terrainChange as TerrainType, terrainTurns: duration }));
                    tempLogs.push(`The terrain changed to ${sec.terrainChange}!`);
                }

                if (sec.setHazard) {
                    const isPlayerTarget = !action.isPlayer;
                    const hazardKey = isPlayerTarget ? 'playerHazards' : 'enemyHazards';
                    setBattleState(prev => {
                        const current = prev[hazardKey] || [];
                        if (!current.includes(sec.setHazard as any)) {
                            return { ...prev, [hazardKey]: [...current, sec.setHazard] };
                        }
                        return prev;
                    });
                    tempLogs.push(`${sec.setHazard} were set on the enemy's side!`);
                }

                if (sec.clearHazards) {
                    setBattleState(prev => ({
                        ...prev,
                        playerHazards: [],
                        enemyHazards: [],
                        reflectTurns: 0,
                        enemyReflectTurns: 0,
                        lightScreenTurns: 0,
                        enemyLightScreenTurns: 0,
                        auroraVeilTurns: 0,
                        enemyAuroraVeilTurns: 0
                    }));
                    tempLogs.push(`The effects of hazards and screens were cleared!`);
                }
                if (sec.tailwind) {
                    setBattleState(prev => ({ ...prev, [action.isPlayer ? 'tailwindTurns' : 'enemyTailwindTurns']: 4 }));
                }
                if (sec.spikes) {
                    setBattleState(prev => {
                        const hazards = action.isPlayer ? [...(prev.enemyHazards || [])] : [...(prev.playerHazards || [])];
                        if (hazards.filter(h => h === 'Spikes').length < 3) {
                            hazards.push('Spikes');
                        }
                        return { ...prev, [action.isPlayer ? 'enemyHazards' : 'playerHazards']: hazards };
                    });
                }
                if (sec.stealthRock) {
                    setBattleState(prev => {
                        const hazards = action.isPlayer ? [...(prev.enemyHazards || [])] : [...(prev.playerHazards || [])];
                        if (!hazards.includes('Stealth Rock')) {
                            hazards.push('Stealth Rock');
                        }
                        return { ...prev, [action.isPlayer ? 'enemyHazards' : 'playerHazards']: hazards };
                    });
                }
                if (sec.toxicSpikes) {
                    setBattleState(prev => {
                        const hazards = action.isPlayer ? [...(prev.enemyHazards || [])] : [...(prev.playerHazards || [])];
                        if (hazards.filter(h => h === 'Toxic Spikes').length < 2) {
                            hazards.push('Toxic Spikes');
                        }
                        return { ...prev, [action.isPlayer ? 'enemyHazards' : 'playerHazards']: hazards };
                    });
                }
                if (sec.reflect) {
                    setBattleState(prev => ({ ...prev, [action.isPlayer ? 'reflectTurns' : 'enemyReflectTurns']: 5 }));
                }
                if (sec.lightScreen) {
                    setBattleState(prev => ({ ...prev, [action.isPlayer ? 'lightScreenTurns' : 'enemyLightScreenTurns']: 5 }));
                }
                if (sec.auroraVeil && battleState.weather === 'snow') {
                    setBattleState(prev => ({ ...prev, [action.isPlayer ? 'auroraVeilTurns' : 'enemyAuroraVeilTurns']: 5 }));
                }
                if (sec.aegisField) {
                    setBattleState(prev => ({ ...prev, [action.isPlayer ? 'aegisFieldTurns' : 'enemyAegisFieldTurns']: 5 }));
                }
                if (sec.runeWard) {
                    setBattleState(prev => ({ ...prev, [action.isPlayer ? 'runeWardTurns' : 'enemyRuneWardTurns']: 5 }));
                }
                if (sec.syncGaugeDrain) {
                    setBattleState(prev => {
                        if (action.isPlayer) {
                            const drain = Math.min(prev.enemyComboMeter, sec.syncGaugeDrain!);
                            return { ...prev, comboMeter: Math.min(100, prev.comboMeter + drain), enemyComboMeter: Math.max(0, prev.enemyComboMeter - drain) };
                        } else {
                            const drain = Math.min(prev.comboMeter, sec.syncGaugeDrain!);
                            return { ...prev, enemyComboMeter: Math.min(100, prev.enemyComboMeter + drain), comboMeter: Math.max(0, prev.comboMeter - drain) };
                        }
                    });
                }
                if (sec.trap) {
                    target.isTrapped = sec.trap;
                }
                if (sec.fieldWarp) {
                    setBattleState(prev => {
                        if (prev.tailwindTurns || prev.enemyTailwindTurns) {
                            return { ...prev, tailwindTurns: 0, enemyTailwindTurns: 0, trickRoomTurns: 5 };
                        } else {
                            return { ...prev, tailwindTurns: 5, enemyTailwindTurns: 5 };
                        }
                    });
                }
                if (sec.stickyWeb) {
                    setBattleState(prev => {
                        const hazards = action.isPlayer ? [...(prev.enemyHazards || [])] : [...(prev.playerHazards || [])];
                        if (!hazards.includes('Sticky Web')) {
                            hazards.push('Sticky Web');
                        }
                        return { ...prev, [action.isPlayer ? 'enemyHazards' : 'playerHazards']: hazards };
                    });
                }
                if (sec.protect) {
                    target.isProtected = true;
                }
                if (sec.forceOut && target.ability.name !== 'AnchorGrip') {
                    const team = action.isPlayer ? tempETeam : tempPTeam;
                    const backline = team.slice(2).filter(p => !p.isFainted);
                    if (backline.length > 0) {
                        const randomIdx = Math.floor(Math.random() * backline.length);
                        const backIdx = team.indexOf(backline[randomIdx]);
                        const temp = team[realTargetIndex];
                        team[realTargetIndex] = team[backIdx];
                        team[backIdx] = temp;
                        tempLogs.push(`${target.name} was forced out!`);
                    }
                }
                if (sec.healing && actor.statStages) {
                    const heal = Math.floor(actor.maxHp * (sec.healing / 100));
                    actor.currentHp = Math.min(actor.maxHp, actor.currentHp + heal);
                    tempLogs.push(`${actor.name} restored its HP!`);
                }
                if (sec.selfStatChanges && actor.statStages) {
                    sec.selfStatChanges.forEach(sc => {
                        const statName = sc.stat.name as keyof StatStages;
                        actor.statStages![statName] = Math.min(6, Math.max(-6, (actor.statStages![statName] || 0) + sc.change));
                        tempLogs.push(`${actor.name}'s ${statName} ${sc.change > 0 ? 'rose' : 'fell'}!`);

                        // Trigger Stat VFX
                        setBattleState(prev => ({ 
                            ...prev, 
                            vfx: { 
                                type: sc.change > 0 ? 'stat-up' : 'stat-down', 
                                target: action.isPlayer ? 'player' : 'enemy', 
                                index: action.actorIndex 
                            } 
                        }));
                    });
                }
                if (sec.weather) {
                    let duration = 5;
                    if (actor.heldItem?.id === 'damp-rock' && sec.weather === 'rain') duration = 8;
                    if (actor.heldItem?.id === 'heat-rock' && sec.weather === 'sun') duration = 8;
                    if (actor.heldItem?.id === 'smooth-rock' && sec.weather === 'sand') duration = 8;
                    if (actor.heldItem?.id === 'icy-rock' && (sec.weather === 'hail' || sec.weather === 'snow')) duration = 8;
                    setBattleState(prev => ({ ...prev, weather: sec.weather!, weatherTurns: duration }));
                    tempLogs.push(sec.msg || `The weather became ${sec.weather}!`);
                    
                    // Tide Turner Ability
                    if (sec.weather === 'rain') {
                        [...tempPTeam, ...tempETeam].forEach(p => {
                            if (p && !p.isFainted && p.ability.name === 'TideTurner' && p.statStages) {
                                p.statStages.speed = Math.min(6, (p.statStages.speed || 0) + 1);
                                tempLogs.push(`${p.name}'s Tide Turner boosted its Speed!`);
                            }
                        });
                    }
                    await syncState(500);
                }
                if (sec.terrain) {
                    const duration = actor.heldItem?.id === 'terrain-extender' ? 8 : 5;
                    setBattleState(prev => ({ ...prev, terrain: sec.terrain!, terrainTurns: duration }));
                    tempLogs.push(sec.msg || `The terrain became ${sec.terrain}!`);
                    await syncState(500);
                }
                if (sec.flinch) {
                    target.isFlinching = true;
                    tempLogs.push(sec.msg || `${target.name} flinched!`);
                    
                    // Shared Nerves Ability
                    const allyIdx = 1 - realTargetIndex;
                    const ally = (!action.isPlayer) ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted && ally.ability.name === 'SharedNerves') {
                        ally.isFlinchImmune = true;
                        tempLogs.push(`${ally.name}'s Shared Nerves made it immune to flinching!`);
                    }
                    await syncState(500);
                }
                if (sec.msg && !sec.weather && !sec.flinch) {
                    tempLogs.push(sec.msg);
                    if (sec.status === 'confusion') {
                        target.confusionTurns = Math.floor(Math.random() * 4) + 2; // 2-5 turns
                        checkBerries(target, tempLogs);
                    } else {
                        target.status = sec.status;
                        // Trigger Status VFX
                        setBattleState(prev => ({ 
                            ...prev, 
                            vfx: { 
                                type: sec.status === 'poison' || sec.status === 'toxic' ? 'poison_status' : sec.status!, 
                                target: !action.isPlayer ? 'player' : 'enemy', 
                                index: realTargetIndex 
                            } 
                        }));
                        if (sec.status === 'sleep') target.statusTurns = Math.floor(Math.random() * 3) + 1;
                        checkBerries(target, tempLogs);
                        
                        // Lag Shock & Crossfire Burn (Attacker has the ability)
                        if (sec.status === 'paralysis' && actor.ability.name === 'LagShock') {
                            const otherFoeIdx = 1 - realTargetIndex;
                            const otherFoe = (action.isPlayer) ? tempETeam[otherFoeIdx] : tempPTeam[otherFoeIdx];
                            if (otherFoe && !otherFoe.isFainted) {
                                otherFoe.nextMovePriorityBoost = (otherFoe.nextMovePriorityBoost || 0) - 1;
                                tempLogs.push(`${actor.name}'s Lag Shock reduced ${otherFoe.name}'s next move priority!`);
                            }
                        }
                        if (sec.status === 'burn' && actor.ability.name === 'CrossfireBurn') {
                            const otherFoeIdx = 1 - realTargetIndex;
                            const otherFoe = (action.isPlayer) ? tempETeam[otherFoeIdx] : tempPTeam[otherFoeIdx];
                            if (otherFoe && !otherFoe.isFainted) {
                                otherFoe.nextMoveDamageBoost = (otherFoe.nextMoveDamageBoost || 1) * 0.8;
                                tempLogs.push(`${actor.name}'s Crossfire Burn weakened ${otherFoe.name}'s next move!`);
                            }
                        }

                        // Split Agony Ability
                        if (sec.status === 'toxic' && target.ability.name === 'SplitAgony') {
                            target.status = 'poison';
                            tempLogs.push(`${target.name}'s Split Agony converted the toxic poison!`);
                            const allyIdx = 1 - realTargetIndex;
                            const ally = (!action.isPlayer) ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                            if (ally && !ally.isFainted && !ally.status) {
                                ally.status = 'poison';
                                tempLogs.push(`${target.name}'s Split Agony poisoned ${ally.name}!`);
                            }
                        }

                        // Antibody Relay: When user or ally is poisoned, other is cured
                        if (sec.status === 'poison' || sec.status === 'toxic') {
                            const allyIdx = 1 - realTargetIndex;
                            const ally = (!action.isPlayer) ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                            if (ally && !ally.isFainted && (target.ability.name === 'AntibodyRelay' || ally.ability.name === 'AntibodyRelay')) {
                                ally.status = undefined;
                                tempLogs.push(`${target.name}'s Antibody Relay cured ${ally.name}!`);
                            }
                        }
                    }
                    await syncState(500);
                }
                if (sec.statChanges && sec.statChanges.length > 0) {
                    const targetMon = sec.statTarget === 'self' ? actor : (sec.statTarget === 'ally' ? (action.isPlayer ? tempPTeam[1 - actorIdx] : tempETeam[1 - actorIdx]) : target);
                    if (targetMon && !targetMon.isFainted) {
                        const isProtectedByRuneWard = (action.isPlayer ? battleState.runeWardTurns : battleState.enemyRuneWardTurns) && (sec.statTarget !== 'self');
                        sec.statChanges.forEach((sc: any) => {
                            const stat = sc.stat.name as keyof StatStages;
                            if (targetMon.statStages) {
                                if (sc.change < 0 && isProtectedByRuneWard) {
                                    tempLogs.push(`${targetMon.name} is protected by Rune Ward!`);
                                    return;
                                }

                                // Clear Amulet
                                if (sc.change < 0 && targetMon.heldItem?.id === 'clear-amulet' && sec.statTarget !== 'self') {
                                    tempLogs.push(`${targetMon.name}'s Clear Amulet prevented stat loss!`);
                                    return;
                                }

                                // Mirror Herb
                                if (sc.change > 0 && sec.statTarget === 'self') {
                                    const opponentTeam = action.isPlayer ? tempETeam : tempPTeam;
                                    opponentTeam.forEach(opp => {
                                        if (opp && !opp.isFainted && opp.heldItem?.id === 'mirror-herb' && opp.statStages) {
                                            opp.statStages[stat] = Math.min(6, (opp.statStages[stat] || 0) + sc.change);
                                            tempLogs.push(`${opp.name}'s Mirror Herb mirrored the stat boost!`);
                                            opp.heldItem = undefined;
                                        }
                                    });
                                }

                                // Foil Ability: Redirect team-wide stat drops to user
                                if (sc.change < 0 && action.isPlayer !== (targetMon === tempPTeam[0] || targetMon === tempPTeam[1])) {
                                    const team = (targetMon === tempPTeam[0] || targetMon === tempPTeam[1]) ? tempPTeam : tempETeam;
                                    const allyIdx = 1 - team.indexOf(targetMon);
                                    const ally = team[allyIdx];
                                    if (ally && ally.ability.name === 'Foil' && !ally.isFainted && (action.move?.target === 'Both foes' || action.move?.target === 'all-opponents')) {
                                        tempLogs.push(`${targetMon.name} is protected by ${ally.name}'s Foil!`);
                                        if (ally.statStages) {
                                            ally.statStages[stat] = Math.min(6, Math.max(-6, (ally.statStages[stat] || 0) + sc.change * 2));
                                            tempLogs.push(`${ally.name}'s ${stat} fell sharply due to Foil!`);
                                        }
                                        return;
                                    }
                                }

                                const oldVal = targetMon.statStages[stat] || 0;
                                targetMon.statStages[stat] = Math.min(6, Math.max(-6, oldVal + sc.change));
                                tempLogs.push(`${targetMon.name}'s ${stat} ${sc.change > 0 ? 'rose' : 'fell'}!`);

                                // Eject Pack
                                if (sc.change < 0 && targetMon.heldItem?.id === 'eject-pack') {
                                    tempLogs.push(`${targetMon.name}'s Eject Pack activated!`);
                                    targetMon.heldItem = undefined;
                                    targetMon.mustSwitch = true;
                                }

                                // Trigger Stat VFX
                                const isPlayerTarget = action.isPlayer ? (targetMon === tempPTeam[0] || targetMon === tempPTeam[1]) : (targetMon === tempETeam[0] || targetMon === tempETeam[1]);
                                const targetIdx = (targetMon === tempPTeam[0] || targetMon === tempETeam[0]) ? 0 : 1;
                                setBattleState(prev => ({ 
                                    ...prev, 
                                    vfx: { 
                                        type: sc.change > 0 ? 'stat-up' : 'stat-down', 
                                        target: isPlayerTarget ? 'player' : 'enemy', 
                                        index: targetIdx 
                                    } 
                                }));

                                // Mirror Focus: When user's stats are lowered, ally's corresponding stat is raised
                                if (sc.change < 0 && targetMon.ability.name === 'MirrorFocus') {
                                    const allyIdx = 1 - (action.isPlayer ? tempPTeam.indexOf(targetMon) : tempETeam.indexOf(targetMon));
                                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                                    if (ally && !ally.isFainted && ally.statStages) {
                                        ally.statStages[stat] = Math.min(6, (ally.statStages[stat] || 0) + 1);
                                        tempLogs.push(`${targetMon.name}'s Mirror Focus raised ${ally.name}'s ${stat}!`);
                                    }
                                }

                                // Tempo Sync: When ally's Speed is raised, user's Speed is also raised
                                if (sc.change > 0 && stat === 'speed') {
                                    const allyIdx = 1 - (action.isPlayer ? tempPTeam.indexOf(targetMon) : tempETeam.indexOf(targetMon));
                                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                                    if (ally && !ally.isFainted && ally.ability.name === 'TempoSync' && ally.statStages) {
                                        ally.statStages.speed = Math.min(6, (ally.statStages.speed || 0) + 1);
                                        tempLogs.push(`${ally.name}'s Tempo Sync boosted its Speed!`);
                                    }
                                }
                            }
                        });
                        if (sec.msg && !sec.weather && !sec.flinch && !sec.status) tempLogs.push(sec.msg);
                        await syncState(500);
                    }
                }

                // Reset
                target.animationState = 'idle';
                target.incomingAttackType = undefined;

                // Link Pivot Ability
                if (actor.ability.name === 'LinkPivot' && action.move?.name.toLowerCase().includes('link')) {
                    const allyIdx = 1 - actorIdx;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted) {
                        ally.nextMovePriorityBoost = true;
                        tempLogs.push(`${actor.name}'s Link Pivot boosted ${ally.name}'s next move!`);
                    }
                }

                // Sync Pulse Ability
                if (actor.ability.name === 'SyncPulse' && Math.random() < 0.3) {
                    setBattleState(prev => {
                        if (action.isPlayer) {
                            const newMeter = Math.min(100, prev.comboMeter + 10);
                            return { ...prev, comboMeter: newMeter, fusionChargeActive: newMeter === 100 };
                        } else {
                            const newMeter = Math.min(100, prev.enemyComboMeter + 10);
                            return { ...prev, enemyComboMeter: newMeter, enemyFusionChargeActive: newMeter === 100 };
                        }
                    });
                    tempLogs.push(`${actor.name}'s Sync Pulse boosted the Sync Gauge!`);
                }

                // Amplifier Ability: Boosts Sync Pulse chance to 60%
                if (actor.ability.name === 'Amplifier' && Math.random() < 0.6) {
                    setBattleState(prev => {
                        if (action.isPlayer) {
                            const newMeter = Math.min(100, prev.comboMeter + 10);
                            return { ...prev, comboMeter: newMeter, fusionChargeActive: newMeter === 100 };
                        } else {
                            const newMeter = Math.min(100, prev.enemyComboMeter + 10);
                            return { ...prev, enemyComboMeter: newMeter, enemyFusionChargeActive: newMeter === 100 };
                        }
                    });
                    tempLogs.push(`${actor.name}'s Amplifier boosted the Sync Gauge!`);
                }

                // Wardrum Ability
                if (actor.ability.name === 'Wardrum' && action.move.type === 'fighting' && Math.random() < 0.3) {
                    const allyIdx = 1 - actorIdx;
                    const ally = action.isPlayer ? tempPTeam[allyIdx] : tempETeam[allyIdx];
                    if (ally && !ally.isFainted && ally.statStages) {
                        ally.statStages.attack = Math.min(6, (ally.statStages.attack || 0) + 1);
                        tempLogs.push(`${actor.name}'s Wardrum raised ${ally.name}'s Attack!`);
                    }
                }

                // Rune Bloom Ability
                if (actor.ability.name === 'RuneBloom' && action.move.type === 'fairy' && action.move.category === 'status' && !actor.hasUsedRuneBloomThisTurn) {
                    if (actor.statStages) {
                        actor.statStages.speed = Math.min(6, (actor.statStages.speed || 0) + 1);
                        actor.hasUsedRuneBloomThisTurn = true;
                        tempLogs.push(`${actor.name}'s Rune Bloom raised its Speed!`);
                    }
                }
            }
        }

        // 4. End of Turn Status Damage & Abilities
        for (let i = 0; i < tempPTeam.length; i++) {
            const mon = tempPTeam[i];
            if (mon.isFainted) continue;
            
            // Slip Cover Ability
            const allyIdx = 1 - i;
            const ally = tempPTeam[allyIdx];
            if (mon.ability.name === 'SlipCover' && (!ally || ally.isFainted)) {
                if (mon.statStages) {
                    mon.statStages.evasion = Math.min(6, (mon.statStages.evasion || 0) + 1);
                    tempLogs.push(`${mon.name}'s Slip Cover raised its Evasion!`);
                }
            }

            // Tag Cleanse Ability
            if (mon.ability.name === 'TagCleanse' && Math.random() < 0.5) {
                const allyIdx = 1 - i;
                const ally = tempPTeam[allyIdx];
                if (ally && !ally.isFainted && (ally.status || (ally.confusionTurns && ally.confusionTurns > 0))) {
                    ally.status = undefined;
                    ally.confusionTurns = 0;
                    tempLogs.push(`${mon.name}'s Tag Cleanse cured its ally!`);
                }
            }

            // Rain Dish+ & Chlorophyll+
            if (mon.ability.name === 'RainDishPlus' && battleState.weather === 'rain') {
                const heal = Math.floor(mon.maxHp / 16);
                tempPTeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                setBattleState(prev => ({ ...prev, comboMeter: Math.min(100, prev.comboMeter + 2) }));
                tempLogs.push(`${mon.name} restored HP and Sync Gauge in the rain!`);
            }
            if (mon.ability.name === 'ChlorophyllPlus' && battleState.weather === 'sun') {
                setBattleState(prev => ({ ...prev, comboMeter: Math.min(100, prev.comboMeter + 2) }));
                tempLogs.push(`${mon.name} boosted its Sync Gauge in the sun!`);
            }

            // Salt Veins Ability
            if (mon.ability.name === 'SaltVeins' && mon.status === 'paralysis') {
                const heal = Math.floor(mon.maxHp / 16);
                tempPTeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`${mon.name}'s Salt Veins restored its HP!`);
            }

            // Moonlight Call Ability
            if (mon.ability.name === 'MoonlightCall' && battleState.weather === 'none') {
                const heal = Math.floor(mon.maxHp / 16);
                tempPTeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`${mon.name}'s Moonlight Call restored its HP!`);
            }

            // Shellblood Ability
            if (mon.ability.name === 'Shellblood' && mon.currentHp <= mon.maxHp / 2) {
                const heal = Math.floor(mon.maxHp / 16);
                tempPTeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`${mon.name}'s Shellblood restored its HP!`);
            }

            // Photosynth Ability
            if (mon.ability.name === 'Photosynth' && battleState.weather === 'sun') {
                const heal = Math.floor(mon.maxHp / 16);
                tempPTeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`${mon.name}'s Photosynth restored its HP!`);
            }

            // Stone Harvest Ability
            if (mon.ability.name === 'StoneHarvest' && battleState.weather === 'sand') {
                const heal = Math.floor(mon.maxHp / 16);
                tempPTeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                if (mon.statStages) {
                    mon.statStages.defense = Math.min(6, (mon.statStages.defense || 0) + 1);
                }
                tempLogs.push(`${mon.name}'s Stone Harvest restored HP and raised Defense!`);
            }

            // Bleakwind Ability
            if (mon.ability.name === 'Bleakwind' && battleState.weather === 'hail') {
                tempETeam.forEach(e => {
                    if (e && !e.isFainted && e.statStages) {
                        e.statStages.speed = Math.max(-6, (e.statStages.speed || 0) - 1);
                        tempLogs.push(`${mon.name}'s Bleakwind lowered ${e.name}'s Speed!`);
                    }
                });
            }

            if (mon.isTrapped) mon.isTrapped--;
            mon.isProtected = false;
            mon.isInvulnerable = false;

            // Perish Song
            if (mon.perishTurns !== undefined) {
                mon.perishTurns--;
                tempLogs.push(`${mon.name}'s perish count fell to ${mon.perishTurns}!`);
                if (mon.perishTurns === 0) {
                    mon.currentHp = 0;
                    mon.isFainted = true;
                    tempLogs.push(`${mon.name} fainted from Perish Song!`);
                }
            }

            // Future Sight
            if (mon.futureSightTurns !== undefined) {
                mon.futureSightTurns--;
                if (mon.futureSightTurns === 0) {
                    const damage = mon.futureSightDamage || 100;
                    mon.currentHp = Math.max(0, mon.currentHp - damage);
                    tempLogs.push(`${mon.name} was hit by Future Sight!`);
                    mon.futureSightTurns = undefined;
                }
            }

            // Leech Seed
            if (mon.isLeechSeeded && !mon.isFainted) {
                const damage = Math.floor(mon.maxHp / 8);
                const actualDamage = Math.min(mon.currentHp, damage);
                tempPTeam[i] = { ...mon, currentHp: Math.max(0, mon.currentHp - actualDamage), animationState: 'damage' };
                tempLogs.push(`${mon.name}'s health was sapped by Leech Seed!`);
                
                // Heal the opponent(s)
                const foes = tempETeam.slice(0, 2).filter(f => !f.isFainted);
                if (foes.length > 0) {
                    const healPerFoe = Math.floor(actualDamage / foes.length);
                    foes.forEach(f => {
                        f.currentHp = Math.min(f.maxHp, f.currentHp + healPerFoe);
                    });
                }
                await syncState(500);
                tempPTeam[i] = { ...tempPTeam[i], animationState: 'idle' };
                if (tempPTeam[i].currentHp === 0) {
                    tempPTeam[i].isFainted = true;
                    playFaintSfx();
                    tempLogs.push(`${tempPTeam[i].name} fainted!`);
                    await syncState(500);
                }
            }

            // Nightmare
            if (mon.isNightmareActive && mon.status === 'sleep' && !mon.isFainted) {
                const damage = Math.floor(mon.maxHp / 4);
                mon.currentHp = Math.max(0, mon.currentHp - damage);
                tempLogs.push(`${mon.name} is locked in a nightmare!`);
            }

            // Curse (Ghost)
            if (mon.isCursed && !mon.isFainted) {
                const damage = Math.floor(mon.maxHp / 4);
                mon.currentHp = Math.max(0, mon.currentHp - damage);
                tempLogs.push(`${mon.name} is afflicted by a curse!`);
            }

            // Trapping Damage (Binding Band)
            if (mon.trappedTurns && mon.trappedTurns > 0 && !mon.isFainted) {
                let trapDamageMult = 1;
                // Check if any opponent has Binding Band (simplified)
                const opponents = i < 2 ? tempETeam : tempPTeam;
                if (opponents.some((o: Pokemon) => o && !o.isFainted && o.heldItem?.id === 'binding-band')) {
                    trapDamageMult = 1.5;
                }
                const trapDamage = Math.floor(mon.maxHp / 8 * trapDamageMult);
                mon.currentHp = Math.max(0, mon.currentHp - trapDamage);
                tempLogs.push(`${mon.name} is hurt by the trap!`);
                if (mon.currentHp === 0) {
                    mon.isFainted = true;
                    playFaintSfx();
                    tempLogs.push(`${mon.name} fainted!`);
                }
            }

            const endResP = handleEndOfTurnStatus(mon, battleState.weather, battleState.terrain);
            if (endResP.damage > 0) {
                tempPTeam[i] = { ...mon, currentHp: Math.max(0, mon.currentHp - endResP.damage), animationState: 'damage' };
                tempLogs.push(endResP.msg!);
                await syncState(500);
                tempPTeam[i] = { ...tempPTeam[i], animationState: 'idle' };
                if (tempPTeam[i].currentHp === 0) {
                    tempPTeam[i].isFainted = true;
                    playFaintSfx();
                    tempLogs.push(`${tempPTeam[i].name} fainted!`);
                    await syncState(500);
                }
            } else if (endResP.damage < 0) {
                tempPTeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp - endResP.damage) };
                tempLogs.push(endResP.msg!);
                await syncState(500);
            }

            // Lifebloom Ability (Aura)
            if (mon.ability.name === 'Lifebloom') {
                const allyIdx = 1 - i;
                const ally = tempPTeam[allyIdx];
                if (ally && !ally.isFainted) {
                    const heal = Math.floor(ally.maxHp / 16);
                    tempPTeam[allyIdx] = { ...ally, currentHp: Math.min(ally.maxHp, ally.currentHp + heal) };
                    tempLogs.push(`${mon.name}'s Lifebloom healed its ally!`);
                }
            }

            // Gladiator's Spirit (Ally heal)
            const allyIdxGS = 1 - i;
            const allyGS = tempPTeam[allyIdxGS];
            if (allyGS && !allyGS.isFainted && allyGS.ability.name === 'GladiatorSSpirit' && (allyGS.koCount || 0) > 0) {
                const heal = Math.floor(mon.maxHp / 16);
                tempPTeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`${allyGS.name}'s Gladiator's Spirit restored ${mon.name}'s HP!`);
            }

            // healAtEnd (Gladiator's Spirit one-time or persistent)
            if (mon.nextMoveBoosts?.healAtEnd) {
                const heal = Math.floor(mon.maxHp / 16);
                tempPTeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`${mon.name} was healed by Gladiator's Spirit!`);
                mon.nextMoveBoosts.healAtEnd = false;
            }

            // Overclock
            if (mon.ability.name === 'Overclock') {
                if (mon.statStages) {
                    mon.statStages.speed = Math.min(6, (mon.statStages.speed || 0) + 1);
                    const recoil = Math.floor(mon.maxHp / 16);
                    mon.currentHp = Math.max(0, mon.currentHp - recoil);
                    tempLogs.push(`${mon.name}'s Overclock boosted Speed but caused recoil!`);
                }
            }
            // Slow Pulse
            if (mon.ability.name === 'SlowPulse') {
                [...tempPTeam, ...tempETeam].forEach(target => {
                    if (target && !target.isFainted && target.statStages) {
                        target.statStages.speed = Math.max(-6, (target.statStages.speed || 0) - 1);
                    }
                });
                tempLogs.push(`${mon.name}'s Slow Pulse slowed everyone down!`);
            }
            // Lucky Bark
            if (mon.ability.name === 'LuckyBark' && Math.random() < 0.1) {
                const heal = Math.floor(mon.maxHp / 4);
                mon.currentHp = Math.min(mon.maxHp, mon.currentHp + heal);
                tempLogs.push(`${mon.name}'s Lucky Bark restored its HP!`);
            }
            // Pollen Surge
            if (mon.ability.name === 'PollenSurge' && battleState.weather === 'sun') {
                const allyIdx = 1 - i;
                const ally = tempPTeam[allyIdx];
                if (ally && !ally.isFainted) {
                    const heal = Math.floor(ally.maxHp / 8);
                    ally.currentHp = Math.min(ally.maxHp, ally.currentHp + heal);
                    tempLogs.push(`${mon.name}'s Pollen Surge healed ${ally.name}!`);
                }
            }
            // Night Bloom
            if (mon.ability.name === 'NightBloom' && battleState.weather === 'none') {
                const heal = Math.floor(mon.maxHp / 8);
                mon.currentHp = Math.min(mon.maxHp, mon.currentHp + heal);
                tempLogs.push(`${mon.name}'s Night Bloom restored its HP!`);
            }
            // Abyssal Pull
            if (mon.ability.name === 'AbyssalPull') {
                tempETeam.slice(0, 2).forEach(f => {
                    if (f && !f.isFainted) {
                        f.isTrapped = 1;
                        if (f.statStages) {
                            f.statStages.speed = Math.max(-6, (f.statStages.speed || 0) - 1);
                        }
                    }
                });
                tempLogs.push(`${mon.name}'s Abyssal Pull is trapping the foes!`);
            }

            // Energy Core
            if (mon.ability.name === 'EnergyCore') {
                if (mon.statStages) {
                    mon.statStages['special-attack'] = Math.min(6, (mon.statStages['special-attack'] || 0) + 1);
                    tempLogs.push(`${mon.name}'s Energy Core boosted its Sp. Atk!`);
                }
            }
            // Mud Forged
            if (mon.ability.name === 'MudForged' && battleState.weather === 'sand') {
                if (mon.statStages) {
                    mon.statStages.defense = Math.min(6, (mon.statStages.defense || 0) + 1);
                    tempLogs.push(`${mon.name}'s Mud Forged boosted its Defense in the sand!`);
                }
            }
            // Crystal Memory
            if (mon.ability.name === 'CrystalMemory' && mon.lastMoveName) {
                tempLogs.push(`${mon.name}'s Crystal Memory is active!`);
            }
            // Hollow Echo
            if (mon.ability.name === 'HollowEcho' && mon.currentHp < mon.maxHp / 2) {
                const foes = tempETeam.slice(0, 2);
                foes.forEach(f => {
                    if (f && !f.isFainted && f.statStages) {
                        f.statStages['special-defense'] = Math.max(-6, (f.statStages['special-defense'] || 0) - 1);
                    }
                });
                tempLogs.push(`${mon.name}'s Hollow Echo lowered foes' Sp. Def!`);
            }

            if (mon.isTrapped) mon.isTrapped--;
            mon.isProtected = false;

            // Overcharge Cycle Ability
            if (mon.ability.name === 'OverchargeCycle') {
                setBattleState(prev => ({ ...prev, comboMeter: Math.min(100, prev.comboMeter + 5) }));
                tempLogs.push(`${mon.name}'s Overcharge Cycle generated Sync energy!`);
            }

            // Clutch Meter Ability
            if (mon.ability.name === 'ClutchMeter' && mon.currentHp <= mon.maxHp * 0.25) {
                setBattleState(prev => ({ ...prev, comboMeter: Math.min(100, prev.comboMeter + 10) }));
                tempLogs.push(`${mon.name}'s Clutch Meter surged with Sync energy!`);
            }

            // Rooted Spirit Ability
            if (mon.ability.name === 'RootedSpirit' && battleState.weather === 'grass') {
                const heal = Math.floor(mon.maxHp / 16);
                tempPTeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`${mon.name}'s Rooted Spirit restored its HP!`);
            }

            // Shoreline Ability
            if (mon.ability.name === 'Shoreline' && (battleState.weather === 'sand' || battleState.weather === 'rain')) {
                if (mon.statStages) {
                    mon.statStages.defense = Math.min(6, (mon.statStages.defense || 0) + 1);
                    tempLogs.push(`${mon.name}'s Shoreline raised its Defense!`);
                }
            }

            // Whirlpool Heart Ability
            if (mon.ability.name === 'WhirlpoolHeart' && battleState.weather === 'rain') {
                if (mon.statStages) {
                    mon.statStages.speed = Math.min(6, (mon.statStages.speed || 0) + 1);
                    tempLogs.push(`${mon.name}'s Whirlpool Heart raised its Speed!`);
                }
            }

            // Amber Core Ability
            if (mon.ability.name === 'AmberCore' && mon.lastMoveType === 'Bug') {
                if (mon.statStages) {
                    mon.statStages['special-attack'] = Math.min(6, (mon.statStages['special-attack'] || 0) + 1);
                    tempLogs.push(`${mon.name}'s Amber Core raised its Sp. Atk!`);
                }
            }

            // Torrent Sync Ability
            if (mon.ability.name === 'TorrentSync' && mon.lastMoveType === 'Water') {
                if (mon.statStages) {
                    mon.statStages['special-attack'] = Math.min(6, (mon.statStages['special-attack'] || 0) + 1);
                    tempLogs.push(`${mon.name}'s Torrent Sync raised its Sp. Atk!`);
                }
            }

            // Storm Rider Ability
            if (mon.ability.name === 'StormRider' && mon.lastMoveType === 'Electric') {
                if (mon.statStages) {
                    mon.statStages['special-attack'] = Math.min(6, (mon.statStages['special-attack'] || 0) + 1);
                    tempLogs.push(`${mon.name}'s Storm Rider raised its Sp. Atk!`);
                }
            }

            // Shared Nerves Ability
            if (mon.ability.name === 'SharedNerves') {
                const allyIdx = 1 - i;
                const ally = tempPTeam[allyIdx];
                if (ally && !ally.isFainted && ally.status) {
                    ally.status = undefined;
                    tempLogs.push(`${mon.name}'s Shared Nerves cured ${ally.name}'s status!`);
                }
            }
        }
        for (let i = 0; i < tempETeam.length; i++) {
            const mon = tempETeam[i];
            if (mon.isFainted) continue;

            // Rain Dish+ & Chlorophyll+ (Enemy)
            if (mon.ability.name === 'RainDishPlus' && battleState.weather === 'rain') {
                const heal = Math.floor(mon.maxHp / 16);
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                setBattleState(prev => ({ ...prev, enemyComboMeter: Math.min(100, prev.enemyComboMeter + 2) }));
                tempLogs.push(`Enemy ${mon.name} restored HP and Sync Gauge in the rain!`);
            }
            if (mon.ability.name === 'ChlorophyllPlus' && battleState.weather === 'sun') {
                setBattleState(prev => ({ ...prev, enemyComboMeter: Math.min(100, prev.enemyComboMeter + 2) }));
                tempLogs.push(`Enemy ${mon.name} boosted its Sync Gauge in the sun!`);
            }

            // Tag Cleanse Ability
            if (mon.ability.name === 'TagCleanse' && Math.random() < 0.5) {
                const allyIdx = 1 - i;
                const ally = tempETeam[allyIdx];
                if (ally && !ally.isFainted && (ally.status || (ally.confusionTurns && ally.confusionTurns > 0))) {
                    ally.status = undefined;
                    ally.confusionTurns = 0;
                    tempLogs.push(`Enemy ${mon.name}'s Tag Cleanse cured its ally!`);
                }
            }

            // Salt Veins Ability
            if (mon.ability.name === 'SaltVeins' && mon.status === 'paralysis') {
                const heal = Math.floor(mon.maxHp / 16);
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`Enemy ${mon.name}'s Salt Veins restored its HP!`);
            }

            // Moonlight Call Ability
            if (mon.ability.name === 'MoonlightCall' && battleState.weather === 'none') {
                const heal = Math.floor(mon.maxHp / 16);
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`Enemy ${mon.name}'s Moonlight Call restored its HP!`);
            }

            // Shellblood Ability
            if (mon.ability.name === 'Shellblood' && mon.currentHp <= mon.maxHp / 2) {
                const heal = Math.floor(mon.maxHp / 16);
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`Enemy ${mon.name}'s Shellblood restored its HP!`);
            }

            // Photosynth Ability
            if (mon.ability.name === 'Photosynth' && battleState.weather === 'sun') {
                const heal = Math.floor(mon.maxHp / 16);
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`Enemy ${mon.name}'s Photosynth restored its HP!`);
            }

            // Overcharge Cycle Ability
            if (mon.ability.name === 'OverchargeCycle') {
                setBattleState(prev => ({ ...prev, enemyComboMeter: Math.min(100, prev.enemyComboMeter + 5) }));
                tempLogs.push(`Enemy ${mon.name}'s Overcharge Cycle generated Sync energy!`);
            }

            // Clutch Meter Ability
            if (mon.ability.name === 'ClutchMeter' && mon.currentHp <= mon.maxHp * 0.25) {
                setBattleState(prev => ({ ...prev, enemyComboMeter: Math.min(100, prev.enemyComboMeter + 10) }));
                tempLogs.push(`Enemy ${mon.name}'s Clutch Meter surged with Sync energy!`);
            }

            // Rooted Spirit Ability
            if (mon.ability.name === 'RootedSpirit' && battleState.weather === 'grass') {
                const heal = Math.floor(mon.maxHp / 16);
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`Enemy ${mon.name}'s Rooted Spirit restored its HP!`);
            }

            // Shoreline Ability
            if (mon.ability.name === 'Shoreline' && (battleState.weather === 'sand' || battleState.weather === 'rain')) {
                if (mon.statStages) {
                    mon.statStages.defense = Math.min(6, (mon.statStages.defense || 0) + 1);
                    tempLogs.push(`Enemy ${mon.name}'s Shoreline raised its Defense!`);
                }
            }

            // Whirlpool Heart Ability
            if (mon.ability.name === 'WhirlpoolHeart' && battleState.weather === 'rain') {
                if (mon.statStages) {
                    mon.statStages.speed = Math.min(6, (mon.statStages.speed || 0) + 1);
                    tempLogs.push(`Enemy ${mon.name}'s Whirlpool Heart raised its Speed!`);
                }
            }

            // Amber Core Ability
            if (mon.ability.name === 'AmberCore' && mon.lastMoveType === 'Bug') {
                if (mon.statStages) {
                    mon.statStages['special-attack'] = Math.min(6, (mon.statStages['special-attack'] || 0) + 1);
                    tempLogs.push(`Enemy ${mon.name}'s Amber Core raised its Sp. Atk!`);
                }
            }

            // Torrent Sync Ability
            if (mon.ability.name === 'TorrentSync' && mon.lastMoveType === 'Water') {
                if (mon.statStages) {
                    mon.statStages['special-attack'] = Math.min(6, (mon.statStages['special-attack'] || 0) + 1);
                    tempLogs.push(`Enemy ${mon.name}'s Torrent Sync raised its Sp. Atk!`);
                }
            }

            // Storm Rider Ability
            if (mon.ability.name === 'StormRider' && mon.lastMoveType === 'Electric') {
                if (mon.statStages) {
                    mon.statStages['special-attack'] = Math.min(6, (mon.statStages['special-attack'] || 0) + 1);
                    tempLogs.push(`Enemy ${mon.name}'s Storm Rider raised its Sp. Atk!`);
                }
            }

            // Shared Nerves Ability
            if (mon.ability.name === 'SharedNerves') {
                const allyIdx = 1 - i;
                const ally = tempETeam[allyIdx];
                if (ally && !ally.isFainted && ally.status) {
                    ally.status = undefined;
                    tempLogs.push(`Enemy ${mon.name}'s Shared Nerves cured ${ally.name}'s status!`);
                }
            }

            // Stone Harvest Ability
            if (mon.ability.name === 'StoneHarvest' && battleState.weather === 'sand') {
                const heal = Math.floor(mon.maxHp / 16);
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                if (mon.statStages) {
                    mon.statStages.defense = Math.min(6, (mon.statStages.defense || 0) + 1);
                }
                tempLogs.push(`Enemy ${mon.name}'s Stone Harvest restored HP and raised Defense!`);
            }

            // Bleakwind Ability
            if (mon.ability.name === 'Bleakwind' && battleState.weather === 'hail') {
                tempPTeam.forEach(p => {
                    if (!p.isFainted && p.statStages) {
                        p.statStages.speed = Math.max(-6, (p.statStages.speed || 0) - 1);
                        tempLogs.push(`Enemy ${mon.name}'s Bleakwind lowered ${p.name}'s Speed!`);
                    }
                });
            }

            if (mon.isTrapped) mon.isTrapped--;
            mon.isProtected = false;
            mon.isInvulnerable = false;

            // Perish Song
            if (mon.perishTurns !== undefined) {
                mon.perishTurns--;
                tempLogs.push(`Enemy ${mon.name}'s perish count fell to ${mon.perishTurns}!`);
                if (mon.perishTurns === 0) {
                    mon.currentHp = 0;
                    mon.isFainted = true;
                    tempLogs.push(`Enemy ${mon.name} fainted from Perish Song!`);
                }
            }

            // Future Sight
            if (mon.futureSightTurns !== undefined) {
                mon.futureSightTurns--;
                if (mon.futureSightTurns === 0) {
                    const damage = mon.futureSightDamage || 100;
                    mon.currentHp = Math.max(0, mon.currentHp - damage);
                    tempLogs.push(`Enemy ${mon.name} was hit by Future Sight!`);
                    mon.futureSightTurns = undefined;
                }
            }

            // Leech Seed
            if (mon.isLeechSeeded && !mon.isFainted) {
                const damage = Math.floor(mon.maxHp / 8);
                const actualDamage = Math.min(mon.currentHp, damage);
                tempETeam[i] = { ...mon, currentHp: Math.max(0, mon.currentHp - actualDamage), animationState: 'damage' };
                tempLogs.push(`Enemy ${mon.name}'s health was sapped by Leech Seed!`);
                
                // Heal the player(s)
                const foes = tempPTeam.slice(0, 2).filter(f => !f.isFainted);
                if (foes.length > 0) {
                    const healPerFoe = Math.floor(actualDamage / foes.length);
                    foes.forEach(f => {
                        f.currentHp = Math.min(f.maxHp, f.currentHp + healPerFoe);
                    });
                }
                await syncState(500);
                tempETeam[i] = { ...tempETeam[i], animationState: 'idle' };
                if (tempETeam[i].currentHp === 0) {
                    tempETeam[i].isFainted = true;
                    playFaintSfx();
                    tempLogs.push(`Enemy ${tempETeam[i].name} fainted!`);
                    await syncState(500);
                }
            }

            // Nightmare
            if (mon.isNightmareActive && mon.status === 'sleep' && !mon.isFainted) {
                const damage = Math.floor(mon.maxHp / 4);
                mon.currentHp = Math.max(0, mon.currentHp - damage);
                tempLogs.push(`Enemy ${mon.name} is locked in a nightmare!`);
            }

            // Curse (Ghost)
            if (mon.isCursed && !mon.isFainted) {
                const damage = Math.floor(mon.maxHp / 4);
                mon.currentHp = Math.max(0, mon.currentHp - damage);
                tempLogs.push(`Enemy ${mon.name} is afflicted by a curse!`);
            }

            const endRes = handleEndOfTurnStatus(mon, battleState.weather, battleState.terrain);
            if (endRes.damage > 0) {
                tempETeam[i] = { ...mon, currentHp: Math.max(0, mon.currentHp - endRes.damage), animationState: 'damage' };
                tempLogs.push(`Enemy ${endRes.msg!}`);
                await syncState(500);
                tempETeam[i] = { ...tempETeam[i], animationState: 'idle' };
                if (tempETeam[i].currentHp === 0) {
                    tempETeam[i].isFainted = true;
                    playFaintSfx();
                    tempLogs.push(`Enemy ${tempETeam[i].name} fainted!`);
                    await syncState(500);
                }
            } else if (endRes.damage < 0) {
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp - endRes.damage) };
                tempLogs.push(`Enemy ${endRes.msg!}`);
                await syncState(500);
            }

            // Lifebloom Ability (Aura)
            if (mon.ability.name === 'Lifebloom') {
                const allyIdx = 1 - i;
                const ally = tempETeam[allyIdx];
                if (ally && !ally.isFainted) {
                    const heal = Math.floor(ally.maxHp / 16);
                    tempETeam[allyIdx] = { ...ally, currentHp: Math.min(ally.maxHp, ally.currentHp + heal) };
                    tempLogs.push(`Enemy ${mon.name}'s Lifebloom healed its ally!`);
                }
            }

            // Gladiator's Spirit (Ally heal)
            const allyIdxGS_E = 1 - i;
            const allyGS_E = tempETeam[allyIdxGS_E];
            if (allyGS_E && !allyGS_E.isFainted && allyGS_E.ability.name === 'GladiatorSSpirit' && (allyGS_E.koCount || 0) > 0) {
                const heal = Math.floor(mon.maxHp / 16);
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`Enemy ${allyGS_E.name}'s Gladiator's Spirit restored ${mon.name}'s HP!`);
            }

            // healAtEnd
            if (mon.nextMoveBoosts?.healAtEnd) {
                const heal = Math.floor(mon.maxHp / 16);
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp + heal) };
                tempLogs.push(`Enemy ${mon.name} was healed by Gladiator's Spirit!`);
                mon.nextMoveBoosts.healAtEnd = false;
            }

            // Overclock (Enemy)
            if (mon.ability.name === 'Overclock') {
                if (mon.statStages) {
                    mon.statStages.speed = Math.min(6, (mon.statStages.speed || 0) + 1);
                    const recoil = Math.floor(mon.maxHp / 16);
                    mon.currentHp = Math.max(0, mon.currentHp - recoil);
                    tempLogs.push(`Enemy ${mon.name}'s Overclock boosted Speed but caused recoil!`);
                }
            }
            // Slow Pulse (Enemy)
            if (mon.ability.name === 'SlowPulse') {
                [...tempPTeam, ...tempETeam].forEach(target => {
                    if (target && !target.isFainted && target.statStages) {
                        target.statStages.speed = Math.max(-6, (target.statStages.speed || 0) - 1);
                    }
                });
                tempLogs.push(`Enemy ${mon.name}'s Slow Pulse slowed everyone down!`);
            }
            // Lucky Bark (Enemy)
            if (mon.ability.name === 'LuckyBark' && Math.random() < 0.1) {
                const heal = Math.floor(mon.maxHp / 4);
                mon.currentHp = Math.min(mon.maxHp, mon.currentHp + heal);
                tempLogs.push(`Enemy ${mon.name}'s Lucky Bark restored its HP!`);
            }
            // Pollen Surge (Enemy)
            if (mon.ability.name === 'PollenSurge' && battleState.weather === 'sun') {
                const allyIdx = 1 - i;
                const ally = tempETeam[allyIdx];
                if (ally && !ally.isFainted) {
                    const heal = Math.floor(ally.maxHp / 8);
                    ally.currentHp = Math.min(ally.maxHp, ally.currentHp + heal);
                    tempLogs.push(`Enemy ${mon.name}'s Pollen Surge healed ${ally.name}!`);
                }
            }
            // Night Bloom (Enemy)
            if (mon.ability.name === 'NightBloom' && battleState.weather === 'none') {
                const heal = Math.floor(mon.maxHp / 8);
                mon.currentHp = Math.min(mon.maxHp, mon.currentHp + heal);
                tempLogs.push(`Enemy ${mon.name}'s Night Bloom restored its HP!`);
            }
            // Abyssal Pull (Enemy)
            if (mon.ability.name === 'AbyssalPull') {
                tempPTeam.slice(0, 2).forEach(f => {
                    if (f && !f.isFainted) {
                        f.isTrapped = 1;
                        if (f.statStages) {
                            f.statStages.speed = Math.max(-6, (f.statStages.speed || 0) - 1);
                        }
                    }
                });
                tempLogs.push(`Enemy ${mon.name}'s Abyssal Pull is trapping the foes!`);
            }

            // Perish Song (Enemy)
            if (mon.perishTurns !== undefined) {
                mon.perishTurns--;
                tempLogs.push(`Enemy ${mon.name}'s perish count fell to ${mon.perishTurns}!`);
                if (mon.perishTurns === 0) {
                    mon.currentHp = 0;
                    mon.isFainted = true;
                    tempLogs.push(`Enemy ${mon.name} fainted from Perish Song!`);
                }
            }

            // Future Sight (Enemy)
            if (mon.futureSightTurns !== undefined) {
                mon.futureSightTurns--;
                if (mon.futureSightTurns === 0) {
                    const damage = mon.futureSightDamage || 100;
                    mon.currentHp = Math.max(0, mon.currentHp - damage);
                    tempLogs.push(`Enemy ${mon.name} was hit by Future Sight!`);
                    mon.futureSightTurns = undefined;
                }
            }

            // Leech Seed (Enemy)
            if (mon.isLeechSeeded && !mon.isFainted) {
                const damage = Math.floor(mon.maxHp / 8);
                mon.currentHp = Math.max(0, mon.currentHp - damage);
                tempLogs.push(`Enemy ${mon.name} was drained by Leech Seed!`);
                const allyIdx = 1 - i;
                const ally = tempETeam[allyIdx];
                if (ally && !ally.isFainted) {
                    ally.currentHp = Math.min(ally.maxHp, ally.currentHp + damage);
                }
            }

            // Nightmare (Enemy)
            if (mon.isNightmareActive && mon.status === 'sleep' && !mon.isFainted) {
                const damage = Math.floor(mon.maxHp / 4);
                mon.currentHp = Math.max(0, mon.currentHp - damage);
                tempLogs.push(`Enemy ${mon.name} is locked in a nightmare!`);
            }

            // Curse (Ghost) (Enemy)
            if (mon.isCursed && !mon.isFainted) {
                const damage = Math.floor(mon.maxHp / 4);
                mon.currentHp = Math.max(0, mon.currentHp - damage);
                tempLogs.push(`Enemy ${mon.name} is afflicted by a curse!`);
            }

            // Energy Core (Enemy)
            if (mon.ability.name === 'EnergyCore') {
                if (mon.statStages) {
                    mon.statStages['special-attack'] = Math.min(6, (mon.statStages['special-attack'] || 0) + 1);
                    tempLogs.push(`Enemy ${mon.name} restored its Sp. Atk!`);
                }
            }
            // Mud Forged (Enemy)
            if (mon.ability.name === 'MudForged' && battleState.weather === 'sand') {
                if (mon.statStages) {
                    mon.statStages.defense = Math.min(6, (mon.statStages.defense || 0) + 1);
                    tempLogs.push(`Enemy ${mon.name}'s Mud Forged boosted its Defense in the sand!`);
                }
            }
            // Crystal Memory (Enemy)
            if (mon.ability.name === 'CrystalMemory' && mon.lastMoveName) {
                tempLogs.push(`Enemy ${mon.name}'s Crystal Memory is active!`);
            }
            // Hollow Echo (Enemy)
            if (mon.ability.name === 'HollowEcho' && mon.currentHp < mon.maxHp / 2) {
                const foes = tempPTeam.slice(0, 2);
                foes.forEach(f => {
                    if (f && !f.isFainted && f.statStages) {
                        f.statStages['special-defense'] = Math.max(-6, (f.statStages['special-defense'] || 0) - 1);
                    }
                });
                tempLogs.push(`Enemy ${mon.name}'s Hollow Echo lowered foes' Sp. Def!`);
            }

            if (mon.isTrapped) mon.isTrapped--;
            mon.isProtected = false;

            if (mon.isLeechSeeded && !mon.isFainted) {
                const damage = Math.floor(mon.maxHp / 8);
                const actualDamage = Math.min(mon.currentHp, damage);
                tempETeam[i] = { ...mon, currentHp: Math.max(0, mon.currentHp - actualDamage), animationState: 'damage' };
                tempLogs.push(`Enemy ${mon.name}'s health was sapped by Leech Seed!`);
                
                // Heal the opponent(s)
                const foes = tempPTeam.slice(0, 2).filter(f => !f.isFainted);
                if (foes.length > 0) {
                    const healPerFoe = Math.floor(actualDamage / foes.length);
                    foes.forEach(f => {
                        f.currentHp = Math.min(f.maxHp, f.currentHp + healPerFoe);
                    });
                }
                await syncState(500);
                tempETeam[i] = { ...tempETeam[i], animationState: 'idle' };
                if (tempETeam[i].currentHp === 0) {
                    tempETeam[i].isFainted = true;
                    playFaintSfx();
                    tempLogs.push(`Enemy ${tempETeam[i].name} fainted!`);
                    await syncState(500);
                }
            }

            const endResE = handleEndOfTurnStatus(mon, battleState.weather, battleState.terrain);
            if (endResE.damage > 0) {
                tempETeam[i] = { ...mon, currentHp: Math.max(0, mon.currentHp - endResE.damage), animationState: 'damage' };
                tempLogs.push(`Enemy ${endResE.msg!}`);
                await syncState(500);
                tempETeam[i] = { ...tempETeam[i], animationState: 'idle' };
                if (tempETeam[i].currentHp === 0) {
                    tempETeam[i].isFainted = true;
                    playFaintSfx();
                    tempLogs.push(`Enemy ${tempETeam[i].name} fainted!`);
                    await syncState(500);
                }
            } else if (endResE.damage < 0) {
                tempETeam[i] = { ...mon, currentHp: Math.min(mon.maxHp, mon.currentHp - endResE.damage) };
                tempLogs.push(`Enemy ${endResE.msg!}`);
                await syncState(500);
            }
        }
        // 5. Weather Turns
        if (battleState.weather !== 'none') {
            const newTurns = (battleState.weatherTurns || 0) - 1;
            if (newTurns <= 0) {
                const oldWeather = battleState.weather;
                setBattleState(prev => ({ ...prev, weather: 'none', weatherTurns: 0 }));
                tempLogs.push(`The weather returned to normal.`);
                
                // Shoreline Ability
                if (oldWeather === 'rain') {
                    [...tempPTeam, ...tempETeam].forEach(p => {
                        if (!p.isFainted && p.ability.name === 'Shoreline') {
                            const heal = Math.floor(p.maxHp * 0.25);
                            p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
                            tempLogs.push(`${p.name}'s Shoreline restored its HP as the rain ended!`);
                        }
                    });
                }
            } else {
                setBattleState(prev => ({ ...prev, weatherTurns: newTurns }));
            }
        }

        // 6. Terrain Turns
        if (battleState.terrain !== 'none') {
            const newTerrainTurns = (battleState.terrainTurns || 0) - 1;
            if (newTerrainTurns <= 0) {
                setBattleState(prev => ({ ...prev, terrain: 'none', terrainTurns: 0 }));
                tempLogs.push(`The terrain returned to normal.`);
            } else {
                setBattleState(prev => ({ ...prev, terrainTurns: newTerrainTurns }));
            }
        }
        // 6. Tailwind Turns
        if (battleState.tailwindTurns && battleState.tailwindTurns > 0) {
            const newTailwind = battleState.tailwindTurns - 1;
            if (newTailwind === 0) tempLogs.push(`The player's tailwind petered out.`);
            setBattleState(prev => ({ ...prev, tailwindTurns: newTailwind }));
        }
        if (battleState.enemyTailwindTurns && battleState.enemyTailwindTurns > 0) {
            const newEnemyTailwind = battleState.enemyTailwindTurns - 1;
            if (newEnemyTailwind === 0) tempLogs.push(`The enemy's tailwind petered out.`);
            setBattleState(prev => ({ ...prev, enemyTailwindTurns: newEnemyTailwind }));
        }

        // 7. Aegis Field Turns
        if (battleState.aegisFieldTurns && battleState.aegisFieldTurns > 0) {
            setBattleState(prev => ({ ...prev, aegisFieldTurns: prev.aegisFieldTurns! - 1 }));
        }
        if (battleState.enemyAegisFieldTurns && battleState.enemyAegisFieldTurns > 0) {
            setBattleState(prev => ({ ...prev, enemyAegisFieldTurns: prev.enemyAegisFieldTurns! - 1 }));
        }

        // 8. Reflect, Light Screen, Aurora Veil, Rune Ward Turns
        if (battleState.reflectTurns && battleState.reflectTurns > 0) {
            const newReflect = battleState.reflectTurns - 1;
            if (newReflect === 0) tempLogs.push(`The player's Reflect wore off.`);
            setBattleState(prev => ({ ...prev, reflectTurns: newReflect }));
        }
        if (battleState.enemyReflectTurns && battleState.enemyReflectTurns > 0) {
            const newEnemyReflect = battleState.enemyReflectTurns - 1;
            if (newEnemyReflect === 0) tempLogs.push(`The enemy's Reflect wore off.`);
            setBattleState(prev => ({ ...prev, enemyReflectTurns: newEnemyReflect }));
        }
        if (battleState.lightScreenTurns && battleState.lightScreenTurns > 0) {
            const newLightScreen = battleState.lightScreenTurns - 1;
            if (newLightScreen === 0) tempLogs.push(`The player's Light Screen wore off.`);
            setBattleState(prev => ({ ...prev, lightScreenTurns: newLightScreen }));
        }
        if (battleState.enemyLightScreenTurns && battleState.enemyLightScreenTurns > 0) {
            const newEnemyLightScreen = battleState.enemyLightScreenTurns - 1;
            if (newEnemyLightScreen === 0) tempLogs.push(`The enemy's Light Screen wore off.`);
            setBattleState(prev => ({ ...prev, enemyLightScreenTurns: newEnemyLightScreen }));
        }
        if (battleState.auroraVeilTurns && battleState.auroraVeilTurns > 0) {
            const newAuroraVeil = battleState.auroraVeilTurns - 1;
            if (newAuroraVeil === 0) tempLogs.push(`The player's Aurora Veil wore off.`);
            setBattleState(prev => ({ ...prev, auroraVeilTurns: newAuroraVeil }));
        }
        if (battleState.enemyAuroraVeilTurns && battleState.enemyAuroraVeilTurns > 0) {
            const newEnemyAuroraVeil = battleState.enemyAuroraVeilTurns - 1;
            if (newEnemyAuroraVeil === 0) tempLogs.push(`The enemy's Aurora Veil wore off.`);
            setBattleState(prev => ({ ...prev, enemyAuroraVeilTurns: newEnemyAuroraVeil }));
        }
        if (battleState.runeWardTurns && battleState.runeWardTurns > 0) {
            const newRuneWard = battleState.runeWardTurns - 1;
            if (newRuneWard === 0) tempLogs.push(`The player's Rune Ward wore off.`);
            setBattleState(prev => ({ ...prev, runeWardTurns: newRuneWard }));
        }
        if (battleState.enemyRuneWardTurns && battleState.enemyRuneWardTurns > 0) {
            const newEnemyRuneWard = battleState.enemyRuneWardTurns - 1;
            if (newEnemyRuneWard === 0) tempLogs.push(`The enemy's Rune Ward wore off.`);
            setBattleState(prev => ({ ...prev, enemyRuneWardTurns: newEnemyRuneWard }));
        }

        // 9. Trick Room Turns
        if (battleState.trickRoomTurns && battleState.trickRoomTurns > 0) {
            const newTrickRoom = battleState.trickRoomTurns - 1;
            if (newTrickRoom === 0) tempLogs.push(`The dimensions returned to normal.`);
            setBattleState(prev => ({ ...prev, trickRoomTurns: newTrickRoom }));
        }

        // 9. Reset Flinching
        tempPTeam.forEach(p => p.isFlinching = false);
        tempETeam.forEach(p => p.isFlinching = false);

        // 9. Trapped & Sealed Turns
        tempPTeam.forEach(p => {
            if (p.trappedTurns && p.trappedTurns > 0) p.trappedTurns--;
            if (p.sealedTurns && p.sealedTurns > 0) {
                p.sealedTurns--;
                if (p.sealedTurns === 0) p.sealedMoveName = undefined;
            }
        });
        tempETeam.forEach(p => {
            if (p.trappedTurns && p.trappedTurns > 0) p.trappedTurns--;
            if (p.sealedTurns && p.sealedTurns > 0) {
                p.sealedTurns--;
                if (p.sealedTurns === 0) p.sealedMoveName = undefined;
            }
        });
    
    // Final check after loop logic
    if (tempPTeam.every((p: Pokemon) => p.isFainted)) gameOver = true;
    if (tempETeam.every((p: Pokemon) => p.isFainted)) victory = true;

    if (gameOver) {
        // White out logic
        handleRunEnd();
        return;
    }

    if (victory) {
        const newStreak = battleState.battleStreak + 1;
        setBattleState(prev => ({ ...prev, battleStreak: newStreak }));

        // Permanent Death: Remove fainted monsters from team
        const survivingTeam = tempPTeam.filter(p => !p.isFainted);
        
        if (survivingTeam.length === 0) {
            handleRunEnd();
            return;
        }

        // Loot Drop Logic
        const loot: string[] = [];
        const lootQuality = playerState.meta.upgrades.lootQuality || 0;
        const dropChance = 0.2 + (newStreak * 0.05) + (lootQuality * 0.1); // Scavenger upgrade increases drop chance
        if (Math.random() < dropChance) {
            const pool = ['poke-ball', 'great-ball', 'potion', 'super-potion', 'revive', 'rare-candy'];
            if (newStreak >= 5 || lootQuality >= 1) pool.push('ultra-ball', 'hyper-potion', 'full-restore');
            if (newStreak >= 10 || lootQuality >= 2) pool.push('master-ball', 'rare-candy', 'rare-candy', 'rare-candy');
            
            // Add evolution stones if loot quality is high
            if (lootQuality >= 1) {
                const stones = ['firestone', 'waterstone', 'thunderstone', 'leafstone', 'moonstone', 'sunstone', 'shinystone', 'duskstone', 'dawnstone'];
                pool.push(...stones);
            }

            // Add battle items if loot quality is very high
            if (lootQuality >= 3) {
                const battleItems = [
                    'leftovers', 'choice-band', 'choice-specs', 'choice-scarf', 
                    'life-orb', 'focus-sash', 'rocky-helmet', 'assault-vest', 
                    'expert-belt', 'eviolite', 'big-root', 'lucky-egg', 
                    'cleanse-tag', 'smoke-ball', 'eject-button', 'red-card', 
                    'binding-band', 'grip-claw', 'amulet-coin', 'booster-energy',
                    'ability-shield', 'protective-pads', 'blunder-policy',
                    'heavy-duty-boots', 'utility-umbrella', 'eject-pack',
                    'room-service', 'covert-cloak', 'loaded-dice', 'punching-glove',
                    'clear-amulet', 'mirror-herb', 'metronome', 'kings-rock',
                    'razor-fang', 'bright-powder', 'wide-lens', 'zoom-lens',
                    'lagging-tail', 'iron-ball', 'sticky-barb', 'flame-orb',
                    'toxic-orb', 'weakness-policy', 'throat-spray', 'light-clay',
                    'damp-rock', 'heat-rock', 'smooth-rock', 'icy-rock',
                    'terrain-extender', 'adrenaline-orb'
                ];
                pool.push(...battleItems);
            }
            
            const item = pool[Math.floor(Math.random() * pool.length)];
            loot.push(item);
        }

        if (battleState.currentTrainerId) {
            let currentMap;
            if (playerState.mapId.startsWith('chunk_')) {
                currentMap = loadedChunks[playerState.mapId];
            } else {
                currentMap = MAPS[playerState.mapId];
            }
            
            const trainer = Object.values(currentMap?.trainers || {}).find((t: any) => t.id === battleState.currentTrainerId) as TrainerData | undefined;
            const isGymLeader = trainer?.isGymLeader;
            
            // Capture Permits: 2 for Gym Leader, 1 for regular Trainer
            const permitsEarned = isGymLeader ? 2 : 1;
            
            // Immediate Rift Essence: 5 for Gym Leader, 1 for regular Trainer
            let essenceEarned = isGymLeader ? 5 : 1;
            if (playerState.meta.upgrades.essenceMultiplier > 0) {
                essenceEarned = Math.floor(essenceEarned * (1 + playerState.meta.upgrades.essenceMultiplier * 0.1));
                // Ensure at least 1 extra if level is high enough but floor rounded it down
                if (playerState.meta.upgrades.essenceMultiplier >= 5 && essenceEarned === (isGymLeader ? 5 : 1)) {
                    essenceEarned += 1;
                }
            }
            
            // Streak Bonus for Money: +20% per streak point
            const moneyBonus = 1 + (newStreak * 0.2);
            const baseMoney = isGymLeader ? 2000 : 500;
            let moneyMult = 1;
            if (survivingTeam.some(p => p.heldItem?.id === 'amulet-coin')) moneyMult = 2;
            const finalMoney = Math.floor(baseMoney * moneyBonus * moneyMult);

            // Victory Heal: Heal surviving team by 25%
            survivingTeam.forEach(p => {
                const healAmt = Math.floor(p.maxHp * 0.25);
                p.currentHp = Math.min(p.maxHp, p.currentHp + healAmt);
            });

            setPlayerState(prev => {
                const newItems = [...prev.inventory.items, ...loot];
                // If it's a trainer, we always give loot now
                if (loot.length === 0) {
                    const pool = ['great-ball', 'super-potion', 'revive', 'rare-candy'];
                    newItems.push(pool[Math.floor(Math.random() * pool.length)]);
                }

                return { 
                    ...prev, 
                    team: survivingTeam, 
                    money: prev.money + finalMoney, 
                    badges: isGymLeader ? prev.badges + 1 : prev.badges,
                    defeatedTrainers: [...prev.defeatedTrainers, battleState.currentTrainerId!],
                    inventory: { ...prev.inventory, items: newItems },
                    meta: {
                        ...prev.meta,
                        riftEssence: prev.meta.riftEssence + essenceEarned
                    },
                    run: {
                        ...prev.run,
                        capturePermits: prev.run.capturePermits + permitsEarned
                    }
                };
            });
            
            const victoryMsgs = isGymLeader ? 
                ["Gym Leader defeated!", "You earned a Badge!", "You received 2 Capture Permits!", "Gained 5 Rift Essence!", "Your team was partially healed!"] : 
                [`Trainer defeated! You got ${finalMoney}.`, "You received a Capture Permit!", "Gained 1 Rift Essence!", "Your team was partially healed!"];
            
            if (loot.length > 0) {
                loot.forEach(id => victoryMsgs.push(`Found a ${ITEMS[id].name}!`));
            }
            if (newStreak > 1) victoryMsgs.push(`Battle Streak: ${newStreak}!`);
            
            setDialogue(victoryMsgs);

            if (isGymLeader) {
                setPhase(GamePhase.PERK_SELECT);
                return;
            }
        } else {
            // Wild victory
            // Capture Permits: 1 for every 6 wild battles (streak) - Harder than trainers
            const permitsEarned = (newStreak % 6 === 0) ? 1 : 0;

            setPlayerState(prev => {
                const newItems = [...prev.inventory.items, ...loot];
                return { 
                    ...prev, 
                    team: survivingTeam,
                    inventory: { ...prev.inventory, items: newItems },
                    run: {
                        ...prev.run,
                        capturePermits: prev.run.capturePermits + permitsEarned
                    }
                };
            });
            
            const wildMsgs = ["Wild Pokemon defeated."];
            if (permitsEarned > 0) wildMsgs.push("You earned a Capture Permit!");
            if (loot.length > 0) {
                loot.forEach(id => wildMsgs.push(`Found a ${ITEMS[id].name}!`));
            }
            if (newStreak > 1) wildMsgs.push(`Battle Streak: ${newStreak}!`);
            setDialogue(wildMsgs);
        }
        setPhase(GamePhase.OVERWORLD);
        return;
    }

    // End of Turn: Healing Items
    [...tempPTeam, ...tempETeam].forEach(p => {
        if (p && !p.isFainted) {
            checkBerries(p, tempLogs);
            if (p.heldItem?.id === 'leftovers') {
                const heal = Math.floor(p.maxHp / 16);
                p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
                tempLogs.push(`${p.name} restored its HP with Leftovers!`);
            }
            if (p.heldItem?.id === 'black-sludge') {
                if (p.types.includes('poison')) {
                    const heal = Math.floor(p.maxHp / 16);
                    p.currentHp = Math.min(p.maxHp, p.currentHp + heal);
                    tempLogs.push(`${p.name} restored its HP with Black Sludge!`);
                } else {
                    const dmg = Math.floor(p.maxHp / 8);
                    p.currentHp = Math.max(0, p.currentHp - dmg);
                    tempLogs.push(`${p.name} was hurt by its Black Sludge!`);
                }
            }
            if (p.heldItem?.id === 'sticky-barb') {
                const dmg = Math.floor(p.maxHp / 8);
                p.currentHp = Math.max(0, p.currentHp - dmg);
                tempLogs.push(`${p.name} was hurt by its Sticky Barb!`);
            }
            if (p.heldItem?.id === 'flame-orb' && !p.status) {
                p.status = 'burn';
                tempLogs.push(`${p.name} was burned by its Flame Orb!`);
            }
            if (p.heldItem?.id === 'toxic-orb' && !p.status) {
                p.status = 'toxic';
                tempLogs.push(`${p.name} was badly poisoned by its Toxic Orb!`);
            }
        }
    });

    const mustSwitch = tempPTeam.some((p, i) => i < 2 && p.isFainted && tempPTeam.slice(2).some(bp => !bp.isFainted));
    const switchingIdx = tempPTeam.findIndex((p, i) => i < 2 && p.isFainted && tempPTeam.slice(2).some(bp => !bp.isFainted));

    setBattleState(prev => {
        const finalMustSwitch = mustSwitch || prev.mustSwitch;
        const finalSwitchingIdx = mustSwitch ? switchingIdx : prev.switchingActorIdx;
        
        return { 
            ...prev, 
            playerTeam: tempPTeam, 
            enemyTeam: tempETeam, 
            logs: tempLogs.slice(-6), 
            phase: 'player_input', 
            turn: prev.turn + 1, 
            activePlayerIndex: finalMustSwitch ? finalSwitchingIdx : 0, 
            pendingMoves: [], 
            mustSwitch: finalMustSwitch,
            switchingActorIdx: finalSwitchingIdx,
            ui: { 
                selectionMode: finalMustSwitch ? 'SWITCH' : 'MOVE', 
                selectedMove: null 
            } 
        };
    });
    setRemoteBattleActions([]);
} catch (e) {
        console.error('Battle execution error:', e);
        setBattleState(prev => ({ ...prev, phase: 'player_input' }));
    }
  };

  function handleSwapTeam(i1: number, i2: number) { 
      setPlayerState(prev => { 
          const t = [...prev.team]; 
          [t[i1], t[i2]] = [t[i2], t[i1]]; 
          if (t[0]) playCry(t[0].id, t[0].name);
          return { ...prev, team: t }; 
      }); 
  };
    function handleBuy(item: string, price: number) {
        if (playerState.money >= price) {
            setPlayerState(prev => {
                const newInventory = { ...prev.inventory };
                let newPermits = prev.run.capturePermits;

                if (item === 'poke-ball') newPermits += 1;
                else if (item === 'potion') newInventory.potions += 1;
                else if (item === 'revive') newInventory.revives += 1;
                else if (item === 'rare-candy') newInventory.rare_candy += 1;
                else newInventory.items = [...(newInventory.items || []), item];
                
                return { 
                    ...prev, 
                    money: prev.money - price, 
                    inventory: newInventory,
                    run: { ...prev.run, capturePermits: newPermits }
                };
            });
            playSound('levelUp');
        }
    };
  function triggerEmote(e: string) { setCurrentEmote(e); setTimeout(()=>setCurrentEmote(null), 2000); };
  function handleStarterSelect(team: Pokemon[]) { 
      if (team[0]) playCry(team[0].id, team[0].name);
      setPlayerState(prev=>({...prev, team})); 
      setPhase(GamePhase.OVERWORLD); 
  };
  

  useEffect(() => { battleStateRef.current = battleState; }, [battleState]);
  useEffect(() => { networkRoleRef.current = networkRole; }, [networkRole]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { isHostRef.current = multiplayer.isHost; }, [multiplayer.isHost]);

  useEffect(() => {
    if (scanCooldown > 0) {
      const timer = setInterval(() => setScanCooldown(c => Math.max(0, c - 1)), 1000);
      return () => clearInterval(timer);
    }
  }, [scanCooldown]);

  // Multiplayer Listeners
  useEffect(() => {
    multiplayer.onPlayersUpdate((players) => {
        setRemotePlayers(new Map(players));
    });

    multiplayer.onData((data) => {
        if (data.type === 'BATTLE_REQUEST') {
            setBattleChallenge(data.payload);
        } else if (data.type === 'BATTLE_ACCEPT') {
            const { battleId, opponentId, opponentInfo, isLead } = data.payload;
            startMultiplayerBattle(battleId, opponentId, opponentInfo, isLead);
        } else if (data.type === 'BATTLE_ACTION') {
            const remoteActions = Array.isArray(data.payload) 
                ? data.payload.map((a: any) => ({ ...a, isPlayer: false }))
                : [{ ...data.payload, isPlayer: false }];
            setRemoteBattleActions(remoteActions);
            setBattleState(prev => {
                const livingPlayers = prev.playerTeam.filter(p => !p.isFainted).length;
                const activePlayerCount = Math.min(2, livingPlayers);
                if (prev.pendingMoves.length >= activePlayerCount) {
                    return { ...prev, phase: 'execution' };
                }
                return prev;
            });
        } else if (data.type === 'SYNC_STATE') {
            setRemotePlayers(prev => {
                const newMap = new Map(prev);
                newMap.set(data.payload.id, data.payload);
                return newMap;
            });
        } else if (data.type === 'GAME_SYNC') {
            const { phase: netPhase, battleState: netBS, riftLayout: netRift, caveLayouts: netCaves, p2Position: netP2Pos } = data.payload;
            if (netPhase) setPhase(netPhase); 
            if (netP2Pos && networkRoleRef.current === 'client') {
                setPlayerState(prev => ({ ...prev, position: netP2Pos }));
            }
            if (netBS) {
                if (networkRoleRef.current === 'client') {
                    // Only sync battleState if not in player_input, or if the host says it's execution
                    if (battleStateRef.current?.phase !== 'player_input' || netBS.phase === 'execution') {
                        setBattleState({
                            ...netBS,
                            playerTeam: netBS.enemyTeam,
                            enemyTeam: netBS.playerTeam,
                            pendingMoves: []
                        });
                    }
                } else {
                    setBattleState(netBS);
                }
            }
            if (netRift) setRiftLayout(netRift);
            if (netCaves) setCaveLayouts(netCaves);
        } else if (data.type === 'INPUT_MOVE') { 
            if (isHostRef.current) handleMapMove(data.payload, 2);
        } else if (data.type === 'INPUT_BATTLE_ACTION') { 
            if (isHostRef.current) queueAction(data.payload.targetIndex, data.payload.item, data.payload.move, data.payload.isFusion, data.payload.switchIndex, data.payload.activePlayerIndex);
        } else if (data.type === 'INPUT_MENU') {
            if (isHostRef.current) {
                if (data.payload === 'PAUSE') setIsPaused(prev => !prev);
                if (data.payload.type === 'SWAP') handleSwapTeam(data.payload.i1, data.payload.i2);
                if (data.payload.type === 'BUY') handleBuy(data.payload.item, data.payload.price);
                if (data.payload.type === 'CLOSE_SHOP') setPhase(GamePhase.OVERWORLD);
                if (data.payload.type === 'INTERACT') handleInteraction(2);
                if (data.payload.type === 'RUN') handleRun();
            }
        } else if (data.type === 'INPUT_EMOTE') {
            triggerEmote(data.payload);
        }
    });
  }, []);

  useEffect(() => { 
    if (multiplayer.isHost && multiplayer.socket?.connected) {
        multiplayer.send({ 
            type: 'GAME_SYNC', 
            payload: { phase, battleState, riftLayout, caveLayouts, p2Position: playerState.p2Position } 
        }); 
    } 
  }, [phase, battleState, riftLayout, caveLayouts, playerState.p2Position]);

  // Sync player state to others
  useEffect(() => {
    if (phase === GamePhase.OVERWORLD && multiplayer.socket) {
        const syncInterval = setInterval(() => {
            multiplayer.send({
                type: 'SYNC_STATE',
                payload: {
                    id: multiplayer.socket?.id,
                    name: playerState.name,
                    position: playerState.position,
                    mapId: playerState.mapId,
                    team: playerState.team.map(p => ({ id: p.id, name: p.name, level: p.level, currentHp: p.currentHp, maxHp: p.maxHp })),
                    spriteUrl: networkRole === 'host' ? 'https://play.pokemonshowdown.com/sprites/trainers/red.png' : 'https://play.pokemonshowdown.com/sprites/trainers/leaf.png'
                }
            });
        }, 100);
        return () => clearInterval(syncInterval);
    }
  }, [phase, playerState.position, playerState.mapId, playerState.name, networkRole]);

  // Main Quest Progression
  useEffect(() => {
    const distance = Math.floor(Math.sqrt(playerState.chunkPos.x ** 2 + playerState.chunkPos.y ** 2));
    const currentQuest = MAIN_QUESTS.find(q => q.id === playerState.meta.mainQuestProgress.currentQuestId);
    
    if (currentQuest) {
        const questValue = currentQuest.type === 'distance' ? distance : playerState.badges;
        if (questValue >= currentQuest.target) {
            const nextQuestIndex = MAIN_QUESTS.findIndex(q => q.id === currentQuest.id) + 1;
            const nextQuest = MAIN_QUESTS[nextQuestIndex];
            
            setPlayerState(prev => ({
                ...prev,
                meta: {
                    ...prev.meta,
                    mainQuestProgress: {
                        currentQuestId: nextQuest ? nextQuest.id : 'completed',
                        completedQuests: [...prev.meta.mainQuestProgress.completedQuests, currentQuest.id]
                    }
                }
            }));
            
            setDialogue([
                `QUEST COMPLETED: ${currentQuest.title}`,
                nextQuest ? `NEW QUEST: ${nextQuest.title}` : "You have completed all main quests!"
            ]);
            playLevelUpSfx();
        }
    }
  }, [playerState.chunkPos, playerState.badges]);


  // Discovery Milestones
  useEffect(() => {
    const milestone = Math.floor(playerState.discoveryPoints / 50); // Milestone every 50 points
    if (milestone > 0 && !playerState.storyFlags.includes(`discovery_milestone_${milestone}`)) {
        const rewardMoney = milestone * 10000;
        const rewardRareCandies = milestone * 2;
        
        setPlayerState(prev => ({
            ...prev,
            money: prev.money + rewardMoney,
            inventory: {
                ...prev.inventory,
                rare_candy: (prev.inventory.rare_candy || 0) + rewardRareCandies
            },
            storyFlags: [...prev.storyFlags, `discovery_milestone_${milestone}`]
        }));
        
        setDialogue(["DISCOVERY MILESTONE REACHED!", `You've earned a reward for your exploration: $${rewardMoney} and ${rewardRareCandies} RARE CANDIES!`]);
    }
  }, [playerState.discoveryPoints, playerState.storyFlags]);



  useEffect(() => {
    if (phase === GamePhase.BATTLE) {
        console.log('Battle Background URL:', battleState.backgroundUrl);
    }
  }, [phase, battleState.backgroundUrl]);

  // --- CONTROLS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase === GamePhase.OVERWORLD && !isPaused && !dialogue) {
          if (networkRole === 'client') {
              let dx = 0, dy = 0;
              if (e.key === 'ArrowUp' || e.key === 'w') dy = -1;
              if (e.key === 'ArrowDown' || e.key === 's') dy = 1;
              if (e.key === 'ArrowLeft' || e.key === 'a') dx = -1;
              if (e.key === 'ArrowRight' || e.key === 'd') dx = 1;
              if (dx !== 0 || dy !== 0) {
                  const newPos = { x: playerState.position.x + dx, y: playerState.position.y + dy };
                  multiplayer.send({ type: 'INPUT_MOVE', payload: newPos });
              }
              if (e.key === 'Enter' || e.key === 'e' || e.key === 'E') multiplayer.send({ type: 'INPUT_MENU', payload: { type: 'INTERACT' } });
              if (e.key === ' ') setIsPaused(true);
          } else {
              // Host Logic
              let dx = 0, dy = 0;
              if (e.key === 'ArrowUp' || e.key === 'w') dy = -1;
              if (e.key === 'ArrowDown' || e.key === 's') dy = 1;
              if (e.key === 'ArrowLeft' || e.key === 'a') dx = -1;
              if (e.key === 'ArrowRight' || e.key === 'd') dx = 1;
              
              if (dx !== 0 || dy !== 0) {
                  const target = { x: playerState.position.x + dx, y: playerState.position.y + dy };
                  handleMapMove(target, 1);
              }
              if (e.key === 'Enter' || e.key === 'e' || e.key === 'E') handleInteraction(1);
              if (e.key === ' ') setIsPaused(true);
          }
      } else if (dialogue && (e.key === 'Enter' || e.key === 'e' || e.key === 'E' || e.key === ' ')) {
          setDialogue(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, playerState, networkRole, isPaused, dialogue]);

  useEffect(() => { if (battleState.phase === 'execution' && (networkRole === 'none' || networkRole === 'host')) executeTurn(); }, [battleState.phase]);

  // Clear remote actions on client when turn ends
  useEffect(() => {
    if (isMultiplayerBattle && networkRole === 'client' && battleState.phase === 'player_input') {
        setRemoteBattleActions([]);
    }
  }, [battleState.phase, isMultiplayerBattle, networkRole]);

  const [musicStarted, setMusicStarted] = useState(false);

  useEffect(() => {
      if (!musicStarted) return;

      if (phase === GamePhase.MENU) {
          playBGM(BGM_TRACKS.MENU);
      } else if (phase === GamePhase.BATTLE) {
          playBGM(BGM_TRACKS.BATTLE);
      } else if (phase === GamePhase.OVERWORLD) {
          playBGM(BGM_TRACKS.OVERWORLD);
      }
  }, [phase, musicStarted]);

  useEffect(() => {
      if (phase === GamePhase.MENU && !musicStarted) {
          const startMusic = () => {
              setMusicStarted(true);
              window.removeEventListener('click', startMusic);
          };
          window.addEventListener('click', startMusic);
          return () => window.removeEventListener('click', startMusic);
      }
  }, [phase, musicStarted]);

    // RENDER UI
    const renderContent = () => {
        console.log('App Rendering: Phase =', phase);
        if (phase === GamePhase.MENU) return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-press-start">
                {/* Atmospheric Pokémon-style Background */}
                <div className="absolute inset-0 z-0 bg-[#0a1a0a] bg-[radial-gradient(circle_at_50%_50%,#1a3a1a_0%,#050a05_100%)]">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-transparent to-black/80"></div>
        
                    {/* Animated Particles/Rifts */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ 
                                    x: Math.random() * window.innerWidth, 
                                    y: Math.random() * window.innerHeight,
                                    opacity: 0 
                                }}
                                animate={{ 
                                    y: [null, Math.random() * -200],
                                    opacity: [0, 0.5, 0],
                                    scale: [0, 1, 0]
                                }}
                                transition={{ 
                                    duration: 5 + Math.random() * 10, 
                                    repeat: Infinity,
                                    delay: Math.random() * 5
                                }}
                                className="absolute w-1 h-1 bg-cyan-400 rounded-full blur-sm"
                            />
                        ))}
                    </div>
                </div>

                <motion.div 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="z-10 text-center mb-16 relative"
                >
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <h1 className="text-6xl md:text-8xl font-black italic mb-4 tracking-tighter leading-tight"
                            style={{ 
                                color: '#ffcb05',
                                textShadow: '0 8px 0 #3c5aa6, 0 12px 24px rgba(0,0,0,0.6)',
                                WebkitTextStroke: '3px #3c5aa6',
                                paintOrder: 'stroke fill'
                            }}
                        >
                            POKÉMON<br/>EXPLORERS
                        </h1>
                        <div className="flex items-center justify-center gap-4">
                            <div className="h-[2px] w-12 bg-cyan-500/50"></div>
                            <p className="text-cyan-400 text-[10px] tracking-[0.4em] font-bold uppercase drop-shadow-lg">Roguelike Pokémon Expedition</p>
                            <div className="h-[2px] w-12 bg-cyan-500/50"></div>
                        </div>
                    </motion.div>
                </motion.div>

                <div className="z-10 flex flex-col gap-6 w-full max-w-sm px-6">
                    <button 
                        onClick={()=>setPhase(GamePhase.STARTER_SELECT)} 
                        className="group relative bg-blue-600 hover:bg-blue-500 px-8 py-6 rounded-2xl text-xl border-b-8 border-blue-800 active:border-b-0 active:translate-y-2 transition-all font-bold uppercase overflow-hidden shadow-[0_20px_50px_rgba(37,99,235,0.3)]"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            <span className="text-2xl">🚀</span> START EXPEDITION
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </button>
                    
                    <button 
                        onClick={()=>setPhase(GamePhase.META_MENU)} 
                        className="group relative bg-purple-600 hover:bg-purple-500 px-8 py-6 rounded-2xl text-xl border-b-8 border-purple-800 active:border-b-0 active:translate-y-2 transition-all font-bold uppercase overflow-hidden shadow-[0_20px_50px_rgba(147,51,234,0.3)]"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            <span className="text-2xl">💎</span> RIFT UPGRADES
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        {playerState.meta.riftEssence > 0 && (
                            <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] px-3 py-1.5 rounded-full animate-bounce font-black shadow-lg border-2 border-black">
                                {playerState.meta.riftEssence} ESSENCE
                            </div>
                        )}
                    </button>

                    <button 
                        onClick={()=>setPhase(GamePhase.NETWORK_MENU)} 
                        className="group relative bg-emerald-600 hover:bg-emerald-500 px-8 py-6 rounded-2xl text-xl border-b-8 border-emerald-800 active:border-b-0 active:translate-y-2 transition-all font-bold uppercase overflow-hidden shadow-[0_20px_50px_rgba(16,185,129,0.3)]"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            <span className="text-2xl">🌐</span> CO-OP PLAY
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </button>
                </div>

                <div className="absolute bottom-8 flex flex-col items-center gap-4">
                    {!musicStarted && (
                        <div className="text-[8px] text-yellow-400/60 animate-pulse uppercase tracking-[0.3em] font-bold">
                            Click anywhere to start music
                        </div>
                    )}
                    <div className="flex gap-4 text-gray-500 text-[8px] uppercase tracking-widest font-bold">
                        <span>v1.2.0-rift-update</span>
                        <span className="text-gray-700">•</span>
                        <span>build 2026.04.08</span>
                    </div>
                    <div className="text-[6px] text-gray-600 uppercase tracking-[0.5em]">Jonathan Vanderwilt Expedition</div>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-cyan-500/20 m-8 rounded-tl-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-purple-500/20 m-8 rounded-br-3xl pointer-events-none"></div>
            </div>
        );

        if (phase === GamePhase.META_MENU) return <MetaMenu state={playerState} setState={setPlayerState} onBack={() => setPhase(GamePhase.MENU)} />;
        if (phase === GamePhase.PERK_SELECT) return <PerkSelect onSelect={(perk) => {
            setPlayerState(prev => ({
                ...prev,
                run: {
                    ...prev.run,
                    perks: [...(prev.run.perks || []), perk]
                }
            }));
            setPhase(GamePhase.OVERWORLD);
            setDialogue([`You gained the ${perk.toUpperCase()} perk!`]);
        }} />;
        if (phase === GamePhase.NETWORK_MENU) return <OnlineMenu onBack={()=>setPhase(GamePhase.MENU)} onStartGame={()=>{ setNetworkRole(multiplayer.isHost?'host':'client'); setPhase(multiplayer.isHost?GamePhase.STARTER_SELECT:GamePhase.OVERWORLD); }} />;
        if (phase === GamePhase.STARTER_SELECT) { 
            return (
                <StarterSelect 
                    onSelect={handleStarterSelect} 
                    unlockedPacks={playerState.meta.unlockedPacks} 
                    shinyBoost={playerState.meta.upgrades.shinyChance} 
                    upgrades={playerState.meta.upgrades}
                    networkRole={networkRole}
                    multiplayer={multiplayer}
                />
            ); 
        }
        if (phase === GamePhase.SHOP) return <ShopMenu onClose={()=>setPhase(GamePhase.OVERWORLD)} money={playerState.money} inventory={playerState.inventory} onBuy={handleBuy} discount={playerState.meta.upgrades.evolutionaryInsight} />;
        
        if (phase === GamePhase.OVERWORLD) {
            const distance = Math.floor(Math.sqrt(playerState.chunkPos.x ** 2 + playerState.chunkPos.y ** 2));
            const stabilityMult = 1 - (playerState.meta.upgrades.riftStability * 0.1);
            const riftIntensity = Math.min(100, Math.floor((Math.pow(distance / 20, 1.2) * 15 + Math.pow(playerState.badges, 1.1) * 10) * stabilityMult));
            
            return (
                <div className="relative overflow-hidden w-screen h-screen bg-black">
                   <EmoteOverlay emote={currentEmote} />
                   <QuestLog state={playerState} />
                   {isPaused && <PauseMenu onClose={()=>setIsPaused(false)} state={playerState} onSwap={handleSwapTeam} onGiveItem={handleGiveItem} />}
                   {dialogue && <div className="absolute bottom-6 left-6 right-6 bg-blue-900/95 border-4 border-white p-6 rounded-2xl z-[60] text-white shadow-2xl"><div className="text-base leading-relaxed">{dialogue.map((l,i)=><p key={i}>{l}</p>)}</div><div className="text-xs text-yellow-400 mt-3 font-bold animate-pulse">Press Enter</div></div>}
                   <div className="absolute top-6 left-6 z-40 flex gap-3">{playerState.team.slice(0,3).map((p,i)=><div key={i} className="scale-90 origin-top-left"><HealthBar current={p.currentHp} max={p.maxHp} label={p.name} level={p.level} status={p.status} /></div>)}</div>
                   <div className="absolute top-6 right-6 z-40 flex flex-col gap-3 items-end">
                        <div className="bg-gray-800 px-4 py-2 border-2 border-gray-600 text-white text-sm font-bold rounded-lg shadow-lg">
                            ${playerState.money}
                        </div>
                        <div className="bg-black/70 px-3 py-1.5 border border-white/30 text-white text-xs rounded-md backdrop-blur-sm">
                            LVL CAP: {15 + playerState.badges * 10}
                        </div>
                        <div className="bg-black/70 px-3 py-1.5 border border-white/30 text-white text-xs rounded-md backdrop-blur-sm">
                            BADGES: {playerState.badges}
                        </div>
                        <div className="bg-black/70 px-3 py-1.5 border border-red-500/50 text-white text-xs rounded-md backdrop-blur-sm flex flex-col gap-1 w-32">
                            <div className="flex justify-between font-black text-[8px] tracking-tighter text-red-400">
                                <span>RIFT INTENSITY</span>
                                <span>{riftIntensity}%</span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${riftIntensity}%` }}></div>
                            </div>
                        </div>
                    </div>
                <Overworld 
                    p1Pos={networkRole === 'client' ? { x: -100, y: -100 } : playerState.position} 
                    p2Pos={networkRole === 'client' ? playerState.position : (networkRole === 'host' ? { x: -100, y: -100 } : playerState.p2Position)} 
                    mapId={playerState.mapId} 
                    loadedChunks={loadedChunks} 
                    customLayout={playerState.mapId==='rift'?riftLayout! : (playerState.mapId.startsWith('cave_') ? caveLayouts[playerState.mapId] : undefined)} 
                    myPlayerId={networkRole==='client'?2:1} 
                    networkRole={networkRole}
                    onInteract={(x,y)=>handleInteraction(1)} 
                    onChallenge={(id, info) => {
                        multiplayer.send({
                            type: 'BATTLE_REQUEST',
                            payload: { targetId: id, playerInfo: { name: playerState.name, team: playerState.team } }
                        });
                        setDialogue(["Challenge sent!", `Waiting for ${info.name} to accept...`]);
                    }}
                    remotePlayers={remotePlayers}
                    storyFlags={playerState.storyFlags} 
                    badges={playerState.badges} 
                    isScanning={isScanning}
                />
                {battleChallenge && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
                        <div className="bg-blue-900 border-4 border-blue-400 p-8 rounded-2xl text-center max-w-sm shadow-2xl animate-in zoom-in duration-300">
                            <h3 className="text-yellow-400 text-xl mb-4 font-bold tracking-widest">BATTLE CHALLENGE!</h3>
                            <p className="text-white text-sm mb-8 leading-relaxed">
                                <span className="text-blue-300 font-bold">{battleChallenge.playerInfo.name}</span> wants to battle you!
                            </p>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => handleChallengeResponse(true)}
                                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl border-b-4 border-green-800 font-bold transition-all active:translate-y-1 active:border-b-0"
                                >
                                    ACCEPT
                                </button>
                                <button 
                                    onClick={() => handleChallengeResponse(false)}
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl border-b-4 border-red-800 font-bold transition-all active:translate-y-1 active:border-b-0"
                                >
                                    DECLINE
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="fixed bottom-28 right-8 z-50 flex flex-col gap-3">
                    <button 
                        onClick={handleScan}
                        disabled={scanCooldown > 0}
                        className={`w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-2xl transition-all active:scale-95 ${scanCooldown > 0 ? 'bg-gray-700 border-gray-600 opacity-50' : 'bg-blue-600 border-blue-400 hover:bg-blue-500'}`}
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-white text-xs font-bold">SCAN</span>
                            {scanCooldown > 0 && <span className="text-white text-[10px]">{scanCooldown}s</span>}
                        </div>
                    </button>
                </div>
            </div>
        );
        }
        
        return (
          <div className="h-[100dvh] bg-gray-900 flex flex-col relative overflow-hidden font-press-start">
             {!battleState.backgroundUrl && (
                 <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
                     <div className="text-center">
                         <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                         <p className="text-yellow-400 text-xl animate-pulse">GENERATING BATTLE ARENA...</p>
                         <p className="text-gray-400 text-sm mt-2">AI is painting a custom anime background for this biome</p>
                     </div>
                 </div>
             )}
             {battleState.backgroundUrl && (
                 <div className="absolute inset-0 z-0">
                     <img 
                         src={battleState.backgroundUrl} 
                         className="w-full h-full object-cover"
                         referrerPolicy="no-referrer"
                         onLoad={() => console.log('Battle background loaded successfully')}
                         onError={(e) => {
                             const target = e.target as HTMLImageElement;
                             // Fallback to a reliable anime-style image if the primary fails
                             const fallback = 'https://play.pokemonshowdown.com/fx/bg/forest.jpg';
                             if (target.src !== fallback) {
                                 target.src = fallback;
                             }
                         }}
                     />
                     <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
                     <div className="absolute bottom-0 left-0 right-0 h-[50%] bg-gradient-to-t from-black/60 to-transparent" />
                 </div>
             )}
             <EmoteOverlay emote={currentEmote} />
             {comboVfx && <div className="absolute inset-0 z-50 bg-white/20 animate-pulse"></div>}
             <motion.div 
                animate={battleState.screenShake ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.2 }}
                className="flex-1 relative z-10 p-4 flex flex-col justify-between min-h-0 overflow-hidden"
             >
                  {battleState.battleStreak > 1 && (
                      <div className="absolute top-4 right-4 z-50">
                          <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-black/60 backdrop-blur-md border border-yellow-500/50 px-4 py-2 rounded-full flex items-center gap-3 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                          >
                              <div className="flex flex-col">
                                  <div className="text-[8px] text-yellow-500 font-black uppercase tracking-tighter leading-none">Battle Streak</div>
                                  <div className="text-xl font-black text-white italic leading-none">{battleState.battleStreak}</div>
                              </div>
                              <div className="w-px h-6 bg-white/20" />
                              <div className="text-[10px] font-bold text-yellow-400">
                                  +{Math.min(100, battleState.battleStreak * 10)}% XP
                              </div>
                          </motion.div>
                      </div>
                  )}
                  {battleState.fusionChargeActive && battleState.phase === 'player_input' && (
                      <div className="absolute top-32 left-1/2 -translate-x-1/2 z-[100]">
                          <motion.button
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              whileHover={{ scale: 1.1 }}
                              onClick={() => {
                                  // Trigger Fusion Move selection
                                  const p1 = battleState.playerTeam[0];
                                  const p2 = battleState.playerTeam[1];
                                  if (p1 && p2 && !p1.isFainted && !p2.isFainted) {
                                      let t1 = p1.types[0];
                                      let t2 = p2.types[0];
                                      
                                      if (p1.ability.name === 'TypeTwist' && p1.types[1]) t1 = p1.types[1];
                                      if (p2.ability.name === 'TypeTwist' && p2.types[1]) t2 = p2.types[1];
                                      
                                      let fusion = getFusionMove(t1, t2);
                                      
                                      if (!fusion && p1.ability.name === 'FusionMaster') {
                                          fusion = getFusionMove(t2, t2);
                                      }
                                      if (!fusion && p2.ability.name === 'FusionMaster') {
                                          fusion = getFusionMove(t1, t1);
                                      }
                                      if (fusion) {
                                          const fusionMove: PokemonMove = {
                                              name: fusion.name,
                                              url: '',
                                              power: fusion.power,
                                              accuracy: fusion.accuracy,
                                              type: fusion.resultType,
                                              damage_class: fusion.category.toLowerCase() as any,
                                              pp: 1,
                                              target: fusion.target,
                                              isFusion: true,
                                              meta: fusion.meta || { ailment: { name: 'none' }, category: { name: 'damage' } }
                                          };
                                          setBattleState(prev => ({
                                              ...prev,
                                              ui: { ...prev.ui, selectionMode: 'TARGET', selectedMove: fusionMove, isFusionNext: true }
                                          }));
                                      }
                                  }
                              }}
                              className="bg-gradient-to-r from-yellow-400 to-orange-600 px-8 py-4 rounded-full border-4 border-white shadow-[0_0_20px_rgba(255,255,255,0.5)] text-white font-bold text-xl animate-pulse"
                          >
                              FUSION CHARGE!
                          </motion.button>
                      </div>
                  )}
                  <div className="flex flex-col items-end gap-1 z-10 -mt-4 pr-12">
                        <SyncGauge value={battleState.enemyComboMeter} label="Team Sync" color="red" />
                      <div className="flex justify-end gap-12">
                          {battleState.enemyTeam.slice(0, 2).map((mon, i) => !mon.isFainted && (
                          <div key={i} className="flex flex-col-reverse items-center gap-2 relative">
                              <div className="relative">
                                  <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-48 h-12 rounded-[100%] border-2 blur-[1px] shadow-lg
                                      ${battleState.weather === 'sand' ? 'bg-amber-700/60 border-amber-500/80' : 
                                        battleState.weather === 'hail' ? 'bg-blue-200/60 border-blue-100/80' :
                                        'bg-green-600/60 border-green-400/80'}`} 
                                  />
                                  <PokemonSprite pokemon={mon} isTargetable={isTargeting} onSelect={() => handleTargetSelect(i)} />
                                  <AnimatePresence>
                                      {battleState.vfx && battleState.vfx.target === 'enemy' && battleState.vfx.index === i && (
                                          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                                              <MoveVFX vfx={battleState.vfx} />
                                          </div>
                                      )}
                                  </AnimatePresence>
                              </div>
                              <HealthBar 
                                current={mon.currentHp} 
                                max={mon.maxHp} 
                                label={mon.name} 
                                level={mon.level} 
                                status={mon.status} 
                              />
                          </div>
                      ))}
                  </div>
                  </div>
                  
                  <div className="flex flex-col items-start gap-1 z-10 pl-12 pb-96">
                        <SyncGauge value={battleState.comboMeter} label="Team Sync" color="yellow" />
                       <div className="flex justify-start gap-12">
                            {battleState.playerTeam.slice(0, 2).map((mon, i) => !mon.isFainted && (
                          <div key={i} className="flex flex-col-reverse items-center gap-2 relative">
                              <div className="relative">
                                  <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-64 h-16 rounded-[100%] border-2 blur-[1px] shadow-xl
                                      ${battleState.weather === 'sand' ? 'bg-amber-700/60 border-amber-500/80' : 
                                        battleState.weather === 'hail' ? 'bg-blue-200/60 border-blue-100/80' :
                                        'bg-green-600/60 border-green-400/80'}`} 
                                  />
                                  <PokemonSprite pokemon={mon} isBack />
                                  <AnimatePresence>
                                      {battleState.vfx && battleState.vfx.target === 'player' && battleState.vfx.index === i && (
                                          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                                              <MoveVFX vfx={battleState.vfx} />
                                          </div>
                                      )}
                                  </AnimatePresence>
                              </div>
                              <HealthBar 
                                current={mon.currentHp} 
                                max={mon.maxHp} 
                                label={mon.name} 
                                level={mon.level} 
                                xp={mon.xp} 
                                maxXp={mon.maxXp} 
                                status={mon.status} 
                              />
                          </div>
                      ))}
                  </div>
              </div>
              </motion.div>
             
             <div className="bg-gray-800 border-t-4 border-gray-600 p-2 md:p-4 h-auto min-h-[16rem] z-20 relative flex-none">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 h-full">
                     <div className="bg-white/5 backdrop-blur-sm p-3 text-[10px] md:text-xs text-gray-300 overflow-y-auto max-h-32 md:max-h-none border-r border-white/10">{battleState.logs.map((l,i)=><div key={i} className="mb-1">{l}</div>)}</div>
                     <div className="col-span-2 bg-gray-700 p-2 md:p-4 rounded-lg overflow-y-auto">
                          {battleState.phase === 'player_input' && activePlayer && !isTargeting && !isBagMode && !isSwitchMode && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                                  <div className="grid grid-cols-2 gap-2">
                                      {activePlayer.moves.map((m, i) => {
                                          const isMyTurn = networkRole === 'none' || (networkRole === 'host' && battleState.activePlayerIndex === 0) || (networkRole === 'client' && battleState.activePlayerIndex === 1);
                                          return (
                                              <MoveButton 
                                                  key={i} 
                                                  move={m} 
                                                  type={m.type || 'normal'} 
                                                  onClick={() => { if (isMyTurn) setBattleState(prev=>({...prev, ui:{selectionMode:'TARGET', selectedMove:m}})) }} 
                                                  disabled={!isMyTurn || (activePlayer.sealedMoveName === m.name && (activePlayer.sealedTurns || 0) > 0)} 
                                              />
                                          );
                                      })}
                                  </div>
                                  <div className="grid grid-cols-3 md:grid-cols-1 gap-2">
                                      {(() => {
                                          const isMyTurn = networkRole === 'none' || (networkRole === 'host' && battleState.activePlayerIndex === 0) || (networkRole === 'client' && battleState.activePlayerIndex === 1);
                                          return (
                                              <>
                                                  <ActionButton label="BAG" color="bg-blue-600" onClick={()=>{ if (isMyTurn) setBattleState(prev=>({...prev, ui:{selectionMode:'ITEM', selectedMove:null}})) }} disabled={!isMyTurn} />
                                                  <ActionButton label="POKEMON" color="bg-green-600" onClick={()=>{ if (isMyTurn) setBattleState(prev=>({...prev, ui:{selectionMode:'SWITCH', selectedMove:null}})) }} disabled={!isMyTurn} />
                                                  <ActionButton label="RUN" color="bg-red-600" onClick={() => { if (isMyTurn) handleRun() }} disabled={!isMyTurn} />
                                              </>
                                          );
                                      })()}
                                  </div>
                                  {/* Multiplayer Turn Indicator */}
                                  {networkRole !== 'none' && (
                                      <div className="col-span-full text-center text-xs text-yellow-400 mt-2 animate-pulse">
                                          {(networkRole === 'host' && battleState.activePlayerIndex === 1) ? 'Waiting for Client...' : 
                                           (networkRole === 'client' && battleState.activePlayerIndex === 0) ? 'Waiting for Host...' : ''}
                                      </div>
                                  )}
                              </div>
                          )}

                          {/* Targeting Phase UI */}
                          {isTargeting && (
                              <div className="flex flex-col items-center justify-center h-full gap-4">
                                  <div className="text-yellow-400 text-xl animate-pulse font-bold tracking-widest">
                                      SELECT TARGET
                                  </div>
                                  <button 
                                      onClick={() => setBattleState(prev => ({ ...prev, ui: { ...prev.ui, selectionMode: 'MOVE', selectedMove: null, selectedItem: null } }))}
                                      className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded border-2 border-gray-400 text-sm transition-colors"
                                  >
                                      BACK
                                  </button>
                              </div>
                          )}
                           {isBagMode && (
                               <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-40">
                                   {playerState.run.capturePermits > 0 && (
                                       <ActionButton 
                                           label={`CAPTURE PERMIT (${playerState.run.capturePermits})`} 
                                           color="bg-orange-500" 
                                           onClick={() => setBattleState(prev => ({ ...prev, ui: { ...prev.ui, selectionMode: 'TARGET', selectedItem: 'poke-ball' } }))} 
                                       />
                                   )}
                                   {playerState.inventory.potions > 0 && (
                                       <ActionButton 
                                           label={`POTION (${playerState.inventory.potions})`} 
                                           color="bg-green-600" 
                                           onClick={() => queueAction(battleState.activePlayerIndex, 'potion')} 
                                       />
                                   )}
                                   {playerState.inventory.items.map((itemId, idx) => {
                                       const item = ITEMS[itemId];
                                       if (!item || (item.category !== 'pokeball' && item.category !== 'healing')) return null;
                                       return (
                                           <ActionButton 
                                               key={idx}
                                               label={`${item.name.toUpperCase()}`} 
                                               color={item.category === 'pokeball' ? "bg-orange-600" : "bg-green-700"} 
                                               onClick={() => {
                                                   if (item.category === 'pokeball') {
                                                       setBattleState(prev => ({ ...prev, ui: { ...prev.ui, selectionMode: 'TARGET', selectedItem: itemId } }));
                                                   } else {
                                                       queueAction(battleState.activePlayerIndex, itemId);
                                                   }
                                               }} 
                                           />
                                       );
                                   })}
                                   <ActionButton label="BACK" color="bg-gray-500" onClick={() => setBattleState(prev => ({ ...prev, ui: { ...prev.ui, selectionMode: 'MOVE' } }))} />
                                   {networkRole !== 'none' && (
                                       <div className="col-span-full text-center text-xs text-yellow-400 mt-2 animate-pulse">
                                           {(networkRole === 'host' && battleState.activePlayerIndex === 1) ? 'Waiting for Client...' : 
                                            (networkRole === 'client' && battleState.activePlayerIndex === 0) ? 'Waiting for Host...' : ''}
                                       </div>
                                   )}
                               </div>
                           )}
                           {isSwitchMode && (
                               <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-40">
                                   {battleState.playerTeam.map((p, i) => {
                                       const abilityData = NEW_ABILITIES[p.ability.name];
                                       return (
                                           <button 
                                               key={i}
                                               className={`p-2 rounded text-xs font-bold border-2 transition-all ${p.isFainted ? 'bg-gray-600 border-gray-800 opacity-50 cursor-not-allowed' : i === battleState.activePlayerIndex ? 'bg-blue-700 border-yellow-400' : 'bg-blue-500 border-blue-700 hover:bg-blue-400'}`}
                                               onClick={() => {
                                                   if (p.isFainted || i === battleState.activePlayerIndex) return;
                                                   queueAction(battleState.activePlayerIndex, undefined, undefined, false, i);
                                               }}
                                               disabled={p.isFainted || i === battleState.activePlayerIndex}
                                           >
                                               <div className="flex justify-between items-center">
                                                   <span className="truncate mr-1">{p.name}</span>
                                                   <span className="text-[8px] whitespace-nowrap">Lv.{p.level}</span>
                                               </div>
                                               <div className="w-full bg-gray-900 h-1 mt-1 rounded-full overflow-hidden">
                                                   <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${(p.currentHp/p.maxHp)*100}%` }}></div>
                                               </div>
                                               <div className="mt-1 text-[8px] text-left text-yellow-200 opacity-90">
                                                   {p.ability.name}
                                               </div>
                                               <div className="text-[7px] text-left text-gray-200 leading-tight line-clamp-2 opacity-75">
                                                   {abilityData?.description || "No description available."}
                                               </div>
                                           </button>
                                       );
                                   })}
                                   <div className="col-span-2">
                                       <ActionButton label="BACK" color="bg-gray-600" onClick={()=>setBattleState(prev=>({...prev, ui:{selectionMode:'MOVE'}}))} disabled={battleState.mustSwitch} />
                                   </div>
                                   {/* Multiplayer Turn Indicator */}
                                   {networkRole !== 'none' && (
                                       <div className="col-span-full text-center text-xs text-yellow-400 mt-2 animate-pulse">
                                           {(networkRole === 'host' && battleState.activePlayerIndex === 1) ? 'Waiting for Client...' : 
                                            (networkRole === 'client' && battleState.activePlayerIndex === 0) ? 'Waiting for Host...' : ''}
                                       </div>
                                   )}
                               </div>
                           )}
                     </div>
                 </div>
             </div>
         </div>
          );
    };

    return (
        <>
            {renderContent()}
        </>
    );
}
