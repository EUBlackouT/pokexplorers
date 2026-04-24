
import React, { useEffect, useState, useRef } from 'react';
import { Coordinate, Chunk } from '../types';
import { MAPS, generateChunk, CHUNK_SIZE, getGrassAura, type GrassAura } from '../services/mapData';
import { BiomeAmbient } from './ui/BiomeAmbient';

// ---------------------------------------------------------------
// Overworld sprite sheets.
//
// These are the pret/pokeemerald Gen 3 `walking.png` strips for
// Brendan and May, bundled from /public/sprites/overworld/. The
// Gen 3 Hoenn style is the modern "proper walking" look the user
// asked for -- full palette, visible arms/legs, two-step bob.
//
// Each sheet is 144x32 -- nine 16x32 frames laid out horizontally:
//
//     x=0    DOWN-stand
//     x=16   UP-stand
//     x=32   LEFT-stand
//     x=48   DOWN-walkA
//     x=64   UP-walkA
//     x=80   LEFT-walkA
//     x=96   DOWN-walkB
//     x=112  UP-walkB
//     x=128  LEFT-walkB
//
// Right-facing is rendered by horizontally flipping the LEFT
// cells (Game Freak never ships a dedicated right-facing sprite --
// they flip the left frames at draw time, same as we do).
//
// Served as static files from /public so there is no CORS or CDN
// availability risk at runtime.
// ---------------------------------------------------------------
const SPRITE_SHEETS = {
    brendan:    '/sprites/overworld/brendan_walking.png',
    may:        '/sprites/overworld/may_walking.png',
    brendanRun: '/sprites/overworld/brendan_running.png',
    mayRun:     '/sprites/overworld/may_running.png',
} as const;
type TrainerFacing = 'up' | 'down' | 'left' | 'right';

// Step cadence in milliseconds -- one step = one tile. These values
// also drive the CSS transition and the "still moving" hold-over
// timer so that parity alternation, transform tweening, and
// animation-state all stay in sync.
const WALK_STEP_MS = 180;
const RUN_STEP_MS  = 100;

interface Props {
    p1Pos: Coordinate;
    p2Pos: Coordinate;
    mapId: string;
    loadedChunks: Record<string, Chunk>;
    customLayout?: number[][];
    myPlayerId: 1 | 2;
    networkRole?: 'host' | 'client' | null;
    onInteract?: (x: number, y: number) => void;
    onChallenge?: (playerId: string, playerInfo: any) => void;
    remotePlayers?: Map<string, any>;
    storyFlags?: string[];
    badges?: number;
    isScanning?: boolean;
    /** Aura Sight talent -- amplifies alpha/anomaly tile glow. */
    auraSight?: boolean;
    /** Local player is holding Shift -- render the running sprite
     *  and shorten the step tween. Remote players are purely
     *  cosmetic today; their run state isn't synced. */
    isRunning?: boolean;
}

/**
 * PlayerCharacter
 * -----------------------------------------------------------------
 * Renders the player as a Gen 3 Hoenn-style overworld walking
 * sprite (Brendan / May from pret/pokeemerald). The sheet is a
 * 144x32 horizontal strip of nine 16x32 cells -- three facings
 * (down/up/left) x three phases (stand / walkA / walkB).
 *
 * Right-facing reuses the LEFT cells with `scaleX(-1)`. While
 * moving we alternate walkA <-> walkB per tile-step (stepParity)
 * to produce the classic two-foot bob. Idle shows `stand`.
 *
 * The native 16x32 cell is scaled 4x to 64x128 so that the
 * character's feet align with the bottom of its tile (y =
 * pos.y + 1) and the head extends up into the tile above
 * (standard Gen 3 rendering).
 *
 * `spriteUrl` is kept for call-site compatibility: we route the
 * local player to Brendan, the remote player to May so two
 * players in the same room are visually distinct. Legacy
 * Showdown URLs (kris / leaf -> may, anything else -> brendan)
 * are also handled.
 */

/**
 * Canonical Gen 3 player walk frame table, taken directly from
 * pret/pokeemerald's `object_event_anims.h` sAnim_Go{South,North,
 * West} tables used by `sAnimTable_Standard` (the Brendan / May
 * normal walking anim). Every direction has its own dedicated
 * walk A/B frames -- there is NO h-flip between steps. Only
 * East is rendered as West mirrored.
 *
 *   sAnim_GoSouth: FRAME 3, FRAME 0, FRAME 4, FRAME 0   => 3,4 = down-walk A/B
 *   sAnim_GoNorth: FRAME 5, FRAME 1, FRAME 6, FRAME 1   => 5,6 = up-walk A/B
 *   sAnim_GoWest:  FRAME 7, FRAME 2, FRAME 8, FRAME 2   => 7,8 = left-walk A/B
 *
 * Frame indices (each 16 wide on a 144x32 strip):
 *   0 down-stand    3 down-walkA    6 up-walkB
 *   1 up-stand      4 down-walkB    7 left-walkA
 *   2 left-stand    5 up-walkA      8 left-walkB
 */
const FRAME_X = {
    downStand:  0,
    upStand:    16,
    leftStand:  32,
    downWalkA:  48,
    downWalkB:  64,
    upWalkA:    80,
    upWalkB:    96,
    leftWalkA:  112,
    leftWalkB:  128,
} as const;

function pickSheetFor(spriteUrl: string, isLocal: boolean, running: boolean): string {
    const u = (spriteUrl || '').toLowerCase();
    const goMay =
        u.includes('may') ||
        u.includes('kris') || u.includes('leaf') ||
        u.includes('lyra') || u.includes('rosa') || u.includes('hilda') ||
        (!u.includes('brendan') && !isLocal);
    if (goMay) return running ? SPRITE_SHEETS.mayRun : SPRITE_SHEETS.may;
    return running ? SPRITE_SHEETS.brendanRun : SPRITE_SHEETS.brendan;
}

const PlayerCharacter: React.FC<{ pos: Coordinate, isLocal: boolean, spriteUrl: string, label: string, isRunning?: boolean, onClick?: () => void }> = ({ pos, isLocal, spriteUrl, label, isRunning = false, onClick }) => {
    const [facing, setFacing] = useState<TrainerFacing>('down');
    const [isMoving, setIsMoving] = useState(false);
    const stepParity = useRef<'A' | 'B'>('A');
    const prevPos = useRef(pos);
    const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const TILE_SIZE = 64;

    // Display size: native cell 16x32 at 4x = 64x128. Characters are
    // one tile wide and two tiles tall -- feet sit in the current
    // tile, head pokes into the tile above (vanilla Gen 3 behaviour).
    const SPRITE_W = 64;
    const SPRITE_H = 128;
    const SHEET_W = 144 * 4; // 576 -- full sheet scaled
    const SHEET_H = 32 * 4;  // 128

    // Pick cadence based on whether the player is sprinting. Keep a
    // live ref too so the moveTimer below always reads the current
    // tempo even if isRunning flips mid-stride.
    const stepMs = isRunning ? RUN_STEP_MS : WALK_STEP_MS;
    const stepMsRef = useRef(stepMs);
    stepMsRef.current = stepMs;

    // Detect movement (position delta) and derive facing + parity.
    // Y takes priority so any diagonal same-tick network update
    // still reads cleanly. stepParity flips each step so the next
    // stride uses the opposite foot -- this is what gives the walk
    // cycle its "bob".
    useEffect(() => {
        const dx = pos.x - prevPos.current.x;
        const dy = pos.y - prevPos.current.y;
        if (dx === 0 && dy === 0) return;

        if (dy !== 0) setFacing(dy < 0 ? 'up' : 'down');
        else if (dx !== 0) setFacing(dx < 0 ? 'left' : 'right');

        stepParity.current = stepParity.current === 'A' ? 'B' : 'A';
        setIsMoving(true);
        if (moveTimer.current) clearTimeout(moveTimer.current);
        // Hold the "walking" state a hair past one full step so that
        // continuous movement never blips to a stand frame between
        // tiles, but we still settle to idle quickly after the last
        // step. Uses the live ref so walk->run switches take effect
        // immediately without a stale timeout.
        moveTimer.current = setTimeout(() => setIsMoving(false), stepMsRef.current + 40);
        prevPos.current = pos;

        return () => { if (moveTimer.current) { clearTimeout(moveTimer.current); moveTimer.current = null; } };
    }, [pos]);

    // Swap to the running sheet only while actually moving -- an idle
    // Shift-hold should still show the walking-stand pose. This also
    // makes the sprite "settle" cleanly after a sprint: feet land,
    // character stands normally.
    const sheet = pickSheetFor(spriteUrl, isLocal, isRunning && isMoving);

    // Resolve the correct cell for the current facing / walk phase
    // using the canonical Gen 3 rule set:
    //
    //   Each direction has its own dedicated stand + walk A/B
    //   frames (9 frames total). East is the only direction that
    //   borrows from another -- it mirrors West with scaleX(-1).
    //
    // This matches Game Freak's shipping animation data
    // (`sAnimTable_Standard` in pret/pokeemerald) and fixes the
    // earlier bug where walking LEFT/RIGHT showed the UP-walk
    // frame (old code mapped leftWalk to frames 5/6, but those
    // are the UP-walk cells on this sheet).
    const parityA = stepParity.current === 'A';
    let xNative: number;
    const flipX = facing === 'right';
    if (!isMoving) {
        if (facing === 'down')      xNative = FRAME_X.downStand;
        else if (facing === 'up')   xNative = FRAME_X.upStand;
        else                         xNative = FRAME_X.leftStand; // right mirrors this
    } else if (facing === 'down') {
        xNative = parityA ? FRAME_X.downWalkA : FRAME_X.downWalkB;
    } else if (facing === 'up') {
        xNative = parityA ? FRAME_X.upWalkA : FRAME_X.upWalkB;
    } else {
        xNative = parityA ? FRAME_X.leftWalkA : FRAME_X.leftWalkB; // right mirrors
    }
    const bgPosX = -xNative * 4;

    return (
        <div
            className={`absolute top-0 left-0 ease-linear z-30 will-change-transform ${onClick ? 'cursor-pointer pointer-events-auto' : 'pointer-events-none'}`}
            style={{
                // Head at pos.y-1, feet at pos.y. Sprite occupies the
                // current tile plus one tile above.
                transform: `translate(${pos.x * TILE_SIZE}px, ${(pos.y - 1) * TILE_SIZE}px)`,
                width: SPRITE_W,
                height: SPRITE_H,
                // Match the tween to the active step cadence so the
                // sprite glides *exactly* tile-to-tile and the foot-
                // plant lines up with the arrival frame. Prevents the
                // old "retarget every 30ms, never settle" jitter.
                transition: `transform ${stepMs}ms linear`,
            }}
            onClick={onClick}
            data-player-label={label}
        >
            <div className="w-full h-full relative flex items-end justify-center">
                {/* Soft ground shadow sits under the sprite's feet so
                    the character reads as grounded rather than floating. */}
                <div
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{
                        bottom: 2,
                        width: 40,
                        height: 10,
                        background: 'radial-gradient(ellipse, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0) 70%)',
                        pointerEvents: 'none',
                        zIndex: 1,
                    }}
                />
                {isLocal && (
                    <div className="absolute -top-4 text-yellow-300 font-bold text-[10px] animate-bounce z-40 drop-shadow-md font-mono">▼</div>
                )}
                {!isLocal && (
                    <div className="absolute -top-6 whitespace-nowrap bg-black/60 text-white text-[8px] px-2 py-1 rounded border border-white/20 z-40">
                        {label}
                    </div>
                )}
                <div
                    className="relative z-10"
                    style={{
                        width: SPRITE_W,
                        height: SPRITE_H,
                        backgroundImage: `url(${sheet})`,
                        backgroundSize: `${SHEET_W}px ${SHEET_H}px`,
                        backgroundPosition: `${bgPosX}px 0px`,
                        backgroundRepeat: 'no-repeat',
                        imageRendering: 'pixelated',
                        transform: flipX ? 'scaleX(-1)' : undefined,
                        transformOrigin: 'center',
                    }}
                />
            </div>
        </div>
    );
};


