import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BattleState, WeatherType, TerrainType } from '../../types';

/* =============================================================================
 * BattleFieldHud
 * =============================================================================
 * Renders the persistent battle-field state as compact chips, plus a couple
 * of ambient full-field overlays. Before this component existed every field
 * effect (Tailwind, Reflect, Trick Room, weather, terrain, hazards, etc.)
 * was only surfaced as a one-off line in the scrolling battle log -- which
 * is essentially invisible to the player once a few moves go by.
 *
 * Layout (within the absolute-positioned arena container):
 *   - Top center : GLOBAL chips (weather, terrain, trick room, gravity, fog)
 *   - Top left   : ENEMY-side chips (their tailwind, screens, hazards on their side)
 *   - Bottom right: PLAYER-side chips (your tailwind, screens, hazards on your side)
 *
 * Chips animate in/out on state change so a freshly summoned weather flashes,
 * then settles into a persistent badge. Turn counters update each end-of-turn
 * tick and the chip pulses red on its final turn so the player knows it's
 * about to drop.
 *
 * Ambient overlays (separate from chips):
 *   - Trick Room : pulsing inverted-purple grid behind sprites
 *   - Tailwind   : drifting wind streaks on whichever side has it active
 *   - Gravity    : subtle downward arrow pattern
 *   - Aurora Veil: prismatic shimmer on that side's lower half
 *
 * All overlays are pointer-events-none and z-indexed below the action panel
 * so they never block input.
 * ========================================================================== */

interface Props {
    bs: BattleState;
}

type ChipColor =
    | 'sun' | 'rain' | 'sand' | 'hail' | 'snow' | 'electric' | 'ash' | 'grass'
    | 'electricTerrain' | 'grassyTerrain' | 'mistyTerrain' | 'psychicTerrain'
    | 'trickRoom' | 'gravity' | 'fog'
    | 'tailwind' | 'reflect' | 'lightScreen' | 'auroraVeil'
    | 'aegis' | 'rune' | 'wish'
    | 'spikes' | 'rocks' | 'web' | 'toxic';

interface Chip {
    id: string;
    label: string;
    icon: string;
    turns?: number;
    color: ChipColor;
    /** Show the chip differently if it's about to expire (turns === 1). */
    expiring?: boolean;
    /** Optional richer tooltip override -- used by hazards to clarify
     *  which side they sit on and what they do, since the chip itself
     *  is short for space reasons. */
    tooltip?: string;
}

