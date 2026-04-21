import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Pokemon, PlayerGlobalState } from '../../types';
import { ITEMS } from '../../services/itemData';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { playCry, playEvolutionPulse, playEvolutionComplete } from '../../services/soundService';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface TradeItemOffer {
    id: string;
    qty: number;
    /**
     * true  -> stackable counter in playerState.inventory (pokeballs/potions/
     *          revives/rare_candy). qty can be >1.
     * false -> unique string in playerState.inventory.items[]. qty is always 1.
     */
    stackable: boolean;
    name: string;
    icon: string;
}

export interface TradeOffer {
    pokemon: Pokemon | null;
    /** Index in the sender's team (only meaningful on the sender side). */
    pokemonTeamIndex?: number;
    items: TradeItemOffer[];
    locked: boolean;
    /** Final "execute" confirmation. Only valid once locked. */
    confirmed: boolean;
}

export interface TradeSession {
    partnerId: string;
    partnerName: string;
    myOffer: TradeOffer;
    partnerOffer: TradeOffer;
    /** choose = freely editing; committing = cinematic running; done = handed back. */
    phase: 'choose' | 'committing' | 'done';
}

export const makeEmptyOffer = (): TradeOffer => ({
    pokemon: null,
    pokemonTeamIndex: undefined,
    items: [],
    locked: false,
    confirmed: false,
});

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const MAX_ITEMS_PER_SIDE = 3;

/** Build the pool of tradable items from a player's inventory. */
const buildItemPool = (state: PlayerGlobalState): TradeItemOffer[] => {
    const pool: TradeItemOffer[] = [];
    const inv = state.inventory;

    const stackable: Array<[string, number]> = [
        ['poke-ball', inv.pokeballs],
        ['potion', inv.potions],
        ['revive', inv.revives],
        ['rare-candy', inv.rare_candy],
    ];
    for (const [id, qty] of stackable) {
        if (qty > 0) {
            const meta = ITEMS[id];
            pool.push({
                id,
                qty,
                stackable: true,
                name: meta?.name ?? id,
                icon: meta?.icon ?? '',
            });
        }
    }

    // Unique items (each string is a single instance)
    const counts = new Map<string, number>();
    for (const s of inv.items) counts.set(s, (counts.get(s) ?? 0) + 1);
    counts.forEach((qty, id) => {
        const meta = ITEMS[id];
        pool.push({
            id,
            qty,
            stackable: false,
            name: meta?.name ?? id,
            icon: meta?.icon ?? 'https://play.pokemonshowdown.com/sprites/itemicons/poke-ball.png',
        });
    });
    return pool;
};

/** How many of itemId are already queued in an offer. */
const queuedQty = (offer: TradeOffer, itemId: string): number =>
    offer.items.filter(i => i.id === itemId).reduce((s, i) => s + i.qty, 0);

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

