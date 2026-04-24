import React from 'react';

/**
 * OverworldTrainer
 * --------------------------------------------------------------
 * An original, lightweight pixel-art overworld sprite rendered as
 * inline SVG. No external assets, no licensed sprites -- we draw
 * every pose from scratch using colored rects.
 *
 * Why inline SVG instead of a PNG sprite sheet:
 *  - Zero network cost, no CORS, no pixelation aliasing issues.
 *  - We can cleanly parameterize pose (facing + walk frame) from
 *    React state and avoid `background-position` math.
 *  - Scales crisply at any tile size (we always render pixel-snapped
 *    rects with shape-rendering:crispEdges).
 *
 * Character design (legally safe original):
 *  - Blue cap + white undershirt peeking through
 *  - Dark-navy pants, black boots
 *  - Red/orange jacket, brown satchel strap visible from behind
 *  - Warm skin + brown hair fringe
 *
 * The component takes `facing` ('up'/'down'/'left'/'right') and a
 * two-state `frame` (0|1). The parent cycles `frame` on a timer while
 * the character is moving, giving a proper two-beat walk cycle.
 */

export type TrainerFacing = 'up' | 'down' | 'left' | 'right';

interface Props {
    facing: TrainerFacing;
    isMoving: boolean;
    frame: 0 | 1;
    /** Uniform tint (hue-rotate filter) to distinguish remote players. */
    hue?: number;
    /** Optional pixel scale -- defaults to 48x64 display (20x28 viewBox). */
    size?: number;
}

// Centralized palette so the four pose functions stay in sync.
const PALETTE = {
    cap: '#2b63d8',
    capBand: '#18397f',
    capShadow: '#0e255a',
    hair: '#6b3a1a',
    hairDark: '#44250c',
    skin: '#f4c9a4',
    skinShade: '#d89e76',
    shirt: '#e85a2a',
    shirtShade: '#a83a13',
    shirtLight: '#f48a52',
    pants: '#1f2a44',
    pantsShade: '#0f1628',
    boot: '#171717',
    bootShade: '#0a0a0a',
    eye: '#141414',
    bag: '#5a3b1f',
    bagShade: '#3b2510',
    undershirt: '#f5f1e8',
    outline: '#0b0f1a',
};

type Piece = { x: number; y: number; w: number; h: number; fill: string };
const P = (x: number, y: number, w: number, h: number, fill: string): Piece => ({ x, y, w, h, fill });

// ------------------------------------------------------------------
// Pose builders -- each returns an ordered list of rects. Back-to-front
// order: shadow layers last so they draw on top when overlapping.
// ------------------------------------------------------------------

/** Front view (facing down -- eyes visible). */
function frontPose(legAY: number, legBY: number): Piece[] {
    const C = PALETTE;
    const parts: Piece[] = [];

    // Cap (top of head) -- two rows of blue + a darker band.
    parts.push(P(6, 3, 8, 2, C.cap));
    parts.push(P(5, 4, 10, 2, C.cap));
    parts.push(P(5, 5, 10, 1, C.capBand));
    parts.push(P(4, 6, 12, 1, C.capBand)); // brim
    parts.push(P(4, 6, 12, 1, C.capShadow)); // brim deep shadow line reuses

    // Hair fringe peeking under the brim.
    parts.push(P(6, 7, 8, 1, C.hair));
    parts.push(P(6, 7, 1, 1, C.hairDark));
    parts.push(P(13, 7, 1, 1, C.hairDark));

    // Head / face.
    parts.push(P(6, 8, 8, 2, C.skin));
    parts.push(P(6, 9, 1, 1, C.skinShade));
    parts.push(P(13, 9, 1, 1, C.skinShade));
    // Eyes.
    parts.push(P(8, 8, 1, 1, C.eye));
    parts.push(P(11, 8, 1, 1, C.eye));
    // Chin shadow.
    parts.push(P(7, 10, 6, 1, C.skinShade));

    // Torso -- jacket with undershirt V.
    parts.push(P(5, 11, 10, 6, C.shirt));
    parts.push(P(5, 11, 10, 1, C.shirtShade));
    parts.push(P(14, 12, 1, 5, C.shirtShade));
    parts.push(P(9, 11, 2, 2, C.undershirt));
    parts.push(P(9, 13, 2, 1, C.shirtShade));
    // Highlight.
    parts.push(P(6, 12, 1, 3, C.shirtLight));

    // Arms.
    parts.push(P(3, 11, 2, 5, C.shirt));
    parts.push(P(3, 11, 1, 5, C.shirtShade));
    parts.push(P(15, 11, 2, 5, C.shirt));
    parts.push(P(16, 11, 1, 5, C.shirtShade));
    // Hands.
    parts.push(P(3, 16, 2, 1, C.skin));
    parts.push(P(15, 16, 2, 1, C.skin));

    // Belt.
    parts.push(P(5, 17, 10, 1, C.pantsShade));

    // Legs -- two rects, with individual Y offset for the walk beat.
    parts.push(P(6, 18 + legAY, 3, 4, C.pants));
    parts.push(P(6, 18 + legAY, 3, 1, C.pantsShade));
    parts.push(P(11, 18 + legBY, 3, 4, C.pants));
    parts.push(P(11, 18 + legBY, 3, 1, C.pantsShade));

    // Boots.
    parts.push(P(6, 22 + legAY, 3, 2, C.boot));
    parts.push(P(6, 23 + legAY, 3, 1, C.bootShade));
    parts.push(P(11, 22 + legBY, 3, 2, C.boot));
    parts.push(P(11, 23 + legBY, 3, 1, C.bootShade));

    return parts;
}

