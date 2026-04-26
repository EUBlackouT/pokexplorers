import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { battlePopupBus, BattlePopup, PopupSide } from '../../utils/battlePopupBus';
import { playStatUpSfx, playStatDownSfx } from '../../services/soundService';

/* =============================================================================
 * BattleBuffFx
 * =============================================================================
 * Big, dramatic, classic-Pokemon style stat-change flourish on top of a
 * single battle slot. Subscribes to the popup bus and renders only when a
 * `kind: 'stat'` event arrives for the matching side+slot.
 *
 * What you see when (e.g.) Speed sharply rises:
 *   1. A burst of 6 large arrows streaks UP through the sprite, color-tinted
 *      to match the stat (yellow for Spe, red for Atk, etc).
 *   2. A pulsing ground ring at the sprite's feet swells outward in the
 *      same color.
 *   3. A bold "SPEED" word + "↑↑" centers on the sprite for ~700ms then
 *      drifts up while fading.
 *   4. A subtle full-arena tint flash in the stat's color.
 *   5. SFX: rising 3-tone (or 5-tone for sharply) arpeggio.
 *
 * On a stat fall everything inverts: arrows drop down through the sprite,
 * ring contracts inward, label drifts down, tint is desaturated rose.
 *
 * Why a separate component from BattlePopupLayer?
 *   The existing layer is anchored to a tiny column 64px above the sprite
 *   for compact "+1 Atk" chips. The buff burst needs the full sprite area
 *   (arrow pillar) and a ground footprint, so it lives in its own layer
 *   with absolute-inset positioning. The two layers stack happily.
 * ========================================================================== */

interface Props {
    side: PopupSide;
    slot: 0 | 1;
}

interface Burst {
    id: string;
    stat: string;
    delta: number;
}

const STAT_COLOR: Record<string, { hex: string; glow: string; ring: string }> = {
    attack:           { hex: '#ef4444', glow: 'rgba(239,68,68,0.65)',  ring: '#fca5a5' },
    defense:          { hex: '#3b82f6', glow: 'rgba(59,130,246,0.65)', ring: '#93c5fd' },
    'special-attack': { hex: '#a855f7', glow: 'rgba(168,85,247,0.65)', ring: '#d8b4fe' },
    'special-defense':{ hex: '#06b6d4', glow: 'rgba(6,182,212,0.65)',  ring: '#67e8f9' },
    speed:            { hex: '#facc15', glow: 'rgba(250,204,21,0.65)', ring: '#fde68a' },
    accuracy:         { hex: '#f8fafc', glow: 'rgba(248,250,252,0.55)',ring: '#e2e8f0' },
    evasion:          { hex: '#c084fc', glow: 'rgba(192,132,252,0.65)',ring: '#e9d5ff' },
};

const STAT_LABEL: Record<string, string> = {
    attack: 'ATTACK',
    defense: 'DEFENSE',
    'special-attack': 'SP. ATK',
    'special-defense': 'SP. DEF',
    speed: 'SPEED',
    accuracy: 'ACCURACY',
    evasion: 'EVASION',
};

const colorFor = (stat: string) =>
    STAT_COLOR[stat] ?? { hex: '#fbbf24', glow: 'rgba(251,191,36,0.65)', ring: '#fde68a' };

/** A single chevron drawn as inline SVG so we don't depend on icon assets.
 *  `inverted` flips it for stat falls without needing two component variants. */
const Chevron: React.FC<{ size: number; color: string; inverted?: boolean }> = ({ size, color, inverted }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={{ transform: inverted ? 'rotate(180deg)' : 'none' }}
        aria-hidden
    >
        <path
            d="M4 16 L12 6 L20 16"
            stroke={color}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
    </svg>
);

