import React from 'react';
import { motion } from 'motion/react';
import { BattleState } from '../../types';
import { getMoveVFX, MOVE_VFX_BASE, VFXStyle } from '../../data/moveVFX';

// =============================================================================
// MoveVFX (v2, dramatic edition)
// =============================================================================
// Renders the in-battle visual effect for every kind of vfx event the battle
// engine emits:
//
//   damage / miss / stat-up / stat-down / status     -> text + glow overlays
//   type-name or miss type                            -> Showdown FX sprite
//                                                        animation + particle
//                                                        burst + impact rings
//   unknown                                           -> legacy type-colored
//                                                        blur circle (fallback)
//
// NOTE: This component is rendered INSIDE each Pokemon's sprite box (scoped
// local space). The battle-field-wide effects (type flash, vignette,
// chromatic shockwave) live in `BattleFxOverlay.tsx` instead.
//
// Per-move sprites hot-linked from Pokemon Showdown's public CDN and cached
// by the browser. `data/moveVFX.ts` maps ~180 moves + 18 types to a sprite +
// one of six animation styles (projectile / beam / aura / self / contact / rain).
// =============================================================================

const TYPE_FX_COLORS: Record<string, string> = {
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

// Raw tints used by particle bursts and impact rings. These are CSS color
// literals rather than Tailwind class names so we can use them in inline
// `background`/`boxShadow` props.
const TYPE_TINT: Record<string, string> = {
    fire:     '#ff6a1a',
    water:    '#4ea8ff',
    electric: '#fde047',
    grass:    '#84e364',
    ice:      '#a8e8ff',
    fighting: '#ff8c3c',
    normal:   '#fff0c8',
    poison:   '#c27be6',
    psychic:  '#ff77c8',
    ghost:    '#9a5edc',
    dragon:   '#8250ff',
    steel:    '#c8d2dc',
    fairy:    '#ffaae6',
    bug:      '#bee35a',
    rock:     '#b4885a',
    ground:   '#d2a060',
    flying:   '#aad2ff',
    dark:     '#4b1a50',
};

// Attacker origin / defender destination expressed as percentages of the battle
// container. `target === 'enemy'` means the PLAYER attacked -> sprite launches
// from the bottom-left and lands in the upper-right. Flipped otherwise.
const POSITIONS: Record<'enemy' | 'player', { from: { x: string; y: string }; to: { x: string; y: string } }> = {
    enemy:  { from: { x: '25%', y: '70%' }, to: { x: '72%', y: '32%' } },
    player: { from: { x: '72%', y: '32%' }, to: { x: '25%', y: '70%' } },
};

// -----------------------------------------------------------------------------
// Low-level particle / ring primitives
// -----------------------------------------------------------------------------

/**
 * A radial burst of small colored particles. Uses pure CSS keyframes so we can
 * cheaply fire 20-30 particles in parallel without 30 motion components.
 */
const ParticleBurst: React.FC<{
    x: string;
    y: string;
    color: string;
    count?: number;
    radius?: number;
    size?: [number, number];
    duration?: number;
    delay?: number;
}> = ({ x, y, color, count = 18, radius = 140, size = [4, 10], duration = 0.7, delay = 0 }) => (
    <div
        className="absolute pointer-events-none"
        style={{ left: x, top: y, width: 0, height: 0 }}
    >
        {Array.from({ length: count }).map((_, i) => {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
            const dist = radius * (0.55 + Math.random() * 0.45);
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist;
            const sz = size[0] + Math.random() * (size[1] - size[0]);
            const dur = duration * (0.7 + Math.random() * 0.5);
            return (
                <span
                    key={i}
                    className="absolute rounded-full"
                    style={{
                        width: sz,
                        height: sz,
                        background: color,
                        boxShadow: `0 0 ${sz * 2.5}px ${color}, 0 0 ${sz * 1.2}px #fff`,
                        left: 0,
                        top: 0,
                        animation: `vfx-spark ${dur}s ease-out ${delay}s forwards`,
                        ['--dx' as any]: `${dx}px`,
                        ['--dy' as any]: `${dy}px`,
                    } as React.CSSProperties}
                />
            );
        })}
    </div>
);

/** Multi-ring expanding shockwave -- dramatic impact marker for the defender. */
const ImpactRings: React.FC<{
    x: string;
    y: string;
    color: string;
    rings?: number;
    size?: number;
    duration?: number;
}> = ({ x, y, color, rings = 2, size = 150, duration = 0.7 }) => (
    <>
        {Array.from({ length: rings }).map((_, i) => (
            <span
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                    left: x,
                    top: y,
                    width: size,
                    height: size,
                    border: `3px solid ${color}`,
                    boxShadow: `0 0 30px ${color}, inset 0 0 20px ${color}`,
                    animation: `vfx-ring ${duration}s ease-out ${i * 0.12}s forwards`,
                }}
            />
        ))}
    </>
);