/** Back view (facing up -- no eyes, hair visible, satchel strap). */
function backPose(legAY: number, legBY: number): Piece[] {
    const C = PALETTE;
    const parts: Piece[] = [];

    // Cap.
    parts.push(P(6, 3, 8, 2, C.cap));
    parts.push(P(5, 4, 10, 2, C.cap));
    parts.push(P(5, 5, 10, 1, C.capBand));
    parts.push(P(4, 6, 12, 1, C.capBand));

    // Back of head -- hair covers more of it.
    parts.push(P(5, 7, 10, 3, C.hair));
    parts.push(P(5, 7, 10, 1, C.hairDark));
    parts.push(P(5, 9, 10, 1, C.hairDark));

    // Neck shadow.
    parts.push(P(8, 10, 4, 1, C.skinShade));

    // Torso (back).
    parts.push(P(5, 11, 10, 6, C.shirt));
    parts.push(P(5, 11, 10, 1, C.shirtShade));
    parts.push(P(5, 11, 1, 6, C.shirtShade));
    // Satchel strap crossing the back.
    parts.push(P(6, 11, 1, 6, C.bag));
    parts.push(P(6, 11, 1, 1, C.bagShade));
    parts.push(P(6, 16, 1, 1, C.bagShade));
    // Small satchel bulge.
    parts.push(P(14, 13, 3, 3, C.bag));
    parts.push(P(14, 13, 3, 1, C.bagShade));
    parts.push(P(16, 13, 1, 3, C.bagShade));

    // Arms.
    parts.push(P(3, 11, 2, 5, C.shirt));
    parts.push(P(3, 11, 1, 5, C.shirtShade));
    parts.push(P(15, 11, 2, 5, C.shirt));
    parts.push(P(16, 11, 1, 5, C.shirtShade));
    // Hands.
    parts.push(P(3, 16, 2, 1, C.skin));
    parts.push(P(15, 16, 2, 1, C.skin));

    // Belt.
    parts.push(P(5, 17, 10, 1, C.pantsShade));

    // Legs.
    parts.push(P(6, 18 + legAY, 3, 4, C.pants));
    parts.push(P(6, 18 + legAY, 3, 1, C.pantsShade));
    parts.push(P(11, 18 + legBY, 3, 4, C.pants));
    parts.push(P(11, 18 + legBY, 3, 1, C.pantsShade));

    // Boots.
    parts.push(P(6, 22 + legAY, 3, 2, C.boot));
    parts.push(P(6, 23 + legAY, 3, 1, C.bootShade));
    parts.push(P(11, 22 + legBY, 3, 2, C.boot));
    parts.push(P(11, 23 + legBY, 3, 1, C.bootShade));

    return parts;
}