const CHIP_PALETTE: Record<ChipColor, { bg: string; border: string; text: string }> = {
    sun:              { bg: 'bg-gradient-to-r from-orange-500 to-amber-500',     border: 'border-amber-300/70',  text: 'text-white' },
    rain:             { bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',      border: 'border-blue-300/70',   text: 'text-white' },
    sand:             { bg: 'bg-gradient-to-r from-amber-700 to-yellow-700',     border: 'border-amber-400/70',  text: 'text-white' },
    hail:             { bg: 'bg-gradient-to-r from-cyan-300 to-blue-500',        border: 'border-cyan-200/70',   text: 'text-slate-900' },
    snow:             { bg: 'bg-gradient-to-r from-sky-200 to-indigo-300',       border: 'border-sky-100/80',    text: 'text-slate-900' },
    electric:         { bg: 'bg-gradient-to-r from-yellow-400 to-amber-500',     border: 'border-yellow-200/80', text: 'text-slate-900' },
    ash:              { bg: 'bg-gradient-to-r from-stone-700 to-zinc-700',       border: 'border-stone-400/60',  text: 'text-amber-100' },
    grass:            { bg: 'bg-gradient-to-r from-lime-500 to-emerald-500',     border: 'border-lime-200/70',   text: 'text-slate-900' },
    electricTerrain:  { bg: 'bg-gradient-to-r from-yellow-300 to-amber-400',     border: 'border-yellow-200/80', text: 'text-slate-900' },
    grassyTerrain:    { bg: 'bg-gradient-to-r from-emerald-400 to-green-500',    border: 'border-emerald-200/80',text: 'text-slate-900' },
    mistyTerrain:     { bg: 'bg-gradient-to-r from-pink-300 to-rose-300',        border: 'border-pink-200/80',   text: 'text-slate-900' },
    psychicTerrain:   { bg: 'bg-gradient-to-r from-fuchsia-500 to-purple-500',   border: 'border-fuchsia-300/70',text: 'text-white' },
    trickRoom:        { bg: 'bg-gradient-to-r from-purple-700 to-violet-700',    border: 'border-purple-300/70', text: 'text-white' },
    gravity:          { bg: 'bg-gradient-to-r from-slate-600 to-zinc-700',       border: 'border-slate-300/60',  text: 'text-white' },
    fog:              { bg: 'bg-gradient-to-r from-violet-500 to-fuchsia-600',   border: 'border-violet-200/80', text: 'text-white' },
    tailwind:         { bg: 'bg-gradient-to-r from-teal-400 to-cyan-400',        border: 'border-teal-100/80',   text: 'text-slate-900' },
    reflect:          { bg: 'bg-gradient-to-r from-amber-400 to-orange-400',     border: 'border-amber-200/80',  text: 'text-slate-900' },
    lightScreen:      { bg: 'bg-gradient-to-r from-pink-400 to-rose-400',        border: 'border-pink-200/80',   text: 'text-white' },
    auroraVeil:       { bg: 'bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-300', border: 'border-white/80', text: 'text-slate-900' },
    aegis:            { bg: 'bg-gradient-to-r from-sky-500 to-indigo-600',       border: 'border-sky-200/80',    text: 'text-white' },
    rune:             { bg: 'bg-gradient-to-r from-violet-600 to-indigo-700',    border: 'border-violet-200/80', text: 'text-white' },
    wish:             { bg: 'bg-gradient-to-r from-emerald-400 to-green-500',    border: 'border-emerald-200/80',text: 'text-slate-900' },
    spikes:           { bg: 'bg-gradient-to-r from-stone-600 to-stone-800',      border: 'border-stone-300/60',  text: 'text-white' },
    rocks:            { bg: 'bg-gradient-to-r from-stone-700 to-amber-900',      border: 'border-amber-300/60',  text: 'text-white' },
    web:              { bg: 'bg-gradient-to-r from-slate-500 to-slate-700',      border: 'border-slate-200/70',  text: 'text-white' },
    toxic:            { bg: 'bg-gradient-to-r from-purple-600 to-fuchsia-700',   border: 'border-purple-200/70', text: 'text-white' },
};

// --- Glyph helpers ----------------------------------------------------------
// We use raw Unicode so we don't have to ship icon assets. These render
// crisply at 12-14px and feel game-y enough next to the gradient pills.
const G = {
    sun: '\u2600',           // ☀
    rain: '\u2602',          // ☂
    sand: '\u29CB',          // ⧋ (sand-ish)
    hail: '\u2744',          // ❄
    snow: '\u2746',          // ❆
    bolt: '\u26A1',          // ⚡
    leaf: '\u2698',          // ⚘
    cloud: '\u2601',         // ☁
    flower: '\u273F',        // ✿
    brain: '\u269B',         // ⚛ (proxy for psychic)
    spiral: '\u29D1',        // ⧑ (proxy for trick room) -- fallback shows neatly
    weight: '\u26B2',        // ⚲ (gravity-ish)
    fog: '\u2638',           // ☸
    wind: '\u27A4',          // ➤ (used as wind streak)
    shield: '\u26E8',        // ⛨
    sparkle: '\u2728',       // ✨
    rainbow: '\u2604',       // ☄ proxy
    aegis: '\u2693',         // ⚓ proxy
    rune: '\u2625',          // ☥ rune-ish
    star: '\u2605',          // ★ (wish)
    spike: '\u26A0',         // ⚠ (spikes proxy)
    rock: '\u25C6',          // ◆
    web: '\u2638',           // ☸ (web proxy)
    skull: '\u2620',         // ☠
};

const weatherChip = (w: WeatherType, turns?: number): Chip | null => {
    if (!w || w === 'none') return null;
    const t = turns;
    const exp = t === 1;
    switch (w) {
        case 'sun':      return { id: 'wx', label: 'Sun',     icon: G.sun,    turns: t, color: 'sun', expiring: exp };
        case 'rain':     return { id: 'wx', label: 'Rain',    icon: G.rain,   turns: t, color: 'rain', expiring: exp };
        case 'sand':     return { id: 'wx', label: 'Sand',    icon: G.sand,   turns: t, color: 'sand', expiring: exp };
        case 'hail':     return { id: 'wx', label: 'Hail',    icon: G.hail,   turns: t, color: 'hail', expiring: exp };
        case 'snow':     return { id: 'wx', label: 'Snow',    icon: G.snow,   turns: t, color: 'snow', expiring: exp };
        case 'electric': return { id: 'wx', label: 'Squall',  icon: G.bolt,   turns: t, color: 'electric', expiring: exp };
        case 'ashstorm': return { id: 'wx', label: 'Ashstorm',icon: G.cloud,  turns: t, color: 'ash', expiring: exp };
        case 'grass':    return { id: 'wx', label: 'Bloom',   icon: G.flower, turns: t, color: 'grass', expiring: exp };
        default: return null;
    }
};

const terrainChip = (t: TerrainType, turns?: number): Chip | null => {
    if (!t || t === 'none') return null;
    const exp = turns === 1;
    switch (t) {
        case 'electric': return { id: 'tr', label: 'Electric Terrain', icon: G.bolt,   turns, color: 'electricTerrain', expiring: exp };
        case 'grassy':   return { id: 'tr', label: 'Grassy Terrain',   icon: G.leaf,   turns, color: 'grassyTerrain', expiring: exp };
        case 'misty':    return { id: 'tr', label: 'Misty Terrain',    icon: G.cloud,  turns, color: 'mistyTerrain', expiring: exp };
        case 'psychic':  return { id: 'tr', label: 'Psychic Terrain',  icon: G.brain,  turns, color: 'psychicTerrain', expiring: exp };
        default: return null;
    }
};

// Hazards always render (no turn counter -- they persist until cleared by a
// move like Defog/Rapid Spin). We collapse Spikes/Toxic Spikes counts into
// a stack indicator since Pokemon's mechanics layer them up to 3/2 deep.
//
// `victim` controls the tooltip wording so the player can read "this is on
// my side -- it hits MY switch-ins" vs "this is on the foe's side". The
// chip's column position already implies the side, but spelling it out in
// the tooltip removes ambiguity about who set vs. who suffers.
const hazardChips = (hazards: string[] | undefined, victim: 'you' | 'foe'): Chip[] => {
    const out: Chip[] = [];
    if (!hazards || hazards.length === 0) return out;
    const spikes = hazards.filter(h => h === 'Spikes').length;
    const tspikes = hazards.filter(h => h === 'Toxic Spikes').length;
    const sr = hazards.includes('Stealth Rock');
    const web = hazards.includes('Sticky Web');
    const who = victim === 'you' ? 'YOUR side' : 'the FOE side';
    const verb = victim === 'you' ? 'your' : 'their';
    if (sr) out.push({
        id: 'hz-sr', label: 'Stealth Rock', icon: G.rock, color: 'rocks',
        tooltip: `Stealth Rock on ${who} -- damages ${verb} Pokemon on switch-in (more vs Rock-weak types).`,
    });
    if (spikes > 0) out.push({
        id: 'hz-sp',
        label: spikes > 1 ? `Spikes ×${spikes}` : 'Spikes',
        icon: G.spike, color: 'spikes',
        tooltip: `${spikes} layer${spikes === 1 ? '' : 's'} of Spikes on ${who} -- chip damage on each grounded switch-in.`,
    });
    if (tspikes > 0) out.push({
        id: 'hz-tsp',
        label: tspikes > 1 ? `Toxic Spikes ×${tspikes}` : 'Toxic Spikes',
        icon: G.skull, color: 'toxic',
        tooltip: `${tspikes} layer${tspikes === 1 ? '' : 's'} of Toxic Spikes on ${who} -- ${tspikes > 1 ? 'badly poisons' : 'poisons'} grounded switch-ins.`,
    });
    if (web) out.push({
        id: 'hz-wb', label: 'Sticky Web', icon: G.web, color: 'web',
        tooltip: `Sticky Web on ${who} -- drops the Speed of grounded switch-ins by one stage.`,
    });
    return out;
};

const sideChips = (bs: BattleState, side: 'player' | 'enemy'): Chip[] => {
    const isP = side === 'player';
    const out: Chip[] = [];
    const tw  = isP ? bs.tailwindTurns       : bs.enemyTailwindTurns;
    const rf  = isP ? bs.reflectTurns        : bs.enemyReflectTurns;
    const ls  = isP ? bs.lightScreenTurns    : bs.enemyLightScreenTurns;
    const av  = isP ? bs.auroraVeilTurns     : bs.enemyAuroraVeilTurns;
    const ag  = isP ? bs.aegisFieldTurns     : bs.enemyAegisFieldTurns;
    const rw  = isP ? bs.runeWardTurns       : bs.enemyRuneWardTurns;
    const sq  = isP ? bs.electricSquallTurns : bs.enemyElectricSquallTurns;
    const wsh = isP ? bs.wishTurns           : bs.enemyWishTurns;
    if (tw && tw > 0)  out.push({ id: 'tw',  label: 'Tailwind',     icon: G.wind,    turns: tw,  color: 'tailwind',    expiring: tw === 1 });
    if (rf && rf > 0)  out.push({ id: 'rf',  label: 'Reflect',      icon: G.shield,  turns: rf,  color: 'reflect',     expiring: rf === 1 });
    if (ls && ls > 0)  out.push({ id: 'ls',  label: 'Light Screen', icon: G.sparkle, turns: ls,  color: 'lightScreen', expiring: ls === 1 });
    if (av && av > 0)  out.push({ id: 'av',  label: 'Aurora Veil',  icon: G.rainbow, turns: av,  color: 'auroraVeil',  expiring: av === 1 });
    if (ag && ag > 0)  out.push({ id: 'ag',  label: 'Aegis Field',  icon: G.aegis,   turns: ag,  color: 'aegis',       expiring: ag === 1 });
    if (rw && rw > 0)  out.push({ id: 'rw',  label: 'Rune Ward',    icon: G.rune,    turns: rw,  color: 'rune',        expiring: rw === 1 });
    if (sq && sq > 0)  out.push({ id: 'sq',  label: 'Electric Squall', icon: G.bolt, turns: sq,  color: 'electric',    expiring: sq === 1 });
    if (wsh && wsh > 0) out.push({ id: 'wsh', label: 'Wish',         icon: G.star,   turns: wsh, color: 'wish',        expiring: wsh === 1 });
    return [...out, ...hazardChips(isP ? bs.playerHazards : bs.enemyHazards, isP ? 'you' : 'foe')];
};

const globalChips = (bs: BattleState): Chip[] => {
    const out: Chip[] = [];
    const wc = weatherChip(bs.weather, bs.weatherTurns);
    if (wc) out.push(wc);
    const tc = terrainChip(bs.terrain, bs.terrainTurns);
    if (tc) out.push(tc);
    if (bs.trickRoomTurns && bs.trickRoomTurns > 0) {
        out.push({ id: 'trk', label: 'Trick Room', icon: G.spiral, turns: bs.trickRoomTurns, color: 'trickRoom', expiring: bs.trickRoomTurns === 1 });
    }
    if (bs.gravityTurns && bs.gravityTurns > 0) {
        out.push({ id: 'grv', label: 'Gravity', icon: G.weight, turns: bs.gravityTurns, color: 'gravity', expiring: bs.gravityTurns === 1 });
    }
    if (bs.mysticFogActive) {
        out.push({ id: 'fog', label: 'Mystic Fog', icon: G.fog, color: 'fog' });
    }
    return out;
};

// --- Visual chip ------------------------------------------------------------
const ChipBadge: React.FC<{ chip: Chip; compact?: boolean }> = ({ chip, compact = false }) => {
    const c = CHIP_PALETTE[chip.color];
    // Prefer the rich per-chip tooltip when present; otherwise build a
    // sensible default ("Tailwind -- 3 turns left").
    const baseTip = chip.turns ? `${chip.label} -- ${chip.turns} turn${chip.turns === 1 ? '' : 's'} left` : chip.label;
    const tip = chip.tooltip ?? baseTip;
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -6, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6, filter: 'blur(2px)' }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={`flex items-center gap-1.5 ${compact ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'} rounded-full border ${c.bg} ${c.border} ${c.text} font-black uppercase tracking-wider shadow-md backdrop-blur-sm select-none ${chip.expiring ? 'animate-pulse ring-2 ring-red-400/60' : ''}`}
            title={tip}
        >
            <span aria-hidden className="text-[11px] leading-none drop-shadow">{chip.icon}</span>
            <span className="leading-none drop-shadow">{chip.label}</span>
            {typeof chip.turns === 'number' && (
                <span className="ml-1 px-1 rounded bg-black/30 text-[8px] tabular-nums font-mono">{chip.turns}T</span>
            )}
        </motion.div>
    );
};

