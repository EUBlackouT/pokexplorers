import React, { useEffect, useState } from 'react';
import { Pokemon } from '../types';
import { getStarters, TYPE_COLORS } from '../services/pokeService';
import { PokemonSprite } from './PokemonSprite';

interface Props {
    onSelect: (team: Pokemon[]) => void;
    unlockedPacks: string[];
    shinyBoost: number;
    upgrades: any;
    networkRole?: 'host' | 'client' | 'none';
    multiplayer?: any;
    remotePlayers?: Map<string, any>;
    onInvite?: () => void;
    onBack?: () => void;
}

export const StarterSelect: React.FC<Props> = ({ onSelect, unlockedPacks, shinyBoost, upgrades, networkRole = 'none', multiplayer, remotePlayers = new Map(), onInvite, onBack }) => {
    const [options, setOptions] = useState<Pokemon[]>([]);
    const optionsRef = React.useRef<Pokemon[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [isInviting, setIsInviting] = useState(false);

    // Sync ref
    React.useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    const currentPlayer = selected.length === 0 ? 1 : 2;
    const isMyTurn = networkRole === 'none' || 
                     (networkRole === 'host' && currentPlayer === 1) || 
                     (networkRole === 'client' && currentPlayer === 2);

    const getBoostedStat = (key: string, value: number) => {
        if (!upgrades) return value;
        if (key === 'attack' || key === 'special-attack') return Math.floor(value * (1 + (upgrades.attackBoost * 0.05)));
        if (key === 'defense' || key === 'special-defense') return Math.floor(value * (1 + (upgrades.defenseBoost * 0.05)));
        if (key === 'speed') return Math.floor(value * (1 + (upgrades.speedBoost * 0.05)));
        return value;
    };

    useEffect(() => {
        if (networkRole === 'client') return; // Client waits for host
        
        if (options.length > 0) {
            // If we already have options and just became host, broadcast them
            if (networkRole === 'host' && multiplayer) {
                console.log("[STARTER_SELECT] Host broadcasting existing starters");
                multiplayer.send({
                    type: 'GAME_SYNC',
                    payload: { type: 'STARTERS_DATA', options: options, isPersistent: true }
                });
            }
            setLoading(false);
            return;
        }

        getStarters(unlockedPacks, shinyBoost).then(data => {
            setOptions(data);
            setLoading(false);
            
            if (networkRole === 'host' && multiplayer) {
                multiplayer.send({
                    type: 'GAME_SYNC',
                    payload: { type: 'STARTERS_DATA', options: data, isPersistent: true }
                });
            }
        }).catch(err => {
            console.error("Failed to fetch starters:", err);
            setError("Failed to scout Pokémon. Please check your connection.");
            setLoading(false);
        });
    }, [unlockedPacks, shinyBoost, networkRole]);

    // Network Sync
    useEffect(() => {
        if (networkRole === 'none' || !multiplayer) return;

        const handleData = (data: any) => {
            if (data.type === 'GAME_SYNC') {
                if (data.payload?.type === 'STARTER_SELECT') {
                    setSelected(data.payload.selected);
                } else if (data.payload?.type === 'STARTERS_DATA' && networkRole === 'client') {
                    console.log("[STARTER_SELECT] Received STARTERS_DATA", data.payload.options.length);
                    optionsRef.current = data.payload.options; // Update ref immediately for synchronous replay
                    setOptions(data.payload.options);
                    setLoading(false);
                } else if (data.payload?.type === 'START_GAME') {
                    if (optionsRef.current.length === 0) {
                        console.warn("[STARTER_SELECT] Received START_GAME but no options yet. Payload:", data.payload);
                        return;
                    }
                    const team = data.payload.selectedIndices.map((i: number) => optionsRef.current[i]);
                    onSelect(team);
                }
            }
        };

        const unsubscribe = multiplayer.onData(handleData);
        return () => {
            unsubscribe();
        };
    }, [networkRole, multiplayer]);

    const toggleSelection = (index: number) => {
        if (!isMyTurn) return;

        let newSelected = [...selected];
        if (selected.includes(index)) {
            newSelected = selected.filter(i => i !== index);
        } else {
            if (selected.length < 2) {
                newSelected = [...selected, index];
            }
        }

        setSelected(newSelected);

        if (networkRole !== 'none' && multiplayer) {
            multiplayer.send({
                type: 'GAME_SYNC',
                payload: { type: 'STARTER_SELECT', selected: newSelected, isPersistent: false }
            });
        }
    };

    const confirmSelection = () => {
        if (selected.length === 2 && (networkRole === 'none' || networkRole === 'host')) {
            const team = selected.map(i => options[i]);
            
            if (networkRole === 'host' && multiplayer) {
                multiplayer.send({
                    type: 'GAME_SYNC',
                    payload: { type: 'START_GAME', selectedIndices: selected, isPersistent: true }
                });
            }
            
            onSelect(team);
        }
    };

    const isActuallyLoading = loading && options.length === 0;

    const retryScouting = () => {
        setLoading(true);
        setError(null);
        getStarters(unlockedPacks, shinyBoost).then(data => {
            setOptions(data);
            setLoading(false);
            if (networkRole === 'host' && multiplayer) {
                multiplayer.send({
                    type: 'GAME_SYNC',
                    payload: { type: 'STARTERS_DATA', options: data, isPersistent: true }
                });
            }
        }).catch(err => {
            console.error("Retry failed:", err);
            setError("Scouting failed again. Check connection.");
            setLoading(false);
        });
    };

    if (isActuallyLoading) return (
        <div className="fixed inset-0 bg-[#020617] flex items-center justify-center z-50">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <div className="text-blue-400 text-xl font-black uppercase tracking-[0.2em] animate-pulse mb-4">Scouting Pokemon...</div>
                <div className="text-white/40 text-xs mb-8">
                    {networkRole === 'client' ? "Waiting for host to send data..." : "Fetching from PokeAPI..."}
                </div>
                <button 
                    onClick={retryScouting}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white/60 text-xs rounded-full border border-white/10 transition-all"
                >
                    RETRY SCOUTING
                </button>
            </div>
        </div>
    );

    if (error) return (
        <div className="fixed inset-0 bg-[#020617] flex items-center justify-center z-50 p-4">
            <div className="text-center max-w-md bg-white/5 backdrop-blur-xl p-10 rounded-[2.5rem] border border-red-500/20">
                <div className="text-4xl mb-6">⚠️</div>
                <div className="text-red-400 text-xl font-black uppercase tracking-widest mb-4">{error}</div>
                <button 
                    onClick={() => window.location.reload()}
                    className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                    Try Again
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-[#020617] text-white p-4 md:p-12 font-sans flex flex-col items-center overflow-y-auto relative custom-scrollbar">
            {/* Immersive Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,#1e3a8a_0%,transparent_70%)] opacity-40"></div>
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/10 blur-[100px] rounded-full"></div>
                
                {/* Decorative Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            </div>

            <div className="max-w-7xl w-full z-10">
                <div className="absolute top-8 left-8">
                    <button 
                        onClick={onBack}
                        className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
                    >
                        ← Back to Menu
                    </button>
                </div>

                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic mb-4" style={{ 
                        color: '#ffcb05',
                        textShadow: '4px 4px 0px #3c5aa6, -1px -1px 0px #3c5aa6, 1px -1px 0px #3c5aa6, -1px 1px 0px #3c5aa6, 1px 1px 0px #3c5aa6'
                    }}>
                        POKÉMON EXPLORERS
                    </h1>
                    
                    {/* Co-op Controls */}
                    <div className="flex flex-col items-center gap-6 mt-8">
                        {networkRole === 'none' ? (
                            <button 
                                onClick={async () => {
                                    setIsInviting(true);
                                    if (onInvite) await onInvite();
                                    setIsInviting(false);
                                }}
                                disabled={isInviting}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.3em] transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)] border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1"
                            >
                                {isInviting ? 'Opening Rift...' : '🤝 Invite Friend to Co-op'}
                            </button>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-[2rem] flex items-center gap-6 shadow-2xl">
                                    <div className="text-left">
                                        <div className="text-[8px] text-blue-400 font-black uppercase tracking-widest mb-1">Room Code</div>
                                        <div className="text-2xl font-mono font-bold tracking-[0.3em] text-white">{multiplayer?.roomId}</div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (multiplayer?.roomId) {
                                                navigator.clipboard.writeText(multiplayer.roomId);
                                            }
                                        }}
                                        className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors text-xl"
                                        title="Copy Code"
                                    >
                                        📋
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${remotePlayers.size > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        {remotePlayers.size > 0 ? 'Friend Connected!' : 'Waiting for friend to join...'}
                                    </span>
                                </div>
                                <p className="text-[8px] text-gray-600 uppercase tracking-widest mt-2">Share this code with your friend to sync your Rifts</p>
                            </div>
                        )}

                        <div className="flex flex-col items-center gap-4 mt-4">
                            <div className="flex items-center gap-4">
                                <div className="h-px w-12 bg-blue-500"></div>
                                <p className="text-blue-400 text-xs md:text-sm uppercase tracking-[0.5em] font-black">
                                    {selected.length < 2 
                                        ? (isMyTurn ? 'Your Turn: Pick your starter' : `Waiting for Player ${currentPlayer}...`)
                                        : 'Team Ready'}
                                </p>
                                <div className="h-px w-12 bg-blue-500"></div>
                            </div>
                            
                            {selected.length < 2 && (
                                <div className={`px-6 py-2 rounded-full animate-pulse border ${isMyTurn ? 'bg-green-500/20 border-green-400/30' : 'bg-blue-500/20 border-blue-400/30'}`}>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isMyTurn ? 'text-green-200' : 'text-blue-200'}`}>
                                        {isMyTurn ? 'Select your Pokémon' : `Player ${currentPlayer} is choosing...`}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 mb-32 max-w-5xl mx-auto">
                    {options.map((p, i) => {
                        const isSelected = selected.includes(i);
                        const isExpanded = expandedIndex === i;
                        const selectionIndex = selected.indexOf(i);
                        
                        return (
                            <div 
                                key={p.id}
                                className={`
                                    group relative bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 transition-all duration-500 border-2
                                    ${isSelected 
                                        ? 'border-blue-400 bg-blue-500/10 scale-105 shadow-[0_0_60px_rgba(59,130,246,0.2)] z-10' 
                                        : 'border-white/5 hover:border-white/20 hover:bg-white/10'}
                                    ${isMyTurn ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}
                                `}
                                onClick={() => toggleSelection(i)}
                            >
                                {/* Selection Badge */}
                                {isSelected && (
                                    <div className="absolute -top-3 -right-3 w-14 h-14 bg-blue-500 text-white rounded-2xl flex flex-col items-center justify-center font-black shadow-2xl border-4 border-[#020617] animate-bounce rotate-12">
                                        <span className="text-[10px] leading-none opacity-70">PLAYER</span>
                                        <span className="text-2xl leading-none">{selectionIndex + 1}</span>
                                    </div>
                                )}

                                {/* Sprite Container */}
                                <div className={`
                                    relative aspect-square rounded-3xl flex items-center justify-center mb-8 transition-all duration-500 overflow-hidden
                                    ${isSelected ? 'bg-blue-400/20' : 'bg-black/40 group-hover:bg-black/60'}
                                `}>
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_70%)]"></div>
                                    <PokemonSprite pokemon={p} className="w-32 h-32 relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] group-hover:scale-110 transition-transform duration-500" variant="menu" />
                                </div>
                                
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-3 mb-2">
                                        <h3 className={`text-2xl font-black uppercase tracking-widest transition-colors ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                                            {p.name}
                                        </h3>
                                        <span className="text-[10px] bg-white/10 px-2 py-1 rounded-lg text-gray-400 font-mono font-bold border border-white/5">Lv.5</span>
                                    </div>

                                    <div className="flex justify-center gap-2 mb-8">
                                        {p.types.map(t => (
                                            <span 
                                                key={t} 
                                                className="text-[9px] px-3 py-1 rounded-full uppercase font-black border border-white/10 shadow-sm"
                                                style={{ backgroundColor: `${TYPE_COLORS[t]}44`, color: TYPE_COLORS[t] }}
                                            >
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedIndex(isExpanded ? null : i);
                                            }}
                                            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                                isExpanded 
                                                    ? 'bg-white text-black border-white' 
                                                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                                            }`}
                                        >
                                            {isExpanded ? 'Hide Stats' : 'View Stats'}
                                        </button>
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                                            isSelected 
                                                ? 'bg-blue-500 border-blue-400 text-white' 
                                                : 'bg-white/5 border-white/10 text-white/30'
                                        }`}>
                                            {isSelected ? '✓' : '+'}
                                        </div>
                                    </div>

                                    {/* Expandable Stats */}
                                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-60 mt-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="grid grid-cols-3 gap-2 p-4 bg-black/40 rounded-3xl border border-white/5">
                                            {[
                                                { label: 'HP', val: p.stats.hp, color: 'text-red-400' },
                                                { label: 'ATK', val: getBoostedStat('attack', p.stats.attack), color: 'text-orange-400' },
                                                { label: 'DEF', val: getBoostedStat('defense', p.stats.defense), color: 'text-yellow-400' },
                                                { label: 'SPA', val: getBoostedStat('special-attack', p.stats['special-attack']), color: 'text-blue-400' },
                                                { label: 'SPD', val: getBoostedStat('special-defense', p.stats['special-defense']), color: 'text-indigo-400' },
                                                { label: 'SPE', val: getBoostedStat('speed', p.stats.speed), color: 'text-emerald-400' }
                                            ].map(s => (
                                                <div key={s.label} className="text-center py-1">
                                                    <div className={`text-[8px] font-black uppercase mb-0.5 ${s.color}`}>{s.label}</div>
                                                    <div className="text-xs font-mono font-bold text-white">{s.val}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Selection Glow */}
                                {isSelected && (
                                    <div className="absolute inset-0 border-2 border-blue-400 rounded-[2.5rem] animate-pulse pointer-events-none" />
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-col items-center gap-8 mb-20">
                    <div className="flex items-center gap-6">
                        <div className={`w-4 h-4 rounded-full transition-all duration-500 border-2 ${selected.length >= 1 ? 'bg-blue-500 border-blue-300 shadow-[0_0_15px_#3b82f6]' : 'bg-white/5 border-white/10'}`}></div>
                        <div className={`w-4 h-4 rounded-full transition-all duration-500 border-2 ${selected.length >= 2 ? 'bg-blue-500 border-blue-300 shadow-[0_0_15px_#3b82f6]' : 'bg-white/5 border-white/10'}`}></div>
                    </div>

                    <button
                        disabled={selected.length !== 2 || networkRole === 'client'}
                        onClick={confirmSelection}
                        className={`
                            group relative px-24 py-7 rounded-3xl text-2xl font-black uppercase tracking-[0.4em] transition-all duration-500 overflow-hidden
                            ${selected.length === 2 && networkRole !== 'client'
                                ? 'bg-white text-black hover:bg-blue-500 hover:text-white shadow-[0_0_60px_rgba(59,130,246,0.4)]' 
                                : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'}
                        `}
                    >
                        <span className="relative z-10">
                            {networkRole === 'client' && selected.length === 2 ? 'Waiting for Host' : 'Begin Adventure'}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </button>
                    
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest font-black">
                        Choose wisely. The rift does not forgive mistakes.
                    </p>
                </div>
            </div>
        </div>
    );
};