export const Overworld: React.FC<Props> = ({ p1Pos, p2Pos, mapId, loadedChunks, customLayout, myPlayerId, networkRole = null, onInteract, onChallenge, remotePlayers = new Map(), storyFlags = [], badges = 0, isScanning = false, auraSight = false, isRunning = false }) => {
    const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night'>('day');
    const [weather, setWeather] = useState<'none' | 'rain' | 'snow' | 'sandstorm'>('none');
    const containerRef = useRef<HTMLDivElement>(null);
    const TILE_SIZE = 64;
    const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const updateCamera = () => {
             const myPos = myPlayerId === 1 ? p1Pos : p2Pos;
             const viewportW = window.innerWidth;
             const viewportH = window.innerHeight;
             const targetX = myPos.x * TILE_SIZE + TILE_SIZE / 2;
             const targetY = myPos.y * TILE_SIZE + TILE_SIZE / 2;
             setCameraOffset({ x: Math.floor(viewportW / 2 - targetX), y: Math.floor(viewportH / 2 - targetY) });
        };
        window.addEventListener('resize', updateCamera);
        updateCamera();
        return () => window.removeEventListener('resize', updateCamera);
    }, [p1Pos, p2Pos, myPlayerId]);

    useEffect(() => {
        const tick = () => {
            if (mapId.includes('interior') || mapId.includes('center') || mapId.includes('mart') || mapId.includes('cave')) {
                setTimeOfDay('day');
                setWeather('none');
                return;
            }
            // Stretched to a 4-minute cycle (was 60s). Old loop was jarring --
            // night would slam shut every minute mid-walk. 240s makes each
            // phase breathable: day 150s, sunset 30s, night 60s.
            const now = new Date();
            const CYCLE = 240;
            const phase = Math.floor(now.getTime() / 1000) % CYCLE;
            if (phase < 150) setTimeOfDay('day');
            else if (phase < 180) setTimeOfDay('sunset');
            else setTimeOfDay('night');

            if (currentMap?.biome === 'snow') setWeather('snow');
            else if (currentMap?.biome === 'desert') setWeather('sandstorm');
            else if (currentMap?.biome === 'lake' && phase % 60 < 30) setWeather('rain');
            else setWeather('none');
        };
        const interval = setInterval(tick, 1000);
        tick();
        return () => clearInterval(interval);
    }, [mapId, loadedChunks]);
    
    let currentMap: any;
    if (mapId.startsWith('chunk_')) {
        currentMap = loadedChunks[mapId];
        if (!currentMap) {
            // Preview-only fallback. Runs when the player state points at a
            // chunk the host/save didn't persist (e.g. after a reload mid
            // transition). We don't know the current riftStability here, so
            // we stay conservative with `0`; the authoritative copy rendered
            // by App.tsx is generated with the live upgrade value.
            const [,cx,cy] = mapId.split('_');
            currentMap = generateChunk(parseInt(cx), parseInt(cy), 0);
        }
    } else {
        currentMap = MAPS[mapId];
    }

    const layout = currentMap ? (customLayout || currentMap.layout) : null;

    const [showInteractPrompt, setShowInteractPrompt] = useState(false);
    const [interactPos, setInteractPos] = useState<Coordinate | null>(null);

    useEffect(() => {
        if (!currentMap || !layout) return;
        const checkInteraction = () => {
            const myPos = myPlayerId === 1 ? p1Pos : p2Pos;
            const neighbors = [
                { x: myPos.x, y: myPos.y - 1 },
                { x: myPos.x, y: myPos.y + 1 },
                { x: myPos.x - 1, y: myPos.y },
                { x: myPos.x + 1, y: myPos.y }
            ];

            for (const n of neighbors) {
                const key = `${n.x},${n.y}`;
                const hasTrainer = currentMap.trainers?.[key];
                const hasNPC = currentMap.npcs?.[key];
                const hasInteractable = currentMap.interactables?.[key];
                
                let hasTileInteract = false;
                if (layout[n.y] && layout[n.y][n.x] !== undefined) {
                    const t = layout[n.y][n.x];
                    if ([12, 53, 56, 5, 10, 68].includes(t)) hasTileInteract = true;
                }

                if (hasTrainer || hasNPC || hasInteractable || hasTileInteract) {
                    setShowInteractPrompt(true);
                    setInteractPos(n);
                    return;
                }
            }
            setShowInteractPrompt(false);
            setInteractPos(null);
        };
        checkInteraction();
    }, [p1Pos, p2Pos, myPlayerId, currentMap, layout]);

    if (!currentMap) return <div className="text-white">Map Error: {mapId}</div>;

    // Position hash for deterministic per-tile variation (trees, grass tone,
    // flower color, prop jitter). Same (x,y,mapId) always returns the same
    // value so the world doesn't reshuffle as the player moves.
    const mapSalt = (() => {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < mapId.length; i++) {
            h ^= mapId.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
        }
        return h;
    })();
    const tileHash = (x: number, y: number): number => {
        let h = mapSalt ^ Math.imul(x + 1, 0x27d4eb2d) ^ Math.imul(y + 1, 0x165667b1);
        h ^= h >>> 13;
        h = Math.imul(h, 0x5bd1e995);
        h ^= h >>> 15;
        return h >>> 0;
    };

    // Classify a raw tile id into a broad "material" for edge-blend detection.
    // 0 = grass-like, 1 = sand, 2 = water, 3 = path/stone, 4 = other/solid.
    const tileMaterial = (t: number | undefined): 0 | 1 | 2 | 3 | 4 => {
        if (t === undefined) return 4;
        if (t === 3 || t === 88 || t === 90) return 2;        // water family
        if (t === 25 || t === 79 || t === 89 || t === 91) return 1; // sand family
        if (t === 4 || t === 17 || t === 7 || t === 20 || t === 29) return 3; // paths/stone/bridge
        // Grass-like: raw grass + anything decorated on top of grass-type tiles
        if (t === 0 || t === 2 || t === 13 || t === 14 || t === 8 ||
            t === 51 || t === 52 || t === 53 || t === 54 || t === 55 ||
            t === 56 || t === 57 || t === 58 || t === 59 || t === 66 ||
            t === 75 || t === 76 || t === 77 || t === 86) return 0;
        return 4;
    };

    // Extract integer chunk coords from the map id (or 0,0 for static maps).
    // Used for deterministic per-tile aura rolls on tall-grass cells.
    const chunkMatch = mapId.match(/^chunk_(-?\d+)_(-?\d+)$/);
    const currentCx = chunkMatch ? parseInt(chunkMatch[1], 10) : 0;
    const currentCy = chunkMatch ? parseInt(chunkMatch[2], 10) : 0;

    const renderTile = (tile: number, x: number, y: number) => {
        const key = `${x},${y}`;
        let className = "tile-base ";
        let content = null;

        const itemFlag = `item_${mapId}_${x}_${y}`;
        const isCollected = storyFlags.includes(itemFlag);
        const effectiveTile = (tile === 12 && isCollected) ? 4 : tile;

        // Precompute variants + neighbor materials so individual cases can
        // opt in without recomputing.
        const h = tileHash(x, y);
        const treeVar = h & 3;                   // 0..3
        const grassTone = (h >>> 3) & 3;         // 0..3
        const flowerVar = (h >>> 6) % 5;         // 0..4
        const propJitter = ((h >>> 9) & 15) - 8; // -8..+7 px
        const nN = layout?.[y - 1]?.[x];
        const nS = layout?.[y + 1]?.[x];
        const nE = layout?.[y]?.[x + 1];
        const nW = layout?.[y]?.[x - 1];
        const myMat = tileMaterial(effectiveTile);
        // Edge-blend: decide which sides (if any) need a shoreline/sand halo.
        // We only draw edges on grass or path tiles bordering sand/water.
        let edgeClass = '';
        if (myMat === 0 || myMat === 3) {
            if (tileMaterial(nN) === 2) edgeClass += ' edge-w-n';
            if (tileMaterial(nS) === 2) edgeClass += ' edge-w-s';
            if (tileMaterial(nE) === 2) edgeClass += ' edge-w-e';
            if (tileMaterial(nW) === 2) edgeClass += ' edge-w-w';
            if (tileMaterial(nN) === 1) edgeClass += ' edge-s-n';
            if (tileMaterial(nS) === 1) edgeClass += ' edge-s-s';
            if (tileMaterial(nE) === 1) edgeClass += ' edge-s-e';
            if (tileMaterial(nW) === 1) edgeClass += ' edge-s-w';
        }

        const trainer = currentMap.trainers?.[key];
        const npc = currentMap.npcs?.[key];
        
        const myPos = myPlayerId === 1 ? p1Pos : p2Pos;
        const dx = Math.abs(x - myPos.x);
        const dy = Math.abs(y - myPos.y);
        const isAdjacent = (dx + dy === 1);

        if (isScanning) {
            const isTallGrass = effectiveTile === 2;
            const isItem = effectiveTile === 12;
            if (isTallGrass || isItem) {
                className += " scan-highlight ";
            }
        }

        if (trainer) {
             content = (
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-auto cursor-pointer" style={{ width: TILE_SIZE * 1.5 }} onClick={() => onInteract?.(x, y)}>
                     {trainer.isGymLeader && (
                         <div className="bg-yellow-400 text-black text-[10px] font-bold px-2 rounded border border-black mb-1 animate-pulse">GYM LEADER</div>
                     )}
                     <div className="text-red-500 font-bold animate-bounce text-lg mb-1">!</div>
                     <div className="bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full mb-1 whitespace-nowrap border border-white/30 shadow-lg">
                         {trainer.name}
                         <span className="ml-1 text-yellow-400 font-bold">Lv.{trainer.level}</span>
                     </div>
                     <img 
                        src={trainer.sprite || 'https://play.pokemonshowdown.com/sprites/trainers/red.png'} 
                        className="w-20 h-20 object-contain drop-shadow-xl scale-110 -translate-y-2" 
                        alt="Trainer" 
                        referrerPolicy="no-referrer" 
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://play.pokemonshowdown.com/sprites/trainers/blue.png'; }}
                     />
                 </div>
             );
        } else if (npc) {
             content = (
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-auto cursor-pointer" style={{ width: TILE_SIZE * 1.5 }} onClick={() => onInteract?.(x, y)}>
                     {npc.challenge && (
                         <div className="bg-blue-500 text-white text-[10px] font-bold px-2 rounded border border-white mb-1 animate-bounce">CHALLENGE</div>
                     )}
                     {isAdjacent && <div className="animate-bounce bg-white text-black rounded-full px-3 py-1 text-xs mb-1 border border-black font-bold shadow-lg">💬</div>}
                     <div className="bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full mb-1 whitespace-nowrap border border-white/30 shadow-lg">
                         {npc.name}
                     </div>
                     <img 
                        src={npc.sprite && npc.sprite.length > 2 ? npc.sprite : 'https://play.pokemonshowdown.com/sprites/trainers/lass.png'} 
                        className="w-20 h-20 object-contain drop-shadow-xl scale-110 -translate-y-2" 
                        alt="NPC" 
                        referrerPolicy="no-referrer" 
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://play.pokemonshowdown.com/sprites/trainers/beauty.png'; }}
                     />
                 </div>
             );
        }

        const biome = currentMap?.biome || 'forest';
        let bgClass = "tile-grass";
        if (biome === 'desert') bgClass = "tile-sand";
        else if (biome === 'snow') bgClass = "tile-snow";
        else if (biome === 'canyon') bgClass = "tile-sand";
        else if (biome === 'cave') bgClass = "tile-cave-floor";
        else if (biome === 'lake') bgClass = "tile-grass";

        switch (effectiveTile) {
            case 0: className += "tile-grass"; break;
            case 1: className += `tile-tree tile-tree-v${treeVar} tile-grass`; break;
            case 2: {
                className += "tile-tall-grass tile-grass";
                // Only chunk-based maps get auras -- static MAPS (Pallet
                // interior, Rift, caves) don't pre-roll encounters anyway.
                const aura: GrassAura = chunkMatch ? getGrassAura(currentCx, currentCy, x, y) : 'normal';
                if (aura !== 'normal') {
                    className += ` tile-aura-${aura}`;
                    // Aura Sight talent: add a beacon marker on rare auras
                    // so they read from across the screen. The glow/particle
                    // layers already render -- this pins a tall column of
                    // light so alpha/anomaly tiles pop out of distant grass.
                    const beacon = auraSight && (aura === 'alpha' || aura === 'anomaly');
                    content = (
                        <>
                            <div className={`aura-glow aura-${aura}`} aria-hidden="true" />
                            <div className={`aura-particles aura-particles-${aura}`} aria-hidden="true" />
                            {beacon && (
                                <div
                                    aria-hidden="true"
                                    className="absolute left-1/2 -translate-x-1/2 bottom-0 w-2 h-40 pointer-events-none animate-pulse"
                                    style={{
                                        background: aura === 'anomaly'
                                            ? 'linear-gradient(to top, rgba(236,72,153,0.9), rgba(236,72,153,0) 80%)'
                                            : 'linear-gradient(to top, rgba(251,191,36,0.9), rgba(251,191,36,0) 80%)',
                                        filter: 'blur(1px)',
                                    }}
                                />
                            )}
                        </>
                    );
                }
                break;
            }
            case 3: className += "tile-water"; break;
            case 4: className += "tile-path"; break;
            case 5: 
                className += "tile-checkered"; 
                content = (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-14 bg-stone-300 rounded-t-xl border-x-4 border-t-4 border-stone-500 shadow-xl flex flex-col items-center">
                        <div className="w-8 h-8 bg-pink-400 rounded-full border-4 border-pink-600 shadow-inner mt-2 animate-pulse flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full opacity-60"></div>
                        </div>
                        <div className="w-full h-2 bg-stone-400 mt-auto"></div>
                    </div>
                ); 
                break;
            case 7: className += "tile-cave-floor"; break; 
            case 8: className += "tile-fence tile-grass"; break;
            case 9: className += "tile-path"; content = <div className="absolute inset-0 bg-purple-900/50 animate-pulse"></div>; break;
            case 10: className += "tile-checkered"; content = <div className="absolute bottom-0 w-full h-3/4 bg-blue-600 border-t-4 border-blue-400"></div>; break;
            case 12: // Item Ball
                className += bgClass;
                content = (
                    <div
                        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto cursor-pointer"
                        onClick={() => onInteract?.(x, y)}
                        aria-label="Item Ball"
                    >
                        <div className="overworld-item-ball" aria-hidden="true">
                            <div className="overworld-item-ball-glow" />
                            <div className="overworld-item-ball-core">
                                <div className="overworld-item-ball-top" />
                                <div className="overworld-item-ball-bot" />
                                <div className="overworld-item-ball-seam" />
                                <div className="overworld-item-ball-btn" />
                            </div>
                        </div>
                    </div>
                );
                break;
            case 13: {
                className += "tile-grass";
                // Pick a flower variant from the 5 flower sprites. Keeps the
                // "pink cluster flower" as the default look but adds daisies,
                // tulips, bluebells, sunflowers across the map for variety.
                const flowerSprites = ['flower-cluster-pink', 'flower-daisy', 'flower-tulip-red', 'flower-bluebell', 'flower-sunflower'];
                const flowerCls13 = flowerSprites[flowerVar];
                content = (
                    <div className={`absolute inset-0 pointer-events-none ${flowerCls13}`} />
                );
                break;
            }
            case 14: className += "tile-ledge tile-grass"; break;
            case 15: className += "tile-wood"; break;
            case 17: className += "tile-checkered"; break;
            case 19: className += "tile-danger"; break;
            case 20: className += "tile-stone"; break;
            case 21: className += "tile-pillar tile-stone"; break;
            case 22: className += "tile-statue tile-stone"; break;
            case 23: className += `tile-tree tile-tree-dark tile-tree-v${treeVar} tile-grass`; break;
            case 24: className += "tile-rock-wall"; break; 
            case 25: className += "tile-sand"; break;
            case 26: className += "tile-snow"; break;
            case 27: className += "tile-ice"; break;
            case 28: className += "tile-lava"; break;
            case 29: className += "tile-bridge"; break;
            case 30: case 31: case 32:
                className += "tile-roof-red tile-grass";
                // Roof corners: left shingle cap / right shingle cap, center gets emblem.
                if (tile === 30) className += ' roof-cap-l';
                if (tile === 32) className += ' roof-cap-r';
                if (tile === 31) content = (
                    <div className="tile-poke-center-sign" aria-label="Pokemon Center">
                        <div className="poke-sign-ball" />
                        <div className="poke-sign-label">CENTER</div>
                    </div>
                );
                break;
            case 33: case 35: case 83: case 85:
                className += "tile-wall-house tile-grass";
                if (tile === 33) className += ' wall-edge-l';
                if (tile === 35) className += ' wall-edge-r';
                if (tile === 83) className += ' wall-edge-l wall-base';
                if (tile === 85) className += ' wall-edge-r wall-base';
                break;
            case 34: className += "tile-window tile-wall-house tile-grass"; break;
            case 40: case 41: case 42:
                className += "tile-roof-blue tile-grass";
                if (tile === 40) className += ' roof-cap-l';
                if (tile === 42) className += ' roof-cap-r';
                if (tile === 41) content = (
                    <div className="tile-poke-mart-sign" aria-label="Pokemon Mart">
                        <div className="poke-sign-mart-letter">M</div>
                        <div className="poke-sign-label poke-sign-label-blue">MART</div>
                    </div>
                );
                break;
            case 43: case 45:
                className += "tile-wall-house wall-mart tile-grass";
                if (tile === 43) className += ' wall-edge-l';
                if (tile === 45) className += ' wall-edge-r';
                break;
            case 80: case 81: case 82:
                className += "tile-roof-orange tile-grass";
                if (tile === 80) className += ' roof-cap-l';
                if (tile === 82) className += ' roof-cap-r';
                if (tile === 81) content = <div className="house-chimney" />;
                break;
            case 50: 
                className += "tile-mat"; 
                content = (
                    <div className="absolute inset-x-1 bottom-0 top-2 bg-blue-100/40 border-2 border-gray-400 rounded-t-sm flex items-center justify-center shadow-inner backdrop-blur-[1px]">
                        <div className="w-0.5 h-full bg-gray-400/50"></div>
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gray-600 rounded-full shadow-sm"></div>
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gray-600 rounded-full shadow-sm"></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                    </div>
                );
                break;
            case 51: className += "tile-grass"; content = <div className="campfire-container"><div className="campfire-flame"></div><div className="campfire-logs"></div></div>; break;
            case 52: className += "tile-tent tile-grass"; break;
            case 53: 
                className += "tile-sign tile-grass"; 
                content = (
                    <div className="absolute inset-x-2 bottom-2 top-4 bg-amber-700 border-2 border-amber-900 rounded-sm shadow-md">
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-2 bg-amber-900"></div>
                    </div>
                );
                break;
            case 54: 
                className += "tile-well tile-grass"; 
                content = (
                    <div className="absolute inset-1 border-4 border-stone-500 rounded-full bg-stone-700 shadow-inner overflow-hidden">
                        <div className="absolute inset-2 bg-blue-900/50 rounded-full animate-pulse"></div>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-stone-400/30"></div>
                    </div>
                );
                break;
            case 55: 
                className += "tile-fountain tile-grass"; 
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full border-4 border-stone-400 bg-blue-400 shadow-inner">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white/50 rounded-full animate-ping"></div>
                        </div>
                    </div>
                );
                break;
            case 56: 
                className += "tile-berry-tree tile-grass"; 
                content = (
                    <div className="absolute inset-x-2 bottom-0 top-2 flex flex-col items-center pointer-events-auto cursor-pointer" onClick={() => onInteract?.(x, y)}>
                        <div className="w-12 h-12 bg-green-600 rounded-full border-4 border-green-800 shadow-lg relative">
                            <div className="absolute top-2 left-2 w-3 h-3 bg-red-500 rounded-full shadow-md animate-pulse"></div>
                            <div className="absolute bottom-2 right-2 w-3 h-3 bg-red-500 rounded-full shadow-md animate-pulse"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-300 rounded-full blur-[1px]"></div>
                        </div>
                        <div className="w-2 h-4 bg-amber-900 border-x-2 border-amber-950"></div>
                    </div>
                );
                break;
            case 57: 
                className += "tile-grass"; 
                content = (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-6 bg-stone-500 rounded-full border-b-4 border-stone-700 shadow-lg flex items-center justify-center overflow-hidden">
                        <div className="absolute top-0 left-1 w-4 h-2 bg-stone-400/40 rounded-full blur-[1px]"></div>
                        <div className="absolute bottom-1 right-1 w-2 h-1 bg-stone-800/30 rounded-full"></div>
                    </div>
                ); 
                break;
            case 58: 
                className += "tile-grass"; 
                content = (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-green-700 rounded-full border-2 border-green-900 shadow-md flex items-center justify-center overflow-hidden">
                        <div className="absolute -top-1 -left-1 w-6 h-6 bg-green-600 rounded-full opacity-40"></div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-800 rounded-full opacity-40"></div>
                        <div className="w-4 h-4 bg-green-500/30 rounded-full blur-[2px]"></div>
                    </div>
                ); 
                break;
            case 59: className += "tile-grass"; content = <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-4 bg-amber-900 rounded-sm border border-amber-950 rotate-12 shadow-md"></div>; break;
            case 60: className += "tile-wood"; content = <div className="deco-table"></div>; break;
            case 61: className += "tile-wood"; content = <div className="deco-tv"></div>; break;
            case 62: className += "tile-wood"; content = <div className="deco-bed"></div>; break;
            case 63: className += "tile-wood"; content = <div className="deco-bookshelf"></div>; break;
            case 64: className += "tile-wood"; content = <div className="deco-plant"></div>; break;
            case 65: 
                className += "tile-stone"; 
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-blue-500/30 border-2 border-blue-300 rounded-lg animate-pulse flex items-center justify-center">
                            <div className="text-white text-xl">⚡</div>
                        </div>
                    </div>
                );
                break;
            case 66: 
                className += "tile-grass"; 
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 bg-cyan-400/40 rounded-full border-4 border-cyan-200 animate-pulse flex items-center justify-center">
                            <div className="text-white text-2xl">✨</div>
                        </div>
                    </div>
                );
                break;
            case 67: 
                className += "tile-stone"; 
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-red-500/30 border-2 border-red-300 rounded-lg animate-pulse flex items-center justify-center">
                            <div className="text-white text-xl">🔥</div>
                        </div>
                    </div>
                );
                break;
            case 68: 
                className += "tile-danger"; 
                content = (
                    <div className="absolute inset-0 bg-black overflow-hidden">
                        <div className="absolute inset-0 bg-purple-600/40 animate-pulse scale-150 blur-xl"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-purple-400 rounded-full animate-spin"></div>
                        </div>
                    </div>
                );
                break;
            case 70: className += "tile-ice"; break;
            case 71: 
                className += "tile-stone"; 
                content = (
                    <div className="absolute inset-1 bg-stone-600 border-4 border-stone-800 rounded shadow-2xl flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-stone-400/30 rounded-full"></div>
                    </div>
                );
                break;
            case 72: 
                className += "tile-cave-floor"; 
                content = <div className="absolute inset-3 bg-black rounded-full shadow-inner"></div>;
                break;
            case 73: className += "tile-wood"; content = <div className="absolute inset-1 bg-red-800/40 border border-red-900/20 rounded shadow-inner"></div>; break;
            case 74: 
                className += "tile-reward"; 
                content = (
                    <div className="absolute inset-0 flex items-center justify-center animate-bounce">
                        <div className="w-8 h-8 bg-yellow-500 border-2 border-yellow-700 rounded shadow-lg flex items-center justify-center">
                            <div className="w-4 h-1 bg-yellow-900"></div>
                        </div>
                    </div>
                );
                break;
            case 75: case 76: case 77:
                className += "tile-grass";
                const flowerColor = tile === 75 ? 'bg-red-500' : (tile === 76 ? 'bg-blue-500' : 'bg-yellow-400');
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-3 h-3 ${flowerColor} rounded-full shadow-sm animate-pulse`}></div>
                        <div className={`absolute top-2 left-2 w-2 h-2 ${flowerColor} rounded-full opacity-60`}></div>
                        <div className={`absolute bottom-2 right-2 w-2 h-2 ${flowerColor} rounded-full opacity-60`}></div>
                    </div>
                );
                break;
            case 78:
                className += (mapId.startsWith('cave_') ? "tile-cave-floor" : "tile-grass");
                content = (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <div className="w-6 h-4 bg-red-600 rounded-t-full border-2 border-red-800 relative">
                            <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full opacity-60"></div>
                        </div>
                        <div className="w-2 h-2 bg-stone-200"></div>
                    </div>
                );
                break;
            case 79:
                className += "tile-sand";
                content = (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <div className="w-6 h-10 bg-green-700 border-x-2 border-t-2 border-green-900 rounded-t-lg relative">
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-green-900/30"></div>
                            <div className="absolute top-1 left-1 w-1 h-1 bg-white/20 rounded-full"></div>
                        </div>
                    </div>
                );
                break;
            case 86:
                className += "tile-snow";
                content = <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-6 bg-white rounded-t-full shadow-inner border-b-2 border-blue-100"></div>;
                break;
            case 87:
                className += (mapId.startsWith('cave_') ? "tile-cave-floor" : "tile-snow");
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-10 bg-cyan-300/60 border border-cyan-100 rotate-45 animate-pulse shadow-[0_0_10px_rgba(165,243,252,0.5)]"></div>
                    </div>
                );
                break;
            case 88:
                className += "tile-water";
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-8 bg-green-800/80 rounded-[40%] border-2 border-green-950 relative">
                            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-pink-400 rounded-full blur-[1px] opacity-60"></div>
                        </div>
                    </div>
                );
                break;
            case 89:
                className += "tile-sand";
                content = (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1">
                        <div className="w-1 h-10 bg-amber-900 rounded-full -rotate-6"></div>
                        <div className="w-1 h-8 bg-amber-800 rounded-full rotate-3"></div>
                        <div className="w-1 h-12 bg-amber-950 rounded-full rotate-12"></div>
                    </div>
                );
                break;
            case 90:
                className += "tile-water";
                content = (
                    <div className="absolute inset-0 flex items-center justify-center gap-2">
                        <div className="w-1 h-full bg-green-500/40 animate-wave rounded-full"></div>
                        <div className="w-1 h-full bg-green-600/30 animate-wave-delayed rounded-full"></div>
                    </div>
                );
                break;
            case 91:
                className += "tile-sand";
                content = (
                    <div className="absolute inset-0">
                        <div className="absolute top-2 left-3 w-2 h-2 bg-white rounded-full opacity-80"></div>
                        <div className="absolute bottom-3 right-4 w-2 h-2 bg-pink-200 rounded-full opacity-80"></div>
                        <div className="absolute top-6 left-8 w-1.5 h-1.5 bg-orange-100 rounded-full opacity-80"></div>
                    </div>
                );
                break;
            case 92:
                className += (biome === 'desert' ? "tile-sand" : "tile-stone");
                content = (
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 left-1/2 w-px h-full bg-black rotate-12"></div>
                        <div className="absolute left-0 top-1/2 w-full h-px bg-black -rotate-12"></div>
                    </div>
                );
                break;
            case 93: // Rift Crystal (Small)
                className += (biome === 'cave' ? "tile-cave-floor" : "tile-stone");
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-6 bg-purple-500/80 rounded-full blur-[2px] animate-pulse"></div>
                        <div className="absolute w-3 h-5 bg-purple-300 rotate-45 skew-x-12 shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
                    </div>
                );
                break;
            case 94: // Rift Crystal (Large)
                className += (biome === 'cave' ? "tile-cave-floor" : "tile-stone");
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-10 bg-purple-600/60 rounded-full blur-[4px] animate-pulse"></div>
                        <div className="absolute w-6 h-10 bg-purple-400 rotate-12 -skew-x-12 shadow-[0_0_20px_rgba(168,85,247,1)]"></div>
                        <div className="absolute w-4 h-8 bg-purple-200 -rotate-12 skew-y-12 opacity-80"></div>
                    </div>
                );
                break;
            case 95: // Ancient Pillar (Broken)
                className += "tile-stone";
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-6 bg-gray-400 border-2 border-gray-600 rounded-sm rotate-45 shadow-lg"></div>
                        <div className="absolute w-8 h-4 bg-gray-500 border border-gray-700 -rotate-12 translate-x-2 translate-y-2"></div>
                    </div>
                );
                break;
            case 96: // Ancient Pillar (Intact)
                className += "tile-stone";
                content = (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-14 bg-gray-300 border-x-4 border-gray-500 shadow-2xl relative">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gray-400"></div>
                            <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-400"></div>
                            <div className="absolute inset-2 border border-gray-400/30"></div>
                        </div>
                    </div>
                );
                break;
            case 97: // Lamppost (glows warm at night)
                // If an NPC/trainer already claimed this tile, fall back to
                // plain grass so the sprite isn't covered by the prop.
                if (trainer || npc) { className += "tile-grass"; break; }
                className += "tile-grass tile-lamppost";
                content = (
                    <>
                        <div className="lamp-post-stem" />
                        <div className={`lamp-post-head ${timeOfDay === 'night' ? 'lamp-lit' : ''}`} />
                        {timeOfDay === 'night' && <div className="lamp-post-glow" aria-hidden="true" />}
                    </>
                );
                break;
            case 98: // Wooden park bench
                if (trainer || npc) { className += "tile-grass"; break; }
                className += "tile-grass tile-bench";
                content = (
                    <>
                        <div className="bench-seat" />
                        <div className="bench-back" />
                        <div className="bench-leg-l" />
                        <div className="bench-leg-r" />
                    </>
                );
                break;
            case 99: // Mailbox
                if (trainer || npc) { className += "tile-grass"; break; }
                className += "tile-grass tile-mailbox";
                content = (
                    <>
                        <div className="mailbox-post" />
                        <div className="mailbox-box" />
                        <div className="mailbox-flag" />
                    </>
                );
                break;
            default: className += "tile-grass"; break;
        }

        // Grass tone variation so flat pastures don't look like linoleum. Only
        // plain grass-like tiles get toned; decorated grass tiles already have
        // their own visual focus so we leave them alone. We also skip any tile
        // hosting a trainer/npc so the subtle tint can never recolor a sprite.
        const applyGrassTone = (effectiveTile === 0) && !trainer && !npc;
        // Edge blend overlay element (drawn last so it layers on top of
        // pseudo-element props like trees/flowers). Only emitted when needed
        // to avoid a wasteful DOM node on every tile.
        const edgeOverlay = edgeClass.length > 0 ? <div className={`tile-edges${edgeClass}`} aria-hidden="true" /> : null;
        // Occasional ambient butterfly on forest/lake grass during the day.
        // We keep the spawn rate low (~1/64 tiles) and deterministic so the
        // world isn't visually noisy.
        const showButterfly = applyGrassTone && timeOfDay !== 'night' && (currentMap?.biome === 'forest' || currentMap?.biome === 'lake') && ((h & 63) === 7);

        return (
            <div
                key={`${x}-${y}`}
                className={className}
                data-grass-tone={applyGrassTone ? grassTone : undefined}
                data-flower-var={flowerVar}
            >
                {content}
                {showButterfly && <div className="tile-butterfly" aria-hidden="true" style={{ top: 8 + ((h >>> 12) & 15), left: 12 + propJitter }} />}
                {edgeOverlay}
            </div>
        );
    };

    const biomeClass = `biome-${currentMap?.biome || 'forest'}`;

    return (
        <div className={`w-full h-full relative bg-[#0f172a] overflow-hidden ${biomeClass}`}>
            <style>{`
                .tile-base { position: relative; width: ${TILE_SIZE}px; height: ${TILE_SIZE}px; box-sizing: border-box; image-rendering: pixelated; }

                /* =========================================================
                 * Ground tiles -- deeper palette, layered textures.
                 *
                 * Goals vs the old CSS:
                 *   - less neon / cartoony color (no raw #4ade80 grass)
                 *   - multi-layer backgrounds so the eye sees micro-detail
                 *     (dithered dots, grass blades, pebbles, scuff marks)
                 *   - a subtle vignette on most ground tiles so the edges
                 *     visually blend into neighbors instead of popping
                 *   - explicit background-color as a safety net in case the
                 *     SVG URL fails to load.
                 * ========================================================= */
                .tile-grass {
                  /* Background-color is the primary fill. All overlay layers
                   * are kept semi-transparent so biome-scoped color swaps
                   * (.biome-forest .tile-grass etc.) stay visible. */
                  background-color: #65a957;
                  background-image:
                    radial-gradient(ellipse 80% 60% at 50% 45%, rgba(255,255,255,0.06) 0%, transparent 65%),
                    radial-gradient(circle at 15% 25%, rgba(255,255,255,0.05) 0%, transparent 15%),
                    radial-gradient(circle at 82% 78%, rgba(0,0,0,0.10) 0%, transparent 18%),
                    url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 50c0-3 1-6 3-6s3 3 3 6M30 52c0-4 2-8 5-8s5 4 5 8M50 50c0-3 1-6 3-6s3 3 3 6M22 22c0-2 1-3 2-3s2 1 2 3M44 20c0-2 1-3 2-3s2 1 2 3M14 30c0-1 0.5-2 1-2s1 1 1 2M54 34c0-1 0.5-2 1-2s1 1 1 2' stroke='%234a8c3f' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3Cpath d='M12 52c0-2 0.5-4 1.5-4s1.5 2 1.5 4M34 54c0-2 1-4 2.5-4s2.5 2 2.5 4M52 52c0-2 0.5-4 1.5-4s1.5 2 1.5 4M26 24c0-1 0.5-2 1-2s1 1 1 2' stroke='%23234f1c' stroke-width='1' fill='none' stroke-linecap='round' opacity='0.7'/%3E%3Ccircle cx='6' cy='12' r='0.5' fill='%23234f1c' opacity='0.4'/%3E%3Ccircle cx='38' cy='8' r='0.5' fill='%23234f1c' opacity='0.4'/%3E%3Ccircle cx='58' cy='44' r='0.5' fill='%23234f1c' opacity='0.4'/%3E%3C/svg%3E"),
                    linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.12) 100%);
                  background-size: 100% 100%, 100% 100%, 100% 100%, ${TILE_SIZE}px ${TILE_SIZE}px, 100% 100%;
                  box-shadow: inset 0 0 14px rgba(34, 66, 26, 0.18);
                }
                .tile-stone {
                  background-color: #8b93a0;
                  background-image:
                    radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 60%),
                    url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='28' height='28' x='2' y='2' rx='3' fill='%2378818f'/%3E%3Crect width='28' height='28' x='2' y='2' rx='3' fill='none' stroke='%235a636f' stroke-width='1.5'/%3E%3Cpath d='M6 8l3 3M20 18l3 3M10 22l2 2M22 8l2 2' stroke='%23adb5bf' stroke-width='0.8' opacity='0.5'/%3E%3Ccircle cx='8' cy='20' r='0.8' fill='%235a636f'/%3E%3Ccircle cx='22' cy='10' r='0.6' fill='%235a636f'/%3E%3C/svg%3E");
                  background-size: 100% 100%, 32px 32px;
                  box-shadow: inset 0 0 10px rgba(0,0,0,0.15);
                }

                /* Tall grass: real clumped blades instead of the old
                 * solid-green pyramid. Rendered as overlapping blade tufts
                 * with a soft green base so the hit-zone still reads as
                 * "tall grass". */
                .tile-tall-grass {
                  position: relative;
                  background-color: #5f9f4f;
                  z-index: 1;
                  box-shadow: inset 0 0 12px rgba(20, 50, 12, 0.25);
                }
                .tile-tall-grass::before {
                  content: '';
                  position: absolute;
                  inset: 0;
                  background-image: radial-gradient(ellipse 60% 45% at 50% 70%, rgba(20,60,20,0.35) 0%, transparent 70%);
                  pointer-events: none;
                }
                .tile-tall-grass::after {
                  content: '';
                  position: absolute;
                  top: -14px; left: -2px; right: -2px; bottom: -2px;
                  background-image: url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke-linecap='round' fill='none'%3E%3Cpath d='M8 58c0-14 1-26 4-28M14 58c0-12 2-22 5-22M22 58c0-16 3-30 6-30M32 58c0-14 2-26 5-26M42 58c0-18 3-32 6-32M52 58c0-12 2-22 5-22M60 58c0-14 1-26 3-26' stroke='%231f4a1a' stroke-width='3'/%3E%3Cpath d='M8 58c0-14 1-26 4-28M14 58c0-12 2-22 5-22M22 58c0-16 3-30 6-30M32 58c0-14 2-26 5-26M42 58c0-18 3-32 6-32M52 58c0-12 2-22 5-22M60 58c0-14 1-26 3-26' stroke='%235aa84a' stroke-width='1.4'/%3E%3Cpath d='M12 34q-2 -4 -4 -4M20 30q2 -4 4 -4M30 26q-2 -4 -4 -4M40 24q2 -4 4 -4M50 28q-2 -4 -4 -4' stroke='%237bc768' stroke-width='1.2'/%3E%3C/g%3E%3C/svg%3E");
                  background-size: 100% 100%;
                  pointer-events: none;
                  filter: drop-shadow(0 3px 2px rgba(0,0,0,0.35));
                }

                /* ---- GRASS AURA TIERS ------------------------------------
                 * Overlays rendered on top of .tile-tall-grass when a chunk's
                 * per-tile hash promotes the patch. Each tier gets its own
                 * palette + particle pattern so the player can read them at a
                 * glance: green=rustle (common-rare), gold=alpha (strong),
                 * violet=anomaly (mystery / legendary-tier). */
                .tile-aura-rustling { box-shadow: inset 0 0 18px rgba(180, 255, 120, 0.55); }
                .tile-aura-alpha    { box-shadow: inset 0 0 22px rgba(255, 200, 60, 0.65); }
                .tile-aura-anomaly  { box-shadow: inset 0 0 26px rgba(220, 130, 255, 0.75); }

                .aura-glow {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: 3;
                    border-radius: 4px;
                    mix-blend-mode: screen;
                    animation: aura-pulse 2.2s ease-in-out infinite;
                }
                .aura-glow.aura-rustling {
                    background: radial-gradient(ellipse 80% 55% at 50% 60%, rgba(180, 255, 120, 0.55) 0%, transparent 70%);
                }
                .aura-glow.aura-alpha {
                    background: radial-gradient(ellipse 85% 60% at 50% 60%, rgba(255, 200, 60, 0.70) 0%, transparent 70%);
                    animation-duration: 1.6s;
                }
                .aura-glow.aura-anomaly {
                    background:
                        radial-gradient(ellipse 90% 65% at 50% 55%, rgba(220, 130, 255, 0.85) 0%, transparent 68%),
                        radial-gradient(ellipse 60% 40% at 50% 55%, rgba(180, 240, 255, 0.45) 0%, transparent 72%);
                    animation-duration: 1.2s;
                }
                @keyframes aura-pulse {
                    0%, 100% { opacity: 0.55; transform: scale(1); }
                    50%      { opacity: 1.0;  transform: scale(1.05); }
                }

                .aura-particles {
                    position: absolute;
                    inset: -6px -2px -2px -2px;
                    pointer-events: none;
                    z-index: 4;
                    background-repeat: no-repeat;
                }
                /* Rustling: three little leaves fluttering upward. */
                .aura-particles-rustling {
                    background-image:
                      radial-gradient(circle 2px at 18% 20%, rgba(200, 255, 140, 0.95), transparent 70%),
                      radial-gradient(circle 2px at 52% 10%, rgba(200, 255, 140, 0.85), transparent 70%),
                      radial-gradient(circle 2px at 82% 28%, rgba(200, 255, 140, 0.90), transparent 70%);
                    animation: aura-float 2.4s linear infinite;
                }
                /* Alpha: bright sparks. */
                .aura-particles-alpha {
                    background-image:
                      radial-gradient(circle 3px at 22% 18%, rgba(255, 230, 140, 1), transparent 72%),
                      radial-gradient(circle 2px at 60% 8%,  rgba(255, 255, 210, 1), transparent 72%),
                      radial-gradient(circle 2.5px at 80% 30%, rgba(255, 200, 80, 1), transparent 72%),
                      radial-gradient(circle 2px at 40% 35%, rgba(255, 220, 120, 1), transparent 72%);
                    animation: aura-float 1.8s linear infinite;
                    filter: drop-shadow(0 0 3px rgba(255, 200, 80, 0.9));
                }
                /* Anomaly: prism shimmer. */
                .aura-particles-anomaly {
                    background-image:
                      radial-gradient(circle 2.5px at 24% 14%, rgba(255, 150, 255, 1), transparent 72%),
                      radial-gradient(circle 2px at 56% 6%,  rgba(180, 200, 255, 1), transparent 72%),
                      radial-gradient(circle 3px at 78% 24%, rgba(220, 180, 255, 1), transparent 72%),
                      radial-gradient(circle 2px at 42% 30%, rgba(255, 180, 240, 1), transparent 72%),
                      radial-gradient(circle 2.5px at 14% 38%, rgba(140, 220, 255, 1), transparent 72%);
                    animation: aura-float 1.4s linear infinite;
                    filter: drop-shadow(0 0 4px rgba(220, 130, 255, 0.9));
                }
                @keyframes aura-float {
                    0%   { transform: translateY(4px);  opacity: 0.4; }
                    50%  { transform: translateY(-4px); opacity: 1.0; }
                    100% { transform: translateY(4px);  opacity: 0.4; }
                }

                /* Path: warm trodden-earth dirt instead of the old stark
                 * concrete grey. Dual-layer: base dirt gradient + SVG
                 * pebble / scuff layer at 2x frequency so you never see a
                 * perfect repeating tile. */
                .tile-path {
                  background-color: #b89770;
                  background-image:
                    url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='14' r='1.5' fill='%23927049'/%3E%3Ccircle cx='48' cy='20' r='1' fill='%23927049'/%3E%3Ccircle cx='24' cy='38' r='1.8' fill='%23a88964'/%3E%3Ccircle cx='54' cy='50' r='1' fill='%23927049'/%3E%3Ccircle cx='18' cy='56' r='0.9' fill='%23927049'/%3E%3Ccircle cx='38' cy='10' r='0.9' fill='%23a88964'/%3E%3Ccircle cx='60' cy='32' r='0.7' fill='%23927049'/%3E%3Ccircle cx='6' cy='42' r='0.7' fill='%23a88964'/%3E%3Cpath d='M4 26c8-3 18 3 26 0s20 4 30 0' stroke='%239c7c54' stroke-width='0.8' fill='none' opacity='0.35'/%3E%3Cpath d='M2 50c10 2 18-4 30 0s18-3 30 0' stroke='%239c7c54' stroke-width='0.8' fill='none' opacity='0.3'/%3E%3C/svg%3E"),
                    linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.12) 100%);
                  background-size: ${TILE_SIZE}px ${TILE_SIZE}px, 100% 100%;
                  box-shadow: inset 0 0 10px rgba(70,48,24,0.18);
                }

                /* Water: layered gradient for depth + two staggered wave
                 * patterns at different scales, still animated via @flow. */
                .tile-water {
                  background-color: #1e5aa8;
                  background-image:
                    url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 24c12-8 12 8 24 0s12-8 24 0' stroke='rgba(255,255,255,0.38)' stroke-width='2.5' fill='none'/%3E%3Cpath d='M0 12c12-8 12 8 24 0s12-8 24 0' stroke='rgba(255,255,255,0.18)' stroke-width='1.8' fill='none'/%3E%3Cpath d='M0 36c12-6 12 6 24 0s12-6 24 0' stroke='rgba(255,255,255,0.10)' stroke-width='1.2' fill='none'/%3E%3C/svg%3E"),
                    url("data:image/svg+xml,%3Csvg width='96' height='96' viewBox='0 0 96 96' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='40' r='2' fill='rgba(255,255,255,0.06)'/%3E%3Ccircle cx='70' cy='70' r='3' fill='rgba(255,255,255,0.06)'/%3E%3Ccircle cx='80' cy='20' r='1.5' fill='rgba(255,255,255,0.05)'/%3E%3C/svg%3E"),
                    radial-gradient(ellipse at 50% 40%, #4a8fd8 0%, #2a6ab8 55%, #13447e 100%);
                  background-size: 48px 48px, 96px 96px, 100% 100%;
                  background-repeat: repeat, repeat, no-repeat;
                  animation: flow 2.4s infinite linear;
                  box-shadow: inset 0 0 18px rgba(0,0,0,0.22), inset 0 3px 6px rgba(255,255,255,0.06);
                }

                /* Sand: warmer tan, softer base. Replaces the old neon
                 * yellow. Adds wind-ripple scuffs. */
                .tile-sand {
                  background-color: #dcb477;
                  background-image:
                    radial-gradient(ellipse at 50% 50%, rgba(255,240,210,0.22) 0%, transparent 55%),
                    url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='12' r='0.9' fill='%23b69058'/%3E%3Ccircle cx='34' cy='36' r='1.1' fill='%23b69058'/%3E%3Ccircle cx='40' cy='8' r='0.6' fill='%23b69058'/%3E%3Ccircle cx='16' cy='42' r='0.7' fill='%23b69058'/%3E%3Cpath d='M2 22c8-3 16 2 24 0s14 2 22 0' stroke='%23b69058' stroke-width='0.6' fill='none' opacity='0.4'/%3E%3Cpath d='M4 38c6-2 12 2 20 0s14 1 20 0' stroke='%23b69058' stroke-width='0.5' fill='none' opacity='0.35'/%3E%3C/svg%3E"),
                    linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.10) 100%);
                  background-size: 100% 100%, 48px 48px, 100% 100%;
                  box-shadow: inset 0 0 10px rgba(120, 80, 30, 0.15);
                }

                /* Snow: blue-tinted base with a cool shadow, sparkle SVG. */
                .tile-snow {
                  background-color: #ecf3fb;
                  background-image:
                    radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.9) 0%, rgba(220,232,246,0.5) 55%, rgba(195,215,236,0.3) 100%),
                    url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='12' cy='16' r='1.2' fill='%23c8d8ec'/%3E%3Ccircle cx='44' cy='22' r='0.9' fill='%23d4e2f1'/%3E%3Ccircle cx='56' cy='54' r='1.1' fill='%23c8d8ec'/%3E%3Ccircle cx='20' cy='50' r='0.8' fill='%23d4e2f1'/%3E%3Ccircle cx='34' cy='34' r='0.6' fill='%23ffffff'/%3E%3Ccircle cx='52' cy='10' r='0.5' fill='%23ffffff'/%3E%3Ccircle cx='8' cy='40' r='0.4' fill='%23ffffff'/%3E%3C/svg%3E");
                  background-size: 100% 100%, 64px 64px;
                  box-shadow: inset 0 0 18px rgba(180,200,226,0.6), inset 0 3px 5px rgba(255,255,255,0.9);
                }
                .tile-ice {
                  background-color: #a8d8f0;
                  background-image:
                    linear-gradient(135deg, rgba(255,255,255,0.75) 0%, transparent 40%, rgba(0,0,0,0.12) 100%),
                    url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 30 L18 22 L14 38 Z' fill='rgba(255,255,255,0.25)'/%3E%3Cpath d='M40 42 L52 36 L46 52 Z' fill='rgba(255,255,255,0.2)'/%3E%3Cpath d='M30 8 L38 14 L30 20 Z' fill='rgba(255,255,255,0.18)' opacity='0.6'/%3E%3C/svg%3E");
                  background-size: 100% 100%, 64px 64px;
                  box-shadow: inset 0 0 18px rgba(255,255,255,0.85), 0 0 6px rgba(186,230,253,0.4);
                  border: 1px solid rgba(255,255,255,0.35);
                }
                .tile-lava {
                  background: #c1351f;
                  background-image:
                    radial-gradient(circle at 30% 40%, rgba(251,191,36,0.6) 0%, transparent 25%),
                    radial-gradient(circle at 70% 65%, rgba(251,146,60,0.5) 0%, transparent 22%),
                    radial-gradient(#7a1812 30%, transparent 31%),
                    radial-gradient(rgba(251,191,36,0.35) 8%, transparent 11%);
                  background-size: 100% 100%, 100% 100%, 16px 16px, 32px 32px;
                  animation: pulse-lava 1.8s infinite alternate;
                  box-shadow: inset 0 0 22px #4a0a08, inset 0 0 6px rgba(255,200,80,0.3);
                }
                .tile-rock {
                  background-color: #6e645b;
                  background-image:
                    radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.22) 0%, transparent 45%),
                    url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10l28 5-5 23-23-5z' fill='%23524840'/%3E%3Cpath d='M14 16l18 3-3 14-16-3z' fill='none' stroke='%23302a24' stroke-width='0.8' opacity='0.5'/%3E%3C/svg%3E");
                  background-size: 100% 100%, 48px 48px;
                  border-radius: 6px;
                  box-shadow: inset 0 -6px 10px rgba(0,0,0,0.45), inset 0 3px 4px rgba(255,255,255,0.18), 0 3px 4px rgba(0,0,0,0.3);
                  border: 2px solid #2a241e;
                  z-index: 5;
                }
                .tile-cave-floor {
                  background-color: #3d3934;
                  background-image:
                    radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 55%),
                    url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='12' cy='18' r='3' fill='%23262320'/%3E%3Ccircle cx='44' cy='30' r='2.4' fill='%23262320'/%3E%3Ccircle cx='28' cy='50' r='2.8' fill='%232b2824'/%3E%3Ccircle cx='56' cy='10' r='1.8' fill='%23262320'/%3E%3Ccircle cx='8' cy='52' r='1.4' fill='%232b2824'/%3E%3Ccircle cx='34' cy='14' r='0.8' fill='%23585049'/%3E%3Ccircle cx='50' cy='48' r='0.6' fill='%23585049'/%3E%3C/svg%3E");
                  background-size: 100% 100%, 64px 64px;
                  box-shadow: inset 0 0 28px rgba(0,0,0,0.65);
                }
                .tile-rock-wall {
                  background-color: #332c28;
                  background-image:
                    linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 35%, rgba(0,0,0,0.35) 100%),
                    url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='%23181410' stroke-width='1.5' fill='none'%3E%3Cpath d='M0 16h64M0 32h64M0 48h64'/%3E%3Cpath d='M16 0v16M40 0v16M8 16v16M28 16v16M52 16v16M20 32v16M44 32v16M4 48v16M32 48v16M56 48v16'/%3E%3C/g%3E%3Cg fill='%234a403a' opacity='0.4'%3E%3Crect x='2' y='2' width='12' height='12'/%3E%3Crect x='18' y='2' width='20' height='12'/%3E%3Crect x='42' y='2' width='20' height='12'/%3E%3Crect x='10' y='18' width='16' height='12'/%3E%3Crect x='30' y='18' width='20' height='12'/%3E%3Crect x='54' y='18' width='8' height='12'/%3E%3Crect x='2' y='34' width='16' height='12'/%3E%3Crect x='22' y='34' width='20' height='12'/%3E%3Crect x='46' y='34' width='16' height='12'/%3E%3C/g%3E%3C/svg%3E");
                  background-size: 100% 100%, 64px 64px;
                  border: 2px solid #0f0c0a;
                  box-shadow: inset 0 0 18px rgba(0,0,0,0.7), 0 4px 6px rgba(0,0,0,0.5);
                  z-index: 10;
                }
                
                .tile-danger { background: repeating-linear-gradient(45deg, #7f1d1d, #7f1d1d 10px, #991b1b 10px, #991b1b 20px); border: 1px solid #000; }
                
                .tile-fence { position: relative; }
                .tile-fence::after { content: ''; position: absolute; top: 10px; left: 0; right: 0; height: 6px; background: #78350f; z-index: 2; border-bottom: 2px solid #451a03; }
                .tile-fence::before { content: ''; position: absolute; top: 22px; left: 0; right: 0; height: 6px; background: #78350f; z-index: 2; border-bottom: 2px solid #451a03; }
                .tile-fence-post { position: absolute; top: 0; bottom: 0; left: 50%; transform: translateX(-50%); width: 8px; background: #92400e; z-index: 1; border: 1px solid #451a03; }
                .tile-ledge {
                  background-color: #3f7c37;
                  background-image:
                    linear-gradient(180deg, #65a957 0%, #4b8a41 40%, #2e5d28 80%, #1a3a17 100%),
                    url("data:image/svg+xml,%3Csvg width='64' height='32' viewBox='0 0 64 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 24c8 4 12-4 20 0s12-3 20 0s12 4 24 0' stroke='%231a3a17' stroke-width='1.5' fill='none'/%3E%3Cpath d='M0 28c8 2 14-2 24 0s14-1 20 0s12 2 20 0' stroke='%23112910' stroke-width='1' fill='none'/%3E%3C/svg%3E");
                  background-size: 100% 100%, 64px 32px;
                  background-repeat: no-repeat, repeat-x;
                  background-position: 0 0, 0 bottom;
                  border-bottom: 6px solid #0a1c09;
                  box-shadow: 0 4px 8px rgba(0,0,0,0.5), inset 0 3px 3px rgba(255,255,255,0.18);
                  border-radius: 0 0 3px 3px;
                }
                /* Tree: layered trunk + canopy. Trunk now uses a real bark
                 * gradient, canopy is a radial gradient with highlight and
                 * shadow separation and a drop-shadow that grounds the tree
                 * on the tile below. Variants (v1-v3) still override the
                 * canopy silhouette, this just polishes the base case. */
                .tile-tree { position: relative; z-index: 5; }
                .tile-tree::before {
                    content: '';
                    position: absolute;
                    bottom: 2px; left: 26px;
                    width: 12px; height: 22px;
                    background:
                      linear-gradient(90deg, rgba(0,0,0,0.25) 0%, transparent 30%, rgba(255,255,255,0.08) 55%, transparent 90%),
                      linear-gradient(180deg, #6d4a33 0%, #3d2718 100%);
                    border-radius: 3px 3px 2px 2px;
                    z-index: 1;
                    border: 1px solid #2a180d;
                    box-shadow: 0 2px 0 #1a0f08, 0 4px 3px rgba(0,0,0,0.25);
                }
                .tile-tree::after {
                    content: '';
                    position: absolute;
                    bottom: 18px; left: -4px;
                    width: 72px; height: 58px;
                    background:
                      radial-gradient(circle at 28% 28%, rgba(255,255,255,0.22) 0%, transparent 35%),
                      radial-gradient(circle at 30% 35%, #72c865 0%, #3f8035 55%, #1e4a1a 100%);
                    z-index: 2;
                    border-radius: 50% 52% 48% 54% / 55% 50% 52% 48%;
                    box-shadow: 0 6px 0 #0f2e0d, 0 12px 18px rgba(0,0,0,0.38), inset 0 -6px 10px rgba(0,0,0,0.2);
                    border: 2px solid #0f2e0d;
                }
                /* Dark (night) variant stays cool-toned. */
                .tile-tree-dark::before {
                    content: '';
                    position: absolute;
                    bottom: 2px; left: 26px;
                    width: 12px; height: 22px;
                    background: linear-gradient(180deg, #2a1b10 0%, #0a0505 100%);
                    border-radius: 3px 3px 2px 2px;
                    z-index: 1;
                    border: 1px solid #000;
                }
                .tile-tree-dark::after {
                    content: '';
                    position: absolute;
                    bottom: 18px; left: -4px;
                    width: 72px; height: 58px;
                    background:
                      radial-gradient(circle at 28% 28%, rgba(255,255,255,0.08) 0%, transparent 40%),
                      radial-gradient(circle at 30% 35%, #2c4f9f 0%, #15275a 60%, #05101e 100%);
                    z-index: 2;
                    border-radius: 50% 52% 48% 54% / 55% 50% 52% 48%;
                    box-shadow: 0 6px 0 #020617, 0 12px 18px rgba(0,0,0,0.5), inset 0 -6px 10px rgba(0,0,0,0.35);
                    border: 2px solid #020617;
                }
                .tile-wood {
                    background-color: #7a4a22;
                    background-image:
                      linear-gradient(90deg, rgba(0,0,0,0.18) 0%, transparent 40%, rgba(255,255,255,0.08) 75%, transparent 100%),
                      repeating-linear-gradient(90deg, transparent 0, transparent 14px, rgba(0,0,0,0.18) 14px, rgba(0,0,0,0.18) 16px),
                      url("data:image/svg+xml,%3Csvg width='64' height='32' viewBox='0 0 64 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 8q16 -4 32 0t32 0M0 22q16 -4 32 0t32 0' stroke='%234e2c13' stroke-width='0.6' fill='none' opacity='0.5'/%3E%3Cellipse cx='14' cy='10' rx='4' ry='2' fill='none' stroke='%234e2c13' stroke-width='0.5' opacity='0.4'/%3E%3Cellipse cx='46' cy='22' rx='3' ry='1.5' fill='none' stroke='%234e2c13' stroke-width='0.5' opacity='0.4'/%3E%3C/svg%3E");
                    box-shadow: inset 0 0 0 1px #3a200f, inset 0 -4px 8px rgba(0,0,0,0.28);
                }
                .tile-bridge {
                    background-color: #8a5a2a;
                    background-image:
                      linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 25%, rgba(0,0,0,0.25) 100%),
                      repeating-linear-gradient(90deg, transparent 0, transparent 10px, rgba(0,0,0,0.35) 10px, rgba(0,0,0,0.35) 12px),
                      linear-gradient(180deg, #a26c35 0%, #6c4119 100%);
                    border-top: 3px solid #3d200a;
                    border-bottom: 3px solid #3d200a;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.45), inset 0 0 6px rgba(0,0,0,0.2);
                }
                
                @keyframes wave {
                    0%, 100% { transform: skewX(-5deg); }
                    50% { transform: skewX(5deg); }
                }
                @keyframes wave-delayed {
                    0%, 100% { transform: skewX(5deg); }
                    50% { transform: skewX(-5deg); }
                }
                .animate-wave { animation: wave 3s infinite ease-in-out; }
                .animate-wave-delayed { animation: wave-delayed 3.5s infinite ease-in-out; }

                .tile-checkered { 
                  background-color: #f3f4f6;
                  background-image: 
                    linear-gradient(45deg, #d1d5db 25%, transparent 25%), 
                    linear-gradient(-45deg, #d1d5db 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #d1d5db 75%), 
                    linear-gradient(-45deg, transparent 75%, #d1d5db 75%);
                  background-size: 32px 32px;
                  background-position: 0 0, 0 16px, 16px -16px, -16px 0px;
                  border: 1px solid rgba(0,0,0,0.1);
                  box-shadow: inset 0 0 10px rgba(0,0,0,0.05);
                }
                .tile-mat { 
                  background: #9ca3af; 
                  box-shadow: inset 0 0 15px rgba(0,0,0,0.2); 
                  position: relative;
                }
                .tile-wall-house { background: #f9fafb; border-bottom: 8px solid #9ca3af; box-shadow: inset 0 -6px 0 rgba(0,0,0,0.1); position: relative; }
                .tile-wall-house::after { content: ''; position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 24h48M24 0v48' stroke='rgba(0,0,0,0.07)' stroke-width='1'/%3E%3C/svg%3E"); }
                
                .tile-roof-red { 
                  background-color: #b91c1c;
                  background-image: 
                    repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.1) 4px, rgba(0,0,0,0.1) 8px),
                    repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.05) 8px, rgba(0,0,0,0.05) 10px),
                    linear-gradient(180deg, #ef4444 0%, #b91c1c 100%);
                  border-bottom: 6px solid #7f1d1d; 
                  box-shadow: 0 4px 8px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2);
                }
                .tile-roof-blue { 
                  background-color: #1e40af;
                  background-image: 
                    repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.1) 4px, rgba(0,0,0,0.1) 8px),
                    repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.05) 8px, rgba(0,0,0,0.05) 10px),
                    linear-gradient(180deg, #3b82f6 0%, #1e40af 100%);
                  border-bottom: 4px solid #1e3a8a; 
                  box-shadow: 0 4px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.1);
                }
                .tile-roof-orange { 
                  background-color: #c2410c;
                  background-image: 
                    repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.1) 4px, rgba(0,0,0,0.1) 8px),
                    repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.05) 8px, rgba(0,0,0,0.05) 10px),
                    linear-gradient(180deg, #f97316 0%, #c2410c 100%);
                  border-bottom: 4px solid #7c2d12; 
                  box-shadow: 0 4px 8px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.1);
                }
                .tile-window { 
                  background: #93c5fd; 
                  border: 3px solid #1e40af; 
                  box-shadow: inset 0 0 10px #3b82f6, 0 0 5px rgba(147,197,253,0.5); 
                  position: relative; 
                  overflow: hidden;
                }
                .tile-window::after { 
                  content: ''; 
                  position: absolute; 
                  top: -50%; 
                  left: -50%; 
                  width: 200%; 
                  height: 200%; 
                  background: linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.4) 50%, transparent 55%); 
                  transform: rotate(45deg); 
                }
                .tile-window::before {
                  content: '';
                  position: absolute;
                  top: 0; left: 50%; width: 2px; height: 100%; background: #1e3a8a;
                  z-index: 1;
                }
                
                .tile-poke-center-sign {
                  position: absolute;
                  top: -12px;
                  left: 50%;
                  transform: translateX(-50%);
                  background: white;
                  border: 3px solid #ef4444;
                  border-radius: 50%;
                  width: 24px;
                  height: 24px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  color: #ef4444;
                  font-size: 14px;
                  z-index: 20;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                .tile-poke-center-sign::after {
                  content: 'P';
                  font-family: sans-serif;
                }
                .tile-poke-mart-sign {
                  position: absolute;
                  top: -12px;
                  left: 50%;
                  transform: translateX(-50%);
                  background: #3b82f6;
                  border: 3px solid white;
                  border-radius: 50%;
                  width: 24px;
                  height: 24px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  color: white;
                  font-size: 14px;
                  z-index: 20;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                .tile-poke-mart-sign::after {
                  content: 'M';
                  font-family: sans-serif;
                }
                
                .tile-pillar { position: relative; }
                .tile-pillar::after { 
                  content: ''; 
                  position: absolute; 
                  bottom: 4px; 
                  left: 8px; 
                  right: 8px; 
                  top: -12px; 
                  background: linear-gradient(90deg, #94a3b8, #cbd5e1, #94a3b8); 
                  border: 2px solid #475569; 
                  border-radius: 2px; 
                  box-shadow: 0 4px 0 #1e293b, 0 6px 10px rgba(0,0,0,0.3); 
                }
                .tile-statue { position: relative; }
                .tile-statue::after { 
                  content: ''; 
                  position: absolute; 
                  bottom: 4px; 
                  left: 4px; 
                  right: 4px; 
                  top: -20px; 
                  background: linear-gradient(135deg, #64748b, #475569); 
                  border: 2px solid #1e293b; 
                  border-radius: 8px 8px 2px 2px; 
                  box-shadow: 0 6px 0 #0f172a, 0 10px 15px rgba(0,0,0,0.4);
                }
                .tile-tent { position: relative; }
                .tile-tent::after { 
                  content: ''; 
                  position: absolute; 
                  bottom: 4px; 
                  left: -4px; 
                  right: -4px; 
                  top: -24px; 
                  background: linear-gradient(135deg, #f87171, #dc2626); 
                  clip-path: polygon(50% 0%, 0% 100%, 100% 100%); 
                  border: 2px solid #7f1d1d; 
                  box-shadow: 0 6px 12px rgba(0,0,0,0.3);
                }
                .tile-sign { position: relative; }
                .tile-sign::after { 
                  content: ''; 
                  position: absolute; 
                  bottom: 4px; 
                  left: 8px; 
                  right: 8px; 
                  top: 0px; 
                  background: linear-gradient(180deg, #d97706, #92400e); 
                  border: 2px solid #451a03; 
                  border-radius: 2px; 
                  box-shadow: 0 4px 0 #451a03, 0 6px 10px rgba(0,0,0,0.3);
                }
                .tile-well { position: relative; }
                .tile-well::after { 
                  content: ''; 
                  position: absolute; 
                  bottom: 4px; 
                  left: 4px; 
                  right: 4px; 
                  top: -12px; 
                  background: #475569; 
                  border: 4px solid #1e293b; 
                  border-radius: 50%; 
                  box-shadow: 0 6px 12px rgba(0,0,0,0.4), inset 0 0 15px #0f172a; 
                }
                .tile-fountain { position: relative; }
                .tile-fountain::after { 
                  content: ''; 
                  position: absolute; 
                  bottom: 4px; 
                  left: 4px; 
                  right: 4px; 
                  top: -12px; 
                  background: #3b82f6; 
                  border: 4px solid #94a3b8; 
                  border-radius: 50%; 
                  animation: pulse-fountain 1.5s infinite alternate; 
                  box-shadow: 0 6px 12px rgba(0,0,0,0.3), inset 0 0 10px rgba(255,255,255,0.5);
                }

                .tile-berry-tree { position: relative; z-index: 5; }
                .tile-berry-tree::before { 
                  content: ''; 
                  position: absolute; 
                  bottom: 4px; 
                  left: 18px; 
                  width: 12px; 
                  height: 16px; 
                  background: linear-gradient(90deg, #5d4037, #3e2723); 
                  border-radius: 2px; 
                  border: 1px solid #2d1b16;
                }
                .tile-berry-tree::after { 
                  content: ''; 
                  position: absolute; 
                  bottom: 12px; 
                  left: -4px; 
                  width: 56px; 
                  height: 56px; 
                  background: radial-gradient(circle at 30% 30%, #4ade80, #15803d 70%, #14532d); 
                  border-radius: 50%; 
                  box-shadow: 0 6px 0 #052e16, 0 10px 15px rgba(0,0,0,0.3); 
                  border: 2px solid #052e16;
                }
                .tile-berry-tree .berries { 
                  position: absolute; 
                  top: 12px; 
                  left: 10px; 
                  width: 28px; 
                  height: 28px; 
                  z-index: 10; 
                  display: flex; 
                  flex-wrap: wrap; 
                  gap: 4px; 
                  justify-content: center; 
                }
                .tile-berry-tree .berry { 
                  width: 8px; 
                  height: 8px; 
                  background: radial-gradient(circle at 30% 30%, #f87171, #ef4444); 
                  border-radius: 50%; 
                  box-shadow: 0 2px 0 #7f1d1d; 
                  border: 1px solid #7f1d1d;
                }

                .tile-small-rock { position: relative; }
                .tile-small-rock::after { 
                  content: ''; 
                  position: absolute; 
                  bottom: 8px; 
                  left: 12px; 
                  width: 24px; 
                  height: 16px; 
                  background: linear-gradient(135deg, #cbd5e1, #94a3b8); 
                  border: 2px solid #475569; 
                  border-radius: 8px 12px 6px 10px; 
                  box-shadow: 0 4px 0 #1e293b, 0 4px 8px rgba(0,0,0,0.3); 
                }
                
                .tile-bush { position: relative; }
                .tile-bush::after { 
                  content: ''; 
                  position: absolute; 
                  bottom: 6px; 
                  left: 6px; 
                  width: 36px; 
                  height: 24px; 
                  background: radial-gradient(circle at 30% 30%, #4ade80, #22c55e); 
                  border: 2px solid #166534; 
                  border-radius: 12px 16px 10px 14px; 
                  box-shadow: 0 4px 0 #14532d, 0 6px 10px rgba(0,0,0,0.3); 
                }
                
                .tile-log { position: relative; }
                .tile-log::after { 
                  content: ''; 
                  position: absolute; 
                  bottom: 10px; 
                  left: 4px; 
                  width: 40px; 
                  height: 12px; 
                  background: linear-gradient(180deg, #92400e, #78350f); 
                  border: 2px solid #451a03; 
                  border-radius: 4px; 
                  box-shadow: 0 3px 0 #2d1002, 0 4px 8px rgba(0,0,0,0.3); 
                  background-image: repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.1) 8px, rgba(0,0,0,0.1) 10px);
                }

                @keyframes flow { 0% { background-position: 0 0; } 100% { background-position: 24px 0; } }
                @keyframes pulse-lava { 0% { opacity: 0.8; transform: scale(1); } 100% { opacity: 1; transform: scale(1.05); } }
                
                .campfire-container { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
                .campfire-flame { width: 16px; height: 24px; background: #f97316; border-radius: 50% 50% 20% 20%; animation: flame 0.5s infinite alternate; box-shadow: 0 0 10px #ef4444; }
                .campfire-logs { position: absolute; bottom: 8px; width: 24px; height: 8px; background: #451a03; border-radius: 4px; }
                @keyframes flame { 0% { transform: scale(1) translateY(0); background: #f97316; } 100% { transform: scale(1.2) translateY(-4px); background: #ef4444; } }
                
                @keyframes rain { from { background-position: 0 0; } to { background-position: 0 1000px; } }
                @keyframes snow { from { background-position: 0 0; } to { background-position: 100px 1000px; } }
                @keyframes sand { from { background-position: -100% 0; } to { background-position: 100% 0; } }
                
                .animate-rain { animation: rain 0.5s linear infinite; }
                .animate-snow { animation: snow 10s linear infinite; }
                .animate-sand { animation: sand 2s linear infinite; }

                .deco-tv { width: 40px; height: 28px; background: #1f2937; margin: auto; border: 4px solid #111; border-radius: 4px; box-shadow: 0 4px 0 rgba(0,0,0,0.3); position: relative; }
                .deco-tv::after { content: ''; position: absolute; right: 4px; top: 4px; width: 4px; height: 4px; background: #ef4444; border-radius: 50%; }
                .deco-bookshelf { width: 40px; height: 44px; background: #78350f; margin: auto; border-radius: 2px; border: 2px solid #451a03; display: flex; flex-direction: column; gap: 4px; padding: 2px; }
                .deco-bookshelf::before { content: ''; flex: 1; background: repeating-linear-gradient(90deg, #fcd34d 0, #fcd34d 4px, #ef4444 4px, #ef4444 8px, #3b82f6 8px, #3b82f6 12px); }
                .deco-plant { width: 32px; height: 40px; background: radial-gradient(circle at 50% 20%, #4ade80 40%, #166534 80%); margin: auto; border-radius: 16px; border: 2px solid #14532d; position: relative; top: -4px; }
                .deco-plant::after { content: ''; position: absolute; bottom: -4px; left: 8px; width: 16px; height: 12px; background: #b45309; border-radius: 0 0 4px 4px; }
                .deco-bed { width: 44px; height: 40px; background: #60a5fa; margin: auto; border-radius: 4px; border-top: 12px solid #eff6ff; box-shadow: 0 2px 0 #1e3a8a; }
                .deco-table { width: 40px; height: 32px; background: #a16207; margin: auto; border: 2px solid #713f12; border-radius: 4px; box-shadow: 0 4px 0 rgba(0,0,0,0.2); }

                .tile-shrine-weather { position: relative; }
                .tile-shrine-weather::after { content: '🌀'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 24px; animation: spin 4s linear infinite; }
                .tile-spring { position: relative; }
                .tile-spring::after { content: ''; position: absolute; inset: 4px; background: #60a5fa; border: 4px solid #fff; border-radius: 50%; box-shadow: 0 0 10px #60a5fa; }
                .tile-shrine-power { position: relative; }
                .tile-shrine-power::after { content: '⚡'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 24px; animation: pulse-lava 1s infinite alternate; }
                .tile-rift { position: relative; background: #000; overflow: hidden; }
                .tile-rift::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle, #7e22ce, transparent); animation: pulse-lava 0.5s infinite alternate; }
                
                .tile-boulder { 
                    background-color: #78716c; 
                    border-radius: 50%; 
                    border: 4px solid #44403c; 
                    box-shadow: 0 4px 0 #1c1917, inset 0 4px 8px rgba(255,255,255,0.2);
                    z-index: 15;
                }
                .tile-hole { 
                    background-color: #1c1917; 
                    border-radius: 50%; 
                    box-shadow: inset 0 4px 10px rgba(0,0,0,0.8);
                }
                .tile-switch { 
                    background-color: #ef4444; 
                    border-radius: 4px; 
                    border: 2px solid #7f1d1d; 
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);
                }
                .tile-reward { 
                    background-color: #e7e5e4; 
                    background-image: radial-gradient(circle, rgba(255,255,0,0.2), transparent);
                }

                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes walk {
                  0% { transform: translateY(0) rotate(0deg); }
                  25% { transform: translateY(-4px) rotate(-3deg); }
                  50% { transform: translateY(0) rotate(0deg); }
                  75% { transform: translateY(-4px) rotate(3deg); }
                  100% { transform: translateY(0) rotate(0deg); }
                }
                .animate-walk { animation: walk 0.3s infinite ease-in-out; }
                
                .scan-highlight {
                    position: relative;
                }
                .scan-highlight::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);
                    animation: scan-pulse 1s infinite alternate;
                    z-index: 20;
                    pointer-events: none;
                }
                @keyframes scan-pulse {
                    from { opacity: 0.3; transform: scale(0.9); }
                    to { opacity: 0.8; transform: scale(1.1); }
                }

                /* =========================================================
                 * Overworld visual upgrade pack (v2)
                 *
                 * Grass tone variation, multiple tree variants, richer
                 * flowers, edge blending between biomes, ambient critters,
                 * and properly-drawn Pokemon Center / Mart buildings.
                 * Everything keyed via data-* or extra modifier classes so
                 * existing maps render unchanged apart from the new polish.
                 * ========================================================= */

                /* -- Biome-aware ground tint -----------------------------
                 * Each biome subtly recolors the grass/sand/snow base so the
                 * same tile IDs feel distinct from zone to zone without us
                 * having to duplicate SVGs. The tint is layered as a
                 * background-color shift + a soft wash -- sprites on the
                 * tile are never touched (they sit on higher z-index). */
                .biome-forest .tile-grass { background-color: #5a9a4d; box-shadow: inset 0 0 18px rgba(20, 50, 16, 0.28); }
                .biome-lake   .tile-grass { background-color: #69b46a; box-shadow: inset 0 0 14px rgba(24, 64, 40, 0.18); }
                .biome-town   .tile-grass { background-color: #7cb76e; box-shadow: inset 0 0 10px rgba(60, 110, 50, 0.15); }
                .biome-desert .tile-sand  { background-color: #d6a561; }
                .biome-canyon .tile-sand  { background-color: #c68a4a; box-shadow: inset 0 0 14px rgba(100, 50, 18, 0.28); }
                .biome-snow   .tile-snow  { box-shadow: inset 0 0 22px rgba(180,200,226,0.7), inset 0 3px 5px rgba(255,255,255,0.95); }
                .biome-cave   .tile-cave-floor { box-shadow: inset 0 0 36px rgba(0,0,0,0.78); }
                /* Path adapts to biome: pale stone in snow, redder dirt in
                 * canyon, dusty in desert, deep-earth in forest. */
                .biome-desert .tile-path { background-color: #c9a574; }
                .biome-canyon .tile-path { background-color: #a77a4c; }
                .biome-snow   .tile-path { background-color: #c8d0d8; }
                .biome-cave   .tile-path { background-color: #6a5e52; }
                .biome-forest .tile-path { background-color: #a3825d; }
                /* Rift turns EVERY ground type into an ominous violet wash
                 * so stepping into the ring reads as "you are not welcome
                 * here". */
                .biome-rift .tile-grass,
                .biome-rift .tile-sand,
                .biome-rift .tile-snow,
                .biome-rift .tile-stone,
                .biome-rift .tile-cave-floor {
                    filter: hue-rotate(-40deg) saturate(1.1) brightness(0.85);
                }

                /* -- Grass tonal variation keyed by data-grass-tone ------
                 * Previous implementation swapped background-color between 4
                 * noticeably different greens and used a CSS filter, which
                 * produced a visible checkerboard of dark and light squares
                 * and also tinted trainer / NPC sprites standing on grass.
                 *
                 * New approach: every plain-grass tile keeps the same base
                 * background; we layer a very gentle rgba wash via ::before
                 * with minimal opacity so the variation only reads as subtle
                 * organic mottling rather than distinct tiles. The overlay
                 * is pointer-events none and sits below content (z-index 0)
                 * so sprites are never affected. */
                .tile-grass[data-grass-tone] { position: relative; }
                .tile-grass[data-grass-tone]::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: 0;
                }
                .tile-grass[data-grass-tone="0"]::before { background: transparent; }
                .tile-grass[data-grass-tone="1"]::before { background: rgba(255, 255, 255, 0.035); }
                .tile-grass[data-grass-tone="2"]::before { background: rgba(134, 239, 172, 0.05); }
                .tile-grass[data-grass-tone="3"]::before { background: rgba(16, 76, 38, 0.05); }

                /* -- Tree variants (oak / pine / round / willow) --------- */
                /* Variant 0 (oak) keeps the original look. Variants 1-3
                 * redefine ::after to morph the canopy silhouette. */
                .tile-tree.tile-tree-v1::after {
                    background: radial-gradient(circle at 50% 30%, #22c55e, #166534 55%, #064e3b 100%);
                    clip-path: polygon(50% 0%, 10% 40%, 20% 42%, 6% 70%, 22% 72%, 10% 100%, 90% 100%, 78% 72%, 94% 70%, 80% 42%, 90% 40%);
                    border-radius: 0;
                    border: none;
                    box-shadow: 0 6px 0 #052e16, 0 10px 15px rgba(0,0,0,0.3);
                    width: 48px;
                    height: 64px;
                    left: 0;
                    bottom: 14px;
                }
                .tile-tree.tile-tree-v1::before {
                    left: 20px;
                    width: 8px;
                    background: linear-gradient(90deg, #3e2723, #1a0f0d);
                }
                .tile-tree.tile-tree-v2::after {
                    width: 44px;
                    height: 44px;
                    left: 2px;
                    bottom: 20px;
                    background: radial-gradient(circle at 32% 30%, #65d98b, #15803d 65%, #14532d);
                    border-color: #0b2a12;
                }
                .tile-tree.tile-tree-v3::after {
                    width: 60px;
                    height: 48px;
                    left: -6px;
                    bottom: 18px;
                    border-radius: 60% 60% 50% 50%;
                    background: radial-gradient(ellipse at 35% 25%, #86efac, #15803d 70%, #14532d);
                    filter: drop-shadow(0 8px 4px rgba(0,0,0,0.25));
                }
                /* Dark (night) forest variant still wins over the color. */
                .tile-tree-dark::after {
                    background: radial-gradient(circle at 30% 30%, #1e40af, #172554 70%, #0f172a) !important;
                    border-color: #020617 !important;
                }
                .tile-tree-dark::before {
                    background: linear-gradient(90deg, #3e2723, #1a0f0d) !important;
                    border-color: #000 !important;
                }

                /* -- Flower sprites ------------------------------------- */
                .flower-cluster-pink {
                    background:
                        radial-gradient(circle 3px at 40% 55%, #fbbf24 40%, transparent 41%),
                        radial-gradient(circle 4px at 40% 55%, #f472b6 60%, transparent 61%),
                        radial-gradient(circle 3px at 30% 48%, #f9a8d4 60%, transparent 61%),
                        radial-gradient(circle 3px at 50% 48%, #f9a8d4 60%, transparent 61%),
                        radial-gradient(circle 3px at 40% 40%, #f9a8d4 60%, transparent 61%),
                        radial-gradient(circle 3px at 40% 62%, #f9a8d4 60%, transparent 61%);
                }
                .flower-daisy {
                    background:
                        radial-gradient(circle 3px at 40% 55%, #fbbf24 55%, transparent 56%),
                        radial-gradient(circle 3px at 30% 48%, #ffffff 65%, transparent 66%),
                        radial-gradient(circle 3px at 50% 48%, #ffffff 65%, transparent 66%),
                        radial-gradient(circle 3px at 30% 62%, #ffffff 65%, transparent 66%),
                        radial-gradient(circle 3px at 50% 62%, #ffffff 65%, transparent 66%);
                }
                .flower-tulip-red {
                    background:
                        linear-gradient(180deg, transparent 45%, #166534 46%, #166534 100%) no-repeat 40% 0 / 2px 60%,
                        radial-gradient(ellipse 5px 7px at 40% 42%, #dc2626 65%, transparent 66%);
                }
                .flower-bluebell {
                    background:
                        radial-gradient(circle 3px at 40% 58%, #2563eb 55%, transparent 56%),
                        radial-gradient(circle 2px at 32% 50%, #3b82f6 60%, transparent 61%),
                        radial-gradient(circle 2px at 48% 50%, #60a5fa 60%, transparent 61%);
                }
                .flower-sunflower {
                    background:
                        linear-gradient(180deg, transparent 50%, #15803d 51%, #15803d 100%) no-repeat 40% 0 / 2px 50%,
                        radial-gradient(circle 2px at 40% 45%, #78350f 80%, transparent 81%),
                        radial-gradient(circle 4px at 40% 45%, #fcd34d 70%, transparent 71%);
                }

                /* -- Edge blending overlays (grass borders water/sand) --- */
                .tile-edges {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: 4;
                }
                /* Sandy shorelines */
                .tile-edges.edge-s-n { box-shadow: inset 0 6px 0 -2px rgba(252, 211, 77, 0.65); }
                .tile-edges.edge-s-s { box-shadow: inset 0 -6px 0 -2px rgba(252, 211, 77, 0.65); }
                .tile-edges.edge-s-e { box-shadow: inset -6px 0 0 -2px rgba(252, 211, 77, 0.65); }
                .tile-edges.edge-s-w { box-shadow: inset 6px 0 0 -2px rgba(252, 211, 77, 0.65); }
                /* Combined sand edges stack via multiple shadows */
                .tile-edges.edge-s-n.edge-s-s { box-shadow: inset 0 6px 0 -2px rgba(252, 211, 77, 0.65), inset 0 -6px 0 -2px rgba(252, 211, 77, 0.65); }
                .tile-edges.edge-s-e.edge-s-w { box-shadow: inset -6px 0 0 -2px rgba(252, 211, 77, 0.65), inset 6px 0 0 -2px rgba(252, 211, 77, 0.65); }
                /* Watery foam edges: brighter, animated */
                .tile-edges.edge-w-n::before,
                .tile-edges.edge-w-s::before,
                .tile-edges.edge-w-e::before,
                .tile-edges.edge-w-w::before {
                    content: '';
                    position: absolute;
                    background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(165,243,252,0.0));
                    animation: foam-bob 2.2s ease-in-out infinite;
                    pointer-events: none;
                }
                .tile-edges.edge-w-n::before { top: 0; left: 0; right: 0; height: 6px; }
                .tile-edges.edge-w-s::before { bottom: 0; left: 0; right: 0; height: 6px; transform: rotate(180deg); }
                .tile-edges.edge-w-e::before { top: 0; right: 0; bottom: 0; width: 6px; background: linear-gradient(270deg, rgba(255,255,255,0.9), rgba(165,243,252,0.0)); }
                .tile-edges.edge-w-w::before { top: 0; left: 0; bottom: 0; width: 6px; background: linear-gradient(90deg, rgba(255,255,255,0.9), rgba(165,243,252,0.0)); }
                @keyframes foam-bob {
                    0%, 100% { opacity: 0.85; }
                    50% { opacity: 0.5; }
                }

                /* -- Pokemon Center building ---------------------------- */
                /* Roof corners round off the silhouette and add a golden
                 * trim strip so the building feels distinct from an
                 * arbitrary red tile. */
                .tile-roof-red.roof-cap-l { border-top-left-radius: 12px; }
                .tile-roof-red.roof-cap-r { border-top-right-radius: 12px; }
                .tile-roof-red::before {
                    content: '';
                    position: absolute;
                    left: 0; right: 0; bottom: -2px;
                    height: 6px;
                    background: linear-gradient(180deg, #fcd34d, #b45309);
                    border-top: 2px solid #7c2d12;
                    box-shadow: inset 0 -1px 0 rgba(0,0,0,0.2);
                    z-index: 2;
                }
                .tile-poke-center-sign {
                    position: absolute;
                    top: -28px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2px;
                    z-index: 25;
                    pointer-events: none;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.45));
                }
                .tile-poke-center-sign::after { content: none; }
                .tile-poke-center-sign .poke-sign-ball {
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    background:
                        linear-gradient(180deg, #ef4444 0%, #ef4444 50%, #f9fafb 50%, #f9fafb 100%);
                    border: 2px solid #1f1f1f;
                    box-shadow: inset 0 0 0 2px rgba(0,0,0,0.2);
                    position: relative;
                }
                .tile-poke-center-sign .poke-sign-ball::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: #f9fafb;
                    border: 2px solid #1f1f1f;
                    box-sizing: border-box;
                }
                .tile-poke-center-sign .poke-sign-label {
                    font-family: 'Press Start 2P', system-ui, sans-serif;
                    font-size: 6px;
                    letter-spacing: 0.1em;
                    color: #fff;
                    background: #b91c1c;
                    padding: 1px 4px;
                    border: 1px solid #7f1d1d;
                    border-radius: 2px;
                    text-shadow: 1px 1px 0 #000;
                }
                .tile-poke-center-sign .poke-sign-label-blue {
                    background: #1d4ed8;
                    border-color: #1e3a8a;
                }

                /* -- Pokemon Mart building ------------------------------ */
                .tile-roof-blue.roof-cap-l { border-top-left-radius: 12px; }
                .tile-roof-blue.roof-cap-r { border-top-right-radius: 12px; }
                .tile-roof-blue::before {
                    content: '';
                    position: absolute;
                    left: 0; right: 0; bottom: -2px;
                    height: 6px;
                    background: repeating-linear-gradient(90deg, #1d4ed8 0, #1d4ed8 8px, #f9fafb 8px, #f9fafb 16px);
                    border-top: 2px solid #1e3a8a;
                    z-index: 2;
                }
                .tile-poke-mart-sign {
                    position: absolute;
                    top: -26px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2px;
                    z-index: 25;
                    pointer-events: none;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
                }
                .tile-poke-mart-sign::after { content: none; }
                .tile-poke-mart-sign .poke-sign-mart-letter {
                    width: 22px;
                    height: 22px;
                    border-radius: 4px;
                    background: linear-gradient(180deg, #3b82f6, #1e40af);
                    border: 2px solid #1e3a8a;
                    color: white;
                    font-family: 'Press Start 2P', system-ui, sans-serif;
                    font-size: 12px;
                    line-height: 20px;
                    text-align: center;
                    font-weight: 900;
                    box-shadow: inset 0 2px 0 rgba(255,255,255,0.3);
                }

                /* -- Walls: add trim & frame hints ---------------------- */
                .tile-wall-house.wall-edge-l { border-left: 4px solid #cbd5e1; }
                .tile-wall-house.wall-edge-r { border-right: 4px solid #cbd5e1; }
                .tile-wall-house.wall-base::before {
                    content: '';
                    position: absolute;
                    left: 50%;
                    bottom: 0;
                    transform: translateX(-50%);
                    width: 18px;
                    height: 28px;
                    background: linear-gradient(180deg, #7c2d12, #451a03);
                    border: 2px solid #1c0a02;
                    border-bottom: none;
                    border-radius: 3px 3px 0 0;
                    z-index: 3;
                }
                .tile-wall-house.wall-base::after {
                    content: '';
                    position: absolute;
                    left: calc(50% + 6px);
                    bottom: 12px;
                    width: 2px;
                    height: 2px;
                    background: #fcd34d;
                    border-radius: 50%;
                    z-index: 4;
                }
                .tile-wall-house.wall-mart { background: #dbeafe; }

                /* Chimney for orange-roof houses */
                .house-chimney {
                    position: absolute;
                    top: -18px;
                    right: 8px;
                    width: 12px;
                    height: 22px;
                    background: linear-gradient(180deg, #57534e, #292524);
                    border: 2px solid #1c1917;
                    border-radius: 2px 2px 0 0;
                    z-index: 3;
                }
                .house-chimney::after {
                    content: '';
                    position: absolute;
                    left: -2px;
                    top: -8px;
                    width: 16px;
                    height: 4px;
                    background: #1c1917;
                    border-radius: 1px;
                }

                /* -- Lamppost ------------------------------------------- */
                .tile-lamppost { z-index: 6; }
                .lamp-post-stem {
                    position: absolute;
                    left: 50%;
                    bottom: 6px;
                    transform: translateX(-50%);
                    width: 4px;
                    height: 42px;
                    background: linear-gradient(180deg, #1f2937, #0f172a);
                    border-radius: 2px;
                    box-shadow: 0 3px 0 #0f172a;
                }
                .lamp-post-head {
                    position: absolute;
                    left: 50%;
                    top: 4px;
                    transform: translateX(-50%);
                    width: 16px;
                    height: 16px;
                    background: linear-gradient(180deg, #fde68a 0%, #d97706 70%, #78350f 100%);
                    border: 2px solid #1f2937;
                    border-radius: 4px 4px 2px 2px;
                    box-shadow: 0 2px 0 #0f172a;
                }
                .lamp-post-head.lamp-lit {
                    background: linear-gradient(180deg, #ffffff 0%, #fef08a 50%, #facc15 100%);
                    box-shadow: 0 0 14px rgba(253, 224, 71, 0.9), 0 0 28px rgba(253, 224, 71, 0.4);
                }
                .lamp-post-glow {
                    position: absolute;
                    left: 50%;
                    top: -4px;
                    transform: translateX(-50%);
                    width: 56px;
                    height: 56px;
                    background: radial-gradient(circle, rgba(253,224,71,0.35) 0%, transparent 65%);
                    pointer-events: none;
                    animation: lamp-flicker 2.2s ease-in-out infinite;
                }
                @keyframes lamp-flicker {
                    0%, 100% { opacity: 0.8; }
                    45% { opacity: 1; }
                    55% { opacity: 0.7; }
                }

                /* -- Bench ---------------------------------------------- */
                .tile-bench { z-index: 4; }
                .bench-back {
                    position: absolute;
                    bottom: 18px;
                    left: 10px;
                    right: 10px;
                    height: 6px;
                    background: linear-gradient(180deg, #92400e, #78350f);
                    border: 1px solid #451a03;
                    border-radius: 2px;
                }
                .bench-seat {
                    position: absolute;
                    bottom: 12px;
                    left: 6px;
                    right: 6px;
                    height: 6px;
                    background: linear-gradient(180deg, #b45309, #78350f);
                    border: 1px solid #451a03;
                    border-radius: 2px;
                    box-shadow: 0 2px 0 #451a03;
                }
                .bench-leg-l, .bench-leg-r {
                    position: absolute;
                    bottom: 4px;
                    width: 3px;
                    height: 10px;
                    background: #451a03;
                    border-radius: 1px;
                }
                .bench-leg-l { left: 12px; }
                .bench-leg-r { right: 12px; }

                /* -- Mailbox -------------------------------------------- */
                .tile-mailbox { z-index: 4; }
                .mailbox-post {
                    position: absolute;
                    left: 50%;
                    bottom: 4px;
                    transform: translateX(-50%);
                    width: 4px;
                    height: 28px;
                    background: #78350f;
                    border: 1px solid #451a03;
                }
                .mailbox-box {
                    position: absolute;
                    left: 50%;
                    bottom: 30px;
                    transform: translateX(-50%);
                    width: 28px;
                    height: 20px;
                    background: linear-gradient(180deg, #f87171, #b91c1c);
                    border: 2px solid #7f1d1d;
                    border-radius: 12px 12px 2px 2px;
                    box-shadow: inset 0 2px 0 rgba(255,255,255,0.3);
                }
                .mailbox-box::after {
                    content: '';
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    width: 14px;
                    height: 2px;
                    background: #1f1f1f;
                    border-radius: 1px;
                }
                .mailbox-flag {
                    position: absolute;
                    right: 12px;
                    bottom: 38px;
                    width: 6px;
                    height: 6px;
                    background: #facc15;
                    border: 1px solid #713f12;
                    animation: flag-wave 4s ease-in-out infinite;
                    transform-origin: left center;
                }
                @keyframes flag-wave {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(-8deg); }
                }

                /* -- Ambient butterflies ---------------------------------
                 * Per-tile butterfly sprite. Wings are two radial gradients
                 * sharing the same background-position so they beat in sync
                 * via the outer element's scaleX animation. The inner
                 * wrapper handles the drifting path so the two transforms
                 * compose without stomping on each other.
                 * ------------------------------------------------------ */
                .tile-butterfly {
                    position: absolute;
                    width: 14px;
                    height: 10px;
                    pointer-events: none;
                    z-index: 6;
                    filter: drop-shadow(0 0 2px rgba(255,255,255,0.5));
                    animation: butterfly-drift 12s ease-in-out infinite;
                }
                .tile-butterfly::before, .tile-butterfly::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    width: 50%;
                    height: 100%;
                    background: radial-gradient(ellipse 65% 100% at 70% 50%, #fde68a 65%, transparent 66%);
                    animation: butterfly-flap 0.25s ease-in-out infinite alternate;
                    transform-origin: right center;
                }
                .tile-butterfly::before { left: 0; }
                .tile-butterfly::after {
                    right: 0;
                    transform-origin: left center;
                    background: radial-gradient(ellipse 65% 100% at 30% 50%, #fde68a 65%, transparent 66%);
                }
                @keyframes butterfly-flap {
                    from { transform: scaleX(1); }
                    to   { transform: scaleX(0.35); }
                }
                @keyframes butterfly-drift {
                    0%   { transform: translate(0, 0); }
                    25%  { transform: translate(6px, -6px); }
                    50%  { transform: translate(12px, 2px); }
                    75%  { transform: translate(4px, -4px); }
                    100% { transform: translate(0, 0); }
                }

                /* -- Overworld Item Ball (pure CSS) ---------------------
                 * Previously we loaded a sprite from Pokemon Showdown at a
                 * URL that 404'd, leaving a broken-image icon on the
                 * overworld. This pure-CSS version cannot fail, matches
                 * the painterly tile style, and renders crisply at any
                 * zoom level. */
                .overworld-item-ball {
                    position: relative;
                    width: 38px;
                    height: 38px;
                    animation: item-ball-bob 1.4s ease-in-out infinite;
                    filter: drop-shadow(0 4px 3px rgba(0,0,0,0.35));
                }
                .overworld-item-ball-glow {
                    position: absolute;
                    inset: -6px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(253, 224, 71, 0.55) 0%, rgba(253, 224, 71, 0.15) 45%, transparent 70%);
                    animation: item-ball-glow 1.8s ease-in-out infinite;
                    pointer-events: none;
                }
                .overworld-item-ball-core {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    border: 2px solid #0f172a;
                    overflow: hidden;
                    box-shadow: inset -4px -5px 0 rgba(0,0,0,0.25), inset 4px 4px 0 rgba(255,255,255,0.22);
                }
                .overworld-item-ball-top {
                    position: absolute;
                    left: 0; right: 0; top: 0;
                    height: 50%;
                    background: linear-gradient(180deg, #f87171 0%, #dc2626 60%, #b91c1c 100%);
                }
                .overworld-item-ball-bot {
                    position: absolute;
                    left: 0; right: 0; bottom: 0;
                    height: 50%;
                    background: linear-gradient(180deg, #f9fafb 0%, #d1d5db 100%);
                }
                .overworld-item-ball-seam {
                    position: absolute;
                    left: 0; right: 0; top: 50%;
                    height: 3px;
                    background: #0f172a;
                    transform: translateY(-50%);
                }
                .overworld-item-ball-btn {
                    position: absolute;
                    top: 50%; left: 50%;
                    width: 10px; height: 10px;
                    transform: translate(-50%, -50%);
                    background: #f9fafb;
                    border-radius: 50%;
                    border: 2px solid #0f172a;
                    box-shadow: inset -1px -1px 0 rgba(0,0,0,0.25), 0 0 0 2px #0f172a;
                }
                @keyframes item-ball-bob {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-5px); }
                }
                @keyframes item-ball-glow {
                    0%, 100% { opacity: 0.55; transform: scale(1); }
                    50%      { opacity: 0.9;  transform: scale(1.08); }
                }

                /* =========================================================
                 * Living ground: tile-level motion.
                 *
                 * We keep these changes on pseudo-elements (::before / ::after)
                 * only so the base tile still composites cheaply. Each
                 * animation is pure transform + opacity -> the compositor
                 * doesn't re-layout when a blade sways.
                 * ========================================================= */

                /* Tall grass blades sway gently. The ::after element already
                 * holds the blade SVG overlay; we anchor the sway at the
                 * stems (bottom-center) and give it a prime period so
                 * neighbouring clumps don't move in lockstep. */
                .tile-tall-grass::after {
                    transform-origin: 50% 92%;
                    animation: grass-sway 4.3s ease-in-out infinite;
                    will-change: transform;
                }
                @keyframes grass-sway {
                    0%,100% { transform: rotate(-1.4deg) skewX(-1deg); }
                    50%     { transform: rotate( 1.4deg) skewX( 1deg); }
                }

                /* Flower cluster bob + soft hue shift. Kept subtle so a
                 * whole meadow doesn't shimmer unrealistically. */
                .flower-cluster-pink,
                .flower-daisy,
                .flower-tulip-red,
                .flower-bluebell,
                .flower-sunflower {
                    transform-origin: 50% 100%;
                    animation: flower-bob 5.5s ease-in-out infinite;
                    will-change: transform;
                }
                .flower-daisy      { animation-duration: 5.1s; animation-delay: -0.9s; }
                .flower-tulip-red  { animation-duration: 5.8s; animation-delay: -1.7s; }
                .flower-bluebell   { animation-duration: 5.3s; animation-delay: -2.4s; }
                .flower-sunflower  { animation-duration: 6.2s; animation-delay: -3.1s; }
                @keyframes flower-bob {
                    0%,100% { transform: rotate(-2deg) translateY(0); }
                    50%     { transform: rotate( 2deg) translateY(-1px); }
                }

                /* =========================================================
                 * Map smoothness pass.
                 *
                 * Two things make a tile-grid look like "old squares":
                 *   1. Uniform color fills that repeat at the same phase.
                 *   2. Hard, axis-aligned seams between neighbouring tiles.
                 *
                 * .map-noise is a faint world-wide noise that fights
                 * color banding without adding per-tile cost. .map-breeze
                 * lays a slowly-drifting highlight on top so the world
                 * reads as lit by a moving atmosphere rather than a
                 * static screenshot. Both are mounted inside the camera
                 * container so they translate with the world.
                 * NOTE: we deliberately do NOT paint a per-tile vignette
                 * here. In early iterations we did, but it stacks 4 dark
                 * corners at every grid intersection and *emphasizes* the
                 * tile grid -- exactly the opposite of "smoother map".
                 * ========================================================= */

                .map-noise {
                    position: absolute;
                    inset: -64px; /* bleed past the camera edge */
                    pointer-events: none;
                    z-index: 2;
                    opacity: 0.08;
                    mix-blend-mode: overlay;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
                    background-size: 180px 180px;
                }
                /* Fine drifting highlight across the map -- very subtle,
                 * reads as breeze / atmosphere and sells the "world is
                 * alive" idea without a frame-rate cost. */
                .map-breeze {
                    position: absolute;
                    inset: -64px;
                    pointer-events: none;
                    z-index: 2;
                    background:
                        radial-gradient(ellipse 40% 30% at 20% 30%, rgba(255,255,255,0.06), transparent 70%),
                        radial-gradient(ellipse 50% 35% at 70% 65%, rgba(255,255,255,0.04), transparent 70%);
                    mix-blend-mode: screen;
                    animation: breeze-drift 18s ease-in-out infinite alternate;
                }
                @keyframes breeze-drift {
                    0%   { transform: translate(-4%, -3%); opacity: 0.9; }
                    50%  { transform: translate( 2%,  1%); opacity: 1; }
                    100% { transform: translate( 5%,  3%); opacity: 0.85; }
                }
            `}</style>
            
            {showInteractPrompt && interactPos && (
                <div 
                    className="absolute z-50 pointer-events-auto cursor-pointer flex flex-col items-center transition-all duration-300 animate-bounce"
                    style={{ 
                        transform: `translate(${interactPos.x * TILE_SIZE}px, ${interactPos.y * TILE_SIZE - 40}px)`,
                        width: TILE_SIZE
                    }}
                    onClick={() => onInteract?.(interactPos.x, interactPos.y)}
                >
                    <div className="bg-yellow-400 text-black font-bold text-[10px] px-2 py-1 rounded border-2 border-black shadow-lg flex items-center gap-1">
                        <span className="bg-black text-white px-1 rounded text-[8px]">E</span>
                        INTERACT
                    </div>
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-black"></div>
                </div>
            )}

            <div className="fixed inset-0 z-30 pointer-events-none transition-colors duration-[2000ms] mix-blend-multiply" style={{ backgroundColor: timeOfDay === 'day' ? 'rgba(255,255,255,0)' : timeOfDay === 'sunset' ? 'rgba(253,186,116,0.2)' : 'rgba(15,23,42,0.5)' }}></div>

            {/* Ambient biome particles (birds, fireflies, leaves, etc.) live
                INSIDE the camera-translated world container below so they
                stay anchored to the map instead of drifting with the viewport
                as the player walks. */}

            {weather === 'rain' && (
                <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 animate-rain opacity-40" style={{ background: 'repeating-linear-gradient(170deg, transparent, transparent 40px, #94a3b8 40px, #94a3b8 41px)', backgroundSize: '100% 200%' }}></div>
                </div>
            )}
            {weather === 'snow' && (
                <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 animate-snow opacity-60" style={{ background: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                </div>
            )}
            {weather === 'sandstorm' && (
                <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden bg-orange-900/10">
                    <div className="absolute inset-0 animate-sand opacity-30" style={{ background: 'linear-gradient(90deg, transparent, #b45309 50%, transparent)', backgroundSize: '200% 100%' }}></div>
                </div>
            )}

            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-black/60 px-6 py-2 rounded-full border border-white/10 backdrop-blur-sm shadow-xl flex flex-col items-center">
                <h2 className="text-yellow-400 font-bold uppercase text-sm">{currentMap.name}</h2>
                {currentMap.biome && <span className="text-[8px] text-gray-400 uppercase tracking-widest">{currentMap.biome} BIOME</span>}
                {badges > 0 && (
                    <div className="flex gap-1 mt-1">
                        {Array.from({ length: badges }).map((_, i) => (
                            <div key={i} className="w-3 h-3 bg-yellow-400 rounded-full border border-white shadow-[0_0_5px_rgba(255,255,0,0.5)]"></div>
                        ))}
                    </div>
                )}
            </div>
            <div ref={containerRef} className="absolute transition-transform duration-300 ease-out" style={{ transform: `translate(${cameraOffset.x}px, ${cameraOffset.y}px)` }}>
                <div className="relative shadow-2xl bg-black flex flex-col" style={{ width: (layout && layout[0] ? layout[0].length : 0) * TILE_SIZE, height: (layout ? layout.length : 0) * TILE_SIZE }}>
                    {layout && layout.map((row, y) => <div key={y} className="flex">{row && row.map((tile, x) => renderTile(tile, x, y))}</div>)}
                    {/* Map-wide noise + atmospheric breeze overlays.
                        Tile-anchored (inside the camera container) so they
                        appear to sit ON the world rather than float above
                        the camera. See .map-noise / .map-breeze in the
                        style block for their motion. Interior maps skip
                        these -- indoor tiles already feel cozy without
                        weather, and the breeze overlay can read as a
                        draft where it shouldn't. */}
                    {!(mapId.includes('interior') || mapId.includes('center') || mapId.includes('mart')) && (
                        <>
                            <div className="map-noise" />
                            <div className="map-breeze" />
                        </>
                    )}
                    {/* World-anchored ambient particle layer. Percentages
                        resolve against this div's size (the whole map), so
                        particles stay fixed to world coordinates. */}
                    <BiomeAmbient
                        biome={currentMap?.biome}
                        timeOfDay={timeOfDay}
                        enabled={!(mapId.includes('interior') || mapId.includes('center') || mapId.includes('mart'))}
                    />
                </div>

                {/* Remote Players (Other than P1/P2) */}
                {Array.from(remotePlayers.entries()).map(([id, player]) => {
                    // In a 2-player game, we skip the other player because we render them via p1Pos/p2Pos
                    if (networkRole === 'host' && !player.isHost) return null;
                    if (networkRole === 'client' && player.isHost) return null;
                    
                    return player.mapId === mapId && (
                        <PlayerCharacter 
                            key={id} 
                            pos={player.position} 
                            isLocal={false} 
                            label={player.name || "Trainer"}
                            spriteUrl={player.spriteUrl || SPRITE_SHEETS.may}
                            onClick={() => onChallenge?.(id, player)}
                        />
                    );
                })}

                {/* Local Players (P1 and P2) - Real-time sync.
                    In 2-player co-op the partner is rendered via p1/p2 (NOT via remotePlayers),
                    so we wire onChallenge here too so clicking them opens the Battle/Trade menu. */}
                { p1Pos.x !== -100 && (() => {
                    const isMe = myPlayerId === 1;
                    // If I'm P2 (client), P1 is the host. Find them in remotePlayers.
                    const partner = !isMe ? Array.from(remotePlayers.entries()).find(([, p]: [string, any]) => p.isHost) : null;
                    return (
                        <PlayerCharacter
                            pos={p1Pos}
                            isLocal={isMe}
                            label={isMe ? "Me" : "Host"}
                            spriteUrl={SPRITE_SHEETS.brendan}
                            isRunning={isMe && isRunning}
                            onClick={!isMe && partner && onChallenge ? () => onChallenge(partner[0], partner[1]) : undefined}
                        />
                    );
                })()}

                { p2Pos.x !== -100 && (() => {
                    const isMe = myPlayerId === 2;
                    // If I'm P1 (host), P2 is a client. Find them in remotePlayers.
                    const partner = !isMe ? Array.from(remotePlayers.entries()).find(([, p]: [string, any]) => !p.isHost) : null;
                    return (
                        <PlayerCharacter
                            pos={p2Pos}
                            isLocal={isMe}
                            label={isMe ? "Me" : "Friend"}
                            spriteUrl={SPRITE_SHEETS.may}
                            isRunning={isMe && isRunning}
                            onClick={!isMe && partner && onChallenge ? () => onChallenge(partner[0], partner[1]) : undefined}
                        />
                    );
                })()}
            </div>
        </div>
    );
};
