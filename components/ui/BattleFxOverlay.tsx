import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BattleState } from '../../types';

/* =============================================================================
 * BattleFxOverlay
 * =============================================================================
 * Renders the BATTLE-FIELD-WIDE visual effects that can't fit inside an
 * individual Pokemon's sprite box. Mounted once at the battle container level.
 *
 * Layers (z ordered, all `mix-blend-mode`-compatible):
 *   1. Type-colored radial flash        -- "the screen turns orange for Fire"
 *   2. Edge vignette                    -- cinematic darken on heavy moves
 *   3. Chromatic aberration (crit only) -- RGB offset split screen on crit
 *   4. Impact shockwave (crit only)     -- expanding ring from center
 *   5. Rim lightning (electric only)    -- thin animated streaks on edges
 *
 * All effects auto-key off `vfx.target + vfx.index + vfx.type + vfx.moveName`
 * so the same move replayed on different turns always replays cleanly.
 * ============================================================================= */

// Per-type flash colors -- hand-tuned for drama. `core` is the bright radial
// center, `edge` is transparent so the flash feathers out to the frame edges.
const TYPE_FLASH: Record<string, { core: string; edge: string; tint: string }> = {
    fire:     { core: 'rgba(255, 130,  40, 0.75)', edge: 'rgba(200,  40,   0, 0)', tint: '#ff6a1a' },
    water:    { core: 'rgba( 90, 180, 255, 0.70)', edge: 'rgba( 20,  80, 200, 0)', tint: '#4ea8ff' },
    electric: { core: 'rgba(255, 245,  80, 0.85)', edge: 'rgba(200, 160,   0, 0)', tint: '#fde047' },
    grass:    { core: 'rgba(130, 240, 120, 0.70)', edge: 'rgba( 40, 130,  40, 0)', tint: '#84e364' },
    ice:      { core: 'rgba(170, 230, 255, 0.75)', edge: 'rgba( 70, 150, 200, 0)', tint: '#a8e8ff' },
    psychic:  { core: 'rgba(255, 120, 200, 0.75)', edge: 'rgba(140,  30, 120, 0)', tint: '#ff77c8' },
    dark:     { core: 'rgba( 80,  30,  90, 0.85)', edge: 'rgba( 10,   0,  20, 0)', tint: '#4b1a50' },
    ghost:    { core: 'rgba(150,  90, 220, 0.72)', edge: 'rgba( 60,  20, 110, 0)', tint: '#9a5edc' },
    poison:   { core: 'rgba(180,  90, 220, 0.72)', edge: 'rgba( 80,  30, 110, 0)', tint: '#b45edc' },
    ground:   { core: 'rgba(210, 160,  90, 0.70)', edge: 'rgba(110,  70,  30, 0)', tint: '#d2a060' },
    rock:     { core: 'rgba(180, 140,  90, 0.70)', edge: 'rgba( 90,  60,  30, 0)', tint: '#b4885a' },
    bug:      { core: 'rgba(190, 220,  90, 0.70)', edge: 'rgba( 80, 110,  30, 0)', tint: '#bee35a' },
    steel:    { core: 'rgba(200, 210, 220, 0.65)', edge: 'rgba( 90, 100, 120, 0)', tint: '#c8d2dc' },
    fighting: { core: 'rgba(255, 140,  60, 0.80)', edge: 'rgba(160,  40,   0, 0)', tint: '#ff8c3c' },
    flying:   { core: 'rgba(170, 210, 255, 0.65)', edge: 'rgba( 70, 120, 200, 0)', tint: '#aad2ff' },
    dragon:   { core: 'rgba(130,  80, 255, 0.80)', edge: 'rgba( 40,  10, 140, 0)', tint: '#8250ff' },
    fairy:    { core: 'rgba(255, 170, 230, 0.75)', edge: 'rgba(180,  60, 140, 0)', tint: '#ffaae6' },
    normal:   { core: 'rgba(255, 240, 200, 0.70)', edge: 'rgba(160, 140,  80, 0)', tint: '#fff0c8' },
};

// Moves that are "heavy hitters" -- they get longer flashes, stronger vignette,
// and the chromatic split. This list is hand-curated from the signature /
// ultimate moves in the move dex. Easy to extend over time.
const HEAVY_MOVES = new Set([
    'hyper-beam', 'giga-impact', 'self-destruct', 'explosion',
    'earthquake', 'blast-burn', 'hydro-cannon', 'frenzy-plant',
    'volt-tackle', 'draco-meteor', 'close-combat', 'focus-punch',
    'meteor-mash', 'overheat', 'outrage', 'fire-blast', 'thunder',
    'blizzard', 'solar-beam', 'zap-cannon', 'head-smash', 'light-of-ruin',
    'spacial-rend', 'roar-of-time', 'judgment', 'v-create', 'sacred-fire',
    'doom-desire', 'psycho-boost', 'origin-pulse', 'precipice-blades',
    'dragon-energy', 'astral-barrage', 'behemoth-blade', 'behemoth-bash',
    'eternabeam', 'dynamax-cannon', 'max-flare', 'max-geyser', 'max-lightning',
    'max-overgrowth', 'max-hailstorm', 'max-phantasm', 'max-darkness',
    'max-knuckle', 'max-airstream', 'max-ooze', 'max-quake', 'max-rockfall',
    'max-flutterby', 'max-starfall', 'max-wyrmwind', 'max-mindstorm',
    'max-steelspike', 'max-strike', 'max-guard',
]);

