
import { MapZone, TrainerData, NPCData, InteractableData, Chunk, ChunkRole, RouteIncident, RouteState, RoutePreview } from '../types';
import { getGymTeam } from '../data/gymTeams';
import { interiorPortal, gymPortal } from './interiors';
import { EARLY_IDS, MID_IDS, LATE_IDS, BIOME_POOLS } from './pokeService';

// --- TILE ID LEGEND ---
// 0: Grass (Green)
// 1: Tree (Forest Boundary/Wall)
// 2: Tall Grass (Encounter)
// 3: Water (Obstacle)
// 4: Path (Gray)
// 5: Healer (Pokemon Center Desk)
// 7: Cave Floor / Dark Ground
// 8: Fence (Horizontal)
// 9: Portal (Visual Glitch)
// 10: Shop (Mart Counter)
// 12: Item Ball (Loot)
// 13: Flowers
// 14: Ledge (Jumpable - South)
// 15: Wood Floor / Bridge
// 17: Checkered Floor
// 19: Danger Floor (High Encounter Rate / Boss Area)
// 20: Stone Floor (Ruins)
// 21: Broken Pillar (Wall)
// 22: Statue (Wall)
// 23: Forest Tree (Darker)
// 24: Rock / Mountain Wall
// 25: Sand (Desert)
// 26: Snow (Tundra)
// 27: Ice (Slippery)
// 28: Lava (Danger)
// 29: Bridge (Horizontal)
// 30-35: Red Roof House
// 40-45: Blue Roof Lab/Gym
// 80-85: Orange Roof House
// 50: Door/Mat
// 51: Campfire (Animated)
// 52: Tent (Wall)
// 53: Signpost (Interactable)
// 54: Well (Wall)
// 55: Fountain (Wall)
// 56: Berry Tree (Interactable)
// 57: Small Rock (Clutter)
// 58: Bush (Clutter)
// 59: Log (Clutter)
// 60-64: Furniture
// 65: Weather Shrine
// 66: Healing Spring
// 67: Power Shrine
// 68: Rift Portal
// 75: Red Flowers
// 76: Blue Flowers
// 77: Yellow Flowers
// 78: Mushroom (Cave/Forest)
// 79: Cactus (Desert)
// 86: Snow Pile (Snow)
// 87: Ice Crystal (Snow/Cave)
// 88: Water Lily (Lake)
// 89: Reeds (Lake edge)
// 90: Seaweed (Water)
// 91: Shells (Sand/Beach)
// 92: Cracked Earth (Canyon/Desert)
// 93: Rift Crystal (Small)
// 94: Rift Crystal (Large)
// 95: Ancient Pillar (Broken)
// 96: Ancient Pillar (Intact)

export const TRAINER_SPRITES = {
    youngster: 'https://play.pokemonshowdown.com/sprites/trainers/youngster.png',
    lass: 'https://play.pokemonshowdown.com/sprites/trainers/lass.png',
    grunt: 'https://play.pokemonshowdown.com/sprites/trainers/grunt.png',
    admin: 'https://play.pokemonshowdown.com/sprites/trainers/proton.png',
    rival: 'https://play.pokemonshowdown.com/sprites/trainers/blue.png',
    prof: 'https://play.pokemonshowdown.com/sprites/trainers/oak.png',
    leader1: 'https://play.pokemonshowdown.com/sprites/trainers/brock.png',
    leader2: 'https://play.pokemonshowdown.com/sprites/trainers/misty.png',
    leader3: 'https://play.pokemonshowdown.com/sprites/trainers/surge.png',
    leader4: 'https://play.pokemonshowdown.com/sprites/trainers/erika.png',
    leader5: 'https://play.pokemonshowdown.com/sprites/trainers/koga.png',
    leader6: 'https://play.pokemonshowdown.com/sprites/trainers/sabrina.png',
    leader7: 'https://play.pokemonshowdown.com/sprites/trainers/blaine.png',
    leader8: 'https://play.pokemonshowdown.com/sprites/trainers/giovanni.png',
    hiker: 'https://play.pokemonshowdown.com/sprites/trainers/hiker.png',
    ace: 'https://play.pokemonshowdown.com/sprites/trainers/acetrainer.png',
    veteran: 'https://play.pokemonshowdown.com/sprites/trainers/veteran.png',
    gentleman: 'https://play.pokemonshowdown.com/sprites/trainers/gentleman.png',
    worker: 'https://play.pokemonshowdown.com/sprites/trainers/worker.png',
    gambler: 'https://play.pokemonshowdown.com/sprites/trainers/gambler.png',
    beauty: 'https://play.pokemonshowdown.com/sprites/trainers/beauty.png',
    bugcatcher: 'https://play.pokemonshowdown.com/sprites/trainers/bugcatcher.png',
    camper: 'https://play.pokemonshowdown.com/sprites/trainers/camper.png',
    picnicker: 'https://play.pokemonshowdown.com/sprites/trainers/picnicker.png',
    swimmer: 'https://play.pokemonshowdown.com/sprites/trainers/swimmer.png',
    blackbelt: 'https://play.pokemonshowdown.com/sprites/trainers/blackbelt.png',
    psychic: 'https://play.pokemonshowdown.com/sprites/trainers/psychic.png',
    scientist: 'https://play.pokemonshowdown.com/sprites/trainers/scientist.png',
    juggler: 'https://play.pokemonshowdown.com/sprites/trainers/juggler.png',
    tamer: 'https://play.pokemonshowdown.com/sprites/trainers/tamer.png',
    birdkeeper: 'https://play.pokemonshowdown.com/sprites/trainers/birdkeeper.png',
    supernerd: 'https://play.pokemonshowdown.com/sprites/trainers/supernerd.png',
    biker: 'https://play.pokemonshowdown.com/sprites/trainers/biker.png',
    cueball: 'https://play.pokemonshowdown.com/sprites/trainers/cueball.png',
    sailor: 'https://play.pokemonshowdown.com/sprites/trainers/sailor.png',
    fisherman: 'https://play.pokemonshowdown.com/sprites/trainers/fisherman.png',
    rocker: 'https://play.pokemonshowdown.com/sprites/trainers/rocker.png',
    channeler: 'https://play.pokemonshowdown.com/sprites/trainers/channeler.png',
    lady: 'https://play.pokemonshowdown.com/sprites/trainers/lady.png',
    richboy: 'https://play.pokemonshowdown.com/sprites/trainers/richboy.png',
    tuber: 'https://play.pokemonshowdown.com/sprites/trainers/tuber.png',
    aromalady: 'https://play.pokemonshowdown.com/sprites/trainers/aromalady.png',
    collector: 'https://play.pokemonshowdown.com/sprites/trainers/collector.png',
    ruinmaniac: 'https://play.pokemonshowdown.com/sprites/trainers/ruinmaniac.png',
    dragontamer: 'https://play.pokemonshowdown.com/sprites/trainers/dragontamer.png',
    ninjaboy: 'https://play.pokemonshowdown.com/sprites/trainers/ninjaboy.png',
    parasollady: 'https://play.pokemonshowdown.com/sprites/trainers/parasollady.png',
    pokefan: 'https://play.pokemonshowdown.com/sprites/trainers/pokefan.png',
    expert: 'https://play.pokemonshowdown.com/sprites/trainers/expert.png',
    clown: 'https://play.pokemonshowdown.com/sprites/trainers/clown.png',
    waiter: 'https://play.pokemonshowdown.com/sprites/trainers/waiter.png',
    waitress: 'https://play.pokemonshowdown.com/sprites/trainers/waitress.png',
    socialite: 'https://play.pokemonshowdown.com/sprites/trainers/socialite.png',
    policeman: 'https://play.pokemonshowdown.com/sprites/trainers/policeman.png',
    cyclist: 'https://play.pokemonshowdown.com/sprites/trainers/cyclist.png',
    artist: 'https://play.pokemonshowdown.com/sprites/trainers/artist.png',
    backpacker: 'https://play.pokemonshowdown.com/sprites/trainers/backpacker.png',
    harlequin: 'https://play.pokemonshowdown.com/sprites/trainers/harlequin.png',
    musician: 'https://play.pokemonshowdown.com/sprites/trainers/musician.png',
    dancer: 'https://play.pokemonshowdown.com/sprites/trainers/dancer.png',
    nurse: 'https://play.pokemonshowdown.com/sprites/trainers/nurse.png',
    doctor: 'https://play.pokemonshowdown.com/sprites/trainers/doctor.png',
    ranger: 'https://play.pokemonshowdown.com/sprites/trainers/ranger.png',
    skier: 'https://play.pokemonshowdown.com/sprites/trainers/skier.png',
    boarder: 'https://play.pokemonshowdown.com/sprites/trainers/boarder.png',
    cynthia: 'https://play.pokemonshowdown.com/sprites/trainers/cynthia.png',
    steven: 'https://play.pokemonshowdown.com/sprites/trainers/steven.png',
    lance: 'https://play.pokemonshowdown.com/sprites/trainers/lance.png',
    red: 'https://play.pokemonshowdown.com/sprites/trainers/red.png',
    leaf: 'https://play.pokemonshowdown.com/sprites/trainers/leaf.png',
    ethan: 'https://play.pokemonshowdown.com/sprites/trainers/ethan.png',
    lyra: 'https://play.pokemonshowdown.com/sprites/trainers/lyra.png',
    brendan: 'https://play.pokemonshowdown.com/sprites/trainers/brendan.png',
    may: 'https://play.pokemonshowdown.com/sprites/trainers/may.png',
    lucas: 'https://play.pokemonshowdown.com/sprites/trainers/lucas.png',
    dawn: 'https://play.pokemonshowdown.com/sprites/trainers/dawn.png',
    hexmaniac: 'https://play.pokemonshowdown.com/sprites/trainers/hexmaniac.png',
    streetthug: 'https://play.pokemonshowdown.com/sprites/trainers/streetthug.png',
    delinquent: 'https://play.pokemonshowdown.com/sprites/trainers/delinquent.png',
    fairy_tale_girl: 'https://play.pokemonshowdown.com/sprites/trainers/fairytalegirl.png',
    snowboarder: 'https://play.pokemonshowdown.com/sprites/trainers/snowboarder.png'
};

// Seeded Random for consistency across P1/P2
class SeededRandom {
    private seed: number;
    constructor(seed: number) { this.seed = Math.abs(seed); }
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return Math.abs(this.seed / 233280);
    }
    nextInt(min: number, max: number) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
}

// Simple 2D Noise implementation
class Noise2D {
    private p: number[] = [];
    constructor(seed: number) {
        const rng = new SeededRandom(seed);
        for (let i = 0; i < 256; i++) this.p[i] = i;
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(rng.next() * (i + 1));
            [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
        }
        this.p = [...this.p, ...this.p];
    }

    private fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
    private lerp(t: number, a: number, b: number) { return a + t * (b - a); }
    private grad(hash: number, x: number, y: number) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise(x: number, y: number) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        const u = this.fade(x);
        const v = this.fade(y);
        const A = this.p[X] + Y, AA = this.p[A], AB = this.p[A + 1];
        const B = this.p[X + 1] + Y, BA = this.p[B], BB = this.p[B + 1];

        return this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y),
                                     this.grad(this.p[BA], x - 1, y)),
                            this.lerp(u, this.grad(this.p[AB], x, y - 1),
                                     this.grad(this.p[BB], x - 1, y - 1)));
    }
}

const globalNoise = new Noise2D(12345); // Fixed seed for global biome noise
const moistureNoise = new Noise2D(67890);

const getChunkSeed = (x: number, y: number) => {
    const h = (x * 374761393) ^ (y * 668265263);
    return Math.abs((h ^ (h >>> 13)) * 1274126177);
};

export const CHUNK_SIZE = 20;

/**
 * Deterministic 4-input hash → float in [0,1). Used by `getGrassAura` below
 * so the aura of a specific tile within a chunk is stable across renders and
 * across save/reload without storing per-tile state.
 */
const hash4 = (a: number, b: number, c: number, d: number): number => {
    let h = a | 0;
    h = Math.imul(h ^ (b | 0), 2246822519);
    h = Math.imul(h ^ (c | 0), 3266489917);
    h = Math.imul(h ^ (d | 0), 668265263);
    h ^= h >>> 13;
    h = Math.imul(h, 374761393);
    h ^= h >>> 16;
    return ((h >>> 0) % 100000) / 100000;
};

/**
 * A "grass aura" is a per-tile flag that promotes a chunk's homogenous
 * tall-grass patches into distinct visual + mechanical events. All tiles
 * default to 'normal'; the rarer tiers give the player something to SEE
 * and AIM for rather than just waiting for random encounters.
 *
 *   normal    (~87%) — baseline wild encounter roll.
 *   rustling  (~10%) — guaranteed encounter + higher level, shiny odds x4.
 *   alpha     (~2.5%) — oversized wild, ~5 levels above floor, held item.
 *   anomaly   (~0.3%) — rare-pool (biome legendary-leaning) encounter with
 *                      a one-off catch permit refund on success.
 *
 * Distribution is biased slightly by distance from origin: far chunks get
 * a modest bump to alpha / anomaly rolls. Near-spawn players still see
 * rustling occasionally so the system teaches itself.
 *
 * The previous tuning (20 / 8 / 2) felt like a slot machine -- auras were
 * constantly popping on-screen. These rates are closer to "cool when it
 * happens" territory: roughly 1 rustle per 10 grass tiles, 1 alpha per 40,
 * 1 anomaly per 300.
 */
export type GrassAura = 'normal' | 'rustling' | 'alpha' | 'anomaly';

export const getGrassAura = (cx: number, cy: number, tx: number, ty: number): GrassAura => {
    const roll = hash4(cx, cy, tx, ty);
    const dist = Math.sqrt(cx * cx + cy * cy);
    // +1.5% alpha / +0.3% anomaly by dist ~60 (capped). Tight so rarity
    // holds across the whole world instead of scaling up into spam.
    const depthBonus = Math.min(0.015, dist / 4000);

    // Thresholds from the top. Order matters: anomaly < alpha < rustling.
    const anomalyThresh = 0.003 + depthBonus * 0.2;              // 0.3% -> 0.6%
    const alphaThresh   = anomalyThresh + 0.025 + depthBonus;    // ~2.5% -> ~4%
    const rustleThresh  = alphaThresh + 0.10;                    // +10% (stable)
    if (roll < anomalyThresh) return 'anomaly';
    if (roll < alphaThresh)   return 'alpha';
    if (roll < rustleThresh)  return 'rustling';
    return 'normal';
};

/**
 * ---- MASS OUTBREAK -----------------------------------------------------
 *
 * A chunk-wide event where one specific species dominates wild encounters.
 * Synergy-first design:
 *   - Stacks trivially with Catch Combo (same species over and over).
 *   - Biases its roster toward common early species on purpose. The
 *     "endorphin hit" is the visible commitment you make to chain a
 *     species for 20+, not scoring a unique catch.
 *   - Deterministic per (chunk,biome) so a player can bookmark a chunk
 *     and re-enter later.
 *
 * Not placed near spawn (< 3 chunks from origin): the tutorial town reads
 * weird with an infestation, and the player hasn't learned the chain
 * system yet.
 *
 * Roughly ~2% of chunks are outbreak chunks, modulated slightly by
 * distance from origin (more far out, capped).
 */
const OUTBREAK_CANDIDATES: Record<string, number[]> = {
    forest: [10, 13, 16, 19, 29, 32, 43, 46, 69, 161, 163, 191, 263, 287, 399, 412, 415, 418, 540, 585, 659, 664, 819],
    desert: [27, 50, 74, 104, 111, 328, 449, 551, 631, 667, 749, 769, 831],
    snow:   [86, 90, 124, 220, 361, 459, 471, 613, 712, 872, 974],
    lake:   [60, 72, 79, 98, 118, 129, 170, 183, 194, 270, 456, 501, 535, 564, 580, 656, 728],
    canyon: [21, 22, 56, 74, 95, 231, 246, 304, 328, 443, 524, 557, 610, 621, 696, 744],
    town:   [16, 19, 25, 35, 39, 52, 172, 173, 175, 298],
    cave:   [41, 74, 95, 169, 207, 246, 293, 304, 337, 343, 353, 524, 595, 696, 713, 867],
    rift:   [147, 246, 371, 443, 633, 704, 866, 885],
    center: [], // no outbreaks inside buildings
    pallet: [],
    rival:  [],
    grandma:[],
    gym:    [],
};

export const getChunkOutbreak = (cx: number, cy: number, biome: string): { speciesId: number } | null => {
    const dist = Math.sqrt(cx * cx + cy * cy);
    if (dist < 3) return null; // keep spawn sane
    // Use a different nonce than the grass-aura hash so the two systems
    // decorrelate cleanly.
    const roll = hash4(cx, cy, 777, 0);
    const baseChance = 0.02;                                // 2%
    const depthBonus = Math.min(0.015, dist / 3000);        // up to +1.5% far out
    if (roll >= baseChance + depthBonus) return null;

    const pool = OUTBREAK_CANDIDATES[biome] || OUTBREAK_CANDIDATES.forest;
    if (pool.length === 0) return null;
    const pickIdx = Math.floor(hash4(cx, cy, 555, 1) * pool.length);
    return { speciesId: pool[pickIdx] };
};

/**
 * ---- ROUTE TRAINER SYSTEM ---------------------------------------------
 *
 * Deterministic, biome-themed trainers placed inside random chunks to
 * break up the wild-encounter rhythm between gyms. Design rules:
 *
 *   - ~12% of non-POI chunks have 1 trainer, ~2.5% have a duo gauntlet.
 *   - Not placed inside gym chunks, not near spawn (dist < 3).
 *   - Archetype matches biome (Hiker in canyon, Fisherman at lake, ...).
 *   - Every team is AT LEAST 2 mons so the double-battle engine has a
 *     proper pair. Teams pull from the biome encounter pool so the
 *     trainer feels "of this place."
 *   - Level scales with chunk distance, tier slightly above wild floor
 *     so the fight is a meaningful break from catching.
 *   - Each trainer is stored on the chunk's `trainers` map; the
 *     interaction code in App.tsx triggers the fight when the player
 *     steps on the tile, same path gym leaders / ghost trainers use.
 *
 * Gauntlet: if a chunk rolls a duo, the 2nd trainer's id is stored on
 * the 1st trainer's `gauntletNextTrainerId`. The App-side handler
 * auto-queues battle B when battle A resolves in victory, WITHOUT
 * healing the player's team between. Losing the duo = losing both.
 */
interface TrainerArchetype {
    key: string;
    spriteKey: keyof typeof TRAINER_SPRITES;
    namePool: string[];
    greeting: string[];
    loss: string[];
    /** Species IDs this archetype loves. Will be mixed w/ the biome pool. */
    signaturePool: number[];
}

const ROUTE_ARCHETYPES: Record<string, TrainerArchetype[]> = {
    forest: [
        {
            key: 'bugcatcher', spriteKey: 'bugcatcher',
            namePool: ['Rick', 'Doug', 'Sammy', 'Ethan', 'Kent'],
            greeting: ["Hey! My bugs are the coolest!", "You like bugs? Let's battle!", "I caught this one myself!"],
            loss: ["Aww, you're tough.", "I need better bugs...", "One day I'll win!"],
            signaturePool: [10, 13, 14, 15, 16, 17, 165, 166, 167, 267, 268, 269, 412, 414, 415, 416],
        },
        {
            key: 'camper', spriteKey: 'camper',
            namePool: ['Brent', 'Todd', 'Matt', 'Jim'],
            greeting: ["Welcome to my camp, challenger!", "The great outdoors demands a battle!"],
            loss: ["A worthy fight. Well done.", "I'll remember this."],
            signaturePool: [16, 19, 29, 32, 43, 69, 161, 263, 270, 296, 504, 659],
        },
        {
            key: 'picnicker', spriteKey: 'picnicker',
            namePool: ['Liz', 'Diana', 'Gina', 'Amy'],
            greeting: ["Care to battle over lunch?", "Perfect day for a picnic... and a fight!"],
            loss: ["You were lovely to battle.", "Share a sandwich next time."],
            signaturePool: [25, 39, 43, 183, 298, 300, 311, 312, 418, 659],
        },
    ],
    desert: [
        {
            key: 'ruinmaniac', spriteKey: 'ruinmaniac',
            namePool: ['Larry', 'Foster', 'Augustin'],
            greeting: ["These ruins whisper secrets!", "Respect the ancient stones, traveler!"],
            loss: ["The dust claims another.", "I'll find better artifacts..."],
            signaturePool: [27, 50, 74, 95, 104, 219, 246, 328, 443, 524, 557, 622, 696, 744],
        },
        {
            key: 'hiker', spriteKey: 'hiker',
            namePool: ['Russell', 'Marc', 'Benjamin', 'Lucas'],
            greeting: ["The dunes hide strong creatures!", "Watch your step out here!"],
            loss: ["Good climb, stranger.", "I'll see you on the trail!"],
            signaturePool: [50, 74, 75, 95, 218, 231, 246, 328, 443, 524],
        },
    ],
    snow: [
        {
            key: 'skier', spriteKey: 'skier',
            namePool: ['Erin', 'Bryce', 'Tia', 'Clark'],
            greeting: ["Fresh powder calls for a fresh fight!", "Cold never bothered me anyway."],
            loss: ["I'll carve it up next time.", "You slipped right past me."],
            signaturePool: [86, 90, 124, 220, 361, 459, 471, 613, 872],
        },
        {
            key: 'boarder', spriteKey: 'snowboarder',
            namePool: ['Kai', 'Shaun', 'Jax'],
            greeting: ["Yo! Let's shred AND battle!", "My boarder mons carve HARD."],
            loss: ["Gnarly combat, dude.", "Respect the mountain."],
            signaturePool: [124, 220, 361, 459, 471, 613, 712, 872],
        },
    ],
    lake: [
        {
            key: 'fisherman', spriteKey: 'fisherman',
            namePool: ['Arnold', 'Barney', 'Chris', 'Walter'],
            greeting: ["Hooked a big one today!", "My line never lies. Battle!"],
            loss: ["One that got away...", "Casting again tomorrow."],
            signaturePool: [60, 72, 98, 116, 129, 170, 183, 318, 339, 456, 501, 535, 728],
        },
        {
            key: 'swimmer', spriteKey: 'swimmer',
            namePool: ['Lucy', 'Mike', 'Denise', 'Paolo'],
            greeting: ["Laps warmed me up nicely!", "You're between me and the shore!"],
            loss: ["Back to the deep I go.", "Good form out there."],
            signaturePool: [7, 54, 60, 79, 98, 118, 120, 129, 170, 194, 270, 318, 341, 349],
        },
        {
            key: 'sailor', spriteKey: 'sailor',
            namePool: ['Duncan', 'Huey', 'Phillip'],
            greeting: ["Storms don't scare me. Does you?", "Ship's ready. Battle's on."],
            loss: ["Anchor's up. Later.", "Fair winds, rookie."],
            signaturePool: [72, 98, 116, 120, 129, 320, 367, 456, 535, 690, 728],
        },
    ],
    canyon: [
        {
            key: 'hiker', spriteKey: 'hiker',
            namePool: ['Gregory', 'Daniel', 'Nicholas'],
            greeting: ["Rocks are my language!", "The ridgelines called me!"],
            loss: ["Fair climb, champion.", "I'll rest at the summit."],
            signaturePool: [74, 75, 95, 111, 246, 304, 328, 371, 443, 524, 557, 696],
        },
        {
            key: 'worker', spriteKey: 'worker',
            namePool: ['Colin', 'Aaron', 'Derek'],
            greeting: ["Shift's over. Fight's on!", "Built strong. Fought strong."],
            loss: ["Clockin' out.", "Nice swing, boss."],
            signaturePool: [74, 75, 95, 304, 443, 524, 532, 622, 696, 744],
        },
        {
            key: 'ruinmaniac', spriteKey: 'ruinmaniac',
            namePool: ['Karl', 'Geoff', 'Lamarr'],
            greeting: ["These canyons are my library!", "Every rock tells a story!"],
            loss: ["Back to the dig site.", "You fight like a scholar."],
            signaturePool: [95, 246, 304, 328, 443, 524, 557, 696, 744],
        },
    ],
    town: [
        {
            key: 'richboy', spriteKey: 'richboy',
            namePool: ['Winston', 'Beauregard', 'Cassius'],
            greeting: ["Daddy says I'm the best.", "I'll pay double if I lose. Deal?"],
            loss: ["Here's your winnings.", "Daddy will hear about this!"],
            signaturePool: [25, 39, 113, 122, 133, 172, 183, 196, 197, 470, 471, 684, 685],
        },
        {
            key: 'gentleman', spriteKey: 'gentleman',
            namePool: ['Roderick', 'Humphrey', 'Eldrick'],
            greeting: ["A proper match, if you please.", "My gentle-mon are anything but."],
            loss: ["Splendid, well played.", "Tea, perhaps, next time?"],
            signaturePool: [25, 39, 113, 133, 183, 196, 197, 280, 470, 471, 684],
        },
        {
            key: 'lady', spriteKey: 'lady',
            namePool: ['Cybil', 'Magdalene', 'Rosabel'],
            greeting: ["How charming. En garde!", "My boutique raised these dears."],
            loss: ["Ah, c'est la vie.", "Splendid effort, darling."],
            signaturePool: [25, 39, 113, 183, 311, 312, 470, 471, 684, 685],
        },
    ],
    cave: [
        {
            key: 'blackbelt', spriteKey: 'blackbelt',
            namePool: ['Kenji', 'Hitoshi', 'Daisuke'],
            greeting: ["Your fists speak through your mons!", "Train harder. Then fight me."],
            loss: ["A worthy discipline.", "Strength recognizes strength."],
            signaturePool: [66, 67, 68, 106, 107, 236, 237, 296, 297, 532, 619, 674, 675],
        },
        {
            key: 'ninjaboy', spriteKey: 'ninjaboy',
            namePool: ['Yasu', 'Riki', 'Taro'],
            greeting: ["You cannot see me. But my mons will!", "Shadows protect the swift."],
            loss: ["Vanishing...", "Tell no one."],
            signaturePool: [41, 95, 169, 207, 213, 246, 302, 359, 595, 696, 867],
        },
        {
            key: 'hiker', spriteKey: 'hiker',
            namePool: ['Manuel', 'Timothy', 'Quentin'],
            greeting: ["These caves go on forever!", "Mind the stalactites!"],
            loss: ["Cave echoes...", "Watch your torch."],
            signaturePool: [41, 74, 95, 246, 304, 337, 353, 524, 595, 713],
        },
    ],
    rift: [
        {
            key: 'veteran', spriteKey: 'veteran',
            namePool: ['Silas', 'Orson', 'Vega'],
            greeting: ["You shouldn't be here.", "The rift ate weaker trainers."],
            loss: ["You pass, then.", "The rift respects you."],
            signaturePool: [149, 248, 373, 376, 445, 635, 706, 784, 889, 887],
        },
    ],
};

