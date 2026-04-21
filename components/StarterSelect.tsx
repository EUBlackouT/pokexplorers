import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Pokemon } from '../types';
import { getStarters, TYPE_COLORS } from '../services/pokeService';
import { PokemonSprite } from './PokemonSprite';
import {
    playCry,
    playMoveClickSfx,
    playSendOutSfx,
    playBattleWinSfx,
} from '../services/soundService';

/* ============================================================================
 * StarterSelect (v2, overhauled)
 *
 * Visual language matches the rest of the game:
 *   - Painted cel-shaded sanctuary background (bg_starter.jpg)
 *   - Press Start 2P for badges/titles, Inter for prose
 *   - "Windowskin" panels with a rounded-corner border + drop shadow instead
 *     of the old glassmorphism SaaS cards
 *
 * Core flow:
 *   1. The full roster of starters is rendered as a row of Poke-Ball pedestals.
 *      Hovering or keyboard-focusing a pedestal updates the big "Preview Dais"
 *      above the row with a huge animated sprite + info card.
 *   2. The player clicks / presses Enter once on a pedestal to lock it in as
 *      Player 1 (or Player 2 in local co-op). A second click removes it.
 *      In multiplayer, each side owns their own selection.
 *   3. Once both slots are filled, the "Begin Adventure" confirm dialog
 *      appears in mainline-Pokemon style: "Will you choose X and Y?"
 *
 * Side effects kept compatible with old version:
 *   - Host broadcasts STARTERS_DATA + START_GAME
 *   - Clients listen and replay via optionsRef
 *   - STARTER_SELECT selections are forwarded bidirectionally
 *
 * Audio:
 *   - Hover/focus plays cry (debounced, so rapid cursor movement doesn't spam)
 *   - Lock-in plays the send-out whoosh
 *   - Confirm plays a small fanfare
 * ========================================================================= */

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

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const titleCase = (s: string): string =>
    s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

/** Classify a starter into a short, human-readable "build role" tag. */
const deriveRole = (p: Pokemon): { tag: string; color: string } => {
    const { attack, defense, speed, hp } = p.stats;
    const spa = p.stats['special-attack'];
    const spd = p.stats['special-defense'];
    const offensive = Math.max(attack, spa);
    const defensive = (defense + spd) / 2;
    if (speed >= 95 && offensive >= 70 && defensive < 70) return { tag: 'Glass Cannon', color: '#ef4444' };
    if (speed >= 95) return { tag: 'Speedster', color: '#eab308' };
    if (hp >= 85 && defensive >= 80) return { tag: 'Bulky Wall', color: '#38bdf8' };
    if (hp >= 80 && attack >= 80) return { tag: 'Bulky Attacker', color: '#a16207' };
    if (spa >= attack + 15) return { tag: 'Special Sweeper', color: '#8b5cf6' };
    if (attack >= spa + 15) return { tag: 'Physical Sweeper', color: '#f97316' };
    return { tag: 'Balanced', color: '#22c55e' };
};

/**
 * Very short one-liner that summarises the Pokemon's offensive identity, used
 * below the role tag. PokeAPI's own flavor text is locale-dependent and noisy,
 * so we synthesize a deterministic blurb from type + role + speed tier.
 */
const flavorLine = (p: Pokemon): string => {
    const primary = titleCase(p.types[0] ?? 'Normal');
    const secondary = p.types[1] ? ` / ${titleCase(p.types[1])}` : '';
    const role = deriveRole(p).tag.toLowerCase();
    const speed = p.stats.speed;
    const tempo = speed >= 100 ? 'blazing' : speed >= 75 ? 'swift' : speed >= 55 ? 'steady' : 'patient';
    return `A ${tempo} ${primary}${secondary} ${role} with ${p.ability.name.replace(/-/g, ' ')}.`;
};

/** Debounced cry player. Ignores rapid hover jitter, fires at most every 220ms. */
const useDebouncedCry = () => {
    const lastIdRef = useRef<number | null>(null);
    const timerRef = useRef<number | null>(null);
    return useCallback((p: Pokemon | undefined) => {
        if (!p) return;
        if (lastIdRef.current === p.id) return;
        lastIdRef.current = p.id;
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
            playCry(p.id, p.name).catch(() => { /* cry fetch failed, not fatal */ });
        }, 220);
    }, []);
};

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