/** White hit-flash that punches through at impact. */
const HitFlash: React.FC<{ x: string; y: string; size?: number; duration?: number }> = ({
    x, y, size = 120, duration = 0.35,
}) => (
    <span
        className="absolute rounded-full pointer-events-none"
        style={{
            left: x,
            top: y,
            width: size,
            height: size,
            background: 'radial-gradient(circle, #fff 0%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0) 70%)',
            mixBlendMode: 'screen',
            animation: `vfx-hit-flash ${duration}s ease-out forwards`,
        }}
    />
);

/** A glowing beam line from attacker (from) to defender (to). */
const BeamLine: React.FC<{
    from: { x: string; y: string };
    to: { x: string; y: string };
    color: string;
    thickness?: number;
    duration?: number;
}> = ({ from, to, color, thickness = 14, duration = 0.55 }) => (
    // We draw the beam as an absolutely positioned svg line that grows from
    // attacker to defender. Using svg so the beam can have glow via filter.
    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        <defs>
            <filter id="beam-glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <motion.line
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            filter="url(#beam-glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
                pathLength: [0, 1, 1, 1],
                opacity: [0, 1, 1, 0],
                strokeWidth: [thickness * 0.3, thickness * 1.4, thickness, thickness * 0.6],
            }}
            transition={{ duration, times: [0, 0.25, 0.75, 1], ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 18px ${color}) drop-shadow(0 0 6px #fff)` }}
        />
    </svg>
);

// -----------------------------------------------------------------------------
// Sprite helper
// -----------------------------------------------------------------------------

const SpriteImg: React.FC<{ sprite: string; size?: number; className?: string; style?: React.CSSProperties }> = ({
    sprite, size = 120, className = '', style
}) => (
    <img
        src={`${MOVE_VFX_BASE}${sprite}`}
        alt=""
        draggable={false}
        className={`pointer-events-none ${className}`}
        style={{ width: size, height: 'auto', imageRendering: 'pixelated', ...style }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
    />
);

// -----------------------------------------------------------------------------
// Per-style animations (heavily upgraded from v1)
// -----------------------------------------------------------------------------

const SpriteAnimation: React.FC<{
    style: VFXStyle;
    sprite: string;
    target: 'player' | 'enemy';
    typeKey: string;
}> = ({ style, sprite, target, typeKey }) => {
    const { from, to } = POSITIONS[target];
    const tint = TYPE_TINT[typeKey] || '#ffffff';

    // ------------------------- projectile -------------------------
    // Large sprite flies in an arc with a trailing particle stream. Lands
    // with a hit flash + impact rings + radial particle burst.
    if (style === 'projectile') {
        const trailCount = 6;
        return (
            <>
                {/* Trailing projectile stream */}
                {Array.from({ length: trailCount }).map((_, i) => (
                    <motion.div
                        key={`trail-${i}`}
                        className="absolute"
                        initial={{ left: from.x, top: from.y, scale: 0, opacity: 0 }}
                        animate={{
                            left: [from.x, to.x],
                            top: [from.y, `calc((${from.y} + ${to.y}) / 2 - 8%)`, to.y],
                            scale: [0.3, 0.8 - i * 0.05, 0.3],
                            opacity: [0, 0.8, 0],
                        }}
                        transition={{ duration: 0.7, delay: i * 0.04, ease: 'easeOut' }}
                        style={{ x: '-50%', y: '-50%' }}
                    >
                        <SpriteImg sprite={sprite} size={90 - i * 6} style={{ filter: `drop-shadow(0 0 10px ${tint})` }} />
                    </motion.div>
                ))}

                {/* Main projectile */}
                <motion.div
                    className="absolute"
                    initial={{ left: from.x, top: from.y, scale: 0.4, opacity: 0, rotate: 0 }}
                    animate={{
                        left: [from.x, to.x],
                        top: [from.y, `calc((${from.y} + ${to.y}) / 2 - 12%)`, to.y],
                        scale: [0.4, 1.3, 1.6],
                        opacity: [0, 1, 1, 0.2],
                        rotate: [0, 240, 480],
                    }}
                    transition={{ duration: 0.7, times: [0, 0.5, 1], ease: 'easeOut' }}
                    style={{ x: '-50%', y: '-50%' }}
                >
                    <SpriteImg sprite={sprite} size={130} style={{ filter: `drop-shadow(0 0 22px ${tint})` }} />
                </motion.div>

                {/* Impact at target after arrival */}
                <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0, 1, 1, 0] }}
                    transition={{ duration: 1, times: [0, 0.6, 0.65, 0.9, 1] }}
                >
                    <HitFlash x={to.x} y={to.y} size={160} duration={0.4} />
                    <ImpactRings x={to.x} y={to.y} color={tint} rings={2} size={160} duration={0.7} />
                    <ParticleBurst x={to.x} y={to.y} color={tint} count={18} radius={140} delay={0.55} />
                </motion.div>
            </>
        );
    }

    // ------------------------- beam -------------------------
    // A proper glowing beam line from attacker to defender, sprite particles
    // streaming along it, and a big impact burst at the defender end.
    if (style === 'beam') {
        const streamCount = 8;
        return (
            <>
                {/* The beam itself -- big SVG glowing line. */}
                <BeamLine from={from} to={to} color={tint} thickness={16} duration={0.65} />

                {/* Sprite particles streaming along the beam path. */}
                {Array.from({ length: streamCount }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute"
                        initial={{ left: from.x, top: from.y, scale: 0, opacity: 0 }}
                        animate={{
                            left: [from.x, to.x],
                            top: [from.y, to.y],
                            scale: [0, 1.1, 0.7],
                            opacity: [0, 1, 0],
                        }}
                        transition={{ duration: 0.5, delay: 0.05 + i * 0.05, ease: 'easeOut' }}
                        style={{ x: '-50%', y: '-50%' }}
                    >
                        <SpriteImg sprite={sprite} size={72} style={{ filter: `drop-shadow(0 0 12px ${tint})` }} />
                    </motion.div>
                ))}

                {/* Defender-end impact burst (starts after beam reaches target). */}
                <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0, 1, 1, 0] }}
                    transition={{ duration: 1, times: [0, 0.3, 0.35, 0.9, 1] }}
                >
                    <HitFlash x={to.x} y={to.y} size={180} duration={0.4} />
                    <ImpactRings x={to.x} y={to.y} color={tint} rings={3} size={180} duration={0.85} />
                    <ParticleBurst x={to.x} y={to.y} color={tint} count={22} radius={160} delay={0.25} />
                </motion.div>
            </>
        );
    }

    // ------------------------- aura -------------------------
    // Big expanding pulse on the defender -- multiple concentric rings + a
    // particle fountain + a pulsing tint plate behind the sprite.
    if (style === 'aura') {
        return (
            <>
                {/* Giant central sprite that pulses in and out. */}
                <motion.div
                    className="absolute"
                    initial={{ left: to.x, top: to.y, scale: 0.4, opacity: 0 }}
                    animate={{ scale: [0.4, 1.8, 2.6], opacity: [0, 0.95, 0] }}
                    transition={{ duration: 0.85, ease: 'easeOut' }}
                    style={{ x: '-50%', y: '-50%' }}
                >
                    <SpriteImg sprite={sprite} size={180} style={{ filter: `drop-shadow(0 0 30px ${tint})` }} />
                </motion.div>

                <ImpactRings x={to.x} y={to.y} color={tint} rings={3} size={180} duration={0.9} />
                <ParticleBurst x={to.x} y={to.y} color={tint} count={24} radius={180} duration={0.9} />
            </>
        );
    }

    // ------------------------- self -------------------------
    // Bloom on the attacker: sprite spins and scales, wrapped in particle
    // fountain + ring expansion. Shown at attacker's "from" location.
    if (style === 'self') {
        return (
            <>
                <motion.div
                    className="absolute"
                    initial={{ left: from.x, top: from.y, scale: 0.3, opacity: 0 }}
                    animate={{ scale: [0.3, 1.6, 1], opacity: [0, 0.95, 0], rotate: [0, 60, -30, 0] }}
                    transition={{ duration: 0.85, ease: 'easeInOut' }}
                    style={{ x: '-50%', y: '-50%' }}
                >
                    <SpriteImg sprite={sprite} size={140} style={{ filter: `drop-shadow(0 0 26px ${tint})` }} />
                </motion.div>

                <ImpactRings x={from.x} y={from.y} color={tint} rings={2} size={160} duration={0.85} />
                <ParticleBurst x={from.x} y={from.y} color={tint} count={18} radius={130} duration={0.8} />
            </>
        );
    }

    // ------------------------- contact -------------------------
    // Fast punch/slash at the defender: hit flash + slash sprite + sharp ring
    // + dense impact burst. Meant to feel VERY snappy.
    if (style === 'contact') {
        return (
            <>
                {/* Slash / impact sprite */}
                <motion.div
                    className="absolute"
                    initial={{ left: to.x, top: to.y, scale: 0, opacity: 0, rotate: -45 }}
                    animate={{ scale: [0, 1.6, 1.2], opacity: [0, 1, 0], rotate: [-45, 15, 0] }}
                    transition={{ duration: 0.45, ease: 'backOut' }}
                    style={{ x: '-50%', y: '-50%' }}
                >
                    <SpriteImg sprite={sprite} size={130} style={{ filter: `drop-shadow(0 0 18px ${tint})` }} />
                </motion.div>

                <HitFlash x={to.x} y={to.y} size={170} duration={0.3} />
                <ImpactRings x={to.x} y={to.y} color={tint} rings={2} size={150} duration={0.55} />
                <ParticleBurst x={to.x} y={to.y} color={tint} count={22} radius={140} duration={0.55} size={[5, 12]} />
            </>
        );
    }

    // ------------------------- rain -------------------------
    // Multi-drop from above: twice the drops, each bigger, with splash rings
    // at impact for extra weight.
    if (style === 'rain') {
        const drops = 12;
        return (
            <>
                {Array.from({ length: drops }).map((_, i) => {
                    const xPct = 15 + (i * 70) / (drops - 1);
                    return (
                        <React.Fragment key={i}>
                            <motion.div
                                className="absolute"
                                initial={{ left: `${xPct}%`, top: '-10%', scale: 0.6, opacity: 0, rotate: 0 }}
                                animate={{
                                    top: ['-10%', to.y],
                                    opacity: [0, 1, 0],
                                    rotate: [0, 360],
                                    scale: [0.6, 1.1, 0.8],
                                }}
                                transition={{ duration: 0.75, delay: i * 0.04, ease: 'easeIn' }}
                                style={{ x: '-50%', y: '-50%' }}
                            >
                                <SpriteImg sprite={sprite} size={60} style={{ filter: `drop-shadow(0 0 10px ${tint})` }} />
                            </motion.div>
                            {/* Splash burst where each drop lands. */}
                            <motion.div
                                className="absolute"
                                style={{ left: `${xPct}%`, top: to.y, x: '-50%', y: '-50%' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 0, 1, 0] }}
                                transition={{ duration: 0.75, delay: i * 0.04, times: [0, 0.65, 0.7, 1] }}
                            >
                                <span
                                    className="block rounded-full"
                                    style={{
                                        width: 28,
                                        height: 28,
                                        background: tint,
                                        boxShadow: `0 0 20px ${tint}`,
                                        opacity: 0.8,
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                />
                            </motion.div>
                        </React.Fragment>
                    );
                })}
                <ImpactRings x="50%" y={to.y} color={tint} rings={2} size={200} duration={0.9} />
            </>
        );
    }

    return null;
};

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