/** Used when a biome has no archetype entry (e.g. center/pallet) -- return []. */
const EMPTY_ARCHETYPES: TrainerArchetype[] = [];

interface AmbientNpcArchetype {
    key: string;
    spriteKeys: Array<keyof typeof TRAINER_SPRITES>;
    names: string[];
    lines: string[];
    challengeTypes: Array<'battle' | 'collect' | 'explore' | 'type_trial'>;
}

const AMBIENT_NPC_BY_BIOME: Record<string, AmbientNpcArchetype[]> = {
    forest: [
        {
            key: 'ranger',
            spriteKeys: ['ranger', 'backpacker', 'artist'],
            names: ['Ranger Mira', 'Scout Hale', 'Trail Guide Nori', 'Pathfinder Oren'],
            lines: [
                'Routes shift after storms -- keep checking signposts.',
                'Wild tracks here are fresh. Keep your lead healthy.',
                'I map safe camps. You map victories.',
            ],
            challengeTypes: ['collect', 'explore'],
        },
        {
            key: 'collector',
            spriteKeys: ['collector', 'pokefan', 'lady'],
            names: ['Collector Vio', 'Archivist Lyra', 'Field Curator Mox'],
            lines: [
                'I catalogue rare finds from every biome.',
                'Bring me supplies and I will return the favor.',
                'Knowledge is loot that never runs out.',
            ],
            challengeTypes: ['collect', 'type_trial'],
        },
    ],
    lake: [
        {
            key: 'angler',
            spriteKeys: ['fisherman', 'swimmer', 'sailor'],
            names: ['Angler Boone', 'Captain Rhea', 'Diver Finn'],
            lines: [
                'Currents changed this morning. Encounters did too.',
                'Water routes reward patience and pressure.',
                'Storm clouds? Perfect weather for a challenge.',
            ],
            challengeTypes: ['battle', 'collect'],
        },
    ],
    desert: [
        {
            key: 'survivalist',
            spriteKeys: ['worker', 'hiker', 'ruinmaniac'],
            names: ['Survivalist Kade', 'Dune Walker Sia', 'Relic Scout Bran'],
            lines: [
                'In the dunes, planning matters more than power.',
                'Sand erases footprints -- but not mistakes.',
                'Keep water and potions stocked before nightfall.',
            ],
            challengeTypes: ['collect', 'battle'],
        },
    ],
    snow: [
        {
            key: 'patrol',
            spriteKeys: ['skier', 'snowboarder', 'boarder'],
            names: ['Patrol Ilya', 'Slope Medic Ren', 'Ice Scout Vale'],
            lines: [
                'Blizzards hide danger floors. Move carefully.',
                'Cold routes punish unprepared teams.',
                'A quick challenge keeps the blood warm.',
            ],
            challengeTypes: ['battle', 'explore'],
        },
    ],
    canyon: [
        {
            key: 'cliffguard',
            spriteKeys: ['hiker', 'worker', 'dragontamer'],
            names: ['Cliffguard Tor', 'Ridge Marshal Bea', 'Outrider Pax'],
            lines: [
                'One wrong step and the canyon decides for you.',
                'Rock paths reward bulky leads and smart switches.',
                'Face me if you want to pass this ridge.',
            ],
            challengeTypes: ['battle', 'type_trial'],
        },
    ],
    town: [
        {
            key: 'guild',
            spriteKeys: ['gentleman', 'lady', 'waiter', 'waitress', 'socialite', 'policeman', 'doctor'],
            names: ['Guild Courier Ana', 'City Clerk Otto', 'Trainer Liaison Vee', 'Dispatch Officer Quin'],
            lines: [
                'Guild contracts rotate every morning.',
                'Strong trainers help keep the roads open.',
                'Need a side challenge? I have one ready.',
            ],
            challengeTypes: ['collect', 'explore', 'type_trial'],
        },
    ],
    cave: [
        {
            key: 'spelunker',
            spriteKeys: ['supernerd', 'scientist', 'hexmaniac', 'channeler'],
            names: ['Spelunker Tess', 'Cave Analyst Rio', 'Echo Seer Iona'],
            lines: [
                'Echoes here can warn you before battles.',
                'Crystals react to strong teams.',
                'Deep routes hide rewards for careful explorers.',
            ],
            challengeTypes: ['explore', 'battle'],
        },
    ],
    rift: [
        {
            key: 'riftwatch',
            spriteKeys: ['expert', 'veteran', 'cynthia', 'steven', 'lance'],
            names: ['Riftwatch Orion', 'Warden Selene', 'Gatekeeper Voss'],
            lines: [
                'The Rift bends weak plans into losses.',
                'Only disciplined teams survive this far.',
                'Prove your control and claim your reward.',
            ],
            challengeTypes: ['battle', 'type_trial', 'explore'],
        },
    ],
};

const pickAmbientNpc = (
    cx: number,
    cy: number,
    biome: string,
    idx: number,
    levelBase: number,
): NPCData => {
    const list = AMBIENT_NPC_BY_BIOME[biome] ?? AMBIENT_NPC_BY_BIOME.forest;
    const a = list[Math.floor(hash4(cx, cy, 23000 + idx, 0) * list.length)];
    const name = a.names[Math.floor(hash4(cx, cy, 23001 + idx, 0) * a.names.length)];
    const spriteKey = a.spriteKeys[Math.floor(hash4(cx, cy, 23002 + idx, 0) * a.spriteKeys.length)];
    const lineA = a.lines[Math.floor(hash4(cx, cy, 23003 + idx, 0) * a.lines.length)];
    const lineB = a.lines[Math.floor(hash4(cx, cy, 23004 + idx, 0) * a.lines.length)];
    const challengeType = a.challengeTypes[Math.floor(hash4(cx, cy, 23005 + idx, 0) * a.challengeTypes.length)];

    const npc: NPCData = {
        id: `ambient_${a.key}_${cx}_${cy}_${idx}`,
        name,
        sprite: TRAINER_SPRITES[spriteKey],
        dialogue: [lineA, lineB, `("${biome.toUpperCase()} route report logged.")`],
        facing: ['up', 'down', 'left', 'right'][Math.floor(hash4(cx, cy, 23006 + idx, 0) * 4)] as any,
    };

    // Keep rewards modest and route-scaled.
    const rewardId = 1 + Math.floor(hash4(cx, cy, 23007 + idx, 0) * 251);
    const rewardLevel = Math.max(5, Math.min(80, levelBase + 2));

    if (challengeType === 'battle') {
        npc.challenge = { type: 'battle', target: 'duel', rewardPokemonId: rewardId, rewardLevel };
        npc.dialogue.push('Challenge duel accepted?');
    } else if (challengeType === 'collect') {
        npc.challenge = { type: 'collect', target: '5 potions', rewardPokemonId: rewardId, rewardLevel };
        npc.dialogue.push('Bring me 5 Potions and I will support your run.');
    } else if (challengeType === 'type_trial') {
        const reqTypes = ['fire', 'water', 'grass', 'electric', 'rock', 'ghost', 'steel', 'psychic'];
        const requiredType = reqTypes[Math.floor(hash4(cx, cy, 23008 + idx, 0) * reqTypes.length)];
        npc.challenge = { type: 'type_trial', target: requiredType, requiredType, rewardPokemonId: rewardId, rewardLevel };
        npc.dialogue.push(`Only ${requiredType.toUpperCase()} specialists pass my trial.`);
    } else {
        npc.challenge = { type: 'explore', target: 'field report', rewardPokemonId: rewardId, rewardLevel };
        npc.dialogue.push('Return after proving your route knowledge.');
    }

    return npc;
};

/**
 * Decides the route-trainer layout for a given chunk. Deterministic on
 * (cx,cy). Returns an array of 0, 1, or 2 placements with all team /
 * archetype / flavor data pre-chosen so generateChunk just has to slot
 * them into the layout.
 */
interface RouteTrainerPlacement {
    archetype: TrainerArchetype;
    name: string;
    tier: 'rookie' | 'veteran' | 'ace';
    tierIndex: 0 | 1 | 2;
    teamSpecies: number[];
    level: number;
    teamSize: number;
}

interface RouteTrainerSpawnPolicy {
    earlyBand: boolean;
    forceSpawn: boolean;
    allowDuo: boolean;
    allowTierRamp: boolean;
}

const getRouteTrainerSpawnPolicy = (dist: number): RouteTrainerSpawnPolicy => {
    const earlyBand = dist <= 8;
    return {
        earlyBand,
        forceSpawn: earlyBand,
        allowDuo: !earlyBand && dist > 5,
        allowTierRamp: !earlyBand,
    };
};

const ROUTE_EARLY_MAX_DIST = 10;
const ROUTE_MID_MAX_DIST = 28;

const getRouteProgressionSpeciesSet = (dist: number): Set<number> => {
    if (dist <= ROUTE_EARLY_MAX_DIST) return new Set<number>(EARLY_IDS);
    if (dist <= ROUTE_MID_MAX_DIST) return new Set<number>([...EARLY_IDS, ...MID_IDS]);
    return new Set<number>([...EARLY_IDS, ...MID_IDS, ...LATE_IDS]);
};

const buildRouteTrainerSpeciesPool = (
    biome: string,
    signaturePool: number[],
    dist: number,
): number[] => {
    const allowed = getRouteProgressionSpeciesSet(dist);
    const biomeBase = BIOME_POOLS[biome] ?? BIOME_POOLS.forest ?? [];
    const biomeFiltered = biomeBase.filter(id => allowed.has(id));
    const signatureFiltered = signaturePool.filter(id => allowed.has(id));
    const biomeUnique = Array.from(new Set(biomeFiltered));
    const signatureUnique = Array.from(new Set(signatureFiltered));

    // Weighted blend:
    // - Biome pool gives broad variety and prevents "same few trainer species".
    // - Signature pool keeps each trainer archetype identity recognizable.
    const weighted = [
        ...biomeUnique,
        ...biomeUnique,
        ...signatureUnique,
    ];
    const uniqueWeighted = Array.from(new Set(weighted));
    if (uniqueWeighted.length > 0) return uniqueWeighted;
    if (biomeUnique.length > 0) return biomeUnique;
    if (signatureUnique.length > 0) return signatureUnique;
    return Array.from(allowed);
};

export const getRouteTrainers = (cx: number, cy: number, biome: string): RouteTrainerPlacement[] => {
    const dist = Math.sqrt(cx * cx + cy * cy);
    if (dist < 1) return []; // keep origin chunk trainer-free, allow nearby routes
    const archetypes = ROUTE_ARCHETYPES[biome] ?? EMPTY_ARCHETYPES;
    if (archetypes.length === 0) return [];

    // Early-route guarantee:
    // The first few chunks outside Pallet must not feel empty. After the
    // balancing refactor the normal spawn chance (~12%) was too sparse, so
    // players could walk several startup chunks without seeing a single
    // trainer. Force one route trainer in the near-spawn ring.
    const spawnPolicy = getRouteTrainerSpawnPolicy(dist);
    if (!spawnPolicy.forceSpawn) {
        const spawnRoll = hash4(cx, cy, 1111, 0);
        // Keep routes visibly populated with trainers, especially during
        // early/mid live playtests where "empty roads" feels broken.
        const spawnChance = 0.18 + Math.min(0.06, dist / 500);
        if (spawnRoll >= spawnChance) return [];
    }

    // Archetype pick + name pick, both deterministic.
    const aIdx = Math.floor(hash4(cx, cy, 2222, 0) * archetypes.length);
    const arch = archetypes[aIdx];
    const nameIdx = Math.floor(hash4(cx, cy, 3333, 0) * arch.namePool.length);
    const name = arch.namePool[nameIdx];

    // Tier: rookie / veteran / ace ramps with distance. Near gyms
    // (dist ~ 5) rookie dominates; deep in the map aces become common.
    const tierRoll = hash4(cx, cy, 4444, 0);
    let tierIndex: 0 | 1 | 2 = 0;
    let tier: 'rookie' | 'veteran' | 'ace' = 'rookie';
    if (spawnPolicy.allowTierRamp) {
        if (dist > 10 && tierRoll > 0.65)      { tierIndex = 1; tier = 'veteran'; }
        if (dist > 25 && tierRoll > 0.90)      { tierIndex = 2; tier = 'ace'; }
        else if (dist > 15 && tierRoll > 0.80) { tierIndex = 1; tier = 'veteran'; }
    }

    // Team size: 2 for rookie, 3 for veteran, 4 for ace.
    const teamSize = 2 + tierIndex; // 2 / 3 / 4

    // Route-trainer level curve (rebalanced):
    // - Early game: gentle slope so first encounters don't spike too hard.
    // - Mid game: pick up pace around dist~12.
    // - Late game: continue rising but with smaller incremental steps so
    //   badges + wild-cap logic can still breathe.
    const levelFromDistance = (d: number, tierBonus: number): number => {
        const early = Math.floor(d * 0.85) + 3;
        const mid = d > 12 ? Math.floor((d - 12) * 0.40) : 0;
        const late = d > 32 ? Math.floor((d - 32) * 0.22) : 0;
        return Math.max(3, Math.min(100, early + mid + late + tierBonus));
    };
    const level = levelFromDistance(dist, tierIndex * 2);

    // Team composition: mix of archetype signature + biome pool.
    const biomePool = (typeof (globalThis as any).__BIOME_POOLS_CACHE__ === 'object')
        ? null
        : null;
    void biomePool; // keep import graph clean -- App/Service fetch species later
    const safePool = buildRouteTrainerSpeciesPool(biome, arch.signaturePool, dist);
    const team: number[] = [];
    const usedSpecies = new Set<number>();
    for (let i = 0; i < teamSize; i++) {
        let pick = Math.floor(hash4(cx, cy, 5555, i) * safePool.length);
        let chosen = safePool[pick];
        if (safePool.length > 1 && usedSpecies.has(chosen)) {
            // Early routes felt repetitive ("double same-species squads" back-to-back).
            // Deterministically step through an alternate slot before allowing duplicates.
            for (let hop = 1; hop < safePool.length; hop++) {
                const alt = safePool[(pick + hop) % safePool.length];
                if (!usedSpecies.has(alt)) {
                    chosen = alt;
                    break;
                }
            }
        }
        team.push(chosen);
        usedSpecies.add(chosen);
    }

    const result: RouteTrainerPlacement[] = [
        { archetype: arch, name, tier, tierIndex, teamSpecies: team, level, teamSize },
    ];

    // Duo (gauntlet) chance: ~20% of spawned chunks get a second trainer.
    // They draw independently so you can absolutely run into a Fisherman
    // standing near a Swimmer -- feels organic.
    const duoRoll = hash4(cx, cy, 6666, 0);
    if (spawnPolicy.allowDuo && duoRoll < 0.20) {
        const aIdx2 = Math.floor(hash4(cx, cy, 7777, 0) * archetypes.length);
        const arch2 = archetypes[aIdx2];
        const nameIdx2 = Math.floor(hash4(cx, cy, 8888, 0) * arch2.namePool.length);
        const name2 = arch2.namePool[(nameIdx2 + 1) % arch2.namePool.length]; // avoid dupe
        const tierIndex2: 0 | 1 | 2 = Math.max(tierIndex - 1 as 0 | 1, 0) as 0 | 1 | 2;
        const tier2: 'rookie' | 'veteran' | 'ace' =
            tierIndex2 === 2 ? 'ace' : tierIndex2 === 1 ? 'veteran' : 'rookie';
        const teamSize2 = 2 + tierIndex2;
        const level2 = levelFromDistance(dist, tierIndex2 * 2);
        const safePool2 = buildRouteTrainerSpeciesPool(biome, arch2.signaturePool, dist);
        const team2: number[] = [];
        const usedSpecies2 = new Set<number>();
        for (let i = 0; i < teamSize2; i++) {
            let pick = Math.floor(hash4(cx, cy, 9999, i) * safePool2.length);
            let chosen = safePool2[pick];
            if (safePool2.length > 1 && usedSpecies2.has(chosen)) {
                for (let hop = 1; hop < safePool2.length; hop++) {
                    const alt = safePool2[(pick + hop) % safePool2.length];
                    if (!usedSpecies2.has(alt)) {
                        chosen = alt;
                        break;
                    }
                }
            }
            team2.push(chosen);
            usedSpecies2.add(chosen);
        }
        result.push({
            archetype: arch2, name: name2, tier: tier2, tierIndex: tierIndex2,
            teamSpecies: team2, level: level2, teamSize: teamSize2,
        });
    }

    return result;
};

/**
 * Soft cap on how far the player can chunk-transition from origin. Beyond
 * this, movement is blocked with a "world edge" message. Keeps save sizes
 * bounded (discoveredChunks array) and avoids Number precision issues at
 * very large cx/cy that degrade noise-based biome/level rules.
 *
 * 200 * 20 = 4000 tiles in any direction. Well past all designed content:
 *   - all 8 main gyms end at distance 40
 *   - rift ring is at distance 50
 *   - world bosses past distance 100
 *   - elite four past distance 150
 */
export const WORLD_MAX_DIST = 200;

/**
 * Curated gym locations -- ONE unique (cx, cy) per badge, spread around the
 * compass so the player is pulled into every octant over the full 8-gym arc
 * rather than shuttling back and forth along a single corridor.
 *
 * Design goals:
 *   1. Each badge has exactly ONE gym in the world (no mirrored copies).
 *      Finding a gym feels like a real discovery.
 *   2. Every octant (N, NE, E, SE, S, SW, W, NW) contains at least one gym,
 *      so whichever direction the player wanders first, they will run into
 *      *some* gym within ~10 chunks.
 *   3. Distance grows with badge number so the level curve of the gym
 *      matches the wild-encounter curve of the surrounding chunks -- a
 *      badge-3 gym shouldn't sit next to badge-7 wild mons.
 *   4. All 8 gyms sit at distance < 42, safely inside the rift ring at 50.
 *
 * The world remains navigable without this list (wild mons, trainers,
 * events still spawn everywhere), but without the compass signposts below
 * this would amount to pixel-hunting. The compass signposts turn this
 * layout into a *guided* exploration puzzle: "the sign says NE, go NE".
 */
export const GYM_LOCATIONS: ReadonlyArray<{ cx: number; cy: number; badge: number }> = [
    { cx:   5, cy:   0, badge: 1 }, // E   dist 5.0
    { cx:  -7, cy:   7, badge: 2 }, // SW  dist 9.9
    { cx:   0, cy: -14, badge: 3 }, // N   dist 14.0
    { cx:  13, cy:  13, badge: 4 }, // SE  dist 18.4
    { cx: -22, cy:   0, badge: 5 }, // W   dist 22.0
    { cx:  19, cy: -19, badge: 6 }, // NE  dist 26.9
    { cx:   0, cy:  32, badge: 7 }, // S   dist 32.0
    { cx: -27, cy: -27, badge: 8 }, // NW  dist 38.2
];

const GUARANTEED_GYMS: Record<string, number> = (() => {
    const out: Record<string, number> = {};
    for (const g of GYM_LOCATIONS) out[`${g.cx},${g.cy}`] = g.badge;
    return out;
})();

/**
 * Return the next gym the player needs (based on badges earned so far), or
 * null if they've already cleared all 8. Used by the compass-signpost
 * interaction handler to render dynamic "Gym N is to the NE" text.
 */
export const getNextGymTarget = (badges: number): { cx: number; cy: number; badge: number } | null => {
    const next = GYM_LOCATIONS.find(g => g.badge === badges + 1);
    return next ?? null;
};

/**
 * Convert a (dx, dy) offset in chunk space into a human-readable compass
 * direction. Chunk y grows *downward* on screen (north = -y), so we invert
 * dy before computing the angle. Returns one of the 8 cardinal/inter-
 * cardinal names.
 */
export const compassDirectionName = (dx: number, dy: number): string => {
    if (dx === 0 && dy === 0) return 'here';
    // angle in degrees, 0 = east, 90 = north (math convention)
    const deg = (Math.atan2(-dy, dx) * 180) / Math.PI;
    // rotate so north maps to bucket 0, then pick one of 8 buckets of 45°.
    const norm = ((90 - deg) % 360 + 360) % 360;
    const idx = Math.round(norm / 45) % 8;
    return ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'][idx];
};

