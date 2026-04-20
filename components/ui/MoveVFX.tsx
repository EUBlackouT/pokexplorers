import React from 'react';
import { motion } from 'motion/react';
import { BattleState } from '../../types';
import { getMoveVFX, MOVE_VFX_BASE, VFXStyle } from '../../data/moveVFX';

// =============================================================================
// MoveVFX
// =============================================================================
// Renders the in-battle visual effect for every kind of vfx event the battle
// engine emits:
//
//   damage / miss / stat-up / stat-down / status     -> text + glow overlays
//   type-name or miss type                            -> Showdown FX sprite
//                                                        animation (if known)
//   unknown                                           -> legacy type-colored
//                                                        blur circle (fallback)
//
// Sprites are hot-linked from Pokémon Showdown's public CDN and cached by the
// browser. `data/moveVFX.ts` maps ~180 moves + 18 types to a sprite + one of
// six animation styles (projectile / beam / aura / self / contact / rain).
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

// Attacker origin / defender destination expressed as percentages of the battle
// container. `target === 'enemy'` means the PLAYER attacked -> sprite launches
// from the bottom-left and lands in the upper-right. Flipped otherwise.
const POSITIONS: Record<'enemy' | 'player', { from: { x: string; y: string }; to: { x: string; y: string } }> = {
    enemy:  { from: { x: '25%', y: '70%' }, to: { x: '72%', y: '32%' } },
    player: { from: { x: '72%', y: '32%' }, to: { x: '25%', y: '70%' } },
};

const SpriteImg: React.FC<{ sprite: string; size?: number; className?: string; style?: React.CSSProperties }> = ({
    sprite, size = 72, className = '', style
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

const SpriteAnimation: React.FC<{
    style: VFXStyle;
    sprite: string;
    target: 'player' | 'enemy';
}> = ({ style, sprite, target }) => {
    const { from, to } = POSITIONS[target];

    if (style === 'projectile') {
        return (
            <motion.div
                className="absolute"
                initial={{ left: from.x, top: from.y, scale: 0.3, opacity: 0, rotate: 0 }}
                animate={{
                    left: [from.x, to.x],
                    top: [from.y, `calc((${from.y} + ${to.y}) / 2 - 10%)`, to.y],
                    scale: [0.3, 1.1, 1.3],
                    opacity: [0, 1, 1, 0.2],
                    rotate: [0, 180, 360],
                }}
                transition={{ duration: 0.75, times: [0, 0.5, 1], ease: 'easeOut' }}
                style={{ x: '-50%', y: '-50%' }}
            >
                <SpriteImg sprite={sprite} size={72} />
            </motion.div>
        );
    }

    if (style === 'beam') {
        // A streak of N sprite "particles" spaced along the attacker->defender line
        const particles = 6;
        return (
            <>
                {Array.from({ length: particles }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute"
                        initial={{ left: from.x, top: from.y, scale: 0, opacity: 0 }}
                        animate={{
                            left: [from.x, to.x],
                            top: [from.y, to.y],
                            scale: [0, 1, 0.6],
                            opacity: [0, 1, 0],
                        }}
                        transition={{ duration: 0.55, delay: i * 0.06, ease: 'easeOut' }}
                        style={{ x: '-50%', y: '-50%' }}
                    >
                        <SpriteImg sprite={sprite} size={56} />
                    </motion.div>
                ))}
            </>
        );
    }

    if (style === 'aura') {
        return (
            <motion.div
                className="absolute"
                initial={{ left: to.x, top: to.y, scale: 0.4, opacity: 0 }}
                animate={{ scale: [0.4, 1.6, 2.2], opacity: [0, 0.95, 0] }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
                style={{ x: '-50%', y: '-50%' }}
            >
                <SpriteImg sprite={sprite} size={140} />
            </motion.div>
        );
    }

    if (style === 'self') {
        return (
            <motion.div
                className="absolute"
                initial={{ left: from.x, top: from.y, scale: 0.3, opacity: 0 }}
                animate={{ scale: [0.3, 1.4, 0.8], opacity: [0, 0.95, 0], rotate: [0, 30, -30, 0] }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                style={{ x: '-50%', y: '-50%' }}
            >
                <SpriteImg sprite={sprite} size={110} />
            </motion.div>
        );
    }

    if (style === 'contact') {
        return (
            <motion.div
                className="absolute"
                initial={{ left: to.x, top: to.y, scale: 0, opacity: 0, rotate: -30 }}
                animate={{ scale: [0, 1.4, 1.1], opacity: [0, 1, 0], rotate: [-30, 10, 0] }}
                transition={{ duration: 0.45, ease: 'backOut' }}
                style={{ x: '-50%', y: '-50%' }}
            >
                <SpriteImg sprite={sprite} size={90} />
            </motion.div>
        );
    }

    if (style === 'rain') {
        const drops = 8;
        return (
            <>
                {Array.from({ length: drops }).map((_, i) => {
                    const xPct = 20 + (i * 60) / (drops - 1);
                    return (
                        <motion.div
                            key={i}
                            className="absolute"
                            initial={{ left: `${xPct}%`, top: '-10%', scale: 0.6, opacity: 0, rotate: 0 }}
                            animate={{
                                top: ['-10%', to.y],
                                opacity: [0, 1, 0],
                                rotate: [0, 360],
                            }}
                            transition={{ duration: 0.7, delay: i * 0.05, ease: 'easeIn' }}
                            style={{ x: '-50%', y: '-50%' }}
                        >
                            <SpriteImg sprite={sprite} size={48} />
                        </motion.div>
                    );
                })}
            </>
        );
    }

    return null;
};

export const MoveVFX: React.FC<{ vfx: NonNullable<BattleState['vfx']> }> = ({ vfx }) => {
    const { type, damage, isCrit, isMiss, isSuperEffective, isNotVeryEffective, moveName, target } = vfx;

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

    // --- Move / type VFX ------------------------------------------------------
    const vfxSpec = getMoveVFX(moveName, type);

    if (vfxSpec && target) {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-[90]">
                {/* Soft type-colored glow under the sprite for readability. */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0.5, 1.8, 0], opacity: [0, 0.5, 0] }}
                    transition={{ duration: 0.8 }}
                    className={`absolute w-32 h-32 rounded-full blur-2xl ${TYPE_FX_COLORS[type] || 'bg-white'} opacity-40`}
                    style={{
                        left: POSITIONS[target].to.x,
                        top: POSITIONS[target].to.y,
                        translateX: '-50%',
                        translateY: '-50%',
                    }}
                />
                <SpriteAnimation style={vfxSpec.style} sprite={vfxSpec.sprite} target={target} />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 2, 0], opacity: [1, 0.8, 0] }}
            transition={{ duration: 0.5 }}
            className={`absolute z-50 w-32 h-32 rounded-full blur-xl ${TYPE_FX_COLORS[type] || 'bg-white'}`}
        />
    );
};