// --- Chip strip with overflow handling --------------------------------------
// On narrow viewports a side may legitimately have 6-8 effects up at once
// (gym leaders love stacking screens + tailwind + multi-layer hazards). The
// previous implementation just wrapped, which on a sub-720px wide screen
// could double-stack the chip rows and steal vertical space from the
// battlefield. ChipStrip caps visible chips and exposes the rest behind a
// "+N" badge that toggles the full list on click/hover.
interface ChipStripProps {
    chips: Chip[];
    /** Max chips to show in collapsed state. Default 4. */
    visibleMax?: number;
    /** Justify direction of the wrapped flex row. */
    align?: 'start' | 'end' | 'center';
    /** Whether nested chips should render compact. */
    compact?: boolean;
}

const ChipStrip: React.FC<ChipStripProps> = ({ chips, visibleMax = 4, align = 'start', compact = false }) => {
    const [expanded, setExpanded] = useState(false);
    // Auto-collapse whenever the chip set shrinks below the threshold so we
    // don't strand the strip in expanded mode after Defog clears half of
    // them.
    useEffect(() => {
        if (chips.length <= visibleMax && expanded) setExpanded(false);
    }, [chips.length, visibleMax, expanded]);
    const overflow = chips.length > visibleMax;
    const visible = expanded || !overflow ? chips : chips.slice(0, visibleMax);
    const hidden = overflow ? chips.length - visibleMax : 0;
    const justify = align === 'end' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';
    return (
        <div className={`flex flex-wrap ${justify} gap-1 pointer-events-auto`}>
            <AnimatePresence>
                {visible.map(c => <ChipBadge key={`${c.id}-${c.label}`} chip={c} compact={compact} />)}
            </AnimatePresence>
            {overflow && (
                <button
                    type="button"
                    onClick={() => setExpanded(v => !v)}
                    onMouseEnter={() => setExpanded(true)}
                    className={`flex items-center gap-1 ${compact ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'} rounded-full border border-white/40 bg-black/55 text-white/90 font-black uppercase tracking-wider shadow-md backdrop-blur-sm hover:bg-black/75 transition-colors`}
                    title={expanded ? 'Hide extra effects' : `${hidden} more active effect${hidden === 1 ? '' : 's'}`}
                >
                    {expanded ? '\u2212 less' : `+${hidden} more`}
                </button>
            )}
        </div>
    );
};