const HOUSE_LAYOUT = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,15,15,15,15,15,15,15,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,15,61,60,15,63,62,15,1,1,1,1,1,1,1], 
    [1,1,1,1,1,1,15,15,15,15,15,15,15,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,15,62,15,64,15,61,15,1,1,1,1,1,1,1], 
    [1,1,1,1,1,1,15,15,15,15,15,15,15,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,50,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const PALLET_LAYOUT = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 75, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 76, 0, 1],
    [1, 0, 30, 31, 32, 0, 0, 0, 0, 4, 4, 0, 30, 31, 32, 0, 0, 0, 0, 1],
    [1, 0, 33, 50, 35, 0, 0, 0, 0, 4, 4, 0, 33, 50, 35, 0, 0, 0, 0, 1],
    [1, 97, 0, 4, 0, 99, 0, 0, 0, 4, 4, 0, 99, 4, 0, 97, 0, 0, 0, 1],
    [1, 8, 8, 8, 8, 8, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 13, 13, 13, 13, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 98, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [4, 4, 0, 0, 0, 0, 0, 0, 0, 40, 41, 42, 41, 42, 0, 0, 0, 0, 4, 4],
    [4, 4, 0, 0, 0, 0, 0, 0, 0, 43, 50, 45, 34, 45, 0, 0, 0, 0, 4, 4],
    [1, 0, 0, 0, 0, 0, 0, 0, 97, 0, 4, 4, 0, 97, 0, 0, 0, 0, 0, 1],
    [1, 0, 58, 0, 0, 0, 0, 98, 0, 0, 4, 4, 0, 0, 0, 0, 0, 58, 0, 1],
    [1, 8, 8, 8, 8, 0, 0, 0, 0, 0, 4, 4, 0, 0, 8, 8, 8, 8, 8, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];


export const STATIC_MAPS: Record<string, MapZone> = {
    'house_player': {
        id: 'house_player', name: "My Room", layout: HOUSE_LAYOUT,
        portals: { "9,9": "chunk_0_0,3,4" }, 
        wildLevelRange: [0,0],
        interactables: { "8,5": { type: 'object', text: ["It's a Wii U!"] }, "7,5": { type: 'object', text: ["Bookshelf full of guides."] } },
        biome: 'interior'
    },
    'lab': { 
        id: 'lab', name: "Oak's Lab", layout: HOUSE_LAYOUT, 
        portals: { "9,9": "chunk_0_0,10,10" }, wildLevelRange: [0,0],
        npcs: { "9,6": { id: "oak", name: "Prof Oak", sprite: TRAINER_SPRITES.prof, dialogue: ["The world is vast.", "Good luck!"] } },
        biome: 'lab'
    },
    'center': { 
        id: 'center', name: "Pokemon Center", layout: HOUSE_LAYOUT, 
        portals: { "9,9": "PREV_POS" }, wildLevelRange: [0,0], 
        npcs: {
            "9,5": { id: "nurse", name: "Nurse", sprite: TRAINER_SPRITES.nurse, dialogue: ["Heal up!"] },
            "6,5": { id: "guild_clerk", name: "Guild Clerk", sprite: TRAINER_SPRITES.scientist, dialogue: ["The Trainer's Guild posts contracts here.", "Take one, hunt it down, claim your reward."] },
        },
        biome: 'center'
    },
    'mart': { 
        id: 'mart', name: "Poke Mart", layout: HOUSE_LAYOUT, 
        portals: { "9,9": "PREV_POS" }, wildLevelRange: [0,0], 
        interactables: { "9,5": { type: 'object', text: ["Buy items."] } },
        biome: 'mart'
    },
    'rift': {
        id: 'rift', name: "The Rift", layout: [], 
        portals: { "10,10": "PREV_POS" }, 
        wildLevelRange: [30, 50],
        biome: 'canyon'
    }
};

/**
 * Globally-consistent biome lookup. Extracted from generateChunk so neighbor
 * biomes can be queried during edge blending.
 */
export const getBiomeAt = (cx: number, cy: number): string => {
    const dist = Math.sqrt(cx * cx + cy * cy);
    // Noise frequency bumped from 0.10 -> 0.14 so biome patches are smaller
    // and the player meets more variety within the first ~10 chunks of
    // walking out of town. Lower values were producing long monolithic
    // forest stretches that made the world feel one-note up close.
    //
    // Moisture uses a *different* frequency (0.19) and a spatial offset so
    // biome and moisture fields decorrelate -- otherwise a straight walk
    // picks up the same (biome, moisture) combo for many chunks in a row
    // because both fields peak/trough together. With independent fields, a
    // player walking due east sees "forest -> cave -> forest -> lake -> ..."
    // instead of "forest -> forest -> forest -> ..." for 20 chunks.
    const biomeVal = (globalNoise.noise(cx * 0.14, cy * 0.14) + 1) / 2;
    const moistVal = (moistureNoise.noise(cx * 0.19 + 31.7, cy * 0.19 - 17.3) + 1) / 2;

    if (Math.floor(dist) === 50) return 'rift';
    if (dist < 3) return 'town';
    // Slightly wider extreme thresholds (0.22 / 0.78) so desert / snow /
    // cave aren't quite as rare as before. Middle band is still majority
    // forest / lake, keeping the world feel intact.
    if (biomeVal < 0.22) return moistVal < 0.5 ? 'desert' : 'canyon';
    if (biomeVal > 0.78) return moistVal < 0.5 ? 'snow' : 'cave';
    if (biomeVal > 0.6)  return moistVal > 0.6 ? 'lake' : 'forest';
    return moistVal > 0.7 ? 'cave' : 'forest';
};

const CHUNK_ROLE_WEIGHTS: Record<ChunkRole, number> = {
    breather: 0.56,
    temptation: 0.95,
    obstacle: 0.82,
    threat: 1.45,
    mystery: 0.92,
    consequence: 1.1,
    setpiece: 0.72,
};

type RouteCadencePreset = 'tutorial' | 'standard' | 'dangerous' | 'mystery' | 'faction_war' | 'high_variance';

const BIOME_FAMILY_WEIGHTS: Record<string, Record<string, number>> = {
    forest: { pokemon_ecology: 1.45, mystery: 1.25, environment: 1.28, human_trouble: 0.86, faction: 0.85, rival: 0.82, companion: 0.9, poi: 1.06, economy: 0.82, setpiece: 0.78 },
    mountain: { pokemon_ecology: 0.95, mystery: 1.0, environment: 1.45, human_trouble: 0.9, faction: 1.15, rival: 0.95, companion: 0.85, poi: 1.0, economy: 0.8, setpiece: 0.9 },
    swamp: { pokemon_ecology: 1.0, mystery: 1.4, environment: 1.35, human_trouble: 0.9, faction: 0.95, rival: 0.8, companion: 0.9, poi: 1.0, economy: 0.7, setpiece: 0.9 },
    desert: { pokemon_ecology: 0.9, mystery: 1.0, environment: 1.35, human_trouble: 0.9, faction: 0.85, rival: 0.9, companion: 0.8, poi: 1.25, economy: 0.85, setpiece: 0.9 },
    coast: { pokemon_ecology: 1.0, mystery: 1.0, environment: 1.35, human_trouble: 1.1, faction: 1.0, rival: 0.9, companion: 0.95, poi: 1.0, economy: 1.1, setpiece: 0.85 },
    urban: { pokemon_ecology: 0.6, mystery: 0.95, environment: 0.85, human_trouble: 1.45, faction: 1.3, rival: 1.05, companion: 1.0, poi: 0.9, economy: 1.3, setpiece: 0.75 },
    haunted: { pokemon_ecology: 0.85, mystery: 1.6, environment: 1.0, human_trouble: 0.75, faction: 0.9, rival: 0.9, companion: 0.7, poi: 1.2, economy: 0.6, setpiece: 1.05 },
    town: { pokemon_ecology: 0.75, mystery: 0.82, environment: 1.12, human_trouble: 1.02, faction: 1.1, rival: 0.85, companion: 1.22, poi: 1.02, economy: 1.2, setpiece: 0.55 },
    lake: { pokemon_ecology: 1.2, mystery: 1.0, environment: 1.32, human_trouble: 0.86, faction: 0.9, rival: 0.8, companion: 0.95, poi: 1.08, economy: 0.8, setpiece: 0.8 },
    canyon: { pokemon_ecology: 1.0, mystery: 0.95, environment: 1.3, human_trouble: 0.95, faction: 1.1, rival: 0.95, companion: 0.85, poi: 1.0, economy: 0.8, setpiece: 0.85 },
    snow: { pokemon_ecology: 1.05, mystery: 1.05, environment: 1.25, human_trouble: 0.85, faction: 0.9, rival: 0.85, companion: 0.9, poi: 0.95, economy: 0.75, setpiece: 0.8 },
    cave: { pokemon_ecology: 0.95, mystery: 1.15, environment: 1.3, human_trouble: 0.8, faction: 0.9, rival: 0.8, companion: 0.85, poi: 1.2, economy: 0.7, setpiece: 0.9 },
};

const getFamilyWeight = (biome: string, family: string): number => {
    const row = BIOME_FAMILY_WEIGHTS[biome] || BIOME_FAMILY_WEIGHTS.forest;
    return row[family] ?? 1;
};

const classifyEchoPriority = (incidentId: string): 'high' | 'medium' | 'low' => {
    if (/rescued|merchant|poacher|rival|shrine|bridge|alpha|ambush/.test(incidentId)) return 'high';
    if (/patrol|checkpoint|contract|guild|ownership|fog|courier/.test(incidentId)) return 'medium';
    return 'low';
};

const getCadencePreset = (rs: RouteState, biome: string, cx: number, cy: number): RouteCadencePreset => {
    const ownership = rs.routeOwnershipByRegion[`${Math.floor(cx / 5)},${Math.floor(cy / 5)}`] || 'neutral';
    const dist = Math.sqrt(cx * cx + cy * cy);
    if (dist <= 12) return 'tutorial';
    if (ownership === 'poacher_controlled' || ownership === 'rival_influenced') return 'dangerous';
    if (ownership === 'cursed' || biome === 'haunted') return 'mystery';
    if (ownership === 'trainer_guild') return 'faction_war';
    if (rs.routeCuriosity >= 7 && rs.routeTension >= 6) return 'high_variance';
    return 'standard';
};

const normalizeRouteStateLocal = (routeState?: RouteState): RouteState => ({
    routeTension: routeState?.routeTension ?? 0,
    routeCuriosity: routeState?.routeCuriosity ?? 0,
    routeFlags: routeState?.routeFlags ?? [],
    factionReputation: routeState?.factionReputation ?? {},
    chunkMemoryStates: routeState?.chunkMemoryStates ?? {},
    routeIntel: routeState?.routeIntel ?? 0,
    routeControl: routeState?.routeControl ?? 0,
    activeRouteArcs: routeState?.activeRouteArcs ?? [],
    completedRouteArcs: routeState?.completedRouteArcs ?? [],
    failedRouteArcs: routeState?.failedRouteArcs ?? [],
    recentIncidentIds: routeState?.recentIncidentIds ?? [],
    recentChunkRoles: routeState?.recentChunkRoles ?? [],
    routeStability: routeState?.routeStability ?? 5,
    queuedEchoes: routeState?.queuedEchoes ?? [],
    pacing: routeState?.pacing ?? {
        desiredIntensity: 'normal',
        recentDangerCount: 0,
        recentRewardCount: 0,
        recentMysteryCount: 0,
        recentBattleIncidentCount: 0,
        chunksSinceMajorIncident: 0,
        chunksSinceBreather: 0,
        forceBreatherSoon: false,
        forcePayoffSoon: false,
    },
    routeOwnershipByRegion: routeState?.routeOwnershipByRegion ?? {},
    activeCompanions: routeState?.activeCompanions ?? [],
    activeContracts: routeState?.activeContracts ?? [],
    completedContracts: routeState?.completedContracts ?? [],
    failedContracts: routeState?.failedContracts ?? [],
});

const ROUTE_INCIDENTS_RAW: any[] = [
    {
        id: 'forest_broken_bridge',
        title: 'Broken Timber Span',
        biomeTags: ['forest'],
        chunkRoles: ['obstacle', 'consequence'],
        rarity: 0.95,
        signalText: ['A creek bridge has collapsed.', 'A courier waves frantically from the far side.'],
        choices: [
            { id: 'repair', label: 'Repair bridge', hint: 'Collect challenge', outcome: { narrative: ['You gather timber and lash a stable crossing.'], challengeType: 'collect', challengeTarget: 'timber_bundle', rewards: { routeIntel: 1, safeCampUnlock: true, futureDiscountPct: 8 }, addFlags: ['bridgeRepaired'], setRouteFlags: ['bridgeRepaired'], tensionDelta: -1 } },
            { id: 'ignore', label: 'Leave it', outcome: { narrative: ['You move on and leave the crossing broken.'], addFlags: ['ignoredDistressCall'], setRouteFlags: ['ignoredDistressCall'], tensionDelta: 1 } },
        ],
    },
    { id: 'forest_poacher_track', title: 'Poacher Tracks', biomeTags: ['forest'], chunkRoles: ['threat', 'mystery'], rarity: 0.82, signalText: ['Bootprints and cage marks cut through the path.'], choices: [ { id: 'ambush', label: 'Track and confront', hint: 'Battle challenge', outcome: { narrative: ['You intercept poachers before they vanish into brush.'], challengeType: 'battle', challengeTarget: 'poacher_cell', rewards: { factionReputation: { rangers: 1 }, craftingMaterials: 2 }, addFlags: ['angeredPoachers'], setRouteFlags: ['angeredPoachers'], tensionDelta: 1 } }, { id: 'rescue', label: 'Free trapped wilds first', hint: 'Explore challenge', outcome: { narrative: ['You pry open cages and release injured wild Pokemon.'], challengeType: 'explore', challengeTarget: 'rescue_site', rewards: { factionReputation: { rangers: 2 }, routeIntel: 1, companionBuff: 'Wild allies mark safer brush routes.' }, addFlags: ['rescuedWildPokemon'], setRouteFlags: ['rescuedWildPokemon'], curiosityDelta: 1, tensionDelta: -1 } } ] },
    { id: 'forest_shrine_hum', title: 'Humming Shrine', biomeTags: ['forest'], chunkRoles: ['mystery', 'setpiece'], rarity: 0.62, signalText: ['A vine-covered shrine resonates with low tones.'], choices: [ { id: 'attune', label: 'Attune to shrine', hint: 'Type trial', outcome: { narrative: ['The shrine responds to your team alignment.'], challengeType: 'type_trial', challengeTarget: 'nature_trial', challengeRequiredType: 'grass', rewards: { rareEncounterAccess: 'grove_rare_pool', moveTutorAccess: 'forest_attunement' }, addFlags: ['shrineActivated'], setRouteFlags: ['shrineActivated'], curiosityDelta: 2 } }, { id: 'catalog', label: 'Take notes only', outcome: { narrative: ['You map runes without disturbing the seal.'], rewards: { routeIntel: 2, mapRevealRadius: 1 }, curiosityDelta: 1 } } ] },
    { id: 'forest_merchant_convoy', title: 'Merchant Convoy', biomeTags: ['forest', 'town'], chunkRoles: ['temptation', 'consequence'], rarity: 0.92, signalText: ['A stalled wagon blocks the road.', 'Guards ask for help securing cargo.'], choices: [ { id: 'escort', label: 'Escort convoy', hint: 'Stealth challenge', outcome: { narrative: ['You move supply crates past prowling thieves.'], challengeType: 'stealth', challengeTarget: 'cargo_run', rewards: { factionReputation: { merchants: 2 }, futureDiscountPct: 12, routeControl: 1 }, addFlags: ['helpedMerchant'], setRouteFlags: ['helpedMerchant'], tensionDelta: -1 } }, { id: 'tax', label: 'Demand payment upfront', outcome: { narrative: ['You take coin, but word spreads about your methods.'], rewards: { money: 350 }, penalties: { tensionDelta: 1 }, addFlags: ['factionAlerted'], setRouteFlags: ['factionAlerted'] } } ] },
    { id: 'lake_fog_signal', title: 'Signal Through Fog', biomeTags: ['lake'], chunkRoles: ['mystery', 'obstacle'], rarity: 0.78, signalText: ['Lantern flashes blink from a misty pier.'], choices: [ { id: 'sprint', label: 'Race to pier', hint: 'Speed challenge', outcome: { narrative: ['You sprint over slick boards before fog closes in.'], challengeType: 'speed', challengeTarget: 'fog_pier', challengeTimeLimit: 15, rewards: { mapRevealRadius: 1, routeIntel: 1 }, curiosityDelta: 1 } }, { id: 'wait', label: 'Wait and observe', outcome: { narrative: ['By waiting, you spot hidden whirlpools and safe paths.'], rewards: { routeIntel: 2, safeCampUnlock: true }, tensionDelta: -1 } } ] },
    { id: 'lake_alpha_wake', title: 'Alpha Wake', biomeTags: ['lake'], chunkRoles: ['threat', 'setpiece'], rarity: 0.66, signalText: ['A huge wake tears across still water.'], choices: [ { id: 'lure', label: 'Lure the alpha out', hint: 'Battle challenge', outcome: { narrative: ['You bait the apex Pokemon into open water combat.'], challengeType: 'battle', challengeTarget: 'alpha_wake', challengeRewardPokemonId: 130, challengeRewardLevel: 18, rewards: { rareEncounterAccess: 'alpha_lake_window', companionBuff: 'Team morale rises after big-game hunt.' }, addFlags: ['alphaPokemonAwake'], setRouteFlags: ['alphaPokemonAwake'], tensionDelta: 2 } }, { id: 'mark', label: 'Mark and bypass', outcome: { narrative: ['You mark the wake pattern for future anglers.'], rewards: { routeIntel: 2, factionReputation: { anglers: 1 } }, curiosityDelta: 1 } } ] },
    { id: 'desert_dust_ambush', title: 'Dustline Ambush', biomeTags: ['desert'], chunkRoles: ['threat', 'obstacle'], rarity: 0.74, signalText: ['Sand spirals around half-buried traps.'], choices: [ { id: 'push', label: 'Push through quickly', hint: 'Speed challenge', outcome: { narrative: ['You surge through drifting trap-lines before they reset.'], challengeType: 'speed', challengeTarget: 'dustline_break', challengeTimeLimit: 14, rewards: { shortcutUnlock: true, routeControl: 1 }, tensionDelta: 1 } }, { id: 'disarm', label: 'Disarm traps', hint: 'Collect challenge', outcome: { narrative: ['You salvage trap parts and clear passage for others.'], challengeType: 'collect', challengeTarget: 'trap_parts', rewards: { craftingMaterials: 4, factionReputation: { caravans: 2 } }, addFlags: ['routeSafehouseUnlocked'], setRouteFlags: ['routeSafehouseUnlocked'], tensionDelta: -1 } } ] },
    { id: 'desert_mirage_shrine', title: 'Mirage Shrine', biomeTags: ['desert'], chunkRoles: ['mystery', 'setpiece'], rarity: 0.55, signalText: ['Heat haze reveals a shrine that fades in and out.'], choices: [ { id: 'stabilize', label: 'Stabilize glyphs', hint: 'Type trial', outcome: { narrative: ['The shrine locks into place under a type-aligned aura.'], challengeType: 'type_trial', challengeTarget: 'mirage_lock', challengeRequiredType: 'ground', rewards: { rareEncounterAccess: 'mirage_pool', moveTutorAccess: 'sand_ritual', mapRevealRadius: 2 }, addFlags: ['shrineActivated'], setRouteFlags: ['shrineActivated'], curiosityDelta: 2 } }, { id: 'skip', label: 'Skip unstable shrine', outcome: { narrative: ['You keep momentum and avoid mirage disorientation.'], tensionDelta: -1 } } ] },
    { id: 'desert_caravan_distress', title: 'Caravan Distress Call', biomeTags: ['desert'], chunkRoles: ['consequence', 'obstacle'], rarity: 0.88, signalText: ['A flare pops above a stranded caravan.'], choices: [ { id: 'assist', label: 'Assist caravan', hint: 'Collect challenge', outcome: { narrative: ['You ration supplies and stabilize the caravan wheel rig.'], challengeType: 'collect', challengeTarget: 'supply_handout', rewards: { factionReputation: { caravans: 2, merchants: 1 }, futureDiscountPct: 10, safeCampUnlock: true }, addFlags: ['helpedMerchant'], setRouteFlags: ['helpedMerchant', 'routeSafehouseUnlocked'], tensionDelta: -1 } }, { id: 'scavenge', label: 'Scavenge abandoned crates', outcome: { narrative: ['You take quick salvage while guards argue.'], rewards: { money: 300, craftingMaterials: 2 }, addFlags: ['factionAlerted'], setRouteFlags: ['factionAlerted'], tensionDelta: 1 } } ] },
    { id: 'canyon_rockfall', title: 'Rockfall Choke', biomeTags: ['canyon'], chunkRoles: ['obstacle', 'consequence'], rarity: 0.9, signalText: ['A recent rockfall blocks the main lane.'], choices: [ { id: 'clear', label: 'Clear debris', hint: 'Collect challenge', outcome: { narrative: ['You clear enough stone for a narrow route.'], challengeType: 'collect', challengeTarget: 'stone_clear', rewards: { routeControl: 1, shortcutUnlock: true, routeIntel: 1 }, addFlags: ['bridgeRepaired'], setRouteFlags: ['bridgeRepaired'], tensionDelta: -1 } }, { id: 'climb', label: 'Climb sidewall', hint: 'Stealth challenge', outcome: { narrative: ['You climb ledges above hostile patrol sightlines.'], challengeType: 'stealth', challengeTarget: 'ledge_sneak', rewards: { mapRevealRadius: 1, routeIntel: 1 }, curiosityDelta: 1 } } ] },
    { id: 'canyon_outpost_claim', title: 'Outpost Claim', biomeTags: ['canyon'], chunkRoles: ['threat', 'consequence'], rarity: 0.7, signalText: ['Two factions argue over an abandoned outpost.'], choices: [ { id: 'mediate', label: 'Mediate dispute', hint: 'Type trial', outcome: { narrative: ['You settle rights through an honor-bound trial.'], challengeType: 'type_trial', challengeTarget: 'outpost_trial', challengeRequiredType: 'rock', rewards: { routeSafehouseUnlocked: true, factionReputation: { rangers: 1, prospectors: 1 } }, addFlags: ['routeSafehouseUnlocked'], setRouteFlags: ['routeSafehouseUnlocked'], tensionDelta: -1 } }, { id: 'take_side', label: 'Back stronger side', hint: 'Battle challenge', outcome: { narrative: ['You back one side and force a decision by battle.'], challengeType: 'battle', challengeTarget: 'outpost_duel', rewards: { money: 450, factionReputation: { prospectors: 2 } }, penalties: { addFlags: ['factionAlerted'], tensionDelta: 1 }, setRouteFlags: ['factionAlerted'] } } ] },
    { id: 'snow_whiteout', title: 'Whiteout Ridge', biomeTags: ['snow'], chunkRoles: ['obstacle', 'threat'], rarity: 0.72, signalText: ['Wind shear reduces visibility to a few steps.'], choices: [ { id: 'dash', label: 'Dash the ridge', hint: 'Speed challenge', outcome: { narrative: ['You commit to a fast crossing before gusts worsen.'], challengeType: 'speed', challengeTarget: 'whiteout_dash', challengeTimeLimit: 13, rewards: { routeControl: 1, tempBuff: 'Cold Focus: +crit chance next battle' }, tensionDelta: 1 } }, { id: 'markers', label: 'Place trail markers', hint: 'Explore challenge', outcome: { narrative: ['You place markers and secure a reusable safe route.'], challengeType: 'explore', challengeTarget: 'marker_route', rewards: { safeCampUnlock: true, routeIntel: 2 }, addFlags: ['routeSafehouseUnlocked'], setRouteFlags: ['routeSafehouseUnlocked'], tensionDelta: -1 } } ] },
    { id: 'snow_rescue_cub', title: 'Rescue in the Drift', biomeTags: ['snow'], chunkRoles: ['consequence', 'mystery'], rarity: 0.86, signalText: ['A faint cry echoes from an ice drift.'], choices: [ { id: 'rescue', label: 'Rescue trapped Pokemon', hint: 'Explore challenge', outcome: { narrative: ['You dig through powder and free a chilled wild Pokemon.'], challengeType: 'explore', challengeTarget: 'drift_rescue', rewards: { companionBuff: 'Rescued wild scouts ahead.', factionReputation: { rangers: 2 } }, addFlags: ['rescuedWildPokemon'], setRouteFlags: ['rescuedWildPokemon'], curiosityDelta: 1, tensionDelta: -1 } }, { id: 'track', label: 'Track predator instead', hint: 'Battle challenge', outcome: { narrative: ['You follow deep claw marks to a predatory alpha.'], challengeType: 'battle', challengeTarget: 'snow_alpha_track', rewards: { rareEncounterAccess: 'snow_alpha_window', money: 300 }, addFlags: ['alphaPokemonAwake'], setRouteFlags: ['alphaPokemonAwake'], tensionDelta: 2 } } ] },
    { id: 'cave_echo_chamber', title: 'Echo Chamber', biomeTags: ['cave'], chunkRoles: ['mystery', 'setpiece'], rarity: 0.58, signalText: ['The cave repeats your footsteps with delayed echoes.'], choices: [ { id: 'sound_map', label: 'Map echoes', hint: 'Stealth challenge', outcome: { narrative: ['You navigate by silence and decode hidden passage beats.'], challengeType: 'stealth', challengeTarget: 'echo_route', rewards: { mapRevealRadius: 2, routeIntel: 2, shortcutUnlock: true }, curiosityDelta: 2 } }, { id: 'force_path', label: 'Force open path', hint: 'Battle challenge', outcome: { narrative: ['Noisy movement awakens territorial den guards.'], challengeType: 'battle', challengeTarget: 'echo_den_guard', rewards: { craftingMaterials: 3 }, tensionDelta: 1 } } ] },
    { id: 'cave_fossil_ring', title: 'Fossil Ring', biomeTags: ['cave'], chunkRoles: ['temptation', 'mystery'], rarity: 0.73, signalText: ['A ring of fossil fragments circles an intact core.'], choices: [ { id: 'excavate', label: 'Excavate carefully', hint: 'Collect challenge', outcome: { narrative: ['You recover fossils and stabilize the chamber.'], challengeType: 'collect', challengeTarget: 'fossil_fragments', rewards: { craftingMaterials: 5, routeIntel: 1, money: 260 }, curiosityDelta: 1 } }, { id: 'awaken', label: 'Trigger resonance', hint: 'Type trial', outcome: { narrative: ['Resonance wakes dormant energies in the chamber.'], challengeType: 'type_trial', challengeTarget: 'fossil_resonance', challengeRequiredType: 'rock', rewards: { rareEncounterAccess: 'fossil_deep_pool', moveTutorAccess: 'fossil_art' }, addFlags: ['alphaPokemonAwake'], setRouteFlags: ['alphaPokemonAwake'], tensionDelta: 1, curiosityDelta: 1 } } ] },
    { id: 'town_rival_notice', title: 'Rival Notice Board', biomeTags: ['town'], chunkRoles: ['threat', 'consequence'], rarity: 0.82, signalText: ['A rival leaves a marked challenge card at the crossroads.'], choices: [ { id: 'chase', label: 'Chase rival now', hint: 'Battle challenge', outcome: { narrative: ['You catch the rival before they slip to side roads.'], challengeType: 'battle', challengeTarget: 'rival_ahead', rewards: { routeControl: 1, factionReputation: { scouts: 1 } }, addFlags: ['rivalAhead'], setRouteFlags: ['rivalAhead'], tensionDelta: 1 } }, { id: 'prepare', label: 'Prepare and gather intel', hint: 'Explore challenge', outcome: { narrative: ['You gather notes on their route and battle habits.'], challengeType: 'explore', challengeTarget: 'rival_intel', rewards: { routeIntel: 2, tempBuff: 'Prepared: +defense in next rival battle' }, curiosityDelta: 1 } } ] },
    { id: 'town_faction_checkpoint', title: 'Faction Checkpoint', biomeTags: ['town', 'forest', 'canyon'], chunkRoles: ['temptation', 'consequence'], rarity: 0.84, signalText: ['A checkpoint requests your allegiance for route support.'], choices: [ { id: 'rangers', label: 'Back Rangers', outcome: { narrative: ['Rangers post safety markers along your mapped lanes.'], rewards: { factionReputation: { rangers: 2 }, safeCampUnlock: true, routeControl: 1 }, setRouteFlags: ['routeSafehouseUnlocked'], tensionDelta: -1 } }, { id: 'merchants', label: 'Back Merchants', outcome: { narrative: ['Merchants issue route vouchers and better prices.'], rewards: { factionReputation: { merchants: 2 }, futureDiscountPct: 10, money: 200 }, setRouteFlags: ['helpedMerchant'] } } ] },
    { id: 'forest_distress_flare', title: 'Distress Flare', biomeTags: ['forest', 'canyon'], chunkRoles: ['consequence', 'threat'], rarity: 0.9, signalText: ['A red flare burns above the canopy.'], choices: [ { id: 'respond', label: 'Respond to call', hint: 'Battle challenge', outcome: { narrative: ['You defend a field team under attack.'], challengeType: 'battle', challengeTarget: 'distress_response', rewards: { factionReputation: { scouts: 2 }, routeIntel: 1, safeCampUnlock: true }, addFlags: ['helpedMerchant'], setRouteFlags: ['helpedMerchant'], tensionDelta: -1 } }, { id: 'ignore', label: 'Keep to objective', outcome: { narrative: ['You stay on route, but the flare fades unanswered.'], addFlags: ['ignoredDistressCall'], setRouteFlags: ['ignoredDistressCall'], tensionDelta: 1 } } ] },
    { id: 'lake_hidden_camp', title: 'Hidden Safe Camp', biomeTags: ['lake', 'forest', 'snow'], chunkRoles: ['breather', 'mystery'], rarity: 0.68, signalText: ['Faint smoke rises from a sheltered hollow.'], choices: [ { id: 'unlock', label: 'Secure safe camp', hint: 'Collect challenge', outcome: { narrative: ['You stock and secure the camp for future runs.'], challengeType: 'collect', challengeTarget: 'camp_stock', rewards: { safeCampUnlock: true, routeControl: 1, routeIntel: 1 }, addFlags: ['routeSafehouseUnlocked'], setRouteFlags: ['routeSafehouseUnlocked'], tensionDelta: -2 } }, { id: 'stash', label: 'Use as temporary stash', outcome: { narrative: ['You rest briefly and note supply routes nearby.'], rewards: { tempBuff: 'Rested: +speed in next encounter', routeIntel: 1 }, tensionDelta: -1 } } ] },
    { id: 'desert_tutor_caravan', title: 'Tutor Caravan', biomeTags: ['desert', 'town', 'canyon'], chunkRoles: ['temptation', 'breather'], rarity: 0.77, signalText: ['A moving caravan advertises battlefield lessons.'], choices: [ { id: 'trial', label: 'Take skill trial', hint: 'Type trial', outcome: { narrative: ['You pass a focused combat drill.'], challengeType: 'type_trial', challengeTarget: 'tutor_trial', challengeRequiredType: 'fighting', rewards: { moveTutorAccess: 'caravan_tutor', companionBuff: 'Party confidence rises.' }, curiosityDelta: 1 } }, { id: 'sponsor', label: 'Sponsor caravan route', hint: 'Collect challenge', outcome: { narrative: ['You donate supplies and gain long-term route perks.'], challengeType: 'collect', challengeTarget: 'caravan_supply', rewards: { futureDiscountPct: 12, factionReputation: { merchants: 2 }, routeControl: 1 }, setRouteFlags: ['helpedMerchant'] } } ] },
];

const INCIDENT_FAMILY_FALLBACK = (id: string): any => {
    if (/rival|shortcut|note|alliance/.test(id)) return 'rival';
    if (/merchant|caravan|trader|economy|contractor/.test(id)) return 'economy';
    if (/poacher|ranger|faction|guild/.test(id)) return 'faction';
    if (/shrine|mystery|glow|silent|mirage|haunted|footprint|statue/.test(id)) return 'mystery';
    if (/bridge|fog|storm|rock|flood|tunnel|slide|collapse/.test(id)) return 'environment';
    if (/alpha|nest|wild|hatchling|honey|migration|predator|territory/.test(id)) return 'pokemon_ecology';
    if (/camp|courier|checkpoint|healer|researcher/.test(id)) return 'human_trouble';
    return 'poi';
};

const REQUIRED_INCIDENT_LIBRARY: Array<{ id: string; title: string; family: any; biomeTags: any[]; chunkRoles: ChunkRole[]; arcId?: string }> = [
    { id: 'migration_crossing', title: 'Migration Crossing', family: 'pokemon_ecology', biomeTags: ['forest', 'coast'], chunkRoles: ['obstacle', 'mystery'] },
    { id: 'injured_wild_pokemon', title: 'Injured Wild Pokemon', family: 'pokemon_ecology', biomeTags: ['forest', 'snow'], chunkRoles: ['consequence', 'mystery'], arcId: 'wounded-pokemon-arc' },
    { id: 'territory_dispute', title: 'Territory Dispute', family: 'pokemon_ecology', biomeTags: ['forest', 'canyon'], chunkRoles: ['threat', 'consequence'] },
    { id: 'nest_defense', title: 'Nest Defense', family: 'pokemon_ecology', biomeTags: ['forest', 'swamp'], chunkRoles: ['threat', 'mystery'] },
    { id: 'alpha_tracks', title: 'Alpha Tracks', family: 'pokemon_ecology', biomeTags: ['forest', 'canyon', 'snow'], chunkRoles: ['threat', 'mystery'], arcId: 'alpha-territory-arc' },
    { id: 'honey_tree_swarm', title: 'Honey Tree Swarm', family: 'pokemon_ecology', biomeTags: ['forest'], chunkRoles: ['temptation', 'setpiece'] },
    { id: 'pokemon_playing_road', title: 'Pokemon Playing in Road', family: 'pokemon_ecology', biomeTags: ['forest', 'town'], chunkRoles: ['breather', 'temptation'] },
    { id: 'predator_silence', title: 'Predator Silence', family: 'pokemon_ecology', biomeTags: ['forest', 'haunted'], chunkRoles: ['mystery', 'threat'] },
    { id: 'lost_hatchling', title: 'Lost Hatchling', family: 'pokemon_ecology', biomeTags: ['forest', 'coast'], chunkRoles: ['consequence', 'mystery'], arcId: 'lost-hatchling-arc' },
    { id: 'rare_cry_distance', title: 'Rare Cry in Distance', family: 'pokemon_ecology', biomeTags: ['forest', 'mountain'], chunkRoles: ['mystery', 'temptation'] },
    { id: 'broken_bridge_named', title: 'Broken Bridge', family: 'environment', biomeTags: ['forest', 'canyon', 'coast'], chunkRoles: ['obstacle', 'consequence'], arcId: 'bridge-repair-arc' },
    { id: 'flooded_crossing', title: 'Flooded Crossing', family: 'environment', biomeTags: ['coast', 'swamp', 'lake'], chunkRoles: ['obstacle', 'threat'] },
    { id: 'rockslide', title: 'Rockslide', family: 'environment', biomeTags: ['mountain', 'canyon'], chunkRoles: ['obstacle', 'threat'] },
    { id: 'thick_fog_named', title: 'Thick Fog', family: 'environment', biomeTags: ['swamp', 'coast', 'haunted'], chunkRoles: ['mystery', 'obstacle'], arcId: 'haunted-fog-path-arc' },
    { id: 'sudden_storm', title: 'Sudden Storm', family: 'environment', biomeTags: ['coast', 'desert'], chunkRoles: ['threat', 'setpiece'] },
    { id: 'poisoned_spring', title: 'Poisoned Spring', family: 'environment', biomeTags: ['swamp', 'forest'], chunkRoles: ['consequence', 'mystery'] },
    { id: 'burning_grassline', title: 'Burning Grassline', family: 'environment', biomeTags: ['desert', 'canyon'], chunkRoles: ['threat', 'setpiece'] },
    { id: 'collapsed_tunnel', title: 'Collapsed Tunnel', family: 'environment', biomeTags: ['mountain', 'cave'], chunkRoles: ['obstacle', 'consequence'] },
    { id: 'overturned_merchant_cart', title: 'Overturned Merchant Cart', family: 'human_trouble', biomeTags: ['forest', 'town', 'coast'], chunkRoles: ['consequence', 'temptation'], arcId: 'merchant-caravan-arc' },
    { id: 'trainer_campfire_named', title: 'Trainer Campfire', family: 'human_trouble', biomeTags: ['forest', 'mountain', 'coast'], chunkRoles: ['breather', 'consequence'], arcId: 'safe-camp-arc' },
    { id: 'poacher_trap_named', title: 'Poacher Trap', family: 'human_trouble', biomeTags: ['forest', 'swamp'], chunkRoles: ['threat', 'consequence'], arcId: 'poacher-trail-arc' },
    { id: 'toll_checkpoint', title: 'Toll Checkpoint', family: 'human_trouble', biomeTags: ['urban', 'canyon', 'town'], chunkRoles: ['obstacle', 'temptation'] },
    { id: 'lost_courier', title: 'Lost Courier', family: 'human_trouble', biomeTags: ['forest', 'desert'], chunkRoles: ['consequence', 'mystery'], arcId: 'lost-trainer-rescue-arc' },
    { id: 'false_healer', title: 'False Healer', family: 'human_trouble', biomeTags: ['swamp', 'haunted', 'urban'], chunkRoles: ['mystery', 'threat'] },
    { id: 'researcher_field_test', title: 'Researcher Field Test', family: 'human_trouble', biomeTags: ['forest', 'mountain', 'urban'], chunkRoles: ['temptation', 'mystery'] },
    { id: 'rival_fanclub_witness', title: 'Rival Fan Club / Rival Witness', family: 'human_trouble', biomeTags: ['town', 'urban'], chunkRoles: ['consequence', 'mystery'] },
    { id: 'glowing_footprints', title: 'Glowing Footprints', family: 'mystery', biomeTags: ['forest', 'haunted', 'swamp'], chunkRoles: ['mystery', 'setpiece'], arcId: 'glowing-footprints-arc' },
    { id: 'abandoned_campsite_named', title: 'Abandoned Campsite', family: 'mystery', biomeTags: ['forest', 'mountain', 'coast'], chunkRoles: ['mystery', 'consequence'] },
    { id: 'ancient_shrine_named', title: 'Ancient Shrine', family: 'mystery', biomeTags: ['forest', 'desert', 'haunted'], chunkRoles: ['setpiece', 'mystery'], arcId: 'shrine-awakening-arc' },
    { id: 'silent_grove', title: 'Silent Grove', family: 'mystery', biomeTags: ['forest', 'haunted'], chunkRoles: ['mystery', 'breather'] },
    { id: 'moving_statue', title: 'Moving Statue', family: 'mystery', biomeTags: ['desert', 'haunted'], chunkRoles: ['mystery', 'setpiece'] },
    { id: 'mirage_item', title: 'Mirage Item', family: 'mystery', biomeTags: ['desert', 'coast'], chunkRoles: ['temptation', 'mystery'] },
    { id: 'rival_note', title: 'Rival Note', family: 'rival', biomeTags: ['town', 'forest'], chunkRoles: ['consequence', 'mystery'] },
    { id: 'rival_shortcut', title: 'Rival Shortcut', family: 'rival', biomeTags: ['forest', 'canyon', 'mountain'], chunkRoles: ['consequence', 'threat'], arcId: 'rival-shortcut-race-arc' },
    { id: 'rival_already_won', title: 'Rival Cleared the Route', family: 'rival', biomeTags: ['town', 'urban', 'coast'], chunkRoles: ['consequence', 'breather'] },
    { id: 'temporary_rival_alliance', title: 'Temporary Rival Alliance', family: 'rival', biomeTags: ['forest', 'haunted'], chunkRoles: ['setpiece', 'consequence'] },
    { id: 'ranger_patrol', title: 'Ranger Patrol', family: 'faction', biomeTags: ['forest', 'swamp'], chunkRoles: ['consequence', 'obstacle'] },
    { id: 'poacher_ambush', title: 'Poacher Ambush', family: 'faction', biomeTags: ['forest', 'swamp', 'canyon'], chunkRoles: ['threat', 'setpiece'] },
    { id: 'merchant_caravan_named', title: 'Merchant Caravan', family: 'faction', biomeTags: ['town', 'coast', 'desert'], chunkRoles: ['temptation', 'consequence'] },
    { id: 'trainer_guild_trial', title: 'Trainer Guild Trial', family: 'faction', biomeTags: ['town', 'urban', 'mountain'], chunkRoles: ['obstacle', 'setpiece'] },
    { id: 'bridge_storm_battle', title: 'Bridge Storm Battle', family: 'setpiece', biomeTags: ['coast', 'forest'], chunkRoles: ['setpiece', 'threat'] },
    { id: 'swarm_stampede', title: 'Swarm Stampede', family: 'setpiece', biomeTags: ['forest', 'swamp'], chunkRoles: ['setpiece', 'threat'] },
    { id: 'cave_collapse_escape', title: 'Cave Collapse Escape', family: 'setpiece', biomeTags: ['cave', 'mountain'], chunkRoles: ['setpiece', 'obstacle'] },
    { id: 'camp_raid', title: 'Camp Raid', family: 'setpiece', biomeTags: ['forest', 'canyon'], chunkRoles: ['setpiece', 'consequence'] },
    { id: 'shrine_awakening_named', title: 'Shrine Awakening', family: 'setpiece', biomeTags: ['forest', 'haunted'], chunkRoles: ['setpiece', 'mystery'] },
    { id: 'alpha_roadblock', title: 'Alpha Pokemon Roadblock', family: 'setpiece', biomeTags: ['forest', 'mountain', 'snow'], chunkRoles: ['setpiece', 'threat'] },
    { id: 'traveling_move_hermit', title: 'Traveling Move Hermit', family: 'economy', biomeTags: ['mountain', 'forest'], chunkRoles: ['breather', 'temptation'] },
    { id: 'black_market_trader', title: 'Black-Market Trader', family: 'economy', biomeTags: ['urban', 'swamp', 'haunted'], chunkRoles: ['temptation', 'threat'] },
    { id: 'map_scout', title: 'Map Scout', family: 'companion', biomeTags: ['forest', 'town', 'mountain'], chunkRoles: ['breather', 'mystery'] },
    { id: 'weather_watcher', title: 'Weather Watcher', family: 'companion', biomeTags: ['coast', 'desert', 'mountain'], chunkRoles: ['breather', 'obstacle'] },
    { id: 'berry_specialist', title: 'Berry Specialist', family: 'economy', biomeTags: ['forest', 'swamp'], chunkRoles: ['breather', 'temptation'] },
    { id: 'route_contractor', title: 'Route Contractor', family: 'companion', biomeTags: ['town', 'urban', 'canyon'], chunkRoles: ['consequence', 'obstacle'] },
];

const buildTemplateIncident = (seed: { id: string; title: string; family: any; biomeTags: any[]; chunkRoles: ChunkRole[]; arcId?: string }): RouteIncident => ({
    id: seed.id,
    title: seed.title,
    family: seed.family,
    biomeTags: seed.biomeTags,
    chunkRoles: seed.chunkRoles,
    rarity: 0.72,
    signalText: [
        `${seed.title} detected ahead.`,
        'Risk: possible ambush / faction reaction / route tension shift.',
        'Opportunity: intel, route control, companion support, or future discounts.',
    ],
    choices: [
        {
            id: 'main',
            label: 'Handle directly',
            hint: 'Balanced approach',
            outcome: {
                narrative: ['You engage the situation head-on and stabilize the route.'],
                challengeType: 'explore',
                challengeTarget: `${seed.id}_resolve`,
                rewards: { routeIntel: 1, routeControl: 1 },
                tensionDelta: -1,
                curiosityDelta: 1,
                startRouteArcId: seed.arcId,
            },
        },
        {
            id: 'risky',
            label: 'Push for bigger gain',
            hint: 'Higher risk / higher reward',
            outcome: {
                narrative: ['You take the risky line and trigger a volatile response.'],
                challengeType: 'battle',
                challengeTarget: `${seed.id}_clash`,
                rewards: { money: 350, craftingMaterials: 2, routeIntel: 1 },
                penalties: { tensionDelta: 1 },
                queueEchoIncidentId: 'poacher_ambush',
                echoDelayChunks: 2,
                startRouteArcId: seed.arcId,
            },
        },
        {
            id: 'cautious',
            label: 'Play it safe',
            hint: 'Lower pressure, slower payoff',
            outcome: {
                narrative: ['You keep the route stable and avoid escalation.'],
                challengeType: 'collect',
                challengeTarget: `${seed.id}_stabilize`,
                rewards: { routeIntel: 1, safeCampUnlock: true },
                tensionDelta: -1,
                startRouteArcId: seed.arcId,
            },
        },
    ],
    followUp: seed.arcId ? {
        arcId: seed.arcId,
        possibleNextIncidentIds: [seed.id, 'rival_note', 'ranger_patrol'],
        echoChance: 0.55,
        minChunksLater: 2,
        maxChunksLater: 4,
        failureFlagIfIgnored: `ignored_${seed.id}`,
    } : undefined,
});

const ROUTE_INCIDENTS_BASE: RouteIncident[] = [
    ...(ROUTE_INCIDENTS_RAW as any[]).map((it) => ({ family: it.family || INCIDENT_FAMILY_FALLBACK(it.id), ...it })),
    ...REQUIRED_INCIDENT_LIBRARY.map(buildTemplateIncident),
];

const ROUTE_ARC_LIBRARY = [
    { id: 'wounded-pokemon-arc', payoffIncidentId: 'predator_silence' },
    { id: 'merchant-caravan-arc', payoffIncidentId: 'merchant_caravan_named' },
    { id: 'bridge-repair-arc', payoffIncidentId: 'bridge_storm_battle' },
    { id: 'glowing-footprints-arc', payoffIncidentId: 'ancient_shrine_named' },
    { id: 'poacher-trail-arc', payoffIncidentId: 'poacher_ambush' },
    { id: 'rival-shortcut-race-arc', payoffIncidentId: 'rival_shortcut' },
    { id: 'safe-camp-arc', payoffIncidentId: 'lake_hidden_camp' },
    { id: 'haunted-fog-path-arc', payoffIncidentId: 'moving_statue' },
    { id: 'alpha-territory-arc', payoffIncidentId: 'alpha_roadblock' },
    { id: 'shrine-awakening-arc', payoffIncidentId: 'shrine_awakening_named' },
    { id: 'lost-trainer-rescue-arc', payoffIncidentId: 'lost_courier' },
    { id: 'lost-hatchling-arc', payoffIncidentId: 'lost_hatchling' },
];

const INCIDENT_OVERRIDES: Record<string, Partial<RouteIncident>> = {
    injured_wild_pokemon: {
        followUp: { arcId: 'wounded-pokemon-arc', possibleNextIncidentIds: ['predator_silence', 'poacher_ambush'], echoChance: 0.7, minChunksLater: 2, maxChunksLater: 4, failureFlagIfIgnored: 'ignored_wounded_wild' },
        choices: [
            { id: 'heal', label: 'Treat the wounds', hint: 'Peaceful option', outcome: { narrative: ['You treat the wild Pokemon and calm the area.'], challengeType: 'collect', challengeTarget: 'field_medicine', rewards: { routeIntel: 1, factionReputation: { rangers: 2 }, joinCompanion: { id: 'ranger_mira', name: 'Ranger Mira', role: 'ranger', expiresAfterChunks: 4, sourceIncidentId: 'injured_wild_pokemon', effects: [{ type: 'trap_warning' }, { type: 'reduce_ambush_chance', amount: 0.2 }] } as any }, addFlags: ['rescuedWildPokemon'], setRouteFlags: ['rescuedWildPokemon'], startRouteArcId: 'wounded-pokemon-arc', queueEchoIncidentId: 'predator_silence', echoDelayChunks: 2, tensionDelta: -1 } },
            { id: 'bait', label: 'Use as bait', hint: 'Risky exploit', outcome: { narrative: ['You exploit the situation and attract predators.'], challengeType: 'battle', challengeTarget: 'predator_lure', rewards: { money: 420 }, penalties: { tensionDelta: 2 }, addFlags: ['factionAlerted'], setRouteFlags: ['factionAlerted'], queueEchoIncidentId: 'alpha_roadblock', echoDelayChunks: 3, failRouteArcId: 'wounded-pokemon-arc' } },
            { id: 'ignore', label: 'Walk past', hint: 'Risk: future hostility', outcome: { narrative: ['You leave it. The route feels less forgiving.'], addFlags: ['ignoredDistressCall'], setRouteFlags: ['ignoredDistressCall'], queueEchoIncidentId: 'poacher_ambush', echoDelayChunks: 2, failRouteArcId: 'wounded-pokemon-arc', tensionDelta: 1 } },
        ] as any,
    },
    overturned_merchant_cart: {
        followUp: { arcId: 'merchant-caravan-arc', possibleNextIncidentIds: ['merchant_caravan_named', 'poacher_ambush'], echoChance: 0.6, minChunksLater: 2, maxChunksLater: 5, failureFlagIfIgnored: 'merchant_cart_ignored' },
    },
    broken_bridge_named: {
        followUp: { arcId: 'bridge-repair-arc', possibleNextIncidentIds: ['merchant_caravan_named', 'bridge_storm_battle'], echoChance: 0.7, minChunksLater: 2, maxChunksLater: 4, failureFlagIfIgnored: 'bridge_ignored' },
    },
    glowing_footprints: {
        followUp: { arcId: 'glowing-footprints-arc', possibleNextIncidentIds: ['ancient_shrine_named', 'moving_statue'], echoChance: 0.7, minChunksLater: 2, maxChunksLater: 4, failureFlagIfIgnored: 'footprints_ignored' },
    },
    poacher_trap_named: {
        followUp: { arcId: 'poacher-trail-arc', possibleNextIncidentIds: ['poacher_ambush', 'ranger_patrol'], echoChance: 0.75, minChunksLater: 1, maxChunksLater: 3, failureFlagIfIgnored: 'poacher_trap_ignored' },
    },
    rival_shortcut: {
        followUp: { arcId: 'rival-shortcut-race-arc', possibleNextIncidentIds: ['rival_already_won', 'temporary_rival_alliance'], echoChance: 0.8, minChunksLater: 1, maxChunksLater: 3, failureFlagIfIgnored: 'rival_shortcut_ignored' },
        choices: [
            { id: 'race', label: 'Race the rival', hint: 'Speed challenge', outcome: { narrative: ['You sprint the hazardous shortcut side by side.'], challengeType: 'speed', challengeTarget: 'rival_race', challengeTimeLimit: 13, addFlags: ['rivalAhead', 'rivalChallengeQueued'], setRouteFlags: ['rivalAhead', 'rivalChallengeQueued'], startRouteArcId: 'rival-shortcut-race-arc', queueEchoIncidentId: 'rival_already_won', echoDelayChunks: 2, rewards: { routeControl: 1 } } },
            { id: 'sabotage', label: 'Set a decoy route', hint: 'Risk: rivalry worsens', outcome: { narrative: ['The rival catches on and gets annoyed.'], addFlags: ['rivalAnnoyed', 'rivalTookShortcut'], setRouteFlags: ['rivalAnnoyed', 'rivalTookShortcut'], queueEchoIncidentId: 'rival_already_won', echoDelayChunks: 1, tensionDelta: 1 } },
            { id: 'alliance', label: 'Offer temporary alliance', hint: 'Explore challenge', outcome: { narrative: ['You cooperate for one dangerous push.'], challengeType: 'explore', challengeTarget: 'rival_alliance', addFlags: ['rivalTemporaryAlliance', 'rivalRespectsPlayer'], setRouteFlags: ['rivalTemporaryAlliance', 'rivalRespectsPlayer'], queueEchoIncidentId: 'temporary_rival_alliance', echoDelayChunks: 2, rewards: { routeIntel: 1 } } },
        ] as any,
    },
    rival_already_won: {
        signalText: [
            'The rival got here first and left fresh boot prints.',
            'A cleared camp and scattered supplies show you just missed them.',
        ],
        followUp: {
            arcId: 'rival-shortcut-race-arc',
            possibleNextIncidentIds: ['rival_note', 'temporary_rival_alliance'],
            echoChance: 1,
            minChunksLater: 0,
            maxChunksLater: 1,
            failureFlagIfIgnored: 'rival_trail_lost',
        },
        choices: [
            {
                id: 'inspect',
                label: 'Inspect the cleared camp',
                hint: 'Gain route intel',
                outcome: {
                    narrative: ['You recover route notes and learn where the rival is headed next.'],
                    rewards: { routeIntel: 2, routeControl: 1, money: 350 },
                    addFlags: ['rivalAhead'],
                    setRouteFlags: ['rivalAhead'],
                    queueEchoIncidentId: 'rival_note',
                    echoDelayChunks: 0,
                    advanceRouteArcId: 'rival-shortcut-race-arc',
                    curiosityDelta: 1,
                },
            },
            {
                id: 'chase',
                label: 'Push to catch up',
                hint: 'Risk: tension rises',
                outcome: {
                    narrative: ['You push hard to catch their trail before it fades.'],
                    rewards: { routeIntel: 1, routeControl: 2, money: 500 },
                    addFlags: ['rivalChallengeQueued'],
                    setRouteFlags: ['rivalChallengeQueued'],
                    queueEchoIncidentId: 'temporary_rival_alliance',
                    echoDelayChunks: 0,
                    completeRouteArcId: 'rival-shortcut-race-arc',
                    tensionDelta: 1,
                },
            },
        ] as any,
    },
    trainer_campfire_named: {
        followUp: { arcId: 'safe-camp-arc', possibleNextIncidentIds: ['lake_hidden_camp'], echoChance: 0.55, minChunksLater: 2, maxChunksLater: 4, failureFlagIfIgnored: 'campfire_ignored' },
    },
    thick_fog_named: {
        followUp: { arcId: 'haunted-fog-path-arc', possibleNextIncidentIds: ['moving_statue', 'silent_grove'], echoChance: 0.65, minChunksLater: 2, maxChunksLater: 4, failureFlagIfIgnored: 'fog_ignored' },
    },
    alpha_tracks: {
        followUp: { arcId: 'alpha-territory-arc', possibleNextIncidentIds: ['alpha_roadblock'], echoChance: 0.85, minChunksLater: 1, maxChunksLater: 3, failureFlagIfIgnored: 'alpha_tracks_ignored' },
    },
    ancient_shrine_named: {
        followUp: { arcId: 'shrine-awakening-arc', possibleNextIncidentIds: ['shrine_awakening_named', 'bridge_storm_battle'], echoChance: 0.7, minChunksLater: 2, maxChunksLater: 5, failureFlagIfIgnored: 'shrine_ignored' },
    },
};

let ROUTE_INCIDENTS: RouteIncident[] = ROUTE_INCIDENTS_BASE.map((incident) => {
    const over = INCIDENT_OVERRIDES[incident.id];
    if (!over) return incident;
    return { ...incident, ...over } as RouteIncident;
});

const ROLE_INCIDENT_BINDINGS: Record<string, { role: any; effect: any }> = {
    map_scout: { role: 'map_scout', effect: { type: 'reveal_next_chunk_role' } },
    weather_watcher: { role: 'weather_watcher', effect: { type: 'trap_warning' } },
    lost_courier: { role: 'lost_trainer', effect: { type: 'increase_stealth_success', amount: 0.2 } },
    black_market_trader: { role: 'black_market_trader', effect: { type: 'discount_shops', amount: 0.08 } },
    traveling_move_hermit: { role: 'move_hermit', effect: { type: 'extra_route_choice' } },
    route_contractor: { role: 'route_contractor', effect: { type: 'extra_route_choice' } },
    merchant_caravan_named: { role: 'merchant', effect: { type: 'discount_shops', amount: 0.12 } },
    rival_fanclub_witness: { role: 'rival_witness', effect: { type: 'reveal_next_chunk_role' } },
    ranger_patrol: { role: 'faction_patrol', effect: { type: 'reduce_ambush_chance', amount: 0.25 } },
    trainer_campfire_named: { role: 'field_medic', effect: { type: 'post_battle_heal', amountPercent: 0.25 } },
    glowing_footprints: { role: 'rumor_hunter', effect: { type: 'increase_rare_pokemon_chance', amount: 0.08 } },
};

ROUTE_INCIDENTS = ROUTE_INCIDENTS.map((incident) => {
    const bind = ROLE_INCIDENT_BINDINGS[incident.id];
    if (!bind || incident.choices.length === 0) return incident;
    const first = { ...incident.choices[0] } as any;
    first.outcome = {
        ...(first.outcome || {}),
        rewards: {
            ...((first.outcome && first.outcome.rewards) || {}),
            joinCompanion: {
                id: `${bind.role}_${incident.id}`,
                name: bind.role.replace(/_/g, ' '),
                role: bind.role,
                expiresAfterChunks: 4,
                sourceIncidentId: incident.id,
                effects: [bind.effect],
            },
        },
    };
    return { ...incident, choices: [first, ...incident.choices.slice(1)] };
});

const pickChunkRole = (cx: number, cy: number, biome: string, routeState?: RouteState): ChunkRole => {
    const rs = normalizeRouteStateLocal(routeState);
    const tension = rs.routeTension;
    const curiosity = rs.routeCuriosity;
    const dist = Math.sqrt(cx * cx + cy * cy);
    const cadence = getCadencePreset(rs, biome, cx, cy);
    const lane = rs.routeFlags.find(f => /^lane_/.test(f)) || 'lane_main';
    const regionKey = `${Math.floor(cx / 5)},${Math.floor(cy / 5)}`;
    const ownership = rs.routeOwnershipByRegion[regionKey] || 'neutral';
    const recentRoleWindow = rs.recentChunkRoles.slice(-5);
    const recentSetpiece = recentRoleWindow.includes('setpiece');
    const recentDangerWindow = recentRoleWindow.filter((r) => r === 'threat' || r === 'setpiece' || r === 'obstacle').length;
    const weights = { ...CHUNK_ROLE_WEIGHTS };
    if (dist < 3) {
        weights.setpiece *= 0.25;
        weights.consequence = Math.max(0.55, weights.consequence - 0.08);
    }
    if (tension >= 4) {
        weights.threat += 0.3;
        weights.obstacle += 0.1;
        weights.breather = Math.max(0.4, weights.breather - 0.2);
    }
    if (curiosity >= 4) {
        weights.mystery += 0.16;
        weights.setpiece += 0.22;
    }
    if (lane === 'lane_side') {
        weights.temptation += 0.18;
        weights.obstacle += 0.1;
        weights.mystery += 0.08;
        weights.consequence += 0.08;
        weights.threat += 0.14;
        weights.breather = Math.max(0.35, weights.breather - 0.1);
        if (recentDangerWindow >= 2 || (rs.pacing.recentDangerCount || 0) >= 2) {
            // Risky stays dangerous, but avoid oppressive chains.
            weights.breather += 0.24;
            weights.threat = Math.max(0.45, weights.threat - 0.12);
            weights.consequence = Math.max(0.45, weights.consequence - 0.08);
        }
    } else if (lane === 'lane_strange') {
        weights.mystery += 0.26;
        weights.setpiece += 0.16;
        weights.threat += 0.02;
        weights.breather = Math.max(0.4, weights.breather - 0.06);
        if (recentDangerWindow >= 2 || (rs.pacing.recentDangerCount || 0) >= 2) {
            // Strange should stay volatile, but still needs occasional decompression.
            weights.breather += 0.34;
            weights.threat = Math.max(0.42, weights.threat - 0.16);
            weights.consequence = Math.max(0.4, weights.consequence - 0.16);
            weights.obstacle = Math.max(0.4, weights.obstacle - 0.08);
            weights.setpiece = Math.max(0.2, weights.setpiece - 0.14);
        }
    } else {
        weights.breather += 0.05;
        weights.temptation += 0.08;
        weights.threat = Math.max(0.42, weights.threat - 0.1);
        weights.setpiece = Math.max(0.18, weights.setpiece - 0.15);
    }
    if (biome === 'town') {
        weights.breather += 0.4;
        weights.threat = Math.max(0.4, weights.threat - 0.5);
    }
    if (rs.pacing.forceBreatherSoon || rs.pacing.chunksSinceBreather > 7 || recentDangerWindow >= 4) {
        weights.breather += 0.45;
        weights.setpiece = Math.max(0.22, weights.setpiece - 0.25);
        weights.threat = Math.max(0.45, weights.threat - 0.25);
        weights.obstacle = Math.max(0.4, weights.obstacle - 0.15);
    }
    if (rs.pacing.chunksSinceMajorIncident > 3) {
        weights.temptation += 0.28;
        weights.mystery += 0.3;
    }
    if (ownership === 'cursed') {
        weights.threat += 0.3;
        weights.mystery += 0.25;
    } else if (ownership === 'merchant_safe' || ownership === 'ranger_protected' || ownership === 'player_stabilized') {
        weights.breather += 0.35;
        weights.consequence += 0.1;
    } else if (ownership === 'poacher_controlled' || ownership === 'rival_influenced') {
        weights.threat += 0.4;
        weights.obstacle += 0.2;
    }
    if (cadence === 'tutorial') {
        weights.breather += 0.18;
        weights.temptation += 0.1;
        weights.setpiece = Math.max(0.05, weights.setpiece - 0.22);
        weights.threat = Math.max(0.45, weights.threat - 0.15);
    } else if (cadence === 'dangerous') {
        weights.threat += 0.18;
        weights.obstacle += 0.12;
        weights.consequence += 0.1;
        weights.setpiece += 0.08;
    } else if (cadence === 'mystery') {
        weights.mystery += 0.2;
        weights.setpiece += 0.08;
    } else if (cadence === 'high_variance') {
        weights.temptation += 0.1;
        weights.setpiece += 0.12;
    }
    if (recentSetpiece) {
        weights.setpiece = Math.max(0.05, weights.setpiece - 0.15);
        weights.breather += 0.22;
    }
    if (rs.recentChunkRoles[rs.recentChunkRoles.length - 1] === 'setpiece') {
        return hash4(cx, cy, 71011, 0) < 0.7 ? 'breather' : 'temptation';
    }
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let roll = hash4(cx, cy, 71001, 0) * total;
    const keys = Object.keys(weights) as ChunkRole[];
    for (const key of keys) {
        roll -= weights[key];
        if (roll <= 0) return key;
    }
    return 'breather';
};

const buildRoutePreview = (cx: number, cy: number, biome: string, role: ChunkRole, routeState?: RouteState): RoutePreview => {
    const rs = normalizeRouteStateLocal(routeState);
    const tension = rs.routeTension;
    const curiosity = rs.routeCuriosity;
    const dangerByRole: Record<ChunkRole, string> = {
        breather: 'The route feels safe.',
        temptation: 'Something feels active nearby.',
        obstacle: 'You feel watched.',
        threat: 'The route feels hostile.',
        mystery: 'Something feels active nearby.',
        consequence: 'You feel watched.',
        setpiece: 'Trouble is closing in.',
    };
    const rewardByRole: Record<ChunkRole, string> = {
        breather: 'Recovery and utility help are likely.',
        temptation: 'Risky detours can pay off.',
        obstacle: 'Clearing this route may unlock safer travel.',
        threat: 'High pressure, but notable rewards on success.',
        mystery: 'Discovery and rare intel are possible.',
        consequence: 'Your past choices can open or close options.',
        setpiece: 'Major payoff possible if you commit.',
    };
    const chunkId = `chunk_${cx}_${cy}`;
    const memoryHints = rs.chunkMemoryStates?.[chunkId] || [];
    const tensionLabel = tension <= 1 ? 'Calm' : tension <= 3 ? 'Watchful' : tension <= 5 ? 'Risky' : tension <= 7 ? 'Dangerous' : 'Critical';
    const curiosityLabel = curiosity <= 1 ? 'Quiet' : curiosity <= 3 ? 'Hints Nearby' : curiosity <= 5 ? 'Strange Signs' : curiosity <= 7 ? 'Mystery Building' : 'Discovery Imminent';
    const tensionHint = tension <= 1 ? 'The route feels safe.' : tension <= 3 ? 'Something feels active nearby.' : tension <= 5 ? 'You feel watched.' : tension <= 7 ? 'The route feels hostile.' : 'Trouble is closing in.';
    const curiosityHint = curiosity <= 1 ? 'No unusual signs.' : curiosity <= 3 ? 'Small details stand out.' : curiosity <= 5 ? 'The area feels unusual.' : curiosity <= 7 ? 'Several clues point off the main path.' : 'Something rare is close.';
    const stackedRisk = (rs.routeFlags || []).filter((f) => ['angeredPoachers', 'factionAlerted', 'ignoredDistressCall'].includes(f)).length >= 2;
    const topCompanion = rs.activeCompanions[0];
    const companionHintByRole: Record<string, string> = {
        map_scout: 'Your scout points out a safer approach.',
        ranger: 'Your ranger notices signs of disturbed wildlife.',
        merchant: 'The merchant warns that valuable cargo may attract trouble.',
        weather_watcher: 'The watcher studies the sky and frowns.',
    };
    return {
        mood: `${biome.toUpperCase()} | ${role.toUpperCase()}`,
        dangerHint: `${dangerByRole[role]} ${tensionHint}${stackedRisk ? ' Multiple prior choices are escalating local hostility.' : ''}`,
        rewardHint: `${rewardByRole[role]} ${curiosityHint}`,
        routeOptions: {
            main: stackedRisk ? 'Main lane can cool heat and reduce chain danger' : role === 'threat' ? 'Hold main lane, lower variance' : 'Steady progress and consistency',
            side: stackedRisk ? 'Side lane remains high reward, but pressure is stacking' : role === 'temptation' ? 'Side lane has richer reward odds' : 'Side lane offers situational rewards',
            strange: role === 'mystery' || role === 'setpiece' ? 'Strange lane may trigger rare incident' : 'High variance route with unknown modifiers',
        },
        knownModifiers: [
            ...(rs.routeFlags?.slice(-3) ?? []),
            ...memoryHints.slice(-2),
            tension >= 5 ? 'heightened_tension' : 'stable_tension',
            curiosity >= 5 ? 'high_curiosity' : 'normal_curiosity',
            stackedRisk ? 'stacked_risk' : 'single_risk',
        ],
        tensionLabel,
        curiosityLabel,
        companionHint: topCompanion ? companionHintByRole[topCompanion.role] || `${topCompanion.name} is helping with ${topCompanion.role.replace(/_/g, ' ')} duties.` : undefined,
    };
};

const selectRouteIncident = (cx: number, cy: number, biome: string, role: ChunkRole, routeState?: RouteState): RouteIncident | undefined => {
    const rs = normalizeRouteStateLocal(routeState);
    const biomeTag = biome as any;
    const dist = Math.sqrt(cx * cx + cy * cy);
    if (dist < 1 || dist > 35) return undefined;
    const tension = rs.routeTension;
    const curiosity = rs.routeCuriosity;
    const flags = new Set(rs.routeFlags ?? []);
    const lane = rs.routeFlags.find(f => /^lane_/.test(f)) || 'lane_main';
    const cadence = getCadencePreset(rs, biome, cx, cy);
    const regionKey = `${Math.floor(cx / 5)},${Math.floor(cy / 5)}`;
    const ownership = rs.routeOwnershipByRegion[regionKey] || 'neutral';
    const chunkFloor = Math.floor(dist);
    const unresolvedArcs = rs.activeRouteArcs.filter(a => !a.completed && !a.failed).length;
    const arcCap = dist <= 20 ? 2 : 3;
    const arcPayoffIds = new Set(
        rs.activeRouteArcs
            .filter(a => !a.completed && !a.failed && (a.stageIndex || 0) >= Math.max(1, (a.maxStages || 4) - 2))
            .map(a => a.payoffIncidentId)
            .filter(Boolean) as string[],
    );
    const eligibleEchoes = rs.queuedEchoes.filter(e => e.triggerAfterChunk <= chunkFloor && (e.expiresAfterChunk === undefined || e.expiresAfterChunk >= chunkFloor));
    if (eligibleEchoes.length > 0 && role !== 'setpiece' && role !== 'consequence') {
        const sortedEchoes = [...eligibleEchoes].sort((a, b) => {
            const pa = classifyEchoPriority(a.incidentId);
            const pb = classifyEchoPriority(b.incidentId);
            const score = (p: 'high' | 'medium' | 'low') => p === 'high' ? 2 : p === 'medium' ? 1 : 0;
            return score(pb) - score(pa);
        });
        const echo = sortedEchoes[0];
        const priority = classifyEchoPriority(echo.incidentId);
        const echoIncident = ROUTE_INCIDENTS.find(i => i.id === echo.incidentId);
        if (echoIncident) {
            if (priority === 'high') return echoIncident;
            const echoRoll = hash4(cx, cy, 71021, 0);
            if ((priority === 'medium' && echoRoll < 0.75) || (priority === 'low' && echoRoll < 0.4)) return echoIncident;
        }
    }
    if (arcPayoffIds.size > 0 && (role === 'setpiece' || role === 'consequence' || rs.pacing.forcePayoffSoon)) {
        const payoff = ROUTE_INCIDENTS.find(i => arcPayoffIds.has(i.id) && i.biomeTags.includes(biomeTag));
        if (payoff) return payoff;
    }
    const pool = ROUTE_INCIDENTS.filter((incident) => {
        if (!incident.biomeTags.includes(biomeTag)) return false;
        if (!incident.chunkRoles.includes(role)) return false;
        if (incident.minTension !== undefined && tension < incident.minTension) return false;
        if (incident.maxTension !== undefined && tension > incident.maxTension) return false;
        if (incident.minCuriosity !== undefined && curiosity < incident.minCuriosity) return false;
        if (incident.maxCuriosity !== undefined && curiosity > incident.maxCuriosity) return false;
        if (incident.blockedFlags?.some((f) => flags.has(f))) return false;
        if (incident.requirements?.some((f) => !flags.has(f))) return false;
        if (rs.recentIncidentIds.slice(-10).includes(incident.id)) return false;
        if (rs.pacing.recentDangerCount >= 2 && incident.family === 'setpiece' && role !== 'setpiece') return false;
        if (unresolvedArcs >= arcCap && incident.followUp?.arcId && !rs.activeRouteArcs.some(a => a.id === incident.followUp?.arcId)) return false;
        const recentFamilies = rs.recentIncidentIds
            .slice(-5)
            .map((id) => ROUTE_INCIDENTS.find((it) => it.id === id)?.family)
            .filter(Boolean);
        const familyCount = recentFamilies.filter((f) => f === incident.family).length;
        const recentRival = recentFamilies.filter((f) => f === 'rival').length;
        const justifiedRepeat = (
            (incident.family === 'mystery' && (biome === 'haunted' || lane === 'lane_strange' || curiosity >= 6))
            || (incident.family === 'environment' && ['mountain', 'swamp', 'desert', 'coast'].includes(biome))
            || (incident.family === 'faction' && ownership !== 'neutral')
        );
        if (familyCount >= 2 && !justifiedRepeat) return false;
        if (incident.family === 'rival' && recentRival >= 1 && !arcPayoffIds.has(incident.id)) return false;
        return true;
    });
    if (pool.length === 0) return undefined;
    const weighted = pool.map((incident) => {
        let weight = Math.max(0.2, incident.rarity ?? 0.7);
        weight *= getFamilyWeight(biome, incident.family);
        if (ownership === 'merchant_safe') weight *= incident.family === 'economy' ? 1.45 : incident.family === 'faction' ? 0.8 : 1;
        if (ownership === 'ranger_protected') weight *= incident.family === 'pokemon_ecology' || incident.family === 'faction' ? 1.35 : 0.9;
        if (ownership === 'poacher_controlled') weight *= incident.family === 'faction' || incident.family === 'human_trouble' ? 1.1 : 0.92;
        if (ownership === 'cursed') weight *= incident.family === 'mystery' || incident.family === 'setpiece' ? 1.45 : 0.8;
        if (ownership === 'rival_influenced') weight *= incident.family === 'rival' ? 1.18 : 0.92;
        if (incident.family === 'environment') weight *= ['mountain', 'swamp', 'desert', 'coast'].includes(biome) ? 1.45 : 1.3;
        if (incident.family === 'human_trouble' && !['urban', 'coast', 'town'].includes(biome)) weight *= 0.84;
        if (incident.family === 'faction' && ownership === 'neutral' && tension < 6) weight *= 0.82;
        if (incident.family === 'rival' && !flags.has('rivalTookShortcut') && !flags.has('rivalAnnoyed')) weight *= 0.86;
        if (lane === 'lane_main') weight *= (incident.family === 'economy' || incident.family === 'companion') ? 1.2 : (incident.family === 'setpiece' || incident.family === 'mystery') ? 0.8 : 1;
        if (lane === 'lane_side') weight *= (incident.family === 'environment' || incident.family === 'pokemon_ecology' || incident.family === 'poi') ? 1.32 : (incident.family === 'faction' ? 0.58 : incident.family === 'rival' ? 0.82 : 1);
        if (lane === 'lane_strange') weight *= (incident.family === 'mystery' || incident.family === 'poi' || incident.family === 'setpiece') ? 1.44 : incident.family === 'rival' ? 1.12 : (incident.family === 'economy' ? 0.7 : 0.9);
        if (tension >= 6 && (incident.family === 'faction' || incident.family === 'environment')) weight *= 1.25;
        if (curiosity >= 6 && (incident.family === 'mystery' || incident.family === 'poi')) weight *= 1.3;
        if (role === 'obstacle' || role === 'threat') {
            if (incident.family === 'environment') weight *= 1.75;
            if (incident.family === 'economy') weight *= 0.65;
        }
        if (role === 'mystery') {
            if (incident.family === 'mystery') weight *= 1.25;
            if (incident.family === 'poi') weight *= 1.45;
            if (incident.family === 'economy') weight *= 0.7;
        }
        if (role === 'consequence') {
            if (incident.family === 'environment') weight *= 1.35;
            if (incident.family === 'economy') weight *= 0.7;
        }
        if (role === 'setpiece') {
            if (incident.family === 'setpiece') weight *= 2.35;
            else if (incident.family === 'mystery' || incident.family === 'rival' || incident.family === 'faction') weight *= 1.05;
            else weight *= 0.72;
        }
        if (role === 'consequence') {
            if (incident.family === 'faction' || incident.family === 'human_trouble' || incident.family === 'economy') weight *= 1.2;
        }
        if (lane === 'lane_side' && (rs.pacing.recentDangerCount || 0) >= 2) {
            if (incident.family === 'faction' || incident.family === 'rival' || incident.family === 'setpiece') weight *= 0.64;
            if (incident.family === 'economy' || incident.family === 'companion' || incident.family === 'pokemon_ecology') weight *= 1.12;
        }
        if (cadence === 'tutorial') {
            if (incident.family === 'setpiece' || incident.family === 'faction') weight *= 0.6;
            if (incident.family === 'companion' || incident.family === 'economy' || incident.family === 'pokemon_ecology') weight *= 1.2;
        } else if (cadence === 'dangerous') {
            if (incident.family === 'faction' || incident.family === 'environment' || incident.family === 'human_trouble') weight *= 1.2;
        } else if (cadence === 'mystery') {
            if (incident.family === 'mystery' || incident.family === 'poi') weight *= 1.35;
        } else if (cadence === 'high_variance') {
            if (incident.family === 'setpiece' || incident.family === 'mystery' || incident.family === 'rival' || incident.family === 'poi') weight *= 1.15;
        }
        if (arcPayoffIds.has(incident.id)) weight *= 1.6;
        if (incident.family === 'economy' && ownership !== 'merchant_safe') weight *= 0.62;
        return { incident, weight: Math.max(0.05, weight) };
    });
    const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
    let roll = hash4(cx, cy, 71002, 0) * totalWeight;
    for (const item of weighted) {
        roll -= item.weight;
        if (roll <= 0) return item.incident;
    }
    return weighted[0].incident;
};

/** Biome → (bg, wall, patch) lookup. Also used for edge blending. */
const getBiomeTiles = (biome: string): { bg: number; wall: number; patch: number } => {
    switch (biome) {
        case 'desert': return { bg: 25, wall: 24, patch: 7 };
        case 'snow':   return { bg: 26, wall: 1,  patch: 27 };
        case 'canyon': return { bg: 7,  wall: 24, patch: 25 };
        case 'lake':   return { bg: 0,  wall: 3,  patch: 2 };
        case 'cave':   return { bg: 7,  wall: 24, patch: 20 };
        case 'rift':   return { bg: 29, wall: 2,  patch: 30 };
        default:       return { bg: 0,  wall: 1,  patch: 2 }; // forest/town
    }
};

export const generateChunk = (cx: number, cy: number, riftStability: number = 0, routeState?: RouteState): Chunk => {
    const seed = getChunkSeed(cx, cy);
    const rng = new SeededRandom(seed);
    const dist = Math.sqrt(cx*cx + cy*cy);

    const biome = getBiomeAt(cx, cy);
    const chunkRole = pickChunkRole(cx, cy, biome, routeState);
    const routePreview = buildRoutePreview(cx, cy, biome, chunkRole, routeState);
    const routeIncident = selectRouteIncident(cx, cy, biome, chunkRole, routeState);

    if (cx === 0 && cy === 0) {
        const starterTownLayout = PALLET_LAYOUT.map(row => row.slice());
        // Starter-town readability pass:
        // - left house remains home/cottage look (orange roof)
        // - right top building is now the guaranteed visible Center
        starterTownLayout[2][2] = 80; starterTownLayout[2][3] = 81; starterTownLayout[2][4] = 82;
        starterTownLayout[3][2] = 83; starterTownLayout[3][3] = 50; starterTownLayout[3][4] = 85;
        starterTownLayout[2][12] = 30; starterTownLayout[2][13] = 31; starterTownLayout[2][14] = 32;
        starterTownLayout[3][12] = 33; starterTownLayout[3][13] = 50; starterTownLayout[3][14] = 35;
        return {
            x: 0, y: 0, id: 'chunk_0_0', name: 'Pallet Town', layout: starterTownLayout,
            // Starter town: fix the long-standing portal mislabels. The
            // visible Mart roof's door at (10,9) now actually opens the
            // Mart interior. The right-hand top building at (13,3) is a
            // guaranteed Center so new runs always have nearby healing.
            portals: {
                "3,3": "house_player,9,8",                      // player's bedroom
                "13,3": interiorPortal('center', 0, 0, 13, 3),  // Pallet Center
                "10,9": interiorPortal('mart', 0, 0, 10, 9),    // Pallet Mart
            },
            wildLevelRange: [2, 5], biome: 'town',
            trainers: {},
            npcs: {
                "5,10": { id: "pallet_npc_1", name: "Old Man", sprite: TRAINER_SPRITES.gentleman, dialogue: ["The old wooden signposts still know the way, y'know.", "If you ever get lost out there, check the nearest one.", "It'll point you toward whichever gym you need next."] },
                "12,5": { id: "pallet_npc_2", name: "Lass", sprite: TRAINER_SPRITES.lass, dialogue: ["Pallet Town is so peaceful.", "Have you seen Prof. Oak?"] },
                "15,13": { id: "pallet_npc_3", name: "Fisherman", sprite: TRAINER_SPRITES.fisherman, dialogue: ["The water here is perfect for fishing.", "I caught a huge Magikarp earlier!"] },
                "2,13": { id: "pallet_npc_4", name: "Bug Catcher", sprite: TRAINER_SPRITES.bugcatcher, dialogue: ["I'm looking for rare bugs in the tall grass!", "Be careful out there."] }
            },
            chunkRole,
            routePreview,
            routeIncident,
        };
    }

    const layout = Array(CHUNK_SIZE).fill(0).map(() => Array(CHUNK_SIZE).fill(0));
    const trainers: Record<string, TrainerData> = {};
    const npcs: Record<string, NPCData> = {};
    const interactables: Record<string, InteractableData> = {};
    const portals: Record<string, string> = {};

    const tiles = getBiomeTiles(biome);
    let bgTile = tiles.bg;
    let wallTile = tiles.wall;
    let patchTile = tiles.patch;

    // Neighbor biomes for edge blending. We precompute only the 4-orthogonal
    // neighbors because diagonal blending on 20x20 chunks produces muddy
    // transitions. 'rift' neighbors are skipped (they're always hard cuts).
    const neighborBg = {
        left:  cx !== 0 || cy !== 0 ? getBiomeTiles(getBiomeAt(cx - 1, cy)).bg : bgTile,
        right: getBiomeTiles(getBiomeAt(cx + 1, cy)).bg,
        up:    getBiomeTiles(getBiomeAt(cx, cy - 1)).bg,
        down:  getBiomeTiles(getBiomeAt(cx, cy + 1)).bg,
    };

    if (biome === 'rift') {
        for(let y=0; y<CHUNK_SIZE; y++) {
            for(let x=0; x<CHUNK_SIZE; x++) {
                layout[y][x] = bgTile;
                if (x === 0 || x === CHUNK_SIZE-1 || y === 0 || y === CHUNK_SIZE-1) {
                    layout[y][x] = wallTile;
                }
            }
        }
        // Entry Gate at bottom
        layout[CHUNK_SIZE-1][10] = 50; // Door/Mat
        
        // Center Boss
        const bx = 10, by = 10;
        layout[by][bx] = 5; // Healer/Boss Marker
        trainers[`${bx},${by}`] = {
            id: `rift_guardian_${cx}_${cy}`,
            name: "RIFT GUARDIAN",
            sprite: TRAINER_SPRITES.red,
            team: [150, 249, 250, 382, 383, 384], // Mewtwo, Lugia, Ho-Oh, Kyogre, Groudon, Rayquaza
            level: 100,
            reward: 50000,
            dialogue: "I am the Guardian of the Rift. None shall pass.",
            winDialogue: "The Rift... it closes. You have saved this reality.",
            isGymLeader: false,
            badgeId: 9 // Special Badge
        };
        
        // Add some rift scenery
        for(let i=0; i<20; i++) {
            const rx = rng.nextInt(2, 18);
            const ry = rng.nextInt(2, 18);
            if (layout[ry][rx] === bgTile) layout[ry][rx] = patchTile;
        }

        return { id: `chunk_${cx}_${cy}`, name: "THE RIFT CORE", layout, portals, wildLevelRange: [90, 100], biome, trainers, npcs, interactables, x: cx, y: cy, chunkRole, routePreview, routeIncident };
    }

    // 2. Fill base terrain with local noise + neighbor-aware edge blending.
    //
    // Edge blending: for tiles within BLEND_RADIUS of a chunk boundary, we
    // probabilistically swap in the neighbor biome's base tile so transitions
    // look natural instead of guillotine-sharp. Probability ramps from ~80% at
    // the edge down to 0 at BLEND_RADIUS.
    const localNoise = new Noise2D(seed);
    const BLEND_RADIUS = 3;
    for(let y=0; y<CHUNK_SIZE; y++) {
        for(let x=0; x<CHUNK_SIZE; x++) {
            const nv = localNoise.noise(x * 0.15, y * 0.15);
            layout[y][x] = bgTile;

            // Edge blending -- pick whichever cardinal edge is closest and
            // push in the neighbor's bg a jittered fraction of the time.
            if (biome !== 'rift') {
                const edgeDistLeft = x;
                const edgeDistRight = CHUNK_SIZE - 1 - x;
                const edgeDistUp = y;
                const edgeDistDown = CHUNK_SIZE - 1 - y;
                const minDist = Math.min(edgeDistLeft, edgeDistRight, edgeDistUp, edgeDistDown);
                if (minDist < BLEND_RADIUS) {
                    let neighborTile = bgTile;
                    if (minDist === edgeDistLeft) neighborTile = neighborBg.left;
                    else if (minDist === edgeDistRight) neighborTile = neighborBg.right;
                    else if (minDist === edgeDistUp) neighborTile = neighborBg.up;
                    else neighborTile = neighborBg.down;
                    if (neighborTile !== bgTile) {
                        const blendP = (BLEND_RADIUS - minDist) / BLEND_RADIUS * 0.8;
                        if (rng.next() < blendP) layout[y][x] = neighborTile;
                    }
                }
            }

            // Natural patches based on noise (applied on top of blending)
            if (nv > 0.35 && layout[y][x] === bgTile) layout[y][x] = patchTile;

            if (biome === 'lake') {
                if (nv < -0.4) layout[y][x] = 3; // Water
                else if (nv < -0.2) layout[y][x] = 25; // Sand beach
            }
            if (biome === 'forest' && nv > 0.6) layout[y][x] = 1; // Dense trees
            if (biome === 'snow' && nv < -0.5) layout[y][x] = 27; // Ice patches
            // Deep canyon / desert chunks get occasional lava pockets (tile 28).
            // These are walkable but deal damage each step -- see lava hazard
            // handler in App.tsx. Spawns only past distance 20 to avoid
            // punishing early game.
            const dist = Math.sqrt(cx * cx + cy * cy);
            if ((biome === 'canyon' || biome === 'desert') && dist > 20 && layout[y][x] === bgTile) {
                if (nv > 0.78) layout[y][x] = 28;
            }

            // Border walls (less rigid). Skip if we already blended in a
            // neighbor tile -- walls would undo the transition.
            if (x === 0 || x === CHUNK_SIZE-1 || y === 0 || y === CHUNK_SIZE-1) {
                const borderNoise = localNoise.noise(x * 0.5, y * 0.5);
                if (borderNoise > -0.3 && layout[y][x] === bgTile) layout[y][x] = wallTile;
            }
        }
    }

    // 3. Ensure paths connect to neighbors (Crossroads)
    // We make paths slightly more interesting but still functional
    const pathX = 9;
    const pathY = 9;
    for(let y=0; y<CHUNK_SIZE; y++) { 
        const globalY = cy * CHUNK_SIZE + y;
        const offset = Math.floor(Math.sin(globalY * 0.3) * 1.5);
        const px = pathX + offset;
        if (px >= 0 && px < CHUNK_SIZE - 1 && layout[y]) {
            layout[y][px] = 4; 
            layout[y][px + 1] = 4; 
            // Add bridge if crossing water
            if (px > 0 && px < CHUNK_SIZE - 2 && (layout[y][px-1] === 3 || layout[y][px+2] === 3)) {
                layout[y][px] = 29; layout[y][px+1] = 29;
            }
        }
    }
    for(let x=0; x<CHUNK_SIZE; x++) { 
        const globalX = cx * CHUNK_SIZE + x;
        const offset = Math.floor(Math.sin(globalX * 0.3) * 1.5);
        const py = pathY + offset;
        if (py >= 0 && py < CHUNK_SIZE - 1) {
            layout[py][x] = 4; 
            layout[py + 1][x] = 4; 
            // Add bridge if crossing water
            if (py > 0 && py < CHUNK_SIZE - 2 && ((layout[py-1] && layout[py-1][x] === 3) || (layout[py+2] && layout[py+2][x] === 3))) {
                layout[py][x] = 29; layout[py+1][x] = 29;
            }
        }
    }

    // 3-lane route structure:
    // - main path (existing cross-road, safest/predictable)
    // - side path (risk/reward lane near edges)
    // - strange path (rare, high-variance weave)
    const sideLaneX = hash4(cx, cy, 72001, 0) > 0.5 ? 3 : CHUNK_SIZE - 4;
    for (let y = 2; y < CHUNK_SIZE - 2; y++) {
        if (layout[y][sideLaneX] === 3) layout[y][sideLaneX] = 29; // bridge if water
        else if (layout[y][sideLaneX] !== wallTile) layout[y][sideLaneX] = 4;
    }
    if (hash4(cx, cy, 72002, 0) < 0.45) {
        let sx = 2 + Math.floor(hash4(cx, cy, 72003, 0) * 3);
        for (let y = CHUNK_SIZE - 3; y >= 2; y--) {
            sx = Math.max(2, Math.min(CHUNK_SIZE - 3, sx + (hash4(cx, cy, 72004, y) < 0.5 ? -1 : 1)));
            if (layout[y][sx] === 3) layout[y][sx] = 29;
            else if (layout[y][sx] !== wallTile) layout[y][sx] = 4;
        }
    }

    // Rift Stability reduces level scaling. We tuned the base factor down to
    // 1.2 (from 1.8) so that the wild-range stored on the chunk tracks the
    // smooth `getWildLevelCap(badges, distance)` curve in utils/progression --
    // otherwise the upper bound hits the badge-based clamp early and flattens
    // into a single level, killing pool variety.
    const scaleFactor = Math.max(0.4, 1.2 - (riftStability * 0.6));
    // Starter-area floor: dist 0 → level 2 pool, so a level-5 starter is on
    // top. Each chunk of distance adds ~1.2 levels until the per-tier cap.
    const levelBase = Math.max(2, Math.floor(dist * scaleFactor) + 2);

    // 4. Procedural POIs (Grouped and logical)
    const poiRoll = rng.next();

    // --- Guaranteed gym placement -----------------------------------------
    // If this chunk is on the forced-gym list, place the gym deterministically
    // at the center of the chunk and skip the RNG POI roll so nothing else
    // can stomp the tiles. Random trainers / clutter still generate around
    // it afterward, so guaranteed gym chunks still feel alive.
    const guaranteedGymBadge = GUARANTEED_GYMS[`${cx},${cy}`];
    let poiPlaced = false;
    if (guaranteedGymBadge !== undefined) {
        const gymBadge = guaranteedGymBadge;
        const hx = 8;
        const hy = 8;
        // Gym exteriors should be visually distinct from Centers/Marts so
        // players can scan towns quickly for healing/shop buildings.
        const roofTile = 80;
        const wTile   = 83;
        const sTile   = 85;

        layout[hy][hx] = roofTile; layout[hy][hx + 1] = roofTile + 1; layout[hy][hx + 2] = roofTile + 2;
        layout[hy + 1][hx] = wTile; layout[hy + 1][hx + 1] = 50; layout[hy + 1][hx + 2] = sTile;

        // Clear the tile in front of the door so the player can always walk
        // up to it (approach from south).
        if (layout[hy + 2]) {
            for (let dx = 0; dx < 3; dx++) {
                if (layout[hy + 2][hx + dx] !== 3) layout[hy + 2][hx + dx] = 4; // path
            }
        }

        // ---- New: route the gym door to a unique INTERIOR. ----
        // The leader and themed mooks now live inside `buildGym(badge)` in
        // services/interiors.ts. The portal is keyed by badge id so all
        // copies of "Pewter Gym" in the world share one canonical interior
        // (matters because gym progress is global, not per-instance).
        portals[`${hx + 1},${hy + 1}`] = gymPortal(gymBadge);
        // The interior's exit (door mat at "10,17") returns to the tile
        // *south* of the door so the player isn't immediately re-portalled.
        // App.tsx interior portal resolver handles the PREV_POS bookkeeping
        // automatically because we stash an `__interior_entry__` flag on
        // entry; the interior's `portals` field uses that as `returnTo`.
        poiPlaced = true;
    }

    // Always add some random clutter/interactables regardless of main POI.
    // Density was previously too aggressive (5 iterations + very wide prop
    // bands), which made chunks feel like a mailbox warehouse. We now run
    // fewer rolls and keep decorative-prop odds low so grass still dominates
    // and gameplay sightlines stay clear.
    // Track whether this chunk got at least one compass signpost. Used so
    // we can force one near spawn (dist <= 3) for new players who haven't
    // met one yet -- otherwise the first gym hint can be a dozen chunks
    // away by RNG, which is exactly the "where do I even go?" complaint.
    let compassSignPlaced = false;
    const placeCompassSign = (rx: number, ry: number): void => {
        layout[ry][rx] = 53;
        interactables[`${rx},${ry}`] = {
            type: 'gym_compass',
            // Fallback text only -- App.tsx replaces this at interaction
            // time with fresh "Gym N lies to the NORTHEAST" copy.
            text: ["A weathered wooden signpost. Its inscription is hard to read from here."],
        };
        compassSignPlaced = true;
    };

    for (let i = 0; i < 3; i++) {
        const rx = rng.nextInt(2, CHUNK_SIZE - 3);
        const ry = rng.nextInt(2, CHUNK_SIZE - 3);
        if (layout[ry][rx] === bgTile) {
            const clutterRoll = rng.next();
            if (clutterRoll < 0.10) layout[ry][rx] = 56; // Berry Tree
            else if (clutterRoll < 0.16) placeCompassSign(rx, ry); // Gym-compass signpost
            else if (clutterRoll < 0.22) layout[ry][rx] = 12; // Item Ball
            else if (clutterRoll < 0.25) layout[ry][rx] = 65; // Weather Shrine
            else if (clutterRoll < 0.28) layout[ry][rx] = 66; // Healing Spring
            // Decorative props (light sprinkle only).
            else if (clutterRoll < 0.32 && (biome === 'forest' || biome === 'lake' || biome === 'town')) layout[ry][rx] = 98; // Bench
            else if (clutterRoll < 0.35 && biome !== 'cave') layout[ry][rx] = 97; // Lamppost
            else if (clutterRoll < 0.37 && biome !== 'cave' && biome !== 'desert') layout[ry][rx] = 99; // Mailbox
        }
    }

    // Guaranteed compass signpost near spawn (dist <= 3). A new player's
    // first few chunks should always contain a clear "go that way" pointer
    // so they never feel lost on fresh start. Find any bgTile cell not
    // already claimed and drop a signpost on it.
    if (!compassSignPlaced && dist <= 3) {
        outer: for (let ty = 3; ty < CHUNK_SIZE - 3; ty++) {
            for (let tx = 3; tx < CHUNK_SIZE - 3; tx++) {
                if (layout[ty][tx] === bgTile
                    && !interactables[`${tx},${ty}`]
                    && !npcs[`${tx},${ty}`]
                    && !trainers[`${tx},${ty}`]
                    && !portals[`${tx},${ty}`]) {
                    placeCompassSign(tx, ty);
                    break outer;
                }
            }
        }
    }

    if (poiPlaced) {
        // Guaranteed gym already placed above -- skip the RNG POI chain.
    } else if (poiRoll < 0.05 && dist > 2) {
        // Ruins Clearing with a Riddle
        const rx = rng.nextInt(3, 12);
        const ry = rng.nextInt(3, 12);
        for(let y=ry-1; y<ry+6; y++) {
            for(let x=rx-1; x<rx+6; x++) {
                if (y >= 0 && y < CHUNK_SIZE && x >= 0 && x < CHUNK_SIZE) {
                    layout[y][x] = 20; // Stone floor
                    if (rng.next() < 0.1) layout[y][x] = 21; // Pillar
                }
            }
        }
        if (layout[ry+2] && rx+2 < CHUNK_SIZE) {
            layout[ry+2][rx+2] = 22; // Statue
            interactables[`${rx+2},${ry+2}`] = { 
                type: 'object', 
                text: ["The statue whispers...", "'Bring me a creature of the deep to unlock my treasure.'", "(Requires a Water-type Pokemon in lead)"] 
            };
        }
    } else if (poiRoll < 0.10 && dist > 1) {
        // Campsite near path
        const side = rng.next() > 0.5 ? 1 : -1;
        const cy_ = rng.nextInt(5, 15);
        const cx_ = pathX + (side * 4);
        if (layout[cy_] && layout[cy_-1] && cx_ >= 0 && cx_ < CHUNK_SIZE) {
            layout[cy_][cx_] = 51; // Campfire
            layout[cy_-1][cx_] = 52; // Tent
            npcs[`${cx_},${cy_-1}`] = { 
                id: `camper_${cx}_${cy}`, 
                name: "Camper", 
                sprite: TRAINER_SPRITES.youngster, 
                dialogue: ["The stars are beautiful tonight.", "Have you tried fishing in the lakes nearby?"],
                challenge: rng.next() > 0.7 ? {
                    type: 'battle',
                    target: 'win_battle',
                    rewardPokemonId: rng.nextInt(1, 151),
                    rewardLevel: levelBase + 2
                } : undefined
            };
        }
    } else if (poiRoll < 0.15 && dist > 1) {
        // Fishing Spot
        const fx = rng.nextInt(5, 15);
        const fy = rng.nextInt(5, 15);
        if (layout[fy] && layout[fy][fx] === 3) { // Water
            npcs[`${fx},${fy-1}`] = {
                id: `fisher_${cx}_${cy}`,
                name: "Fisherman",
                sprite: "https://play.pokemonshowdown.com/sprites/trainers/fisherman.png",
                dialogue: ["The big one got away!", "You can fish here if you have a Rod."],
                challenge: {
                    type: 'collect',
                    target: 'Magikarp',
                    reward: { id: 130, name: 'Gyarados', level: 20, stats: {} as any, baseStats: {} as any, types: ['water', 'flying'], moves: [], sprites: { front_default: '' }, currentHp: 100, maxHp: 100, ivs: {} as any, evs: {} as any, nature: { name: 'Hardy' }, ability: { name: 'Intimidate' }, xp: 0, maxXp: 1000 } as any
                }
            };
        }
    } else if (poiRoll < 0.20 && dist > 5) {
        // Cave Entrance
        const cx_ = rng.nextInt(5, 15);
        const cy_ = rng.nextInt(5, 15);
        if (layout[cy_] && layout[cy_][cx_] === bgTile) {
            layout[cy_][cx_] = 7; // Cave floor
            layout[cy_-1][cx_] = 24; // Rock wall
            portals[`${cx_},${cy_}`] = `cave_${cx}_${cy},10,18`;
            interactables[`${cx_},${cy_}`] = { type: 'object', text: ["A dark cave entrance...", "It smells of damp earth."] };
        }
    } else if (poiRoll < 0.25 && dist > 20) {
        // Ancient Library
        const lx = rng.nextInt(3, 12);
        const ly = rng.nextInt(3, 12);
        for(let y=ly; y<ly+3; y++) {
            for(let x=lx; x<lx+4; x++) {
                if (y < CHUNK_SIZE && x < CHUNK_SIZE) {
                    layout[y][x] = 20; // Stone floor
                    if (y === ly) layout[y][x] = 40; // Blue roof
                }
            }
        }
        npcs[`${lx+2},${ly+2}`] = {
            id: `scholar_${cx}_${cy}`,
            name: "Scholar",
            sprite: TRAINER_SPRITES.prof,
            dialogue: ["Legend says the Elite Four reside beyond the 150th horizon.", "Only those with 8 badges may challenge the Champion."],
            challenge: {
                type: 'explore',
                target: 'Ancient Knowledge',
                rewardPokemonId: 144, // Articuno hint
                rewardLevel: 50
            }
        };
    } else if (poiRoll < 0.28 && dist > 10) {
        // Hidden Grotto (previously dead code: its range overlapped Ancient
        // Library's 0.20-0.25 slice and could never fire. Now 0.25-0.28.)
        const gx = rng.nextInt(3, 15);
        const gy = rng.nextInt(3, 15);
        layout[gy][gx] = 7; // Dark ground
        layout[gy][gx+1] = 7;
        layout[gy+1][gx] = 7;
        layout[gy+1][gx+1] = 7;
        interactables[`${gx},${gy}`] = { type: 'object', text: ["A mysterious grotto...", "Rare Pokemon seem to gather here."] };
        // High chance of rare spawn in this chunk
    } else if (poiRoll < 0.30 && dist > 5) {
        // Co-op Gate
        const gx = rng.nextInt(5, 15);
        const gy = rng.nextInt(5, 15);
        layout[gy][gx] = 68; // Rift portal (as switch)
        layout[gy][gx+2] = 68; // Second switch
        layout[gy-1][gx+1] = 21; // Gate (Pillar)
        
        npcs[`${gx},${gy}`] = {
            id: `switch_a_${cx}_${cy}`,
            name: "Switch A",
            sprite: "https://play.pokemonshowdown.com/sprites/trainers/scientist.png", // Visual indicator
            dialogue: ["This switch is active.", "The other one needs to be pressed too!"],
            facing: 'down'
        };
        npcs[`${gx+2},${gy}`] = {
            id: `switch_b_${cx}_${cy}`,
            name: "Switch B",
            sprite: "https://play.pokemonshowdown.com/sprites/trainers/scientist.png",
            dialogue: ["This switch is active.", "The other one needs to be pressed too!"],
            facing: 'down'
        };

        interactables[`${gx},${gy}`] = { type: 'object', text: ["A heavy switch. It needs another person to press the other one."] };
        interactables[`${gx+2},${gy}`] = { type: 'object', text: ["A heavy switch. It needs another person to press the other one."] };
    } else if (poiRoll < 0.45 && dist > 1) {
        // Small Outpost / Gym
        const hx = rng.nextInt(3, 13);
        const hy = rng.nextInt(3, 13);
        const houseType = rng.next();
        if (layout[hy] && layout[hy+1] && hx+2 < CHUNK_SIZE) {
            // Small helper: decorate the tile adjacent to a placed building
            // with a given prop id, but only if that cell is currently plain
            // background terrain (so we never stomp paths/water/etc).
            const decorate = (x: number, y: number, propId: number): void => {
                if (y >= 0 && y < CHUNK_SIZE && x >= 0 && x < CHUNK_SIZE && layout[y] && layout[y][x] === bgTile) {
                    layout[y][x] = propId;
                }
            };
            // Door tile is at (hx+1, hy+1); entry portal key is
            // `"${hx+1},${hy+1}"`. We also use the door coords as the
            // interior seed so each instance is stable *and* unique --
            // re-entering the same Center keeps the same NPCs / rug / flavor
            // rather than regenerating every time.
            const doorX = hx + 1, doorY = hy + 1;
            // Players exit the door mat one tile south of the door so they
            // don't get bounced right back onto the portal. We clamp in
            // case the door sat near the chunk edge.
            const exitY = Math.min(CHUNK_SIZE - 1, doorY + 1);
            if (houseType < 0.25) {
                // POKEMON CENTER -- 25% of POI buildings. Rarer than before
                // so finding one feels worthwhile after a long trek.
                layout[hy][hx] = 30; layout[hy][hx+1] = 31; layout[hy][hx+2] = 32;
                layout[hy+1][hx] = 33; layout[hy+1][hx+1] = 50; layout[hy+1][hx+2] = 35;
                portals[`${doorX},${doorY}`] = interiorPortal('center', cx, cy, doorX, doorY);
                decorate(hx - 1, hy + 1, 97);
                decorate(hx + 3, hy + 1, 97);
                decorate(hx + 3, hy + 2, 99);
            } else if (houseType < 0.45) {
                // POKE MART -- 20% of POI buildings.
                layout[hy][hx] = 40; layout[hy][hx+1] = 41; layout[hy][hx+2] = 42;
                layout[hy+1][hx] = 43; layout[hy+1][hx+1] = 50; layout[hy+1][hx+2] = 45;
                portals[`${doorX},${doorY}`] = interiorPortal('mart', cx, cy, doorX, doorY);
                decorate(hx - 1, hy + 2, 98);
                decorate(hx + 3, hy + 1, 97);
            } else if (houseType < 0.85) {
                // RANDOM HOUSE -- 40% of POI buildings. The interior is
                // seeded by the door coords so each house has consistent
                // identity (trader / tutor / gift-giver / quest / trainer
                // / lore NPC). This is the new variety layer that replaces
                // the boring "clone of my bedroom" interior.
                layout[hy][hx] = 80; layout[hy][hx+1] = 81; layout[hy][hx+2] = 82;
                layout[hy+1][hx] = 83; layout[hy+1][hx+1] = 50; layout[hy+1][hx+2] = 85;
                portals[`${doorX},${doorY}`] = interiorPortal('house', cx, cy, doorX, doorY);
                // Small decoration so different houses look visually
                // distinct on the overworld too. Pick a prop from the
                // door coords so it's deterministic.
                const decorProp = [97, 98, 99][(doorX + doorY) % 3];
                decorate(hx - 1, hy + 2, decorProp);
            } else if (dist > 10) {
                // Veteran Trainer Outpost (replaces the legacy RNG gym slot).
                // We used to spawn a random extra gym here, but those diluted
                // the "one unique gym per badge" feeling of the 8 curated
                // GYM_LOCATIONS above -- a player could stumble on a second
                // badge-3 gym and rematch it for infinite money, or walk past
                // three gyms in one chunk, which made the world feel random
                // instead of curated.
                //
                // Instead we place a tough veteran trainer in the same
                // structure. They gate no progression but give a hefty XP /
                // money reward and scale with the chunk's distance.
                layout[hy][hx] = 80; layout[hy][hx+1] = 81; layout[hy][hx+2] = 82;
                layout[hy+1][hx] = 83; layout[hy+1][hx+1] = 50; layout[hy+1][hx+2] = 85;
                const vetLevel = Math.min(80, levelBase + 6);
                const vetTeam = [
                    rng.nextInt(1, 151), rng.nextInt(1, 151),
                    rng.nextInt(1, 151), rng.nextInt(1, 151),
                ];
                trainers[`${hx+1},${hy+2}`] = {
                    id: `veteran_${cx}_${cy}`,
                    name: "Veteran Trainer",
                    sprite: TRAINER_SPRITES.veteran,
                    team: vetTeam,
                    level: vetLevel,
                    reward: 800 + Math.floor(dist * 20),
                    dialogue: "I've trained for decades. Think you can match me?",
                    winDialogue: "Heh. Kids these days are tougher than I thought.",
                };
                decorate(hx - 1, hy + 1, 97); // lamppost
            } else {
                // Near spawn, downgrade this slot to a normal house so we
                // don't leak high-pressure veteran encounters too early.
                layout[hy][hx] = 80; layout[hy][hx+1] = 81; layout[hy][hx+2] = 82;
                layout[hy+1][hx] = 83; layout[hy+1][hx+1] = 50; layout[hy+1][hx+2] = 85;
                portals[`${doorX},${doorY}`] = interiorPortal('house', cx, cy, doorX, doorY);
                const decorProp = [97, 98, 99][(doorX + doorY + 1) % 3];
                decorate(hx - 1, hy + 2, decorProp);
            }
        }
    } else if (poiRoll < 0.55 && dist > 150) {
        // Elite Four Entrance (Way more expensive now)
        const ex = rng.nextInt(3, 10);
        const ey = rng.nextInt(3, 10);
        
        // Large building
        for (let dy = 0; dy < 3; dy++) {
            for (let dx = 0; dx < 5; dx++) {
                if (ey+dy < CHUNK_SIZE && ex+dx < CHUNK_SIZE) {
                    if (dy === 0) layout[ey+dy][ex+dx] = 80 + (dx % 3); // Orange roof
                    else if (dy === 2 && dx === 2) layout[ey+dy][ex+dx] = 50; // Entrance
                    else layout[ey+dy][ex+dx] = 43; // Wall
                }
            }
        }
        
        const leaderId = `e4_${cx}_${cy}`;
        const e4Type = rng.nextInt(0, 3);
        let team = [149, 130, 131, 143, 65, 94]; // Default
        let name = "Elite Member";
        
        if (e4Type === 0) { // Rain Team
            team = [186, 230, 272, 130, 131, 9]; // Politoed, Kingdra, Ludicolo, Gyarados, Lapras, Blastoise
            name = "Elite Rain Master";
        } else if (e4Type === 1) { // Sun Team
            team = [324, 3, 6, 38, 45, 103]; // Torkoal, Venusaur, Charizard, Ninetales, Vileplume, Exeggutor
            name = "Elite Sun Master";
        } else if (e4Type === 2) { // Trick Room
            team = [356, 476, 534, 324, 464, 466]; // Dusclops, Porygon-Z, Conkeldurr, Torkoal, Rhyperior, Electivire
            name = "Elite Trickster";
        } else if (e4Type === 3) { // Tailwind / Speed
            team = [547, 630, 445, 149, 373, 130]; // Whimsicott, Mandibuzz, Garchomp, Dragonite, Salamence, Gyarados
            name = "Elite Speedster";
        }

        trainers[`${ex+2},${ey+3}`] = {
            id: leaderId,
            name: name,
            sprite: "https://play.pokemonshowdown.com/sprites/trainers/grimsley.png",
            level: 75 + Math.floor(dist / 2),
            team: team,
            isGymLeader: false, // Elite encounter, not a progression gym badge.
            badgeId: 99,
            reward: 10000,
            dialogue: "You've come far, but your journey ends here!",
            winDialogue: "Unbelievable... You are the new Champion!"
        };
    } else if (poiRoll < 0.60 && dist > 100) {
        // World Boss (Legendary)
        const bx = rng.nextInt(5, 15);
        const by = rng.nextInt(5, 15);
        layout[by][bx] = 19; // Danger floor
        const bossId = rng.next() > 0.5 ? 150 : 249; // Mewtwo or Lugia
        trainers[`${bx},${by}`] = {
            id: `world_boss_${cx}_${cy}`,
            name: "Ancient Guardian",
            sprite: TRAINER_SPRITES.veteran,
            team: [bossId],
            level: 80 + Math.floor(dist / 2),
            reward: 20000,
            dialogue: "A powerful presence looms...",
            winDialogue: "The guardian has been quelled."
        };
    } else if (poiRoll < 0.70 && dist > 2) {
        // Challenge NPC (Speed/Stealth)
        const side = rng.next() > 0.5 ? 1 : -1;
        const cy_ = rng.nextInt(5, 15);
        const cx_ = pathX + (side * 4);
        if (layout[cy_] && cx_ >= 0 && cx_ < CHUNK_SIZE) {
            const challengeType = rng.next();
            if (challengeType < 0.5) {
                npcs[`${cx_},${cy_}`] = {
                    id: `speed_${cx}_${cy}`,
                    name: "Runner",
                    sprite: TRAINER_SPRITES.youngster,
                    dialogue: ["I bet you can't reach the other side of this region in 15 seconds!", "Want to try?"],
                    challenge: {
                        type: 'speed',
                        target: 'reach_edge',
                        timeLimit: 15,
                        rewardPokemonId: 25, // Pikachu
                        rewardLevel: levelBase
                    }
                };
            } else {
                npcs[`${cx_},${cy_}`] = {
                    id: `stealth_${cx}_${cy}`,
                    name: "Ninja",
                    sprite: TRAINER_SPRITES.grunt,
                    dialogue: ["Shhh... Can you reach that treasure without being seen by my guards?", "It's a true test of stealth."],
                    challenge: {
                        type: 'stealth',
                        target: 'reach_treasure',
                        rewardPokemonId: 94, // Gengar
                        rewardLevel: levelBase + 5
                    }
                };
                // Add "Guards"
                for(let j=0; j<3; j++) {
                    const gx = rng.nextInt(2, 18);
                    const gy = rng.nextInt(2, 18);
                    if (layout[gy] && layout[gy][gx] === bgTile) {
                        npcs[`${gx},${gy}`] = {
                            id: `guard_${cx}_${cy}_${j}`,
                            name: "Guard",
                            sprite: TRAINER_SPRITES.grunt,
                            dialogue: ["Intruder!", "I see you!"],
                            facing: ['up', 'down', 'left', 'right'][rng.nextInt(0, 3)] as any
                        };
                    }
                }
            }
        }
    }

    // 5. Jittered Grid for Scenery (Better distribution)
    const gridSize = 2; // Smaller grid = higher density
    for(let gy=0; gy<CHUNK_SIZE; gy+=gridSize) {
        for(let gx=0; gx<CHUNK_SIZE; gx+=gridSize) {
            const rx = gx + rng.nextInt(0, gridSize-1);
            const ry = gy + rng.nextInt(0, gridSize-1);
            if (ry >= 0 && ry < CHUNK_SIZE && rx >= 0 && rx < CHUNK_SIZE && layout[ry] && (layout[ry][rx] === bgTile || layout[ry][rx] === patchTile)) {
                const roll = rng.next();
                // Biome specific scenery
                if (biome === 'forest' || biome === 'town') {
                    if (roll < 0.2) layout[ry][rx] = 1; // Tree
                    else if (roll < 0.35) layout[ry][rx] = 58; // Bush
                    else if (roll < 0.4) layout[ry][rx] = 59; // Log
                    else if (roll < 0.5) layout[ry][rx] = 13; // Flowers
                    else if (roll < 0.55) layout[ry][rx] = 75; // Red Flowers
                    else if (roll < 0.6) layout[ry][rx] = 76; // Blue Flowers
                    else if (roll < 0.65) layout[ry][rx] = 77; // Yellow Flowers
                    else if (roll < 0.67) layout[ry][rx] = 78; // Mushroom
                    else if (roll < 0.7) layout[ry][rx] = 95; // Broken Pillar
                } else if (biome === 'desert') {
                    if (roll < 0.2) layout[ry][rx] = 24; // Rock
                    else if (roll < 0.4) layout[ry][rx] = 57; // Small Rock
                    else if (roll < 0.55) layout[ry][rx] = 79; // Cactus
                    else if (roll < 0.65) layout[ry][rx] = 92; // Cracked Earth
                    else if (roll < 0.7) layout[ry][rx] = 95; // Broken Pillar
                } else if (biome === 'snow') {
                    if (roll < 0.2) layout[ry][rx] = 23; // Dark Tree
                    else if (roll < 0.4) layout[ry][rx] = 86; // Snow Pile
                    else if (roll < 0.5) layout[ry][rx] = 87; // Ice Crystal
                    else if (roll < 0.6) layout[ry][rx] = 96; // Intact Pillar
                } else if (biome === 'canyon') {
                    if (roll < 0.3) layout[ry][rx] = 24; // Rock
                    else if (roll < 0.5) layout[ry][rx] = 92; // Cracked Earth
                    else if (roll < 0.6) layout[ry][rx] = 57; // Small Rock
                    else if (roll < 0.7) layout[ry][rx] = 95; // Broken Pillar
                } else if (biome === 'lake') {
                    if (roll < 0.2) layout[ry][rx] = 1; // Tree
                    else if (roll < 0.4) layout[ry][rx] = 13; // Flowers
                    else if (roll < 0.5) layout[ry][rx] = 95; // Broken Pillar
                } else if (biome === 'rift') {
                    if (roll < 0.2) layout[ry][rx] = 94; // Large Crystal
                    else if (roll < 0.5) layout[ry][rx] = 93; // Small Crystal
                    else if (roll < 0.6) layout[ry][rx] = 96; // Intact Pillar
                    else if (roll < 0.7) layout[ry][rx] = 95; // Broken Pillar
                }
            } else if (ry >= 0 && ry < CHUNK_SIZE && rx >= 0 && rx < CHUNK_SIZE && layout[ry] && layout[ry][rx] === 3) {
                // Water decorations
                const roll = rng.next();
                if (roll < 0.1) layout[ry][rx] = 88; // Water Lily
                else if (roll < 0.2) layout[ry][rx] = 90; // Seaweed
            } else if (ry >= 0 && ry < CHUNK_SIZE && rx >= 0 && rx < CHUNK_SIZE && layout[ry] && layout[ry][rx] === 25 && biome === 'lake') {
                // Sand/Beach decorations
                const roll = rng.next();
                if (roll < 0.15) layout[ry][rx] = 91; // Shells
                else if (roll < 0.3) layout[ry][rx] = 89; // Reeds
            }
        }
    }

    // 6. Height variation (Ledges)
    if (rng.next() < 0.4) {
        const ly = rng.nextInt(5, 15);
        for(let x=2; x<CHUNK_SIZE-2; x++) {
            if (layout[ly][x] === bgTile && layout[ly][x] !== 4 && layout[ly][x] !== 29) {
                layout[ly][x] = 14; // Ledge
            }
        }
    }

    // 6. Bosses & Trainers
    
    // 7. Special Events (Shrines/Springs/Rifts)
    if (rng.next() < 0.15 && dist > 3) {
        const ex = rng.nextInt(4, 15);
        const ey = rng.nextInt(4, 15);
        if (layout[ey] && layout[ey][ex] === bgTile) {
            const eventType = rng.next();
            if (eventType < 0.3) {
                layout[ey][ex] = 65; // Weather Shrine
                interactables[`${ex},${ey}`] = { type: 'object', text: ["The shrine hums with atmospheric energy.", "It seems to influence the weather."] };
            } else if (eventType < 0.6) {
                layout[ey][ex] = 66; // Healing Spring
                interactables[`${ex},${ey}`] = { type: 'object', text: ["The water looks incredibly refreshing.", "Your team feels rejuvenated!"] };
            } else if (eventType < 0.9) {
                layout[ey][ex] = 67; // Power Shrine
                interactables[`${ex},${ey}`] = { type: 'object', text: ["You feel a surge of power from the stone.", "A rare item was hidden here!"] };
            } else if (eventType < 0.95) {
                layout[ey][ex] = 68; // Rift Portal
                interactables[`${ex},${ey}`] = { type: 'object', text: ["A tear in reality...", "It leads somewhere dangerous."] };
                portals[`${ex},${ey}`] = "rift,10,10";
            } else {
                layout[ey][ex] = 53; // Signpost leading to puzzle
                const pTypes: ('ice' | 'boulder' | 'memory')[] = ['ice', 'boulder', 'memory'];
                const pType = pTypes[rng.nextInt(0, pTypes.length - 1)];
                interactables[`${ex},${ey}`] = { type: 'object', text: ["This sign points to a hidden trial.", "Enter the clearing to begin."] };
                layout[ey+1][ex] = 9; // Portal tile
                portals[`${ex},${ey+1}`] = `puzzle_${pType}_${seed},10,17`;
            }
        }
    }

    // --- Secondary POI pass ---------------------------------------------------
    // The original generator used an if/else-if ladder, so each chunk could
    // only ever hold ONE point of interest (and ~45% held nothing at all).
    // This secondary pass rolls minor POIs *independently*, so exploration is
    // denser and co-exists with whatever major POI was just placed.
    const hasMajorPOI = poiRoll < 0.70;
    const tryPlace = (predicate: (x: number, y: number) => boolean): { x: number; y: number } | null => {
        for (let attempt = 0; attempt < 6; attempt++) {
            const x = rng.nextInt(2, CHUNK_SIZE - 3);
            const y = rng.nextInt(2, CHUNK_SIZE - 3);
            if (predicate(x, y)) return { x, y };
        }
        return null;
    };
    const isOpen = (x: number, y: number) =>
        layout[y] && (layout[y][x] === bgTile || layout[y][x] === patchTile) &&
        !interactables[`${x},${y}`] && !npcs[`${x},${y}`] && !trainers[`${x},${y}`];

    // Early healing reliability: ensure at least one visible Center in the
    // first route ring so players don't have to brute-force random houses.
    const hasCenterPortal = Object.values(portals).some(p => typeof p === 'string' && p.startsWith('interior:center:'));
    if (dist >= 1 && dist <= 2 && !hasCenterPortal) {
        const spot = tryPlace((x, y) =>
            x + 2 < CHUNK_SIZE &&
            y + 1 < CHUNK_SIZE &&
            isOpen(x, y) &&
            isOpen(x + 1, y) &&
            isOpen(x + 2, y) &&
            isOpen(x, y + 1) &&
            isOpen(x + 1, y + 1) &&
            isOpen(x + 2, y + 1)
        );
        if (spot) {
            const hx = spot.x;
            const hy = spot.y;
            layout[hy][hx] = 30; layout[hy][hx + 1] = 31; layout[hy][hx + 2] = 32;
            layout[hy + 1][hx] = 33; layout[hy + 1][hx + 1] = 50; layout[hy + 1][hx + 2] = 35;
            portals[`${hx + 1},${hy + 1}`] = interiorPortal('center', cx, cy, hx + 1, hy + 1);
            if (hy + 2 < CHUNK_SIZE && layout[hy + 2][hx + 1] === bgTile) layout[hy + 2][hx + 1] = 4;
        }
    }

    // Minor item cache (very common)
    if (dist > 1 && rng.next() < 0.45) {
        const spot = tryPlace(isOpen);
        if (spot) {
            layout[spot.y][spot.x] = 12; // Item Ball
        }
    }

    // Early support pass (first 1-2 chunks from origin):
    // ensure new runs see at least one accessible item cache quickly, with
    // a small chance for a second cache so early healing feels less punishing.
    if (dist >= 1 && dist <= 2) {
        const hasItemBall = layout.some(row => row.includes(12));
        if (!hasItemBall) {
            const guaranteedSpot = tryPlace(isOpen);
            if (guaranteedSpot) layout[guaranteedSpot.y][guaranteedSpot.x] = 12;
        } else if (rng.next() < 0.35) {
            const bonusSpot = tryPlace(isOpen);
            if (bonusSpot) layout[bonusSpot.y][bonusSpot.x] = 12;
        }
    }

    // Berry tree (farms/food source, common in non-arid biomes)
    if (rng.next() < (biome === 'desert' || biome === 'canyon' ? 0.1 : 0.3)) {
        const spot = tryPlace(isOpen);
        if (spot) {
            layout[spot.y][spot.x] = 56; // Berry Tree
        }
    }

    // Bonus signpost with flavor / hint text
    if (!hasMajorPOI && rng.next() < 0.4) {
        const spot = tryPlace(isOpen);
        if (spot) {
            const hints = [
                [`North leads deeper into the ${biome}.`, `Pokemon here average Lv ${Math.max(5, Math.floor(dist * 1.5) + 3)}.`],
                [`"The stars guide those who wander."`, `Keep exploring -- discovery rewards grow with distance.`],
                [`Capture Permit milestones every 5 chunks discovered.`, `Save them for rare encounters!`],
                [`"Beyond 10 badges lies the Rift..."`, `"Or so the elders claim."`],
            ];
            layout[spot.y][spot.x] = 53; // Signpost
            interactables[`${spot.x},${spot.y}`] = { type: 'object', text: hints[rng.nextInt(0, hints.length - 1)] };
        }
    }

    // Ambient NPC pass --------------------------------------------------------
    // These are non-trainer world actors (scouts, couriers, anglers, etc.)
    // pulled from a wider sprite/name pool than the old handful of static
    // NPCs. Most ship with a lightweight challenge hook so they "do stuff"
    // instead of only repeating flavor text.
    if (dist > 1) {
        const ambientChance = biome === 'town' ? 0.42 : 0.30;
        if (rng.next() < ambientChance) {
            const count =
                (biome === 'town' ? 1 : 0) +
                (dist > 18 ? 1 : 0) +
                (rng.next() < 0.30 ? 1 : 0);
            const npcCount = Math.max(1, Math.min(3, count || 1));
            for (let i = 0; i < npcCount; i++) {
                const spot = tryPlace(isOpen);
                if (!spot) continue;
                npcs[`${spot.x},${spot.y}`] = pickAmbientNpc(cx, cy, biome, i, levelBase);
            }
        }
    }

    // --- Landmark POI pass ----------------------------------------------------
    // Rare, lore-flavored scenes that tell a tiny environmental story without
    // overlapping the major POI. All reuse existing tile IDs so no sprite work
    // is needed. Independent probabilities, only up to ONE landmark per chunk.
    const tryCluster = (
        w: number,
        h: number,
        predicate: (x: number, y: number) => boolean = () => true
    ): { x: number; y: number } | null => {
        for (let attempt = 0; attempt < 10; attempt++) {
            const x = rng.nextInt(2, CHUNK_SIZE - w - 2);
            const y = rng.nextInt(2, CHUNK_SIZE - h - 2);
            let ok = true;
            for (let dy = 0; dy < h && ok; dy++) {
                for (let dx = 0; dx < w && ok; dx++) {
                    if (!isOpen(x + dx, y + dy) || !predicate(x + dx, y + dy)) ok = false;
                }
            }
            if (ok) return { x, y };
        }
        return null;
    };

    let landmarkPlaced = false;
    const poiTags: string[] = [];

    // Ancient Graveyard -- 4x4 of broken pillars around a central statue,
    // with an epitaph signpost. Forest / canyon, far from origin.
    if (!landmarkPlaced && dist > 12 && (biome === 'forest' || biome === 'canyon') && rng.next() < 0.08) {
        const pos = tryCluster(5, 5);
        if (pos) {
            for (let dy = 0; dy < 5; dy++) {
                for (let dx = 0; dx < 5; dx++) {
                    layout[pos.y + dy][pos.x + dx] = 20; // Stone floor
                    // Corners & midpoints host pillars / statues for a circle feel
                    const isEdge = dy === 0 || dy === 4 || dx === 0 || dx === 4;
                    const isCorner = (dy === 0 || dy === 4) && (dx === 0 || dx === 4);
                    if (isEdge && !isCorner && rng.next() < 0.5) layout[pos.y + dy][pos.x + dx] = 95; // Broken pillar
                    if (isCorner) layout[pos.y + dy][pos.x + dx] = 21; // Broken Pillar wall
                }
            }
            const cx2 = pos.x + 2, cy2 = pos.y + 2;
            layout[cy2][cx2] = 22; // Central Statue
            const epitaphTile = { x: pos.x + 2, y: pos.y + 4 };
            layout[epitaphTile.y][epitaphTile.x] = 53; // Signpost
            const epitaphs = [
                ["Here rest the fallen of the First Rift War.", "\"May their Pokemon sleep soundly.\""],
                ["In memory of the Wanderers who never returned.", "Their badges were never recovered."],
                ["The stones remember each name, though time has worn them smooth.", "Pay your respects and move on."],
            ];
            interactables[`${epitaphTile.x},${epitaphTile.y}`] = {
                type: 'object',
                text: epitaphs[rng.nextInt(0, epitaphs.length - 1)],
            };
            poiTags.push('graveyard');
            landmarkPlaced = true;
        }
    }

    // Shipwreck -- hull of stone on the beach next to water. Lake biome.
    if (!landmarkPlaced && biome === 'lake' && dist > 8 && rng.next() < 0.12) {
        const pos = tryCluster(4, 2);
        if (pos) {
            // "Hull" planks
            for (let dx = 0; dx < 4; dx++) {
                layout[pos.y][pos.x + dx] = 15; // Wood floor / bridge
                layout[pos.y + 1][pos.x + dx] = 15;
            }
            // Mast
            layout[pos.y][pos.x + 1] = 96; // Intact pillar
            // Loot
            layout[pos.y + 1][pos.x + 2] = 12; // Item ball
            // Message in a bottle as signpost
            if (isOpen(pos.x + 3, pos.y + 2)) {
                layout[pos.y + 2][pos.x + 3] = 53;
                interactables[`${pos.x + 3},${pos.y + 2}`] = {
                    type: 'object',
                    text: [
                        "A weathered journal page washed up here.",
                        `"Lat ${cx},${cy}. The storm came from nowhere. Crew scattered."`,
                        "\"If anyone finds this -- check the hold.\"",
                    ],
                };
            }
            landmarkPlaced = true;
        }
    }

    // Meteor Crater -- rift crystals on cracked earth. Canyon / desert.
    if (!landmarkPlaced && (biome === 'canyon' || biome === 'desert') && dist > 8 && rng.next() < 0.10) {
        const pos = tryCluster(5, 5);
        if (pos) {
            const centerX = pos.x + 2, centerY = pos.y + 2;
            // Crater floor
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const ring = Math.max(Math.abs(dx), Math.abs(dy));
                    const tx = centerX + dx, ty = centerY + dy;
                    if (ring === 2 && rng.next() < 0.3) layout[ty][tx] = 57; // Small rocks rim
                    else if (ring <= 1) layout[ty][tx] = 92; // Cracked earth
                }
            }
            layout[centerY][centerX] = 94; // Large rift crystal
            if (isOpen(centerX + 1, centerY)) layout[centerY][centerX + 1] = 93;
            if (isOpen(centerX - 1, centerY)) layout[centerY][centerX - 1] = 93;
            // Lore tablet
            if (isOpen(centerX, centerY + 2)) {
                layout[centerY + 2][centerX] = 53;
                interactables[`${centerX},${centerY + 2}`] = {
                    type: 'object',
                    text: [
                        "A perfect crater, perhaps a kilometer across.",
                        "The center hums with RIFT ESSENCE.",
                        "\"It fell when the sky tore open. Not a star. Something older.\"",
                    ],
                };
            }
            landmarkPlaced = true;
        }
    }

    // Crystal Grove -- intact pillars + rift crystals in a ring. Deep forest.
    if (!landmarkPlaced && biome === 'forest' && dist > 20 && rng.next() < 0.07) {
        const pos = tryCluster(5, 5);
        if (pos) {
            const centerX = pos.x + 2, centerY = pos.y + 2;
            const ringCoords = [
                [0, -2], [2, -1], [2, 1], [0, 2], [-2, 1], [-2, -1],
            ];
            for (const [dx, dy] of ringCoords) layout[centerY + dy][centerX + dx] = 96; // Intact pillar
            // Flower mandala inside
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    layout[centerY + dy][centerX + dx] = [75, 76, 77][(Math.abs(dx) + Math.abs(dy)) % 3];
                }
            }
            layout[centerY][centerX] = 94; // Large crystal
            // Guardian signpost
            if (isOpen(centerX, centerY + 3)) {
                layout[centerY + 3][centerX] = 53;
                interactables[`${centerX},${centerY + 3}`] = {
                    type: 'object',
                    text: [
                        "An old grove, thick with silent power.",
                        "The pillars hum in a pattern only a careful ear can follow.",
                        "\"Some say if you stand at the center during a meteor shower, a legendary will appear.\"",
                    ],
                };
            }
            landmarkPlaced = true;
        }
    }

    // Ancient Obelisk -- single tall pillar with cryptic lore. Anywhere deep.
    if (!landmarkPlaced && dist > 30 && rng.next() < 0.08) {
        const spot = tryPlace(isOpen);
        if (spot) {
            layout[spot.y][spot.x] = 96; // Intact pillar (the obelisk)
            // Surround with broken stones
            const around = [
                [0, -1], [1, 0], [0, 1], [-1, 0],
            ];
            for (const [dx, dy] of around) {
                const nx = spot.x + dx, ny = spot.y + dy;
                if (isOpen(nx, ny) && rng.next() < 0.5) layout[ny][nx] = 95; // Broken pillar
            }
            // Plaque
            const plaqueDy = isOpen(spot.x, spot.y + 2) ? 2 : isOpen(spot.x + 1, spot.y) ? 0 : -1;
            const plaqueDx = plaqueDy === 0 ? 1 : 0;
            const px = spot.x + plaqueDx, py = spot.y + plaqueDy;
            if (isOpen(px, py)) {
                layout[py][px] = 53;
                const obeliskLore = [
                    ["\"Before the Pokemon were named,\"", "\"the stars named them first.\""],
                    ["\"The First Trainer bonded with an Eevee,\"", "\"and the bond became a promise.\""],
                    ["Deep scratches near the base read:", "\"MEWTWO WAS HERE. MEWTWO IS STILL HERE.\""],
                    ["\"Ten badges open the gate.\"", "\"Only one heart may cross.\""],
                ];
                interactables[`${px},${py}`] = {
                    type: 'object',
                    text: obeliskLore[rng.nextInt(0, obeliskLore.length - 1)],
                };
            }
            landmarkPlaced = true;
        }
    }

    // Abandoned Camp -- tent + cold campfire + nearby loot + note.
    if (!landmarkPlaced && dist > 2 && rng.next() < 0.12) {
        const pos = tryCluster(3, 2);
        if (pos) {
            layout[pos.y][pos.x] = 52;          // Tent
            layout[pos.y][pos.x + 1] = 51;      // Campfire
            if (isOpen(pos.x + 2, pos.y)) layout[pos.y][pos.x + 2] = 12; // Item ball
            if (isOpen(pos.x + 1, pos.y + 1)) {
                layout[pos.y + 1][pos.x + 1] = 53; // Signpost (note)
                const notes = [
                    ["A hastily scrawled note:", "\"Heard howling. Left in a hurry. Come find me.\""],
                    ["A torn map scrap:", `"Dig north of the crossroads -- treasure! -- ${rng.nextInt(100,999)}"`],
                    ["The ash is cold. Days old.", "\"If you read this, the others didn't make it back.\""],
                ];
                interactables[`${pos.x + 1},${pos.y + 1}`] = {
                    type: 'object',
                    text: notes[rng.nextInt(0, notes.length - 1)],
                };
            }
            landmarkPlaced = true;
        }
    }

    // Wandering Merchant -- NPC with flavorful stock hint. Rare, anywhere.
    if (!landmarkPlaced && dist > 3 && rng.next() < 0.05) {
        const spot = tryPlace(isOpen);
        if (spot) {
            npcs[`${spot.x},${spot.y}`] = {
                id: `merchant_${cx}_${cy}`,
                name: "Wandering Merchant",
                sprite: TRAINER_SPRITES.gentleman,
                dialogue: [
                    "Travel far, trade well.",
                    "I'll be somewhere else tomorrow. Today, I'm here.",
                    "Hit a Poke Mart for supplies -- I only carry stories.",
                    `"Word from the road: ${['meteor showers boost rock types','a legendary was sighted near the Rift','a trader has a shiny Dratini, but she is picky'][rng.nextInt(0,2)]}."`,
                ],
                facing: ['up', 'down', 'left', 'right'][rng.nextInt(0, 3)] as any,
            };
            landmarkPlaced = true;
        }
    }

    // Lost Traveler -- NPC who gives a modest reward; reuses the 'battle'
    // challenge scaffold so the existing reward path works.
    if (!landmarkPlaced && dist > 5 && rng.next() < 0.07) {
        const spot = tryPlace(isOpen);
        if (spot) {
            npcs[`${spot.x},${spot.y}`] = {
                id: `lost_${cx}_${cy}`,
                name: "Lost Traveler",
                sprite: TRAINER_SPRITES.beauty,
                dialogue: [
                    "Thank goodness -- I thought I was done for.",
                    "I got turned around chasing a Zubat an hour ago.",
                    "Here, take this for finding me.",
                ],
                challenge: {
                    type: 'collect',
                    target: 'escort',
                    rewardPokemonId: 0,
                    rewardLevel: 0,
                } as any,
                facing: 'down',
            };
            // A small reward item ball to feel tangible
            if (isOpen(spot.x + 1, spot.y)) layout[spot.y][spot.x + 1] = 12;
            landmarkPlaced = true;
        }
    }

    // Scarecrow / Spooky Scene -- night atmosphere filler, low-effort but
    // distinctive. Any non-aquatic biome.
    if (!landmarkPlaced && biome !== 'lake' && rng.next() < 0.06) {
        const spot = tryPlace(isOpen);
        if (spot) {
            layout[spot.y][spot.x] = 22; // Statue as scarecrow
            // Scatter mushrooms or rocks around for vibe
            const around = [[1,0],[-1,0],[0,1],[0,-1]];
            for (const [dx, dy] of around) {
                if (rng.next() < 0.4 && isOpen(spot.x + dx, spot.y + dy)) {
                    layout[spot.y + dy][spot.x + dx] = biome === 'forest' ? 78 : 57;
                }
            }
            if (isOpen(spot.x, spot.y + 2)) {
                layout[spot.y + 2][spot.x] = 53;
                interactables[`${spot.x},${spot.y + 2}`] = {
                    type: 'object',
                    text: [
                        "A weathered scarecrow, dressed in a Rocket uniform.",
                        "\"Someone had a sense of humor out here.\"",
                    ],
                };
            }
            landmarkPlaced = true;
        }
    }

    const isBossChunk = dist > 5 && Math.floor(dist) % 10 === 0 && rng.next() < 0.4;

    if (isBossChunk) {
        const tx = 9; const ty = 4;
        layout[ty][tx] = 19;
        trainers[`${tx},${ty}`] = {
            id: `boss_${cx}_${cy}`,
            name: "Guardian",
            sprite: TRAINER_SPRITES.veteran,
            team: [rng.nextInt(1, 151), rng.nextInt(1, 151)],
            level: levelBase + 10,
            reward: levelBase * 100,
            dialogue: "Halt! None shall pass.",
            winDialogue: "Impressive."
        };
    }

    // Legacy "random trainer clutter" system retired.
    //
    // Why:
    // - It bypassed route-trainer progression rules and could roll teams like
    //   [Gastly, Haunter, Gengar] at very low levels.
    // - It forced oversized early squads (minimum 4 mons) that spiked
    //   difficulty before players had enough resources/moves.
    // - It competed with the newer archetype route-trainer placement below,
    //   causing inconsistent balancing from chunk to chunk.

    // Safety sweep: decorative props (bench/lamppost/mailbox) were placed at
    // random very early. If a trainer or NPC was later dropped on top of one,
    // OR on the tile directly below one, demote the prop tile back to plain
    // ground so the sprite isn't visually occluded. Trainer/NPC sprites are
    // rendered oversized and extend roughly one tile upward, so the tile
    // ---- ROUTE TRAINER PLACEMENT ---------------------------------------
    // Runs AFTER all POI placement so we only drop route trainers on
    // empty chunks (no gym, no ruins, no campsite, etc). Deterministic
    // on (cx,cy) via getRouteTrainers().
    //
    // Why skip when poiPlaced is true: the player should read each chunk
    // as "one point of interest, tops." Stacking a trainer onto a ruin
    // or camp makes the screen noisy and lets the trainer ambush from
    // behind a static sprite the player didn't notice.
    //
    // Skip if we're a "danger floor" tile chunk too -- those are
    // gauntlet-like already.
    // Route trainers should still appear on many chunks even when a light POI
    // (camp, sign, lore object) exists. Hard-blocking on `poiPlaced` made
    // trainers feel like they vanished after the balancing pass.
    const hasMajorStoryTrainer = Object.values(trainers).some(t =>
        t.isGymLeader || /^boss_/.test(t.id) || /^elite_/.test(t.id) || /^champion_/.test(t.id)
    );
    if (!hasMajorStoryTrainer) {
        const placements = getRouteTrainers(cx, cy, biome);
        if (placements.length > 0) {
            // Find up to `placements.length` walkable bgTile cells away
            // from edges and with no existing sprite/portal. Scan row by
            // row so the two duo trainers end up side-by-side or close.
            const openSpots: Array<{ x: number; y: number }> = [];
            outerScan:
            for (let ty = 4; ty < CHUNK_SIZE - 4; ty++) {
                for (let tx = 4; tx < CHUNK_SIZE - 4; tx++) {
                    const tile = layout[ty]?.[tx];
                    // Accept grass (tile 2), path (4), or bgTile. Reject
                    // walls / water / buildings / danger floors.
                    if (tile !== bgTile && tile !== 2 && tile !== 4 && tile !== patchTile) continue;
                    const key = `${tx},${ty}`;
                    if (trainers[key] || npcs[key] || interactables[key] || portals[key]) continue;
                    openSpots.push({ x: tx, y: ty });
                    if (openSpots.length >= placements.length + 2) break outerScan;
                }
            }

            // Prefer spots near the central crossroads so trainers feel
            // like they're blocking the path rather than hiding in the
            // corners. Sort by distance from chunk center.
            openSpots.sort((a, b) => {
                const da = Math.abs(a.x - 9.5) + Math.abs(a.y - 9.5);
                const db = Math.abs(b.x - 9.5) + Math.abs(b.y - 9.5);
                return da - db;
            });

            const placedIds: string[] = [];
            placements.forEach((p, idx) => {
                const spot = openSpots[idx];
                if (!spot) return;
                const key = `${spot.x},${spot.y}`;
                const tierIdx = p.tierIndex;
                const tierTag: 'rookie' | 'veteran' | 'ace' =
                    tierIdx === 2 ? 'ace' : tierIdx === 1 ? 'veteran' : 'rookie';
                const titlePrefix = tierTag === 'ace' ? 'Ace '
                    : tierTag === 'veteran' ? 'Senior ' : '';
                const displayName = `${titlePrefix}${p.archetype.key[0].toUpperCase()}${p.archetype.key.slice(1)} ${p.name}`;
                const greetingIdx = Math.floor(hash4(cx, cy, 11111 + idx, 0) * p.archetype.greeting.length);
                const lossIdx = Math.floor(hash4(cx, cy, 22222 + idx, 0) * p.archetype.loss.length);
                // Reward: money matches existing trainer economy, scaled
                // by tier (1x / 1.6x / 2.5x) and distance.
                const tierMoneyMult = tierIdx === 2 ? 2.5 : tierIdx === 1 ? 1.6 : 1.0;
                const reward = Math.floor((400 + dist * 12) * tierMoneyMult);
                const trainerId = `route_${cx}_${cy}_${idx}`;
                placedIds.push(trainerId);
                trainers[key] = {
                    id: trainerId,
                    name: displayName,
                    sprite: TRAINER_SPRITES[p.archetype.spriteKey],
                    team: p.teamSpecies,
                    level: p.level,
                    reward,
                    dialogue: p.archetype.greeting[greetingIdx],
                    winDialogue: p.archetype.loss[lossIdx],
                    archetype: p.archetype.key,
                    tier: tierTag,
                };
                // Stamp the tile so the sprite renders on a walkable
                // surface (tile 4 = path) -- this ensures the visible
                // "trainer on a road" read. If the tile under them is
                // bgTile or grass, replace it with path so it looks
                // intentional. We preserve water tiles (swimmers,
                // fishermen) by leaving tile 3 untouched.
                if (layout[spot.y][spot.x] !== 3 && layout[spot.y][spot.x] !== 25) {
                    layout[spot.y][spot.x] = 4;
                }
            });

            // Gauntlet wiring: if we placed a duo, link the first to the
            // second so App.tsx auto-chains the second battle after the
            // first victory (no heal between). The player sees two
            // sprites and knows they're committing to both if they
            // step on the first one.
            if (placedIds.length >= 2) {
                const firstKey = Object.keys(trainers).find(k => trainers[k].id === placedIds[0]);
                if (firstKey) {
                    trainers[firstKey].gauntletNextTrainerId = placedIds[1];
                    // Also mark both dialogue strings so the player
                    // knows what they're getting into.
                    trainers[firstKey].dialogue = `[Gauntlet] ${trainers[firstKey].dialogue} My partner's waiting -- beat us both!`;
                }
            }
        }
    }

    // ---- P0 VALIDATION / REPAIR LAYER ---------------------------------------
    // Goals:
    //  1) Near-spawn chunks should not be empty of trainers.
    //  2) NPC challenge payloads must be structurally valid before App.tsx
    //     interaction code touches them.
    //  3) Keep generation deterministic: all fallback choices derive from hash4.
    const validationWarn = (msg: string) => {
        // Keep logs concise and grep-friendly when debugging map generation.
        console.warn(`[ChunkValidation ${cx},${cy}] ${msg}`);
    };

    // 1) NPC challenge schema sanitation.
    const trialTypes = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
    Object.entries(npcs).forEach(([key, npc], idx) => {
        if (!npc.challenge) return;
        const ch = npc.challenge as any;
        const defaultRewardId = Math.max(1, Math.min(1025, 1 + Math.floor(hash4(cx, cy, 31000 + idx, 0) * 1025)));
        const defaultRewardLevel = Math.max(5, Math.min(100, levelBase + 2));

        // Shared defaults.
        if (typeof ch.target !== 'string' || ch.target.trim().length === 0) {
            ch.target = 'challenge';
            validationWarn(`NPC "${npc.id}" had missing challenge.target at ${key}; defaulted.`);
        }
        if (!Number.isFinite(ch.rewardLevel)) ch.rewardLevel = defaultRewardLevel;

        if (ch.type === 'battle' || ch.type === 'collect' || ch.type === 'explore' || ch.type === 'type_trial') {
            if (!Number.isFinite(ch.rewardPokemonId) || ch.rewardPokemonId < 1 || ch.rewardPokemonId > 1025) {
                ch.rewardPokemonId = defaultRewardId;
                validationWarn(`NPC "${npc.id}" had invalid rewardPokemonId at ${key}; defaulted to ${defaultRewardId}.`);
            }
        }
        if (ch.type === 'type_trial') {
            if (typeof ch.requiredType !== 'string' || !trialTypes.includes(ch.requiredType)) {
                ch.requiredType = trialTypes[Math.floor(hash4(cx, cy, 31020 + idx, 0) * trialTypes.length)];
                validationWarn(`NPC "${npc.id}" had invalid type_trial.requiredType at ${key}; defaulted to ${ch.requiredType}.`);
            }
        }
        if (ch.type === 'speed') {
            if (!Number.isFinite(ch.timeLimit) || ch.timeLimit <= 0) {
                ch.timeLimit = 15;
                validationWarn(`NPC "${npc.id}" had invalid speed.timeLimit at ${key}; defaulted to 15s.`);
            }
        }
    });

    // 2) Early-ring trainer density assertion + deterministic fallback.
    const earlyBand = dist >= 1 && dist <= 8;
    if (earlyBand && Object.keys(trainers).length === 0) {
        const archetypes = ROUTE_ARCHETYPES[biome] ?? EMPTY_ARCHETYPES;
        if (archetypes.length > 0) {
            const openSpots: Array<{ x: number; y: number }> = [];
            for (let ty = 3; ty < CHUNK_SIZE - 3; ty++) {
                for (let tx = 3; tx < CHUNK_SIZE - 3; tx++) {
                    const tile = layout[ty]?.[tx];
                    if (tile !== bgTile && tile !== 2 && tile !== 4 && tile !== patchTile) continue;
                    const key = `${tx},${ty}`;
                    if (trainers[key] || npcs[key] || interactables[key] || portals[key]) continue;
                    openSpots.push({ x: tx, y: ty });
                }
            }
            openSpots.sort((a, b) => {
                const da = Math.abs(a.x - 9.5) + Math.abs(a.y - 9.5);
                const db = Math.abs(b.x - 9.5) + Math.abs(b.y - 9.5);
                return da - db;
            });

            const spot = openSpots[0];
            if (spot) {
                const arch = archetypes[Math.floor(hash4(cx, cy, 31100, 0) * archetypes.length)];
                const name = arch.namePool[Math.floor(hash4(cx, cy, 31101, 0) * arch.namePool.length)];
                const greetingIdx = Math.floor(hash4(cx, cy, 31102, 0) * arch.greeting.length);
                const lossIdx = Math.floor(hash4(cx, cy, 31103, 0) * arch.loss.length);
                const level = Math.max(3, Math.min(100, Math.floor(dist * 0.85) + 3));
                const fallbackPool = buildRouteTrainerSpeciesPool(biome, arch.signaturePool, dist);
                const firstIdx = Math.floor(hash4(cx, cy, 31104, 0) * fallbackPool.length);
                let secondIdx = Math.floor(hash4(cx, cy, 31105, 0) * fallbackPool.length);
                if (fallbackPool.length > 1 && secondIdx === firstIdx) {
                    secondIdx = (secondIdx + 1) % fallbackPool.length;
                }
                const team = [
                    fallbackPool[firstIdx],
                    fallbackPool[secondIdx],
                ];
                const trainerId = `route_fallback_${cx}_${cy}`;
                trainers[`${spot.x},${spot.y}`] = {
                    id: trainerId,
                    name: `${arch.key[0].toUpperCase()}${arch.key.slice(1)} ${name}`,
                    sprite: TRAINER_SPRITES[arch.spriteKey],
                    team,
                    level,
                    reward: Math.floor(350 + dist * 10),
                    dialogue: arch.greeting[greetingIdx],
                    winDialogue: arch.loss[lossIdx],
                    archetype: arch.key,
                    tier: 'rookie',
                };
                if (layout[spot.y][spot.x] !== 3 && layout[spot.y][spot.x] !== 25) layout[spot.y][spot.x] = 4;
                validationWarn(`Injected deterministic fallback trainer (${trainerId}) to satisfy early-band density.`);
            } else {
                validationWarn('Early-band chunk had no valid open tile for fallback trainer injection.');
            }
        } else {
            validationWarn(`No route archetypes for biome "${biome}" while validating early-band trainer density.`);
        }
    }

    // 3) Duplicate trainer-id repair (deterministic suffixing).
    const trainerIdOwners = new Map<string, string[]>();
    Object.entries(trainers).forEach(([k, t]) => {
        const arr = trainerIdOwners.get(t.id) ?? [];
        arr.push(k);
        trainerIdOwners.set(t.id, arr);
    });
    trainerIdOwners.forEach((keys, id) => {
        if (keys.length <= 1) return;
        // Keep first key untouched, suffix the rest.
        keys.slice(1).forEach((key, i) => {
            const nextId = `${id}_v${i + 2}`;
            trainers[key].id = nextId;
            validationWarn(`Duplicate trainer id "${id}" detected; rewrote ${key} -> "${nextId}".`);
        });
    });

    // 4) Minimum NPC density bands by distance.
    // Conservative targets so we improve consistency without overcrowding:
    //   dist 1..6  : at least 1 NPC
    //   dist > 25  : at least 2 NPCs
    let minNpcCount = 0;
    if (dist >= 1 && dist <= 6) minNpcCount = 1;
    else if (dist > 25) minNpcCount = 2;
    const npcDeficit = minNpcCount - Object.keys(npcs).length;
    if (npcDeficit > 0) {
        const openSpots: Array<{ x: number; y: number }> = [];
        for (let ty = 3; ty < CHUNK_SIZE - 3; ty++) {
            for (let tx = 3; tx < CHUNK_SIZE - 3; tx++) {
                const tile = layout[ty]?.[tx];
                if (tile !== bgTile && tile !== 2 && tile !== 4 && tile !== patchTile) continue;
                const key = `${tx},${ty}`;
                if (trainers[key] || npcs[key] || interactables[key] || portals[key]) continue;
                openSpots.push({ x: tx, y: ty });
            }
        }
        openSpots.sort((a, b) => {
            const da = Math.abs(a.x - 9.5) + Math.abs(a.y - 9.5);
            const db = Math.abs(b.x - 9.5) + Math.abs(b.y - 9.5);
            return da - db;
        });

        for (let i = 0; i < npcDeficit; i++) {
            const spot = openSpots[i];
            if (!spot) break;
            const npc = pickAmbientNpc(cx, cy, biome, 90 + i, levelBase);
            npcs[`${spot.x},${spot.y}`] = npc;
            validationWarn(`Injected ambient NPC "${npc.id}" to satisfy min NPC density band.`);
        }
    }

    // directly above them is also a no-prop zone.
    const propTiles = new Set([97, 98, 99]);
    const clearPropAt = (px: number, py: number) => {
        if (!Number.isFinite(px) || !Number.isFinite(py)) return;
        if (layout[py]?.[px] !== undefined && propTiles.has(layout[py][px])) {
            layout[py][px] = bgTile;
        }
    };
    const reserveAroundSprite = (key: string) => {
        const [sx, sy] = key.split(',').map(Number);
        clearPropAt(sx, sy);          // on sprite
        clearPropAt(sx, sy - 1);      // above sprite (sprite head extends up)
    };
    Object.keys(trainers).forEach(reserveAroundSprite);
    Object.keys(npcs).forEach(reserveAroundSprite);

    // Keep doorway approaches walkable. Props/foliage spawned in front of a
    // portal can soft-block Centers/Marts/houses and feel like a broken map.
    const clearEntranceApproach = (doorKey: string) => {
        const [dx, dy] = doorKey.split(',').map(Number);
        if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
        const approachYs = [dy + 1, dy + 2, dy + 3];
        for (const ay of approachYs) {
            if (ay < 0 || ay >= CHUNK_SIZE) continue;
            const tile = layout[ay]?.[dx];
            if (tile === undefined) continue;
            const isBlockedFoliage =
                tile === 11 || // tree
                tile === 23 || tile === 24 || // cliff edge
                tile === 53 || tile === 54 || tile === 55 || tile === 56 || tile === 57 || tile === 58 || tile === 59 || tile === 60 || tile === 61 || tile === 62 || tile === 63 || tile === 64 || // rocks/crystals
                propTiles.has(tile);
            if (isBlockedFoliage) {
                layout[ay][dx] = 4;
            }
        }
    };
    Object.keys(portals).forEach(clearEntranceApproach);

    // Town biome identity pass: guarantee visible buildings so "town" chunks
    // don't read like empty fields with a label.
    if (biome === 'town' && dist >= 1) {
        const hasTownPortal = Object.keys(portals).length > 0;
        if (!hasTownPortal) {
            const placeTownBuilding = (seedOffset: number, kind: 'house' | 'mart') => {
                const candidates: Array<{ x: number; y: number }> = [];
                for (let ty = 3; ty < CHUNK_SIZE - 4; ty++) {
                    for (let tx = 3; tx < CHUNK_SIZE - 4; tx++) {
                        const doorKey = `${tx + 1},${ty + 1}`;
                        const a = layout[ty]?.[tx];
                        const b = layout[ty]?.[tx + 1];
                        const c = layout[ty]?.[tx + 2];
                        const d = layout[ty + 1]?.[tx];
                        const e = layout[ty + 1]?.[tx + 1];
                        const f = layout[ty + 1]?.[tx + 2];
                        if ([a, b, c, d, e, f].some((tile) => tile !== bgTile && tile !== 2 && tile !== 4 && tile !== patchTile)) continue;
                        if (trainers[doorKey] || npcs[doorKey] || interactables[doorKey] || portals[doorKey]) continue;
                        candidates.push({ x: tx, y: ty });
                    }
                }
                if (candidates.length === 0) return false;
                const pick = candidates[Math.floor(hash4(cx, cy, 32000 + seedOffset, 0) * candidates.length)];
                const roof = kind === 'mart' ? 40 : 80;
                const wall = kind === 'mart' ? 43 : 83;
                const side = kind === 'mart' ? 45 : 85;
                layout[pick.y][pick.x] = roof;
                layout[pick.y][pick.x + 1] = roof + 1;
                layout[pick.y][pick.x + 2] = roof + 2;
                layout[pick.y + 1][pick.x] = wall;
                layout[pick.y + 1][pick.x + 1] = 50;
                layout[pick.y + 1][pick.x + 2] = side;
                portals[`${pick.x + 1},${pick.y + 1}`] = interiorPortal(kind, cx, cy, pick.x + 1, pick.y + 1);
                if (layout[pick.y + 2]?.[pick.x] !== undefined) {
                    layout[pick.y + 2][pick.x] = 4;
                    layout[pick.y + 2][pick.x + 1] = 4;
                    layout[pick.y + 2][pick.x + 2] = 4;
                }
                return true;
            };
            const builtA = placeTownBuilding(1, 'house');
            const builtB = placeTownBuilding(2, 'mart');
            if (builtA || builtB) poiTags.push('town_block');
        }
    }

    // Final doorway safety pass (runs after all optional biome adjustments):
    // guarantee a short walkable lane in front of every interior portal.
    Object.entries(portals).forEach(([key, to]) => {
        if (typeof to !== 'string' || !to.startsWith('interior:')) return;
        const [dx, dy] = key.split(',').map(Number);
        if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
        for (const ay of [dy + 1, dy + 2]) {
            if (ay < 0 || ay >= CHUNK_SIZE) continue;
            if (layout[ay]?.[dx] !== undefined) layout[ay][dx] = 4;
        }
    });

    // Clamp generated trainer levels so far-distance event formulas don't
    // exceed expected battle-level bounds.
    Object.values(trainers).forEach((t) => {
        const lvl = Number.isFinite(t.level) ? Math.floor(t.level) : 1;
        t.level = Math.max(1, Math.min(100, lvl));
    });

    return {
        x: cx, y: cy,
        id: `chunk_${cx}_${cy}`,
        name: biome.toUpperCase() + (dist > 15 ? " FRONTIER" : " REGION"),
        layout,
        portals,
        wildLevelRange: [levelBase, levelBase + 5],
        trainers,
        npcs,
        interactables,
        biome,
        poiTags: poiTags.length > 0 ? poiTags : undefined,
        chunkRole,
        routePreview,
        routeIncident,
    };
};