const OfferPanel: React.FC<{
    side: 'me' | 'partner';
    name: string;
    offer: TradeOffer;
    onClearPokemon?: () => void;
    onRemoveItem?: (index: number) => void;
}> = ({ side, name, offer, onClearPokemon, onRemoveItem }) => {
    const title = side === 'me' ? `YOUR OFFER` : `${name.toUpperCase()}`;
    const accent = side === 'me' ? 'border-blue-400' : 'border-pink-400';
    const bg = side === 'me' ? 'from-blue-950/80 to-indigo-950/80' : 'from-pink-950/80 to-fuchsia-950/80';

    return (
        <div className={`flex-1 bg-gradient-to-b ${bg} border-4 ${accent} rounded-lg p-3 flex flex-col`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className={`text-[9px] uppercase tracking-widest font-bold ${side === 'me' ? 'text-blue-300' : 'text-pink-300'}`}>
                    {title}
                </h3>
                {offer.locked && (
                    <span className="px-2 py-0.5 bg-green-700 border border-green-300 text-green-100 text-[6px] uppercase tracking-widest rounded animate-pulse">
                        Locked
                    </span>
                )}
            </div>

            {/* Pokemon slot */}
            <div className="relative aspect-square bg-black/50 border-2 border-white/10 rounded flex items-center justify-center mb-2 overflow-hidden">
                {offer.pokemon ? (
                    <>
                        <img
                            src={offer.pokemon.sprites.front_default}
                            alt={offer.pokemon.name}
                            className="w-28 h-28 object-contain"
                            style={{ imageRendering: 'pixelated' }}
                        />
                        <div className="absolute bottom-1 left-1 right-1 text-center">
                            <div className="text-[9px] text-white uppercase tracking-wide font-bold truncate">
                                {offer.pokemon.name}
                            </div>
                            <div className="text-[7px] text-yellow-300 uppercase">Lv {offer.pokemon.level}</div>
                        </div>
                        {side === 'me' && !offer.locked && onClearPokemon && (
                            <button
                                onClick={onClearPokemon}
                                className="absolute top-1 right-1 w-5 h-5 bg-red-700 hover:bg-red-500 border border-red-300 rounded text-white text-[9px] leading-none flex items-center justify-center"
                                title="Remove from offer"
                            >
                                ×
                            </button>
                        )}
                        {offer.pokemon.isShiny && (
                            <div className="absolute top-1 left-1 text-yellow-300 text-sm drop-shadow">★</div>
                        )}
                    </>
                ) : (
                    <div className="text-[8px] text-gray-500 uppercase tracking-widest">
                        {side === 'me' ? 'Pick a Pokemon ↓' : 'Waiting...'}
                    </div>
                )}
            </div>

            {/* Items row */}
            <div className="grid grid-cols-3 gap-1 mb-2">
                {Array.from({ length: MAX_ITEMS_PER_SIDE }).map((_, i) => {
                    const item = offer.items[i];
                    return (
                        <div
                            key={i}
                            className="relative aspect-square bg-black/50 border border-white/10 rounded flex items-center justify-center"
                        >
                            {item ? (
                                <>
                                    {item.icon && (
                                        <img
                                            src={item.icon}
                                            alt={item.name}
                                            className="w-10 h-10 object-contain"
                                            style={{ imageRendering: 'pixelated' }}
                                        />
                                    )}
                                    {item.qty > 1 && (
                                        <div className="absolute bottom-0 right-0 bg-black/80 text-yellow-300 text-[7px] px-1 rounded-tl">
                                            ×{item.qty}
                                        </div>
                                    )}
                                    {side === 'me' && !offer.locked && onRemoveItem && (
                                        <button
                                            onClick={() => onRemoveItem(i)}
                                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-700 hover:bg-red-500 border border-red-300 rounded text-white text-[8px] leading-none flex items-center justify-center"
                                        >
                                            ×
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="text-[7px] text-gray-600 uppercase">—</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*  Cinematic overlay                                                          */
/* -------------------------------------------------------------------------- */

const TradeCinematic: React.FC<{
    fromMe: Pokemon | null;
    fromPartner: Pokemon | null;
    onDone: () => void;
}> = ({ fromMe, fromPartner, onDone }) => {
    const [stage, setStage] = useState<'send' | 'swap' | 'reveal' | 'done'>('send');

    useEffect(() => {
        const t1 = window.setTimeout(() => { setStage('swap'); playEvolutionPulse(); }, 700);
        const t2 = window.setTimeout(() => { setStage('reveal'); playEvolutionComplete(); }, 2400);
        const t3 = window.setTimeout(() => {
            setStage('done');
            if (fromPartner) playCry(fromPartner.id, fromPartner.name);
        }, 2900);
        const t4 = window.setTimeout(() => onDone(), 5200);
        return () => { [t1, t2, t3, t4].forEach(clearTimeout); };
    }, [fromPartner, onDone]);

    return (
        <div className="fixed inset-0 z-[210] bg-black flex items-center justify-center overflow-hidden font-press-start">
            {/* Star-field */}
            <div className="absolute inset-0 opacity-80">
                {Array.from({ length: 70 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-[2px] h-[2px] bg-white rounded-full"
                        style={{
                            left: `${(i * 37) % 100}%`,
                            top: `${(i * 53) % 100}%`,
                            animation: `twinkle ${1.5 + (i % 5) * 0.3}s ease-in-out infinite`,
                            animationDelay: `${(i % 7) * 0.15}s`,
                        }}
                    />
                ))}
            </div>
            <style>{`
                @keyframes twinkle { 0%,100%{opacity:.2} 50%{opacity:1} }
            `}</style>

            {/* Left ball (me -> partner) */}
            <motion.div
                className="absolute"
                initial={{ left: '15%', top: '50%', scale: 1, rotate: 0 }}
                animate={
                    stage === 'send'
                        ? { left: '15%', top: '50%', scale: 1, rotate: 0 }
                        : stage === 'swap'
                        ? { left: '85%', top: '50%', scale: 1.1, rotate: 720 }
                        : { left: '85%', top: '50%', scale: 0, rotate: 720 }
                }
                transition={{ duration: 1.6, ease: 'easeInOut' }}
                style={{ transform: 'translate(-50%, -50%)' }}
            >
                <div className="relative">
                    <img
                        src="https://play.pokemonshowdown.com/sprites/itemicons/poke-ball.png"
                        alt="trade"
                        className="w-16 h-16 drop-shadow-[0_0_12px_rgba(96,165,250,0.8)]"
                        style={{ imageRendering: 'pixelated' }}
                    />
                    {fromMe && stage === 'send' && (
                        <div className="absolute -top-24 left-1/2 -translate-x-1/2 text-[8px] uppercase text-blue-300 whitespace-nowrap tracking-widest">
                            {fromMe.name}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Right ball (partner -> me) */}
            <motion.div
                className="absolute"
                initial={{ left: '85%', top: '50%', scale: 1, rotate: 0 }}
                animate={
                    stage === 'send'
                        ? { left: '85%', top: '50%', scale: 1, rotate: 0 }
                        : stage === 'swap'
                        ? { left: '15%', top: '50%', scale: 1.1, rotate: -720 }
                        : { left: '15%', top: '50%', scale: 0, rotate: -720 }
                }
                transition={{ duration: 1.6, ease: 'easeInOut' }}
                style={{ transform: 'translate(-50%, -50%)' }}
            >
                <div className="relative">
                    <img
                        src="https://play.pokemonshowdown.com/sprites/itemicons/poke-ball.png"
                        alt="trade"
                        className="w-16 h-16 drop-shadow-[0_0_12px_rgba(244,114,182,0.8)]"
                        style={{ imageRendering: 'pixelated' }}
                    />
                    {fromPartner && stage === 'send' && (
                        <div className="absolute -top-24 left-1/2 -translate-x-1/2 text-[8px] uppercase text-pink-300 whitespace-nowrap tracking-widest">
                            {fromPartner.name}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Reveal: partner's pokemon pops out on our side */}
            <AnimatePresence>
                {(stage === 'reveal' || stage === 'done') && fromPartner && (
                    <motion.div
                        className="absolute left-1/2 top-1/2"
                        initial={{ scale: 0, opacity: 0, y: 0 }}
                        animate={{ scale: 1, opacity: 1, y: -20 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: 'backOut' }}
                        style={{ transform: 'translate(-50%, -50%)' }}
                    >
                        <div className="flex flex-col items-center">
                            <img
                                src={fromPartner.sprites.front_default}
                                alt={fromPartner.name}
                                className="w-40 h-40 object-contain drop-shadow-[0_0_24px_rgba(255,255,255,0.9)]"
                                style={{ imageRendering: 'pixelated' }}
                            />
                            <div className="mt-3 text-yellow-300 text-sm uppercase tracking-widest">
                                {fromPartner.name}
                            </div>
                            {stage === 'done' && (
                                <div className="mt-2 text-[9px] text-white uppercase tracking-widest">
                                    Welcome home!
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top banner */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center">
                <div className="text-[10px] uppercase tracking-[.4em] text-gray-400">Trading</div>
                <div className="text-yellow-300 text-lg uppercase tracking-widest mt-1">
                    {stage === 'send' && 'Releasing...'}
                    {stage === 'swap' && '• • •'}
                    {stage === 'reveal' && 'Take care of them!'}
                    {stage === 'done' && 'Trade complete!'}
                </div>
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*  Main screen                                                                */
/* -------------------------------------------------------------------------- */

interface Props {
    session: TradeSession;
    state: PlayerGlobalState;
    /** Fires whenever MY offer changes; parent forwards to partner. */
    onOfferChange: (offer: TradeOffer) => void;
    /** Cancel trade entirely. Parent tears down session + notifies partner. */
    onCancel: () => void;
    /** Called once both sides confirmed + cinematic finished. Commits atomically. */
    onCommit: () => void;
}

export const TradeScreen: React.FC<Props> = ({ session, state, onOfferChange, onCancel, onCommit }) => {
    const { myOffer, partnerOffer, phase, partnerName } = session;
    const [tab, setTab] = useState<'party' | 'items'>('party');
    const committedOnce = useRef(false);

    useEscapeKey(() => {
        if (!myOffer.locked) onCancel();
    }, phase === 'choose');

    const itemPool = useMemo(() => buildItemPool(state), [state]);

    // When BOTH sides are confirmed, play cinematic then commit.
    useEffect(() => {
        if (phase === 'committing' && !committedOnce.current) {
            committedOnce.current = true;
            // The cinematic fires onDone, which calls onCommit.
        }
    }, [phase]);

    const bothLocked = myOffer.locked && partnerOffer.locked;
    const bothConfirmed = myOffer.confirmed && partnerOffer.confirmed;
    const atLeastOneOffered = !!myOffer.pokemon || myOffer.items.length > 0;
    const atLeastOneIncoming = !!partnerOffer.pokemon || partnerOffer.items.length > 0;
    // Safety: don't let the player offer their last Pokemon unless partner offers a pokemon back.
    const wouldLeaveTeamEmpty =
        !!myOffer.pokemon &&
        state.team.filter(m => !m.isFainted).length - (!myOffer.pokemon.isFainted ? 1 : 0) <= 0 &&
        !partnerOffer.pokemon;

    const addPokemon = (idx: number) => {
        if (myOffer.locked) return;
        const mon = state.team[idx];
        if (!mon) return;
        onOfferChange({ ...myOffer, pokemon: mon, pokemonTeamIndex: idx });
    };
    const clearPokemon = () => {
        if (myOffer.locked) return;
        onOfferChange({ ...myOffer, pokemon: null, pokemonTeamIndex: undefined });
    };

    const addItem = (item: TradeItemOffer) => {
        if (myOffer.locked) return;
        if (myOffer.items.length >= MAX_ITEMS_PER_SIDE) return;
        const owned = itemPool.find(p => p.id === item.id)?.qty ?? 0;
        const already = queuedQty(myOffer, item.id);
        if (already >= owned) return;

        // Stack with an existing entry if possible; else add a new slot.
        const existingIdx = myOffer.items.findIndex(i => i.id === item.id);
        let nextItems: TradeItemOffer[];
        if (item.stackable && existingIdx >= 0) {
            nextItems = myOffer.items.map((it, i) => i === existingIdx ? { ...it, qty: it.qty + 1 } : it);
        } else {
            nextItems = [...myOffer.items, { ...item, qty: 1 }];
        }
        onOfferChange({ ...myOffer, items: nextItems });
    };

    const removeItem = (slotIdx: number) => {
        if (myOffer.locked) return;
        const item = myOffer.items[slotIdx];
        if (!item) return;
        let nextItems: TradeItemOffer[];
        if (item.stackable && item.qty > 1) {
            nextItems = myOffer.items.map((it, i) => i === slotIdx ? { ...it, qty: it.qty - 1 } : it);
        } else {
            nextItems = myOffer.items.filter((_, i) => i !== slotIdx);
        }
        onOfferChange({ ...myOffer, items: nextItems });
    };

    const toggleLock = () => {
        if (wouldLeaveTeamEmpty && !myOffer.locked) return;
        onOfferChange({ ...myOffer, locked: !myOffer.locked, confirmed: false });
    };

    const toggleConfirm = () => {
        if (!bothLocked) return;
        onOfferChange({ ...myOffer, confirmed: !myOffer.confirmed });
    };

    /* ---------- Cinematic branch ---------- */
    if (phase === 'committing') {
        return (
            <TradeCinematic
                fromMe={myOffer.pokemon}
                fromPartner={partnerOffer.pokemon}
                onDone={onCommit}
            />
        );
    }

    /* ---------- Main UI ---------- */
    return (
        <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4 font-press-start">
            <div className="w-full max-w-5xl max-h-[95vh] bg-gradient-to-b from-gray-900 to-black border-4 border-yellow-400 rounded-lg p-4 flex flex-col text-white">
                {/* Title */}
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="text-[8px] uppercase tracking-[.4em] text-gray-500">Global Trade</div>
                        <h2 className="text-yellow-300 text-sm uppercase tracking-widest">
                            Trading with {partnerName}
                        </h2>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={myOffer.locked}
                        className="px-3 py-1.5 bg-red-700 hover:bg-red-500 disabled:bg-gray-700 disabled:opacity-50 border border-red-300 text-white text-[8px] uppercase tracking-widest rounded"
                    >
                        {myOffer.locked ? 'Locked' : 'Cancel'}
                    </button>
                </div>

                {/* Offer panels */}
                <div className="flex gap-3 items-stretch mb-3 relative">
                    <OfferPanel
                        side="me"
                        name="YOU"
                        offer={myOffer}
                        onClearPokemon={clearPokemon}
                        onRemoveItem={removeItem}
                    />
                    <div className="flex items-center justify-center px-2">
                        <div className="text-3xl text-yellow-400 animate-pulse select-none">⇆</div>
                    </div>
                    <OfferPanel
                        side="partner"
                        name={partnerName}
                        offer={partnerOffer}
                    />
                </div>

                {/* Status strip */}
                <div className="grid grid-cols-2 gap-3 mb-3 text-[8px] uppercase tracking-widest">
                    <div className={`p-2 rounded border text-center ${myOffer.locked ? 'bg-green-900/50 border-green-400 text-green-200' : 'bg-gray-800/50 border-gray-600 text-gray-400'}`}>
                        You: {myOffer.locked ? (myOffer.confirmed ? 'CONFIRMED ✓' : 'LOCKED') : 'Editing...'}
                    </div>
                    <div className={`p-2 rounded border text-center ${partnerOffer.locked ? 'bg-green-900/50 border-green-400 text-green-200' : 'bg-gray-800/50 border-gray-600 text-gray-400'}`}>
                        {partnerName}: {partnerOffer.locked ? (partnerOffer.confirmed ? 'CONFIRMED ✓' : 'LOCKED') : 'Editing...'}
                    </div>
                </div>

                {wouldLeaveTeamEmpty && (
                    <div className="mb-2 p-2 bg-red-900/40 border border-red-400 text-red-200 text-[8px] uppercase tracking-wider text-center rounded">
                        ⚠ You can't trade away your last healthy Pokemon unless your partner offers one back.
                    </div>
                )}

                {/* Action row */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <button
                        onClick={toggleLock}
                        disabled={!atLeastOneOffered && !atLeastOneIncoming && !myOffer.locked}
                        className={`py-2 border text-[9px] uppercase font-bold tracking-widest rounded transition ${
                            myOffer.locked
                                ? 'bg-yellow-700 hover:bg-yellow-600 border-yellow-300 text-yellow-100'
                                : 'bg-blue-700 hover:bg-blue-600 border-blue-300 text-white disabled:bg-gray-700 disabled:opacity-50'
                        }`}
                    >
                        {myOffer.locked ? 'Unlock Offer' : 'Lock In Offer'}
                    </button>
                    <button
                        onClick={toggleConfirm}
                        disabled={!bothLocked}
                        className={`py-2 border text-[9px] uppercase font-bold tracking-widest rounded transition ${
                            myOffer.confirmed
                                ? 'bg-purple-700 hover:bg-purple-600 border-purple-300 text-purple-100 animate-pulse'
                                : 'bg-green-700 hover:bg-green-600 border-green-300 text-white disabled:bg-gray-700 disabled:opacity-50'
                        }`}
                    >
                        {myOffer.confirmed
                            ? 'Waiting for partner...'
                            : bothConfirmed
                            ? 'Starting trade...'
                            : bothLocked
                            ? 'Confirm Trade'
                            : 'Both must lock'}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-2">
                    <button
                        onClick={() => setTab('party')}
                        className={`flex-1 py-1.5 text-[8px] uppercase tracking-widest rounded-t ${tab === 'party' ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-400'}`}
                    >
                        Your Party
                    </button>
                    <button
                        onClick={() => setTab('items')}
                        className={`flex-1 py-1.5 text-[8px] uppercase tracking-widest rounded-t ${tab === 'items' ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-400'}`}
                    >
                        Your Bag
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-black/40 border border-white/10 rounded p-2 custom-scrollbar min-h-[120px]">
                    {tab === 'party' ? (
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {state.team.map((p, i) => {
                                const selected = myOffer.pokemonTeamIndex === i;
                                const disabled = myOffer.locked || (p.isFainted && state.team.filter(m => !m.isFainted).length <= 1);
                                return (
                                    <button
                                        key={i}
                                        onClick={() => addPokemon(i)}
                                        disabled={disabled}
                                        className={`relative aspect-square rounded border-2 flex flex-col items-center justify-center p-1 transition ${
                                            selected
                                                ? 'bg-blue-900/60 border-yellow-400 scale-105'
                                                : 'bg-gray-800/60 border-white/10 hover:border-blue-400 hover:bg-blue-950/40'
                                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                                    >
                                        <img
                                            src={p.sprites.front_default}
                                            alt={p.name}
                                            className="w-14 h-14 object-contain"
                                            style={{ imageRendering: 'pixelated' }}
                                        />
                                        <div className="text-[7px] uppercase tracking-wide truncate w-full text-center">{p.name}</div>
                                        <div className="text-[6px] text-yellow-300">Lv {p.level}</div>
                                        {p.isShiny && <div className="absolute top-0.5 left-0.5 text-yellow-300 text-xs">★</div>}
                                        {p.isFainted && <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center text-[7px] text-red-200 uppercase">Fainted</div>}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {itemPool.length === 0 && (
                                <div className="col-span-full text-center text-[8px] text-gray-500 uppercase py-4">
                                    No tradable items in your bag.
                                </div>
                            )}
                            {itemPool.map((item, i) => {
                                const used = queuedQty(myOffer, item.id);
                                const remaining = item.qty - used;
                                const disabled = myOffer.locked || remaining <= 0 || myOffer.items.length >= MAX_ITEMS_PER_SIDE;
                                return (
                                    <button
                                        key={`${item.id}_${i}`}
                                        onClick={() => addItem(item)}
                                        disabled={disabled}
                                        className="relative bg-gray-800/60 border border-white/10 hover:border-green-400 hover:bg-green-950/40 p-2 rounded flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-left"
                                    >
                                        {item.icon && (
                                            <img
                                                src={item.icon}
                                                alt={item.name}
                                                className="w-8 h-8 object-contain flex-shrink-0"
                                                style={{ imageRendering: 'pixelated' }}
                                            />
                                        )}
                                        <div className="min-w-0">
                                            <div className="text-[8px] uppercase truncate text-white">{item.name}</div>
                                            <div className="text-[7px] text-gray-400">
                                                {remaining}/{item.qty} left
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="mt-2 text-center text-[7px] text-gray-500 uppercase tracking-widest">
                    Tap to add → lock in → both confirm to trade • Press Esc to cancel
                </div>
            </div>
        </div>
    );
};