// --- Ambient overlays -------------------------------------------------------
// Trick Room: a one-shot intro flash on activation, then a very subtle
// static grid in steady state. The previous version pulsed every 3.6s
// for the entire duration, which fought with VFX and animated
// backgrounds for the player's attention. Now it announces itself
// loudly the FIRST turn (banner sweep + grid flash), then fades down to
// a low-amplitude texture you can ignore unless you scan for it. The
// `firstSeen` tick gates the intro so re-mounts during HMR don't replay
// it forever.
const TrickRoomAmbient: React.FC<{ active: boolean }> = ({ active }) => {
    const wasActive = useRef(false);
    const [showIntro, setShowIntro] = useState(false);

    useEffect(() => {
        if (active && !wasActive.current) {
            setShowIntro(true);
            const t = setTimeout(() => setShowIntro(false), 1200);
            wasActive.current = true;
            return () => clearTimeout(t);
        }
        if (!active) wasActive.current = false;
    }, [active]);

    if (!active) return null;
    return (
        <>
            <div
                className="absolute inset-0 pointer-events-none z-[5]"
                style={{
                    background:
                        'repeating-linear-gradient(45deg, rgba(168,85,247,0.10) 0 2px, transparent 2px 40px),' +
                        'repeating-linear-gradient(-45deg, rgba(168,85,247,0.10) 0 2px, transparent 2px 40px)',
                    mixBlendMode: 'screen',
                    opacity: 0.55,
                }}
            />
            <AnimatePresence>
                {showIntro && (
                    <>
                        {/* Intro flash: brighter grid + radial bloom */}
                        <motion.div
                            key="tr-flash"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.9, 0] }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.0, times: [0, 0.25, 1], ease: 'easeOut' }}
                            className="absolute inset-0 pointer-events-none z-[6]"
                            style={{
                                background:
                                    'radial-gradient(circle at center, rgba(168,85,247,0.5) 0%, rgba(168,85,247,0) 60%),' +
                                    'repeating-linear-gradient(45deg, rgba(216,180,254,0.5) 0 3px, transparent 3px 30px),' +
                                    'repeating-linear-gradient(-45deg, rgba(216,180,254,0.5) 0 3px, transparent 3px 30px)',
                                mixBlendMode: 'screen',
                            }}
                        />
                        {/* Banner sweep */}
                        <motion.div
                            key="tr-banner"
                            initial={{ x: '-110%', opacity: 0 }}
                            animate={{ x: '0%', opacity: 1 }}
                            exit={{ x: '110%', opacity: 0 }}
                            transition={{ duration: 0.55, ease: 'easeOut' }}
                            className="absolute top-1/3 left-0 right-0 z-[7] pointer-events-none flex items-center justify-center"
                        >
                            <div className="px-8 py-2 bg-gradient-to-r from-purple-700 via-violet-600 to-purple-700 border-y-4 border-purple-300/80 text-white text-2xl md:text-3xl font-black tracking-[0.4em] uppercase shadow-2xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)]">
                                Trick Room
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