export const formatRouteMemory = (routeState?: RouteState): string[] => {
    const rs = normalizeRouteStateLocal(routeState);
    const memories: string[] = [];
    const push = (line: string) => {
        if (!line) return;
        if (memories.includes(line)) return;
        memories.push(line);
    };
    if (rs.routeFlags.includes('bridgeRepaired')) push('The repaired bridge has made this road safer.');
    if (rs.routeFlags.includes('angeredPoachers') || rs.routeFlags.includes('factionAlerted')) push('Poachers are watching this route.');
    if (rs.routeFlags.includes('rescuedWildPokemon')) push('A rescued Pokemon may return later.');
    if (rs.routeFlags.includes('routeSafehouseUnlocked')) push('A safe camp is available nearby.');
    if (rs.routeFlags.includes('rivalAhead') || rs.routeFlags.includes('rivalChallengeQueued') || rs.routeFlags.includes('rivalTookShortcut')) push('Your rival is somewhere ahead.');
    if (rs.routeFlags.includes('shrineActivated')) push('The shrine\'s energy is still active on this route.');
    if ((rs.factionReputation.rangers || 0) > (rs.factionReputation.poachers || 0)) push('Rangers trust your decisions here.');
    const lastOwnership = Object.values(rs.routeOwnershipByRegion).slice(-1)[0];
    if (lastOwnership === 'merchant_safe') push('Merchant traffic has stabilized this route.');
    if (lastOwnership === 'poacher_controlled' || lastOwnership === 'cursed') push('This route still feels unstable.');
    const urgentArc = rs.activeRouteArcs
        .filter((a) => !a.completed && !a.failed)
        .sort((a, b) => ((a.expiresAfterChunks || 99) - (a.stageIndex || 0)) - ((b.expiresAfterChunks || 99) - (b.stageIndex || 0)))[0];
    if (urgentArc) {
        if (urgentArc.id.includes('wounded')) push('The wounded Pokemon trail is getting colder.');
        else if (urgentArc.id.includes('poacher')) push('The poacher trail may disappear soon.');
        else if (urgentArc.id.includes('shrine')) push('The shrine energy is stronger nearby.');
        else if (urgentArc.id.includes('rival')) push('The rival\'s tracks are still fresh.');
        else push(`${urgentArc.title} still needs a resolution.`);
    }
    const majorEcho = rs.queuedEchoes
        .map((e) => e.incidentId)
        .find((id) => classifyEchoPriority(id) !== 'low');
    if (majorEcho?.includes('merchant')) push('A merchant favor may pay off soon.');
    else if (majorEcho?.includes('poacher')) push('Retaliation may be waiting ahead.');
    else if (majorEcho?.includes('rival')) push('A rival follow-up is close.');
    else if (majorEcho?.includes('shrine')) push('The shrine\'s consequence has not passed yet.');
    if (rs.activeCompanions[0]) {
        const c = rs.activeCompanions[0];
        push(`${c.name} is still traveling with you.`);
    }
    const latestChunkMem = Object.values(rs.chunkMemoryStates)
        .flat()
        .filter((m) => m && !/flag_|echo_|arc_/.test(m))
        .slice(-3);
    latestChunkMem.forEach(push);
    return memories.slice(-6);
};