export const MoveVFX: React.FC<{ vfx: NonNullable<BattleState['vfx']> }> = ({ vfx }) => {
    const { type, damage, isCrit, isMiss, isSuperEffective, isNotVeryEffective, moveName, target } = vfx;

    // ------------------------- damage popup -------------------------
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

    // ------------------------- miss -------------------------
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

    // ------------------------- stat up / down -------------------------
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

    // ------------------------- status application -------------------------
    if (['burn', 'freeze', 'paralysis', 'poison_status', 'sleep'].includes(type)) {
        return (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [1, 2.5, 0], opacity: [0, 1, 0], rotate: [0, 180, 360] }}
                    transition={{ duration: 1 }}
                    className={`w-32 h-32 rounded-full blur-2xl ${TYPE_FX_COLORS[type] || 'bg-white'} opacity-60`}
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

    // ------------------------- move animation -------------------------
    const vfxSpec = getMoveVFX(moveName, type);
    const typeKey = type.toLowerCase();
    const tint = TYPE_TINT[typeKey] || '#ffffff';

    if (vfxSpec && target) {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-visible z-[90]">
                {/* Ambient under-sprite glow at target -- bigger & more saturated than v1. */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0.5, 2.3, 0], opacity: [0, 0.75, 0] }}
                    transition={{ duration: 0.9 }}
                    className="absolute rounded-full blur-2xl"
                    style={{
                        width: 180,
                        height: 180,
                        background: tint,
                        left: POSITIONS[target].to.x,
                        top: POSITIONS[target].to.y,
                        translateX: '-50%',
                        translateY: '-50%',
                        mixBlendMode: 'screen',
                    }}
                />
                <SpriteAnimation style={vfxSpec.style} sprite={vfxSpec.sprite} target={target} typeKey={typeKey} />
            </div>
        );
    }

    // ------------------------- legacy fallback -------------------------
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 2, 0], opacity: [1, 0.8, 0] }}
            transition={{ duration: 0.5 }}
            className={`absolute z-50 w-32 h-32 rounded-full blur-xl ${TYPE_FX_COLORS[type] || 'bg-white'}`}
        />
    );
};