// Gravity: dim radial gradient pulling toward the floor. Tells the player
// "Fly/Levitate are disabled" without reading the log.
const GravityAmbient: React.FC = () => (
    <div
        className="absolute inset-0 pointer-events-none z-[5]"
        style={{
            background: 'radial-gradient(ellipse at 50% 110%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 65%)',
        }}
    />
);

// Tailwind streaks on a side. Direction is "from back to front" so on the
// player's (bottom-left) side they sweep RIGHTWARD; on the enemy's side
// they sweep LEFTWARD. Five staggered streaks per side keeps it readable
// without being noisy.
const TailwindStreaks: React.FC<{ side: 'player' | 'enemy' }> = ({ side }) => {
    const isP = side === 'player';
    const baseTop = isP ? '60%' : '8%';
    const baseHeight = '32%';
    return (
        <div
            className="absolute pointer-events-none z-[6] overflow-hidden"
            style={{
                left: 0,
                right: 0,
                top: baseTop,
                height: baseHeight,
                maskImage: isP
                    ? 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
                    : 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            }}
        >
            {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ x: isP ? '-15%' : '115%', opacity: 0 }}
                    animate={{ x: isP ? '115%' : '-15%', opacity: [0, 0.7, 0] }}
                    transition={{ duration: 1.4 + (i % 3) * 0.3, repeat: Infinity, ease: 'linear', delay: i * 0.22 }}
                    className="absolute h-[2px] bg-gradient-to-r from-transparent via-cyan-200 to-transparent rounded-full"
                    style={{ top: `${10 + i * 14}%`, width: '32%', filter: 'blur(0.4px)' }}
                />
            ))}
        </div>
    );
};