const TypeBadge: React.FC<{ type: string }> = ({ type }) => (
    <span
        className="text-[10px] md:text-xs px-3 py-1 rounded-full uppercase font-black tracking-widest border border-black/20 shadow-inner"
        style={{
            backgroundColor: TYPE_COLORS[type] || '#9ca3af',
            color: '#fff',
            textShadow: '1px 1px 0 rgba(0,0,0,0.6)',
        }}
    >
        {type}
    </span>
);

const StatBar: React.FC<{ label: string; value: number; color: string; max?: number }> = ({ label, value, color, max = 150 }) => (
    <div className="flex items-center gap-2 w-full">
        <span className="text-[9px] font-black uppercase w-10 text-gray-700 font-press-start">{label}</span>
        <div className="flex-1 h-3 bg-black/10 rounded-full overflow-hidden border border-black/10">
            <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            />
        </div>
        <span className="text-xs font-mono font-bold text-gray-800 w-8 text-right">{value}</span>
    </div>
);

/**
 * A single starter pedestal. Renders the Poke Ball on the ground and the
 * Pokemon sprite hovering above it. Animates in on mount, grows on hover/focus.
 */
const Pedestal: React.FC<{
    pokemon: Pokemon;
    index: number;
    isFocused: boolean;
    assignedTo: 1 | 2 | null;
    canInteract: boolean;
    onFocus: () => void;
    onToggle: () => void;
}> = ({ pokemon, index, isFocused, assignedTo, canInteract, onFocus, onToggle }) => {
    return (
        <motion.button
            type="button"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05, ease: 'easeOut' }}
            onClick={() => { if (canInteract) { onToggle(); } else { onFocus(); } }}
            onMouseEnter={onFocus}
            onFocus={onFocus}
            aria-label={`Choose ${pokemon.name}`}
            className={`relative flex flex-col items-center justify-end gap-1 px-2 pt-6 pb-3 rounded-2xl transition-all duration-300 outline-none group
                ${isFocused ? 'scale-110 -translate-y-2' : 'scale-100'}
                ${assignedTo ? 'drop-shadow-[0_0_25px_rgba(255,203,5,0.8)]' : ''}
                ${canInteract ? 'cursor-pointer' : 'cursor-default'}
            `}
            style={{ minWidth: 120 }}
        >
            {/* Player badge above pedestal when locked in */}
            <AnimatePresence>
                {assignedTo && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.6 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.25 }}
                        className="absolute -top-1 left-1/2 -translate-x-1/2 bg-gradient-to-b from-yellow-300 to-amber-500 text-black font-press-start text-[8px] px-3 py-1 rounded-full border-2 border-white shadow-lg whitespace-nowrap z-20"
                    >
                        P{assignedTo} Chose
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating sprite */}
            <div className={`relative h-28 w-28 md:h-32 md:w-32 flex items-center justify-end transition-all duration-300 ${isFocused ? 'scale-110' : 'group-hover:scale-105'}`}>
                <PokemonSprite pokemon={pokemon} variant="menu" className="w-full h-full drop-shadow-[0_8px_12px_rgba(0,0,0,0.45)]" />
                {pokemon.isShiny && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-2 right-2 text-yellow-300 text-xl animate-pulse">✦</div>
                    </div>
                )}
            </div>

            {/* Pedestal Poke Ball */}
            <div className="relative h-10 w-20 flex items-center justify-center">
                {/* ground shadow */}
                <div className="absolute bottom-1 w-16 h-2 rounded-full bg-black/40 blur-[2px]" />
                {/* ball */}
                <svg viewBox="0 0 64 64" className={`relative w-14 h-14 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] transition-transform duration-300 ${isFocused ? 'animate-bounce' : ''}`}>
                    <defs>
                        <linearGradient id={`ball-red-${pokemon.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ff5a5a" />
                            <stop offset="100%" stopColor="#c81d1d" />
                        </linearGradient>
                        <linearGradient id={`ball-white-${pokemon.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="100%" stopColor="#d6d3d1" />
                        </linearGradient>
                    </defs>
                    <circle cx="32" cy="32" r="30" fill="#1f1f1f" />
                    <path d="M2 32 A30 30 0 0 1 62 32 Z" fill={`url(#ball-red-${pokemon.id})`} />
                    <path d="M2 32 A30 30 0 0 0 62 32 Z" fill={`url(#ball-white-${pokemon.id})`} />
                    <rect x="2" y="29" width="60" height="6" fill="#1f1f1f" />
                    <circle cx="32" cy="32" r="8" fill="#1f1f1f" />
                    <circle cx="32" cy="32" r="5" fill="#ffffff" />
                    <circle cx="32" cy="32" r="2.5" fill={assignedTo ? '#facc15' : '#9ca3af'} />
                </svg>
            </div>

            {/* Name label */}
            <div
                className={`mt-1 text-center font-press-start text-[9px] md:text-[10px] uppercase whitespace-nowrap tracking-wider transition-colors duration-200
                    ${isFocused ? 'text-yellow-200 drop-shadow-[1px_1px_0_#3c5aa6]' : 'text-white drop-shadow-[1px_1px_0_rgba(0,0,0,0.8)]'}`}
            >
                {pokemon.name}
            </div>
        </motion.button>
    );
};