export const getRouteIncidentStats = () => {
    const byFamily: Record<string, number> = {};
    ROUTE_INCIDENTS.forEach(i => { byFamily[i.family] = (byFamily[i.family] || 0) + 1; });
    return { total: ROUTE_INCIDENTS.length, byFamily };
};

export const getRouteIncidentCatalog = (): RouteIncident[] => ROUTE_INCIDENTS;
export const getRouteArcCatalog = () => ROUTE_ARC_LIBRARY;

export const MAPS = STATIC_MAPS; // Keep static maps for interiors

export const generateRiftMap = (): number[][] => {
    const width = 20; const height = 20;
    let map = Array(height).fill(0).map(() => Array(width).fill(19)); // Danger floor base
    for(let y=1; y<height-1; y++) {
        for(let x=1; x<width-1; x++) {
            const roll = Math.random();
            if (roll > 0.3) map[y][x] = 7; // Cave floor
            else if (roll > 0.1) map[y][x] = 28; // Lava
            
            if (Math.random() < 0.05) map[y][x] = 9; // Glitch portal
        }
    }
    // Safe spot at center
    map[10][10] = 50; 
    map[10][11] = 7;
    map[11][10] = 7;
    map[9][10] = 7;
    map[10][9] = 7;
    return map;
};

export const generateCaveMap = (seed: number): number[][] => {
    const rng = new SeededRandom(seed);
    const width = 20; const height = 20;
    let map = Array(height).fill(0).map(() => Array(width).fill(24)); // Rock wall base
    
    // Simple drunkard's walk for cave generation
    let x = 10, y = 18;
    for(let i=0; i<200; i++) {
        if (y >= 0 && y < height && x >= 0 && x < width) {
            map[y][x] = 7; // Cave floor
        }
        const dir = rng.nextInt(0, 3);
        if (dir === 0) y--; else if (dir === 1) y++; else if (dir === 2) x--; else x++;
        x = Math.max(1, Math.min(width-2, x));
        y = Math.max(1, Math.min(height-2, y));
    }
    
    // Exit
    map[19][10] = 50;

    // Cave decorations
    for (let i = 0; i < 40; i++) {
        const rx = rng.nextInt(1, width - 2);
        const ry = rng.nextInt(1, height - 2);
        if (map[ry][rx] === 7) {
            const roll = rng.next();
            if (roll < 0.1) map[ry][rx] = 78; // Mushroom
            else if (roll < 0.2) map[ry][rx] = 87; // Ice Crystal (Glowing)
            else if (roll < 0.3) map[ry][rx] = 57; // Small Rock
        }
    }

    return map;
};