// Aurora Veil shimmer -- prismatic band that floats just below that side's HP bars.
const AuroraVeilAmbient: React.FC<{ side: 'player' | 'enemy' }> = ({ side }) => {
    const isP = side === 'player';
    return (
        <motion.div
            className="absolute pointer-events-none z-[6]"
            style={{
                left: isP ? '4%' : '40%',
                right: isP ? '40%' : '4%',
                top: isP ? '70%' : '4%',
                height: '12%',
                background:
                    'linear-gradient(90deg, rgba(180,210,255,0.0), rgba(255,170,230,0.45), rgba(180,255,210,0.45), rgba(255,230,170,0.45), rgba(180,210,255,0.0))',
                filter: 'blur(8px)',
                borderRadius: '999px',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />
    );
};

// --- Main component ---------------------------------------------------------
export const BattleFieldHud: React.FC<Props> = ({ bs }) => {
    const globals = globalChips(bs);
    const playerSide = sideChips(bs, 'player');
    const enemySide = sideChips(bs, 'enemy');

    const trickRoomOn = !!(bs.trickRoomTurns && bs.trickRoomTurns > 0);
    const gravityOn   = !!(bs.gravityTurns && bs.gravityTurns > 0);
    const playerTw    = !!(bs.tailwindTurns && bs.tailwindTurns > 0);
    const enemyTw     = !!(bs.enemyTailwindTurns && bs.enemyTailwindTurns > 0);
    const playerAv    = !!(bs.auroraVeilTurns && bs.auroraVeilTurns > 0);
    const enemyAv     = !!(bs.enemyAuroraVeilTurns && bs.enemyAuroraVeilTurns > 0);

    return (
        <>
            {/* ---------- Ambient layer ---------- */}
            <TrickRoomAmbient active={trickRoomOn} />
            {gravityOn && <GravityAmbient />}
            {playerTw && <TailwindStreaks side="player" />}
            {enemyTw && <TailwindStreaks side="enemy" />}
            {playerAv && <AuroraVeilAmbient side="player" />}
            {enemyAv && <AuroraVeilAmbient side="enemy" />}

            {/* ---------- Global chips (top center) ----------
             * Z-INDEX MAP for the battle arena:
             *    0   bg image
             *    5   ambient field overlays (TR grid, gravity vignette)
             *    6   tailwind streaks, aurora-veil shimmer, TR intro flash
             *    7   TR intro banner sweep
             *    10  enemy team / player team containers
             *    20  action panel
             *    30  THIS HUD (chips)
             *    50  battle streak chip + rift pressure chip (top-right)
             *    50  per-Pokemon move VFX
             *    100 FUSION CHARGE call-to-action button (top-32)
             *
             * Spatial layout keeps these from colliding even at 30 vs 50:
             *  - global strip is centered, capped at 56vw, so it doesn't
             *    extend into the top-right corner where streak/pressure
             *    pills live (`top-4 right-4`).
             *  - enemy side chips are top-LEFT (team is top-RIGHT).
             *  - player side chips are bottom-RIGHT (team is bottom-LEFT).
             *  - FUSION CHARGE is vertically separated (top-32) from the
             *    top-2 chip strip so they never overlap.
             */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none max-w-[56vw]">
                <ChipStrip chips={globals} visibleMax={5} align="center" />
            </div>

            {/* ---------- Enemy side chips (top-left of arena, beside enemy team) ---------- */}
            <div className="absolute top-2 left-2 md:left-4 z-30 pointer-events-none max-w-[44vw]">
                <div className="flex flex-col items-start gap-1">
                    <AnimatePresence>
                        {enemySide.length > 0 && (
                            <motion.div
                                key="enemy-label"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-[8px] font-black uppercase tracking-[0.25em] text-red-300/80 px-2 drop-shadow"
                            >
                                Foe Side
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <ChipStrip chips={enemySide} visibleMax={4} align="start" compact />
                </div>
            </div>

            {/* ---------- Player side chips (bottom-right of arena, opposite the team) ---------- */}
            <div className="absolute bottom-2 right-2 md:right-4 z-30 pointer-events-none max-w-[44vw]">
                <div className="flex flex-col items-end gap-1">
                    <AnimatePresence>
                        {playerSide.length > 0 && (
                            <motion.div
                                key="player-label"
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-[8px] font-black uppercase tracking-[0.25em] text-cyan-300/80 px-2 drop-shadow"
                            >
                                Your Side
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <ChipStrip chips={playerSide} visibleMax={4} align="end" compact />
                </div>
            </div>
        </>
    );
};