const slugify = (s?: string) =>
    (s || '')
        .toLowerCase()
        .trim()
        .replace(/['’`]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

interface Props {
    vfx: BattleState['vfx'];
}

export const BattleFxOverlay: React.FC<Props> = ({ vfx }) => {
    if (!vfx) return null;

    // Ignore payloads that are popups rather than move casts.
    const skip =
        vfx.damage !== undefined ||
        vfx.isMiss ||
        ['stat-up', 'stat-down', 'burn', 'freeze', 'paralysis', 'poison_status', 'sleep', 'miss'].includes(vfx.type);
    if (skip) return null;

    const typeKey = vfx.type.toLowerCase();
    const flash = TYPE_FLASH[typeKey];
    if (!flash) return null;

    const moveSlug = slugify(vfx.moveName);
    const isHeavy = HEAVY_MOVES.has(moveSlug);
    const keyId = `${vfx.type}-${vfx.target}-${vfx.index}-${moveSlug}`;

    // Intensity multipliers
    const flashDur = isHeavy ? 0.65 : 0.4;
    const flashOpacity = isHeavy ? 1 : 0.85;
    const vignetteOpacity = isHeavy ? 0.75 : 0.45;
    const vignetteDur = isHeavy ? 0.75 : 0.5;

    return (
        <div className="absolute inset-0 pointer-events-none z-[70] overflow-hidden">
            <AnimatePresence>
                {/* ---------- Layer 1: Type-colored radial flash ---------- */}
                <motion.div
                    key={`flash-${keyId}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, flashOpacity, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: flashDur, times: [0, 0.15, 1], ease: 'easeOut' }}
                    className="absolute inset-0"
                    style={{
                        background: `radial-gradient(circle at center, ${flash.core} 0%, ${flash.edge} 75%)`,
                        mixBlendMode: 'screen',
                    }}
                />

                {/* ---------- Layer 2: Edge vignette ---------- */}
                <motion.div
                    key={`vignette-${keyId}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, vignetteOpacity, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: vignetteDur, ease: 'easeOut' }}
                    className="absolute inset-0"
                    style={{
                        boxShadow: `inset 0 0 ${isHeavy ? 160 : 100}px ${isHeavy ? 60 : 30}px rgba(0, 0, 0, 0.95)`,
                    }}
                />

                {/* ---------- Layer 3: Rim tint (subtle color wash that sells the "screen turned X color" vibe) ---------- */}
                <motion.div
                    key={`tint-${keyId}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.35, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: flashDur * 0.9, ease: 'easeOut' }}
                    className="absolute inset-0"
                    style={{
                        background: flash.tint,
                        mixBlendMode: 'soft-light',
                    }}
                />

                {/* ---------- Layer 4: Chromatic shockwave on heavy moves ---------- */}
                {isHeavy && (
                    <motion.div
                        key={`shockwave-${keyId}`}
                        initial={{ scale: 0.1, opacity: 0.9 }}
                        animate={{ scale: 3.5, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.75, ease: 'easeOut' }}
                        className="absolute left-1/2 top-1/2 w-[40vw] h-[40vw] rounded-full -translate-x-1/2 -translate-y-1/2"
                        style={{
                            border: `4px solid ${flash.tint}`,
                            boxShadow: `0 0 80px 20px ${flash.tint}, inset 0 0 60px 10px ${flash.tint}`,
                            mixBlendMode: 'screen',
                        }}
                    />
                )}

                {/* ---------- Layer 5: Screen-space impact sparkles ----------
                 * 18 particles radiating out from the center. CSS keyframe
                 * driven so framer doesn't animate 18 motion components. */}
                <motion.div
                    key={`sparks-${keyId}`}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: isHeavy ? 0.9 : 0.6, ease: 'easeOut' }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    {Array.from({ length: isHeavy ? 28 : 18 }).map((_, i) => {
                        const angle = (i / (isHeavy ? 28 : 18)) * Math.PI * 2;
                        const dist = 35 + Math.random() * 25;
                        const dx = Math.cos(angle) * dist;
                        const dy = Math.sin(angle) * dist;
                        const sz = 6 + Math.random() * 8;
                        const dur = 0.5 + Math.random() * 0.4;
                        return (
                            <span
                                key={i}
                                className="absolute rounded-full"
                                style={{
                                    width: sz,
                                    height: sz,
                                    background: flash.tint,
                                    boxShadow: `0 0 ${sz * 2}px ${flash.tint}`,
                                    left: '50%',
                                    top: '50%',
                                    animation: `vfx-spark ${dur}s ease-out forwards`,
                                    ['--dx' as any]: `${dx}vw`,
                                    ['--dy' as any]: `${dy}vh`,
                                }}
                            />
                        );
                    })}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
