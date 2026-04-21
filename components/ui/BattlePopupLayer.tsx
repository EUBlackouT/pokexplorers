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
            const arrows = Math.abs(variant.delta) >= 2 ? (up ? '\u2191\u2191' : '\u2193\u2193') : (up ? '\u2191' : '\u2193');
            const label = STAT_LABEL[variant.stat] ?? variant.stat;
            return (
                <span className={`font-black text-sm ${up ? 'text-emerald-200' : 'text-rose-200'}`}>
                    {label} {arrows}
                </span>
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

const variantStyle = (variant: PopupVariant): string => {
    switch (variant.kind) {
        case 'ability':   return 'bg-gradient-to-r from-yellow-600 to-amber-500 border-yellow-200 shadow-yellow-500/60';
        case 'stat':      return variant.delta > 0
            ? 'bg-gradient-to-r from-emerald-600 to-green-500 border-emerald-200 shadow-emerald-500/60'
            : 'bg-gradient-to-r from-rose-700 to-red-500 border-rose-200 shadow-rose-500/60';
        case 'status':    return `${STATUS_STYLE[variant.status]?.bg ?? 'bg-slate-600'} border-white/80 shadow-lg ${STATUS_STYLE[variant.status]?.glow ?? ''}`;
        case 'weather':   return `${WEATHER_STYLE[variant.weather]?.bg ?? 'bg-slate-600'} border-white/80 shadow-lg`;
        case 'immunity':  return 'bg-gradient-to-r from-slate-600 to-slate-500 border-slate-200 shadow-slate-500/60';
        case 'crit':      return 'bg-gradient-to-r from-red-600 to-orange-500 border-yellow-200 shadow-red-500/80';
        case 'effective': return variant.level === 'super'
            ? 'bg-gradient-to-r from-red-600 to-orange-500 border-yellow-200 shadow-red-500/60'
            : 'bg-gradient-to-r from-slate-700 to-slate-500 border-slate-300 shadow-slate-500/60';
        case 'item':      return 'bg-gradient-to-r from-amber-700 to-yellow-500 border-amber-200 shadow-amber-500/60';
        case 'custom':    return `bg-gradient-to-r ${variant.color ?? 'from-indigo-600 to-purple-600'} border-white/80 shadow-lg`;
        default:          return 'bg-slate-700 border-slate-300';
    }
};

export const BattlePopupLayer: React.FC<Props> = ({ side, slot, ttl = 1400 }) => {
    const [popups, setPopups] = useState<BattlePopup[]>([]);

    useEffect(() => {
        const unsubscribe = battlePopupBus.subscribe((p) => {
            if (p.side !== side || p.slot !== slot) return;
            setPopups((prev) => [...prev, p]);
            window.setTimeout(() => {
                setPopups((prev) => prev.filter((x) => x.id !== p.id));
            }, ttl);
        });
        return unsubscribe;
    }, [side, slot, ttl]);

    return (
        <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-1 min-w-[120px]">
            <AnimatePresence>
                {popups.map((p, i) => (
                    <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: -i * 2, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.7 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className={`px-3 py-1 rounded-md border-2 text-white shadow-xl whitespace-nowrap ${variantStyle(p.variant)}`}
                    >
                        {renderPopup(p.variant)}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
