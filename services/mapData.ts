
import { MapZone, TrainerData, NPCData, InteractableData, Chunk } from '../types';
import { getGymTeam } from '../data/gymTeams';
import { interiorPortal, gymPortal } from './interiors';

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

export const getRouteTrainers = (cx: number, cy: number, biome: string): RouteTrainerPlacement[] => {
    const dist = Math.sqrt(cx * cx + cy * cy);
    if (dist < 3) return []; // no route trainers in tutorial zone
    const archetypes = ROUTE_ARCHETYPES[biome] ?? EMPTY_ARCHETYPES;
    if (archetypes.length === 0) return [];

    const spawnRoll = hash4(cx, cy, 1111, 0);
    // ~12% spawn rate, gently scales up to ~18% in late-game distance.
    const spawnChance = 0.12 + Math.min(0.06, dist / 800);
    if (spawnRoll >= spawnChance) return [];

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
    if (dist > 10 && tierRoll > 0.65)      { tierIndex = 1; tier = 'veteran'; }
    if (dist > 25 && tierRoll > 0.90)      { tierIndex = 2; tier = 'ace'; }
    else if (dist > 15 && tierRoll > 0.80) { tierIndex = 1; tier = 'veteran'; }

    // Team size: 2 for rookie, 3 for veteran, 4 for ace.
    const teamSize = 2 + tierIndex; // 2 / 3 / 4

    // Level scaling matches wild floor but biases slightly higher so
    // route trainers feel like a proper break. The player's party is
    // auto-scaled via perks, so this is more "flavor challenge" than
    // grind wall.
    const baseLevel = Math.max(4, Math.floor(dist * 1.3) + 2 + tierIndex * 2);
    const level = baseLevel;

    // Team composition: mix of archetype signature + biome pool.
    const biomePool = (typeof (globalThis as any).__BIOME_POOLS_CACHE__ === 'object')
        ? null
        : null;
    void biomePool; // keep import graph clean -- App/Service fetch species later
    const candidatePool = arch.signaturePool;
    const team: number[] = [];
    for (let i = 0; i < teamSize; i++) {
        const pick = Math.floor(hash4(cx, cy, 5555, i) * candidatePool.length);
        team.push(candidatePool[pick]);
    }

    const result: RouteTrainerPlacement[] = [
        { archetype: arch, name, tier, tierIndex, teamSpecies: team, level, teamSize },
    ];

    // Duo (gauntlet) chance: ~20% of spawned chunks get a second trainer.
    // They draw independently so you can absolutely run into a Fisherman
    // standing near a Swimmer -- feels organic.
    const duoRoll = hash4(cx, cy, 6666, 0);
    if (duoRoll < 0.20 && dist > 5) {
        const aIdx2 = Math.floor(hash4(cx, cy, 7777, 0) * archetypes.length);
        const arch2 = archetypes[aIdx2];
        const nameIdx2 = Math.floor(hash4(cx, cy, 8888, 0) * arch2.namePool.length);
        const name2 = arch2.namePool[(nameIdx2 + 1) % arch2.namePool.length]; // avoid dupe
        const tierIndex2: 0 | 1 | 2 = Math.max(tierIndex - 1 as 0 | 1, 0) as 0 | 1 | 2;
        const tier2: 'rookie' | 'veteran' | 'ace' =
            tierIndex2 === 2 ? 'ace' : tierIndex2 === 1 ? 'veteran' : 'rookie';
        const teamSize2 = 2 + tierIndex2;
        const level2 = Math.max(4, Math.floor(dist * 1.3) + 2 + tierIndex2 * 2);
        const team2: number[] = [];
        for (let i = 0; i < teamSize2; i++) {
            const pick = Math.floor(hash4(cx, cy, 9999, i) * arch2.signaturePool.length);
            team2.push(arch2.signaturePool[pick]);
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

export const generateChunk = (cx: number, cy: number, riftStability: number = 0): Chunk => {
    const seed = getChunkSeed(cx, cy);
    const rng = new SeededRandom(seed);
    const dist = Math.sqrt(cx*cx + cy*cy);

    const biome = getBiomeAt(cx, cy);

    if (cx === 0 && cy === 0) {
        return {
            x: 0, y: 0, id: 'chunk_0_0', name: 'Pallet Town', layout: PALLET_LAYOUT,
            // Starter town: fix the long-standing portal mislabels. The
            // visible Mart roof's door at (10,9) now actually opens the
            // Mart interior, not Oak's Lab. The right-hand red-roofed
            // building at (13,3) becomes Oak's Lab (static); the left
            // red-roofed building at (3,3) remains the player's bedroom.
            portals: {
                "3,3": "house_player,9,8",                      // player's bedroom
                "13,3": "lab,9,8",                              // Oak's Lab
                "10,9": interiorPortal('mart', 0, 0, 10, 9),    // Pallet Mart
            },
            wildLevelRange: [2, 5], biome: 'town',
            trainers: {},
            npcs: {
                "5,10": { id: "pallet_npc_1", name: "Old Man", sprite: TRAINER_SPRITES.gentleman, dialogue: ["The old wooden signposts still know the way, y'know.", "If you ever get lost out there, check the nearest one.", "It'll point you toward whichever gym you need next."] },
                "12,5": { id: "pallet_npc_2", name: "Lass", sprite: TRAINER_SPRITES.lass, dialogue: ["Pallet Town is so peaceful.", "Have you seen Prof. Oak?"] },
                "15,13": { id: "pallet_npc_3", name: "Fisherman", sprite: TRAINER_SPRITES.fisherman, dialogue: ["The water here is perfect for fishing.", "I caught a huge Magikarp earlier!"] },
                "2,13": { id: "pallet_npc_4", name: "Bug Catcher", sprite: TRAINER_SPRITES.bugcatcher, dialogue: ["I'm looking for rare bugs in the tall grass!", "Be careful out there."] }
            }
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
            isGymLeader: true,
            badgeId: 9 // Special Badge
        };
        
        // Add some rift scenery
        for(let i=0; i<20; i++) {
            const rx = rng.nextInt(2, 18);
            const ry = rng.nextInt(2, 18);
            if (layout[ry][rx] === bgTile) layout[ry][rx] = patchTile;
        }

        return { id: `chunk_${cx}_${cy}`, name: "THE RIFT CORE", layout, portals, wildLevelRange: [90, 100], biome, trainers, npcs, interactables, x: cx, y: cy };
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
        // Even/odd split: red roof (pokecenter-palette) vs blue roof (mart
        // palette). Same tile IDs the random-gym branch uses below.
        const roofTile = gymBadge % 2 === 0 ? 30 : 40;
        const wTile   = gymBadge % 2 === 0 ? 33 : 43;
        const sTile   = gymBadge % 2 === 0 ? 45 : 35;

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
                layout[hy][hx] = 30; layout[hy][hx+1] = 31; layout[hy][hx+2] = 32;
                layout[hy+1][hx] = 33; layout[hy+1][hx+1] = 50; layout[hy+1][hx+2] = 35;
                portals[`${doorX},${doorY}`] = interiorPortal('house', cx, cy, doorX, doorY);
                // Small decoration so different houses look visually
                // distinct on the overworld too. Pick a prop from the
                // door coords so it's deterministic.
                const decorProp = [97, 98, 99][(doorX + doorY) % 3];
                decorate(hx - 1, hy + 2, decorProp);
            } else {
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
                layout[hy][hx] = 30; layout[hy][hx+1] = 31; layout[hy][hx+2] = 32;
                layout[hy+1][hx] = 33; layout[hy+1][hx+1] = 50; layout[hy+1][hx+2] = 35;
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
            isGymLeader: true, // Treat as gym leader for badge logic
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

    // Minor item cache (very common)
    if (dist > 1 && rng.next() < 0.45) {
        const spot = tryPlace(isOpen);
        if (spot) {
            layout[spot.y][spot.x] = 12; // Item Ball
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

    const trainerCount = rng.nextInt(0, 2) + (dist > 8 ? 1 : 0);
    const spriteKeys = Object.keys(TRAINER_SPRITES).filter(k => !k.startsWith('leader') && k !== 'prof' && k !== 'rival');
    
    for(let i=0; i<trainerCount; i++) {
        const tx = rng.nextInt(2, CHUNK_SIZE-3);
        const ty = rng.nextInt(2, CHUNK_SIZE-3);
        if (layout[ty] && (layout[ty][tx] === 4 || layout[ty][tx] === bgTile) && !trainers[`${tx},${ty}`]) {
            const spriteKey = spriteKeys[rng.nextInt(0, spriteKeys.length - 1)];
            const trainerName = spriteKey.charAt(0).toUpperCase() + spriteKey.slice(1);
            
            // Random team size based on distance - Minimum 4 for 2v2
            const teamSize = dist < 5 ? 4 : (dist < 15 ? rng.nextInt(4, 5) : rng.nextInt(5, 6));
            const team = [];
            
            // Pick a "theme" for the trainer
            const themes = [
                [1, 4, 7], // Starters
                [25, 26, 135], // Electric
                [92, 93, 94], // Ghost
                [66, 67, 68], // Fighting
                [133, 134, 135, 136, 196, 197], // Eeveelutions
                [147, 148, 149], // Dragon
                [143, 131, 112], // Tanky
                [63, 64, 65], // Psychic
                [74, 75, 76], // Rock/Ground
            ];
            
            const theme = themes[rng.nextInt(0, themes.length - 1)];
            for(let j=0; j<teamSize; j++) {
                if (j < theme.length && rng.next() < 0.7) {
                    team.push(theme[j]);
                } else {
                    team.push(rng.nextInt(1, 151));
                }
            }

            trainers[`${tx},${ty}`] = {
                id: `chunk_${cx}_${cy}_t${i}`,
                name: trainerName,
                sprite: TRAINER_SPRITES[spriteKey as keyof typeof TRAINER_SPRITES],
                team: team,
                level: levelBase + rng.nextInt(-1, 3), // Slightly higher level for trainers
                reward: levelBase * 50,
                dialogue: "I've been training hard! Let's see what you've got!",
                winDialogue: "You're clearly a master..."
            };
        }
    }

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
    if (!poiPlaced) {
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
    };
};

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