/** Side view (facing right -- one eye visible, profile). Flipped for left. */
function sidePose(frontLegY: number, backLegY: number): Piece[] {
    const C = PALETTE;
    const parts: Piece[] = [];

    // Cap (bias to the right = front-facing side).
    parts.push(P(6, 3, 8, 2, C.cap));
    parts.push(P(5, 4, 10, 2, C.cap));
    parts.push(P(5, 5, 10, 1, C.capBand));
    // Brim extends further to the "front" (right).
    parts.push(P(5, 6, 12, 1, C.capBand));

    // Hair fringe.
    parts.push(P(5, 7, 10, 1, C.hair));
    parts.push(P(5, 7, 1, 1, C.hairDark));

    // Head (profile).
    parts.push(P(6, 8, 8, 2, C.skin));
    parts.push(P(6, 9, 1, 1, C.skinShade));
    // Single visible eye (front side).
    parts.push(P(11, 8, 1, 1, C.eye));
    // Ear hint at back.
    parts.push(P(6, 8, 1, 1, C.skinShade));
    // Nose.
    parts.push(P(14, 9, 1, 1, C.skinShade));

    // Torso -- slightly narrower in side view.
    parts.push(P(6, 11, 8, 6, C.shirt));
    parts.push(P(6, 11, 8, 1, C.shirtShade));
    parts.push(P(6, 11, 1, 6, C.shirtShade));
    // Undershirt sliver at neck.
    parts.push(P(10, 11, 2, 1, C.undershirt));

    // Bag strap visible on back side.
    parts.push(P(6, 12, 1, 4, C.bag));
    // Small satchel behind torso.
    parts.push(P(4, 13, 2, 3, C.bag));
    parts.push(P(4, 13, 2, 1, C.bagShade));

    // Front arm (swings opposite to front leg).
    // When frontLegY == 0 (planted) -> arm swings slightly back.
    // When frontLegY != 0 (lifted)  -> arm swings forward.
    const frontArmX = frontLegY < 0 ? 13 : 12;
    parts.push(P(frontArmX, 12, 2, 4, C.shirt));
    parts.push(P(frontArmX, 15, 2, 1, C.skin));
    // Back arm.
    const backArmX = backLegY < 0 ? 7 : 6;
    parts.push(P(backArmX, 12, 1, 4, C.shirtShade));

    // Belt.
    parts.push(P(6, 17, 8, 1, C.pantsShade));

    // Legs -- stride front/back based on frame.
    // Front leg (right side in side view).
    parts.push(P(10, 18 + frontLegY, 3, 4, C.pants));
    parts.push(P(10, 18 + frontLegY, 3, 1, C.pantsShade));
    // Back leg (left side in side view).
    parts.push(P(7, 18 + backLegY, 3, 4, C.pants));
    parts.push(P(7, 18 + backLegY, 3, 1, C.pantsShade));

    // Boots.
    parts.push(P(10, 22 + frontLegY, 3, 2, C.boot));
    parts.push(P(10, 23 + frontLegY, 3, 1, C.bootShade));
    parts.push(P(7, 22 + backLegY, 3, 2, C.boot));
    parts.push(P(7, 23 + backLegY, 3, 1, C.bootShade));

    return parts;
}

// ------------------------------------------------------------------
// Public component
// ------------------------------------------------------------------
export const OverworldTrainer: React.FC<Props> = ({ facing, isMoving, frame, hue, size = 48 }) => {
    // Legs offsets per frame. When idle we force a neutral pose so the
    // character doesn't appear to walk in place at a red light.
    let legA = 0, legB = 0;
    if (isMoving) {
        if (frame === 0) { legA = 0;  legB = -1; }
        else              { legA = -1; legB = 0;  }
    }

    // Left-facing reuses the right-facing sprite with a horizontal flip.
    const flipX = facing === 'left';
    const viewKey: 'down' | 'up' | 'right' = facing === 'down' ? 'down'
        : facing === 'up' ? 'up'
        : 'right';

    let pieces: Piece[];
    if (viewKey === 'down') pieces = frontPose(legA, legB);
    else if (viewKey === 'up') pieces = backPose(legA, legB);
    else pieces = sidePose(legA, legB);

    // Subtle whole-body bob while walking -- 1px lift on frame 1.
    const bobY = isMoving && frame === 1 ? -1 : 0;

    return (
        <svg
            viewBox="0 0 20 28"
            width={size}
            height={(size * 28) / 20}
            shapeRendering="crispEdges"
            style={{
                imageRendering: 'pixelated',
                transform: flipX ? 'scaleX(-1)' : undefined,
                transformOrigin: 'center',
                filter: hue ? `hue-rotate(${hue}deg) saturate(1.05)` : undefined,
                overflow: 'visible',
            }}
        >
            {/* Ground shadow (stays on the tile, doesn't bob with the body). */}
            <ellipse cx="10" cy="26.5" rx="5" ry="1.15" fill="rgba(0,0,0,0.38)" />
            <g transform={`translate(0, ${bobY})`}>
                {pieces.map((p, i) => (
                    <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} fill={p.fill} />
                ))}
            </g>
        </svg>
    );
};
