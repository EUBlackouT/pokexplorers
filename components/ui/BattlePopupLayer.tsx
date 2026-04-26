import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BattlePopup, PopupSide, PopupVariant, battlePopupBus } from '../../utils/battlePopupBus';

interface Props {
    side: PopupSide;
    slot: 0 | 1;
    /** How long each popup stays visible before fading. Defaults to 1400ms. */
    ttl?: number;
}

const STAT_LABEL: Record<string, string> = {
    attack: 'Atk',
    defense: 'Def',
    'special-attack': 'SpA',
    'special-defense': 'SpD',
    speed: 'Spe',
    accuracy: 'Acc',
    evasion: 'Eva',
};

// Per-stat tint for the floating chip. Buffs use the saturated colour;
// debuffs use a desaturated rose so the player can tell at a glance whether
// the change is good for them. Keeps the chip on-brand with the bigger
// BattleBuffFx burst (which uses the same hex palette).
const STAT_HEX: Record<string, { up: string; down: string; ring: string }> = {
    attack:           { up: '#ef4444', down: '#9f1239', ring: '#fca5a5' },
    defense:          { up: '#3b82f6', down: '#1e3a8a', ring: '#93c5fd' },
    'special-attack': { up: '#a855f7', down: '#581c87', ring: '#d8b4fe' },
    'special-defense':{ up: '#06b6d4', down: '#155e75', ring: '#67e8f9' },
    speed:            { up: '#facc15', down: '#854d0e', ring: '#fde68a' },
    accuracy:         { up: '#f1f5f9', down: '#475569', ring: '#cbd5e1' },
    evasion:          { up: '#c084fc', down: '#6b21a8', ring: '#e9d5ff' },
};

const STATUS_STYLE: Record<string, { label: string; bg: string; glow: string }> = {
    burn:            { label: 'BURN',    bg: 'bg-orange-600',  glow: 'shadow-orange-500/70' },
    poison:          { label: 'POISON',  bg: 'bg-purple-600',  glow: 'shadow-purple-500/70' },
    'badly-poisoned':{ label: 'TOXIC',   bg: 'bg-fuchsia-700', glow: 'shadow-fuchsia-500/70' },
    sleep:           { label: 'SLEEP',   bg: 'bg-slate-500',   glow: 'shadow-slate-400/70' },
    freeze:          { label: 'FROZEN',  bg: 'bg-cyan-500',    glow: 'shadow-cyan-400/70' },
    paralysis:       { label: 'PARALYZE',bg: 'bg-yellow-500',  glow: 'shadow-yellow-400/70' },
    confusion:       { label: 'CONFUSED',bg: 'bg-pink-500',    glow: 'shadow-pink-400/70' },
    cured:           { label: 'CURED',   bg: 'bg-emerald-500', glow: 'shadow-emerald-400/70' },
};

const WEATHER_STYLE: Record<string, { label: string; bg: string; icon: string }> = {
    sun:   { label: 'HARSH SUN',    bg: 'bg-gradient-to-r from-orange-500 to-red-500', icon: '\u2600' },
    rain:  { label: 'RAIN',         bg: 'bg-gradient-to-r from-blue-500 to-indigo-500', icon: '\u2602' },
    sand:  { label: 'SANDSTORM',    bg: 'bg-gradient-to-r from-amber-600 to-yellow-700', icon: '\u25b6' },
    hail:  { label: 'HAIL',         bg: 'bg-gradient-to-r from-cyan-400 to-blue-500', icon: '\u2744' },
    snow:  { label: 'SNOW',         bg: 'bg-gradient-to-r from-sky-300 to-indigo-400', icon: '\u2744' },
    clear: { label: 'CLEAR SKIES',  bg: 'bg-gradient-to-r from-sky-400 to-cyan-300', icon: '\u2600' },
};