const ArrowPillar: React.FC<{ color: string; up: boolean; sharp: boolean }> = ({ color, up, sharp }) => {
    // 5 arrows for normal, 7 for sharply -- cluster tighter on sharply so it
    // reads as a single "shaft" rushing through the sprite rather than five
    // separate chevrons.
    const count = sharp ? 7 : 5;
    const arr = Array.from({ length: count }, (_, i) => i);
    return (
        <div
            className="absolute inset-0 flex flex-col items-center pointer-events-none overflow-visible"
            style={{ zIndex: 25 }}
        >
            {arr.map(i => {
                // Stagger by index so chevrons appear like a column of arrows
                // chasing each other, not a single solid block. Reverse the
                // order on debuffs so the leading arrow is the first to enter
                // from above (matches expectation of "falling in").
                const delay = i * 0.06;
                const startY = up ? 80 : -80;
                const endY   = up ? -120 : 120;
                return (
                    <motion.div
                        key={i}
                        initial={{ y: startY, opacity: 0, scale: 0.6 }}
                        animate={{ y: endY, opacity: [0, 1, 1, 0], scale: [0.6, 1.2, 1, 0.8] }}
                        transition={{ duration: sharp ? 0.95 : 0.8, delay, ease: 'easeOut' }}
                        className="absolute"
                        style={{
                            // Spread the chevrons across the column slightly so
                            // they don't collapse onto a single x-coordinate.
                            left: `calc(50% + ${(i % 3 - 1) * 14}px)`,
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        <Chevron size={sharp ? 38 : 30} color={color} inverted={!up} />
                    </motion.div>
                );
            })}
        </div>
    );
};

const GroundRing: React.FC<{ color: string; up: boolean }> = ({ color, up }) => {
    // Buffs: ring expands outward from the feet (rising power).
    // Debuffs: ring contracts inward like a constraint closing in.
    return (
        <motion.div
            className="absolute left-1/2 -bottom-4 pointer-events-none"
            style={{
                width: 110,
                height: 26,
                transform: 'translateX(-50%)',
                borderRadius: '50%',
                border: `3px solid ${color}`,
                boxShadow: `0 0 22px 4px ${color}, inset 0 0 14px ${color}`,
                zIndex: 18,
            }}
            initial={up
                ? { opacity: 0,    scaleX: 0.3, scaleY: 0.5 }
                : { opacity: 0.85, scaleX: 1.6, scaleY: 1.6 }}
            animate={up
                ? { opacity: [0, 0.95, 0], scaleX: [0.3, 1.7, 2.2], scaleY: [0.5, 1.6, 2.0] }
                : { opacity: [0.85, 0.95, 0], scaleX: [1.6, 0.7, 0.4], scaleY: [1.6, 0.9, 0.5] }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
        />
    );
};

const StatLabel: React.FC<{ label: string; arrows: string; color: string; up: boolean }> = ({
    label, arrows, color, up,
}) => (
    <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 28 }}
        initial={{ opacity: 0, y: up ? 10 : -10, scale: 0.7 }}
        animate={{ opacity: [0, 1, 1, 0], y: up ? -22 : 22, scale: [0.7, 1.15, 1.0, 0.95] }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
    >
        <div
            className="font-press-start tracking-widest text-center select-none"
            style={{
                color,
                textShadow: `0 0 8px ${color}, 0 0 18px ${color}, 0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000`,
            }}
        >
            <div className="text-[12px] md:text-[14px] font-black leading-tight">{label}</div>
            <div className="text-[26px] md:text-[34px] font-black leading-none">{arrows}</div>
        </div>
    </motion.div>
);

/** Subtle full-arena tint. Sits at z-1 of the slot container so everything
 *  else stays on top, and is short-lived so it doesn't fight other VFX. */
const SlotFlash: React.FC<{ color: string }> = ({ color }) => (
    <motion.div
        aria-hidden
        className="absolute -inset-8 pointer-events-none"
        style={{
            background: `radial-gradient(ellipse at center, ${color}55 0%, transparent 65%)`,
            zIndex: 5,
            mixBlendMode: 'screen',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0] }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
    />
);

export const BattleBuffFx: React.FC<Props> = ({ side, slot }) => {
    const [bursts, setBursts] = useState<Burst[]>([]);

    useEffect(() => {
        const unsubscribe = battlePopupBus.subscribe((p: BattlePopup) => {
            if (p.side !== side || p.slot !== slot) return;
            if (p.variant.kind !== 'stat') return;
            const { stat, delta } = p.variant;
            if (!delta) return;
            // Fire SFX immediately so the audio lines up with the arrow burst.
            // Magnitude >=2 plays the "sharply" variant for both pitch range
            // and louder volume.
            try {
                if (delta > 0) playStatUpSfx(Math.abs(delta) >= 2);
                else            playStatDownSfx(Math.abs(delta) >= 2);
            } catch { /* audio failures are non-fatal */ }
            const burst: Burst = { id: p.id, stat, delta };
            setBursts(prev => [...prev, burst]);
            window.setTimeout(() => {
                setBursts(prev => prev.filter(b => b.id !== p.id));
            }, 1200);
        });
        return unsubscribe;
    }, [side, slot]);

    return (
        <AnimatePresence>
            {bursts.map(b => {
                const c = colorFor(b.stat);
                const up = b.delta > 0;
                const sharp = Math.abs(b.delta) >= 2;
                const arrows = sharp ? (up ? '\u2191\u2191' : '\u2193\u2193') : (up ? '\u2191' : '\u2193');
                const label = (STAT_LABEL[b.stat] ?? b.stat).toUpperCase();
                return (
                    <React.Fragment key={b.id}>
                        <SlotFlash color={c.glow} />
                        <GroundRing color={c.hex} up={up} />
                        <ArrowPillar color={c.hex} up={up} sharp={sharp} />
                        <StatLabel label={label} arrows={arrows} color={c.ring} up={up} />
                    </React.Fragment>
                );
            })}
        </AnimatePresence>
    );
};