/**
 * The big Preview Dais sitting above the pedestal row. Shows the currently-
 * focused starter at large scale with its types, role, ability + description,
 * and a few key stats. Animates in when focus changes.
 */
const PreviewDais: React.FC<{ pokemon: Pokemon | null; upgrades: any }> = ({ pokemon, upgrades }) => {
    const getBoostedStat = (key: string, value: number) => {
        if (!upgrades) return value;
        if (key === 'attack' || key === 'special-attack') return Math.floor(value * (1 + (upgrades.attackBoost * 0.05)));
        if (key === 'defense' || key === 'special-defense') return Math.floor(value * (1 + (upgrades.defenseBoost * 0.05)));
        if (key === 'speed') return Math.floor(value * (1 + (upgrades.speedBoost * 0.05)));
        return value;
    };

    const role = pokemon ? deriveRole(pokemon) : null;

    return (
        <div className="w-full flex flex-col md:flex-row items-center md:items-stretch gap-4 md:gap-8">
            {/* Left: huge sprite */}
            <div className="relative flex-shrink-0 w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {pokemon && (
                        <motion.div
                            key={pokemon.id}
                            initial={{ opacity: 0, scale: 0.7, rotate: -4 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.7, rotate: 4 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.35)_0%,transparent_70%)] animate-pulse" />
                            <PokemonSprite
                                pokemon={pokemon}
                                variant="menu"
                                className="w-48 h-48 md:w-64 md:h-64 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Right: info windowskin */}
            <div className="relative flex-1 bg-white/95 text-gray-900 border-4 border-[#3c5aa6] rounded-2xl shadow-[0_6px_0_#1e3a8a,0_12px_24px_rgba(0,0,0,0.4)] p-5 md:p-6 min-h-[12rem]">
                <AnimatePresence mode="wait">
                    {pokemon ? (
                        <motion.div
                            key={pokemon.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            className="flex flex-col gap-3"
                        >
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="font-press-start text-xl md:text-2xl uppercase tracking-wider text-[#1e3a8a]">
                                    {pokemon.name}
                                </h2>
                                <span className="bg-[#1e3a8a] text-white text-[10px] font-press-start px-2 py-1 rounded">Lv.5</span>
                                {pokemon.isShiny && (
                                    <span className="bg-yellow-400 text-black text-[10px] font-press-start px-2 py-1 rounded animate-pulse">SHINY</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                {pokemon.types.map(t => <TypeBadge key={t} type={t} />)}
                                {role && (
                                    <span
                                        className="ml-auto text-[10px] font-press-start uppercase px-3 py-1 rounded-full text-white shadow-inner"
                                        style={{ background: role.color }}
                                    >
                                        {role.tag}
                                    </span>
                                )}
                            </div>

                            <div className="text-sm leading-snug text-gray-700">
                                {flavorLine(pokemon)}
                            </div>

                            <div className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[9px] font-press-start uppercase tracking-wider text-[#b91c1c]">Ability</span>
                                    <span className="text-xs font-bold text-gray-900">{titleCase(pokemon.ability.name)}</span>
                                </div>
                                <p className="text-[11px] leading-snug text-gray-600 line-clamp-3">
                                    {pokemon.ability.description || 'No description available.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-1.5 mt-1">
                                <StatBar label="HP" value={pokemon.stats.hp} color="#ef4444" />
                                <StatBar label="ATK" value={getBoostedStat('attack', pokemon.stats.attack)} color="#f97316" />
                                <StatBar label="SPA" value={getBoostedStat('special-attack', pokemon.stats['special-attack'])} color="#3b82f6" />
                                <StatBar label="SPE" value={getBoostedStat('speed', pokemon.stats.speed)} color="#10b981" />
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-sm text-gray-500 font-press-start uppercase tracking-wider">
                            Hover a Poké Ball...
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

export const StarterSelect: React.FC<Props> = ({
    onSelect,
    unlockedPacks,
    shinyBoost,
    upgrades,
    networkRole = 'none',
    multiplayer,
    remotePlayers = new Map(),
    onInvite,
    onBack,
}) => {
    const [options, setOptions] = useState<Pokemon[]>([]);
    const optionsRef = useRef<Pokemon[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [focusedIndex, setFocusedIndex] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInviting, setIsInviting] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const debouncedCry = useDebouncedCry();

    useEffect(() => { optionsRef.current = options; }, [options]);

    const currentPlayer = selected.length === 0 ? 1 : 2;
    const isMyTurn =
        networkRole === 'none' ||
        (networkRole === 'host' && currentPlayer === 1) ||
        (networkRole === 'client' && currentPlayer === 2);

    /* -----------------------------------------------------------------------
     * Data load + multiplayer handshake (kept identical to old version so the
     * host/client sync doesn't regress).
     * --------------------------------------------------------------------- */
    useEffect(() => {
        if (networkRole === 'client') return;

        if (options.length > 0) {
            if (networkRole === 'host' && multiplayer) {
                multiplayer.send({
                    type: 'GAME_SYNC',
                    payload: { type: 'STARTERS_DATA', options, isPersistent: true },
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
                    payload: { type: 'STARTERS_DATA', options: data, isPersistent: true },
                });
            }
        }).catch(err => {
            console.error('Failed to fetch starters:', err);
            setError('Failed to scout Pokémon. Please check your connection.');
            setLoading(false);
        });
    }, [unlockedPacks, shinyBoost, networkRole]);

    useEffect(() => {
        if (networkRole === 'none' || !multiplayer) return;
        const handleData = (data: any) => {
            if (data.type !== 'GAME_SYNC') return;
            if (data.payload?.type === 'STARTER_SELECT') {
                setSelected(data.payload.selected);
            } else if (data.payload?.type === 'STARTERS_DATA' && networkRole === 'client') {
                optionsRef.current = data.payload.options;
                setOptions(data.payload.options);
                setLoading(false);
            } else if (data.payload?.type === 'START_GAME') {
                if (optionsRef.current.length === 0) return;
                const team = data.payload.selectedIndices.map((i: number) => optionsRef.current[i]);
                onSelect(team);
            }
        };
        const unsubscribe = multiplayer.onData(handleData);
        return () => { unsubscribe(); };
    }, [networkRole, multiplayer]);

    /* -----------------------------------------------------------------------
     * Selection toggle + network propagation.
     * --------------------------------------------------------------------- */
    const toggleSelection = useCallback((index: number) => {
        if (!isMyTurn) return;
        const pick = options[index];
        if (!pick) return;

        let newSelected: number[];
        if (selected.includes(index)) {
            newSelected = selected.filter(i => i !== index);
            playMoveClickSfx();
        } else if (selected.length < 2) {
            newSelected = [...selected, index];
            playSendOutSfx();
        } else {
            return;
        }
        setSelected(newSelected);
        if (networkRole !== 'none' && multiplayer) {
            multiplayer.send({
                type: 'GAME_SYNC',
                payload: { type: 'STARTER_SELECT', selected: newSelected, isPersistent: false },
            });
        }
    }, [isMyTurn, options, selected, networkRole, multiplayer]);

    /* -----------------------------------------------------------------------
     * Keyboard controls: ArrowLeft/ArrowRight moves focus, Enter toggles,
     * Ctrl/Shift+Enter confirms when both are filled. Escape -> back.
     * --------------------------------------------------------------------- */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (loading || error) return;
            const tag = (e.target as HTMLElement | null)?.tagName || '';
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
            if (showConfirm) return; // Confirm dialog has its own handlers.
            if (!options.length) return;

            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                setFocusedIndex(i => (i + 1) % options.length);
                e.preventDefault();
            } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                setFocusedIndex(i => (i - 1 + options.length) % options.length);
                e.preventDefault();
            } else if (e.key === 'Enter' || e.key === ' ') {
                toggleSelection(focusedIndex);
                e.preventDefault();
            } else if (e.key === 'Escape' && onBack) {
                onBack();
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [focusedIndex, options, loading, error, toggleSelection, onBack, showConfirm]);

    /* -----------------------------------------------------------------------
     * Play cry when focus changes.
     * --------------------------------------------------------------------- */
    useEffect(() => {
        const p = options[focusedIndex];
        if (p) debouncedCry(p);
    }, [focusedIndex, options, debouncedCry]);

    /* -----------------------------------------------------------------------
     * Final confirm.
     * --------------------------------------------------------------------- */
    const confirmSelection = useCallback(() => {
        if (selected.length !== 2) return;
        if (networkRole === 'client') return;
        playBattleWinSfx();
        const team = selected.map(i => options[i]);
        if (networkRole === 'host' && multiplayer) {
            multiplayer.send({
                type: 'GAME_SYNC',
                payload: { type: 'START_GAME', selectedIndices: selected, isPersistent: true },
            });
        }
        onSelect(team);
    }, [selected, options, networkRole, multiplayer, onSelect]);

    const retryScouting = () => {
        setLoading(true);
        setError(null);
        getStarters(unlockedPacks, shinyBoost).then(data => {
            setOptions(data);
            setLoading(false);
            if (networkRole === 'host' && multiplayer) {
                multiplayer.send({
                    type: 'GAME_SYNC',
                    payload: { type: 'STARTERS_DATA', options: data, isPersistent: true },
                });
            }
        }).catch(err => {
            console.error('Retry failed:', err);
            setError('Scouting failed again. Check connection.');
            setLoading(false);
        });
    };

    const isActuallyLoading = loading && options.length === 0;

    const focusedPokemon = useMemo(() => options[focusedIndex] || null, [options, focusedIndex]);

    /* ============ Early returns: loading + error ============ */
    if (isActuallyLoading) return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{
                backgroundImage: 'url(/bg/bg_starter.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative text-center bg-white/95 border-4 border-[#3c5aa6] rounded-2xl px-8 py-6 shadow-[0_6px_0_#1e3a8a]">
                <div className="w-12 h-12 border-4 border-[#3c5aa6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <div className="text-[#1e3a8a] text-sm font-press-start uppercase tracking-widest animate-pulse mb-4">
                    Scouting Pokémon...
                </div>
                <div className="text-gray-500 text-[10px] mb-4 font-press-start">
                    {networkRole === 'client' ? 'Waiting for host...' : 'Fetching from PokeAPI...'}
                </div>
                <button
                    onClick={retryScouting}
                    className="px-5 py-2 bg-[#3c5aa6] hover:bg-[#1e3a8a] text-white text-[10px] rounded-full font-press-start transition-colors"
                >
                    Retry
                </button>
            </div>
        </div>
    );

    if (error) return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{
                backgroundImage: 'url(/bg/bg_starter.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative max-w-md bg-white/95 border-4 border-red-600 rounded-2xl px-8 py-8 text-center shadow-[0_6px_0_#b91c1c]">
                <div className="text-red-700 text-sm font-press-start uppercase mb-4 tracking-wider">{error}</div>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl text-[10px] font-press-start uppercase transition-colors"
                >
                    Try Again
                </button>
            </div>
        </div>
    );

    /* ============ Main render ============ */
    return (
        <div className="fixed inset-0 text-white overflow-hidden select-none">
            {/* ---------- Painted sanctuary background ---------- */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    className="absolute inset-0 bg-center bg-cover"
                    style={{ backgroundImage: 'url(/bg/bg_starter.jpg)' }}
                    initial={{ scale: 1.04 }}
                    animate={{ scale: [1.04, 1.08, 1.04] }}
                    transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/55" />
            </div>

            {/* ---------- Top bar ---------- */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-start justify-between p-4 md:p-6 pointer-events-none">
                <div className="pointer-events-auto">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="bg-white/90 hover:bg-white text-[#1e3a8a] px-4 py-2 rounded-xl text-[9px] font-press-start uppercase tracking-wider transition-all border-b-4 border-[#3c5aa6] active:translate-y-0.5 active:border-b-2 shadow-md"
                        >
                            ← Back
                        </button>
                    )}
                </div>

                <div className="text-center flex-1 -ml-10">
                    <h1
                        className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic font-press-start"
                        style={{
                            color: '#ffcb05',
                            textShadow: '3px 3px 0px #3c5aa6, -1px -1px 0 #3c5aa6, 1px -1px 0 #3c5aa6, -1px 1px 0 #3c5aa6, 1px 1px 0 #3c5aa6, 4px 4px 12px rgba(0,0,0,0.6)',
                        }}
                    >
                        Choose Your Starters
                    </h1>
                    <p className="mt-2 text-[10px] md:text-xs text-white/90 font-press-start uppercase tracking-widest drop-shadow-[1px_1px_0_rgba(0,0,0,0.6)]">
                        Two to begin the journey — pick wisely
                    </p>
                </div>

                {/* Co-op widget: warm "room code on a wooden sign" style */}
                <div className="pointer-events-auto">
                    {networkRole === 'none' ? (
                        <button
                            onClick={async () => {
                                setIsInviting(true);
                                if (onInvite) await onInvite();
                                setIsInviting(false);
                            }}
                            disabled={isInviting}
                            className="bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white px-4 py-2 rounded-xl text-[9px] font-press-start uppercase tracking-wider transition-all border-b-4 border-emerald-900 active:translate-y-0.5 active:border-b-2 shadow-md"
                        >
                            {isInviting ? 'Opening Rift...' : '+ Invite Friend'}
                        </button>
                    ) : (
                        <div className="bg-amber-100 border-4 border-amber-800 rounded-xl px-4 py-2 shadow-[0_4px_0_#78350f]">
                            <div className="text-[8px] text-amber-900 font-press-start uppercase tracking-wider">Room Code</div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-mono font-bold tracking-[0.25em] text-[#3c5aa6]">{multiplayer?.roomId}</span>
                                <button
                                    onClick={() => {
                                        if (multiplayer?.roomId) {
                                            navigator.clipboard.writeText(multiplayer.roomId);
                                            setCodeCopied(true);
                                            window.setTimeout(() => setCodeCopied(false), 1500);
                                        }
                                    }}
                                    className={`p-1 rounded text-xs transition-colors ${codeCopied ? 'bg-emerald-500 text-white' : 'bg-amber-700 text-amber-100 hover:bg-amber-800'}`}
                                    title="Copy"
                                    aria-label="Copy room code"
                                >
                                    {codeCopied ? '✓' : '⧉'}
                                </button>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <div className={`w-2 h-2 rounded-full ${remotePlayers.size > 0 ? 'bg-green-600 animate-pulse' : 'bg-gray-500'}`} />
                                <span className="text-[8px] font-press-start uppercase text-amber-900">
                                    {remotePlayers.size > 0 ? 'Friend Online' : 'Waiting...'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ---------- Centerpiece (preview + pedestals) ---------- */}
            <div className="relative z-10 h-full w-full flex flex-col items-center justify-end pb-20 pt-36 md:pt-28 px-4 md:px-10 gap-5 md:gap-8 overflow-y-auto">
                {/* Preview dais */}
                <div className="w-full max-w-5xl">
                    <PreviewDais pokemon={focusedPokemon} upgrades={upgrades} />
                </div>

                {/* Pedestal row */}
                <div className="w-full max-w-6xl overflow-x-auto">
                    <div className="flex items-end justify-center gap-3 md:gap-5 py-4 px-2 min-w-max mx-auto">
                        {options.map((p, i) => {
                            const selIndex = selected.indexOf(i);
                            const assignedTo = selIndex === -1 ? null : (selIndex === 0 ? 1 : 2) as 1 | 2;
                            return (
                                <Pedestal
                                    key={p.id}
                                    pokemon={p}
                                    index={i}
                                    isFocused={focusedIndex === i}
                                    assignedTo={assignedTo}
                                    canInteract={isMyTurn}
                                    onFocus={() => setFocusedIndex(i)}
                                    onToggle={() => toggleSelection(i)}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Selection state + action bar */}
                <div className="w-full max-w-5xl bg-white/95 text-gray-900 border-4 border-[#3c5aa6] rounded-2xl shadow-[0_6px_0_#1e3a8a] px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4 flex-wrap">
                        <SlotChip label="P1" pokemon={options[selected[0]]} />
                        <SlotChip label="P2" pokemon={options[selected[1]]} />
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[9px] font-press-start uppercase tracking-wider text-gray-600">
                            {selected.length < 2
                                ? (isMyTurn ? `${currentPlayer === 1 ? 'Pick #1' : 'Pick #2'}` : `Waiting for P${currentPlayer}...`)
                                : networkRole === 'client' ? 'Waiting for host' : 'Ready!'}
                        </span>
                        <button
                            onClick={() => setShowConfirm(true)}
                            disabled={selected.length !== 2 || networkRole === 'client'}
                            className={`px-6 py-3 rounded-xl font-press-start text-xs uppercase tracking-widest transition-all border-b-4 shadow-md
                                ${selected.length === 2 && networkRole !== 'client'
                                    ? 'bg-gradient-to-b from-yellow-400 to-amber-500 text-black hover:from-yellow-300 border-amber-800 active:translate-y-0.5 active:border-b-2'
                                    : 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'}`}
                        >
                            Begin Adventure
                        </button>
                    </div>
                </div>

                <p className="text-[9px] font-press-start uppercase tracking-wider text-white/70 drop-shadow-[1px_1px_0_rgba(0,0,0,0.8)]">
                    ← → to move · Enter to select · Esc to go back
                </p>
            </div>

            {/* ---------- Confirm dialog (mainline Pokemon style) ---------- */}
            <AnimatePresence>
                {showConfirm && selected.length === 2 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-30 flex items-center justify-center bg-black/60"
                        onClick={() => setShowConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.85, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.85, y: 20 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                            className="relative bg-white text-gray-900 border-4 border-[#3c5aa6] rounded-2xl shadow-[0_6px_0_#1e3a8a,0_12px_24px_rgba(0,0,0,0.4)] max-w-xl w-[92%] p-6 md:p-8"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="font-press-start text-sm md:text-base text-[#1e3a8a] uppercase tracking-wider mb-4">
                                Will you choose
                            </div>
                            <div className="flex items-center justify-center gap-4 md:gap-6 py-4">
                                {selected.map((idx, slot) => {
                                    const p = options[idx];
                                    return (
                                        <div key={idx} className="flex flex-col items-center gap-2">
                                            <div className="relative w-24 h-24 md:w-32 md:h-32">
                                                <PokemonSprite pokemon={p} variant="menu" className="w-full h-full drop-shadow-lg" />
                                            </div>
                                            <span className="font-press-start text-[9px] text-[#1e3a8a]">P{slot + 1}</span>
                                            <span className="font-press-start text-[10px] uppercase">{p.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="text-sm text-gray-700 text-center mb-5 leading-relaxed">
                                Your journey awaits. The Rift does not forgive mistakes — but does reward the brave.
                            </div>
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-press-start text-[10px] uppercase tracking-wider border-b-4 border-gray-400 active:translate-y-0.5 active:border-b-2"
                                >
                                    No
                                </button>
                                <button
                                    onClick={confirmSelection}
                                    className="px-6 py-2 rounded-xl bg-gradient-to-b from-yellow-400 to-amber-500 hover:from-yellow-300 text-black font-press-start text-[10px] uppercase tracking-wider border-b-4 border-amber-800 active:translate-y-0.5 active:border-b-2"
                                >
                                    Yes!
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// -----------------------------------------------------------------------------
// Tiny helper rendered in the bottom action bar
// -----------------------------------------------------------------------------
const SlotChip: React.FC<{ label: string; pokemon?: Pokemon }> = ({ label, pokemon }) => {
    if (!pokemon) {
        return (
            <div className="flex items-center gap-2 bg-gray-100 border-2 border-dashed border-gray-400 rounded-xl px-3 py-2">
                <span className="font-press-start text-[9px] text-gray-500">{label}</span>
                <span className="text-[10px] text-gray-500 font-press-start uppercase">Empty</span>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-2 bg-[#3c5aa6] text-white border-2 border-[#1e3a8a] rounded-xl px-3 py-1.5">
            <span className="font-press-start text-[9px] text-yellow-200">{label}</span>
            <div className="w-8 h-8 flex items-center justify-center">
                <PokemonSprite pokemon={pokemon} variant="menu" className="w-8 h-8" />
            </div>
            <span className="font-press-start text-[9px] uppercase whitespace-nowrap">{pokemon.name}</span>
        </div>
    );
};