export const generatePuzzleMap = (type: 'ice' | 'boulder' | 'memory', seed: number): Chunk => {
    const layout = Array(CHUNK_SIZE).fill(0).map(() => Array(CHUNK_SIZE).fill(1)); // Start with walls
    const rng = new SeededRandom(seed);
    const interactables: Record<string, InteractableData> = {};
    const portals: Record<string, string> = {};
    const npcs: Record<string, NPCData> = {};
    
    // Create a room
    for (let y = 2; y < CHUNK_SIZE - 2; y++) {
        for (let x = 2; x < CHUNK_SIZE - 2; x++) {
            layout[y][x] = 0; // Floor
        }
    }

    if (type === 'ice') {
        // Fill room with ice
        for (let y = 3; y < CHUNK_SIZE - 3; y++) {
            for (let x = 3; x < CHUNK_SIZE - 3; x++) {
                layout[y][x] = 70;
            }
        }
        // Add some rocks to bounce off
        for (let i = 0; i < 15; i++) {
            const rx = rng.nextInt(3, CHUNK_SIZE - 4);
            const ry = rng.nextInt(3, CHUNK_SIZE - 4);
            layout[ry][rx] = 23; // Rock
        }
        // Reward at the end
        const rewardX = Math.floor(CHUNK_SIZE / 2);
        const rewardY = 3;
        layout[rewardY][rewardX] = 74;
        interactables[`${rewardX},${rewardY}`] = { type: 'object', text: ["You solved the ice puzzle!", "Found a Choice Band!"] };
    } else if (type === 'boulder') {
        // Add boulders and holes
        for (let i = 0; i < 4; i++) {
            const bx = rng.nextInt(4, CHUNK_SIZE - 5);
            const by = rng.nextInt(4, CHUNK_SIZE - 5);
            layout[by][bx] = 71; // Boulder
            
            const hx = rng.nextInt(4, CHUNK_SIZE - 5);
            const hy = rng.nextInt(4, CHUNK_SIZE - 5);
            layout[hy][hx] = 72; // Hole
        }
        const rewardX = Math.floor(CHUNK_SIZE / 2);
        const rewardY = 3;
        layout[rewardY][rewardX] = 74;
        interactables[`${rewardX},${rewardY}`] = { type: 'object', text: ["The boulders are in place!", "Found Leftovers!"] };
    } else if (type === 'memory') {
        // Switch sequence puzzle
        const sequence = [0, 1, 2, 3].sort(() => rng.next() - 0.5);
        const switchPositions = [
            { x: 5, y: 5 },
            { x: 14, y: 5 },
            { x: 5, y: 14 },
            { x: 14, y: 14 }
        ];
        
        switchPositions.forEach((pos, idx) => {
            layout[pos.y][pos.x] = 73; // Switch
            interactables[`${pos.x},${pos.y}`] = { 
                type: 'object', 
                text: [`Switch #${idx + 1}`] 
            };
        });
        
        // Store the correct sequence in the interactable of the first switch or as a hint
        npcs[`10,10`] = { 
            id: 'puzzle_master',
            name: "Puzzle Master", 
            sprite: '1', 
            dialogue: ["To pass, you must step on the switches in the correct order.", "The sequence is hidden in the patterns of the floor..."] 
        };
        
        const rewardX = Math.floor(CHUNK_SIZE / 2);
        const rewardY = 3;
        layout[rewardY][rewardX] = 74;
        interactables[`${rewardX},${rewardY}`] = { 
            type: 'object', 
            text: ["The sequence was correct!", "Found a Focus Sash!"] 
        };
    }

    // Entrance
    const entX = Math.floor(CHUNK_SIZE / 2);
    const entY = CHUNK_SIZE - 2;
    layout[entY][entX] = 50;
    portals[`${entX},${entY}`] = "PREV_POS";

    return {
        id: `puzzle_${type}_${seed}`,
        x: 0, y: 0, // Placeholder for puzzle maps
        name: type.toUpperCase() + " PUZZLE",
        layout,
        portals,
        wildLevelRange: [1, 1],
        trainers: {},
        npcs,
        interactables,
        biome: 'forest'
    };
};