// Rendering ------------------------------------------------------------------
const renderPopup = (variant: PopupVariant): React.ReactNode => {
    switch (variant.kind) {
        case 'ability':
            return (
                <div className="flex flex-col items-center">
                    <span className="text-[8px] uppercase tracking-[0.3em] text-yellow-200/80 leading-none">Ability</span>
                    <span className="text-[13px] font-black leading-tight">{variant.name}</span>
                </div>
            );
        case 'stat': {
            const up = variant.delta > 0;
            const mag = Math.abs(variant.delta);
            // One arrow per stage of magnitude, capped at three so a +6
            // legacy ability burst doesn't run off the chip horizontally.
            const arrows = (up ? '\u2191' : '\u2193').repeat(Math.min(3, mag));
            const label = STAT_LABEL[variant.stat] ?? variant.stat;
            const tint = STAT_HEX[variant.stat]?.ring ?? (up ? '#bbf7d0' : '#fecaca');
            return (
                <div className="flex flex-col items-center leading-none">
                    <span
                        className="font-black text-[15px] md:text-base tracking-wider"
                        style={{ color: tint, textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
                    >
                        {label}
                    </span>
                    <span
                        className="font-black text-2xl md:text-3xl leading-none"
                        style={{
                            color: tint,
                            textShadow: `0 0 8px ${tint}, 0 2px 0 rgba(0,0,0,0.85)`,
                            letterSpacing: '0.05em',
                        }}
                    >
                        {arrows}
                    </span>
                </div>
            );
        }
        case 'status': {
            const s = STATUS_STYLE[variant.status];
            return <span className="font-black text-xs tracking-wider">{s?.label ?? variant.status.toUpperCase()}</span>;
        }
        case 'weather': {
            const w = WEATHER_STYLE[variant.weather];
            return <span className="font-black text-xs tracking-wider flex items-center gap-1">{w?.icon} {w?.label ?? variant.weather.toUpperCase()}</span>;
        }
        case 'immunity':
            return <span className="font-black text-xs tracking-wider">{variant.reason ? variant.reason.toUpperCase() : 'IMMUNE'}</span>;
        case 'crit':
            return <span className="font-black text-xs tracking-[0.2em]">CRIT!</span>;
        case 'effective':
            return (
                <span className="font-black text-xs tracking-[0.2em]">
                    {variant.level === 'super' ? 'SUPER EFFECTIVE' : 'RESISTED'}
                </span>
            );
        case 'item':
            return (
                <div className="flex flex-col items-center">
                    <span className="text-[8px] uppercase tracking-[0.3em] text-amber-200/80 leading-none">Item</span>
                    <span className="text-xs font-black leading-tight">{variant.label}</span>
                </div>
            );
        case 'custom':
            return <span className="font-black text-xs tracking-wider">{variant.icon ? `${variant.icon} ` : ''}{variant.label}</span>;
        default:
            return null;
    }
};

// `variantStyle` produces both the Tailwind class string and any inline
// styles for variants that need dynamic colour values (e.g. per-stat tints
// can't be expressed as static utility classes).
interface VariantPresentation {
    className: string;
    style?: React.CSSProperties;
}

const variantStyle = (variant: PopupVariant): VariantPresentation => {
    switch (variant.kind) {
        case 'ability':   return { className: 'bg-gradient-to-r from-yellow-600 to-amber-500 border-yellow-200 shadow-yellow-500/60' };
        case 'stat': {
            const hex = STAT_HEX[variant.stat] ?? { up: '#10b981', down: '#e11d48', ring: '#ffffff' };
            const base = variant.delta > 0 ? hex.up : hex.down;
            return {
                // Slightly bigger padding + 3px border so the stat chip
                // physically dominates the smaller status / immunity chips.
                className: 'border-[3px] px-4 py-1.5 shadow-2xl rounded-md',
                style: {
                    backgroundImage: `linear-gradient(135deg, ${base}, ${base}cc 60%, rgba(0,0,0,0.6))`,
                    borderColor: hex.ring,
                    boxShadow: `0 0 22px 2px ${base}aa, 0 4px 14px rgba(0,0,0,0.5)`,
                },
            };
        }
        case 'status':    return { className: `${STATUS_STYLE[variant.status]?.bg ?? 'bg-slate-600'} border-white/80 shadow-lg ${STATUS_STYLE[variant.status]?.glow ?? ''}` };
        case 'weather':   return { className: `${WEATHER_STYLE[variant.weather]?.bg ?? 'bg-slate-600'} border-white/80 shadow-lg` };
        case 'immunity':  return { className: 'bg-gradient-to-r from-slate-600 to-slate-500 border-slate-200 shadow-slate-500/60' };
        case 'crit':      return { className: 'bg-gradient-to-r from-red-600 to-orange-500 border-yellow-200 shadow-red-500/80' };
        case 'effective': return { className: variant.level === 'super'
            ? 'bg-gradient-to-r from-red-600 to-orange-500 border-yellow-200 shadow-red-500/60'
            : 'bg-gradient-to-r from-slate-700 to-slate-500 border-slate-300 shadow-slate-500/60' };
        case 'item':      return { className: 'bg-gradient-to-r from-amber-700 to-yellow-500 border-amber-200 shadow-amber-500/60' };
        case 'custom':    return { className: `bg-gradient-to-r ${variant.color ?? 'from-indigo-600 to-purple-600'} border-white/80 shadow-lg` };
        default:          return { className: 'bg-slate-700 border-slate-300' };
    }
};

// Stat changes get a longer dwell so the player has time to catch the
// affected stat after the arrow burst has already played. Other variants
// keep the snappy 1.4s default.
const ttlFor = (variant: PopupVariant, fallback: number): number => {
    if (variant.kind === 'stat') return 2200;
    return fallback;
};

export const BattlePopupLayer: React.FC<Props> = ({ side, slot, ttl = 1400 }) => {
    const [popups, setPopups] = useState<BattlePopup[]>([]);

    useEffect(() => {
        const unsubscribe = battlePopupBus.subscribe((p) => {
            if (p.side !== side || p.slot !== slot) return;
            setPopups((prev) => [...prev, p]);
            const lifetime = ttlFor(p.variant, ttl);
            window.setTimeout(() => {
                setPopups((prev) => prev.filter((x) => x.id !== p.id));
            }, lifetime);
        });
        return unsubscribe;
    }, [side, slot, ttl]);

    return (
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-1 min-w-[120px]">
            <AnimatePresence>
                {popups.map((p, i) => {
                    const pres = variantStyle(p.variant);
                    const isStat = p.variant.kind === 'stat';
                    return (
                        <motion.div
                            key={p.id}
                            // Stat chips get a punchy spring-bounce intro so
                            // the player sees the chip physically pop in.
                            // Other chips use the original quick fade so the
                            // tighter feedback (CRIT, IMMUNE, etc.) stays
                            // snappy.
                            initial={isStat ? { opacity: 0, y: 30, scale: 0.4 } : { opacity: 0, y: 10, scale: 0.8 }}
                            animate={isStat
                                ? { opacity: 1, y: -i * 4, scale: [0.4, 1.25, 1] }
                                : { opacity: 1, y: -i * 2, scale: 1 }}
                            exit={{ opacity: 0, y: -30, scale: 0.7 }}
                            transition={isStat
                                ? { duration: 0.55, ease: 'easeOut' }
                                : { duration: 0.25, ease: 'easeOut' }}
                            className={`px-3 py-1 rounded-md border-2 text-white shadow-xl whitespace-nowrap ${pres.className}`}
                            style={pres.style}
                        >
                            {renderPopup(p.variant)}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
