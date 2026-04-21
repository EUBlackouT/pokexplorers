
import { MapZone, TrainerData, NPCData, InteractableData, Chunk } from '../types';
import { getGymTeam } from '../data/gymTeams';

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
        npcs: { "9,5": { id: "nurse", name: "Nurse", sprite: TRAINER_SPRITES.nurse, dialogue: ["Heal up!"] } },
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
    const biomeVal = (globalNoise.noise(cx * 0.1, cy * 0.1) + 1) / 2;
    const moistVal = (moistureNoise.noise(cx * 0.1, cy * 0.1) + 1) / 2;

    if (Math.floor(dist) === 50) return 'rift';
    if (dist < 3) return 'town';
    if (biomeVal < 0.2) return moistVal < 0.5 ? 'desert' : 'canyon';
    if (biomeVal > 0.8) return moistVal < 0.5 ? 'snow' : 'cave';
    if (biomeVal > 0.6) return moistVal > 0.6 ? 'lake' : 'forest';
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
            portals: { "3,3": "house_player,9,8", "10,9": "lab,9,8", "14,3": "house_player,9,8" },
            wildLevelRange: [2, 5], biome: 'town',
            trainers: {},
            npcs: {
                "5,10": { id: "pallet_npc_1", name: "Old Man", sprite: TRAINER_SPRITES.gentleman, dialogue: ["Technology is incredible!", "You can now battle with friends!"] },
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
    
    // Always add some random clutter/interactables regardless of main POI.
    // We bumped iterations from 3 -> 5 now that extra decorative props
    // (benches, lampposts, mailboxes) are in the pool.
    for (let i = 0; i < 5; i++) {
        const rx = rng.nextInt(2, CHUNK_SIZE - 3);
        const ry = rng.nextInt(2, CHUNK_SIZE - 3);
        if (layout[ry][rx] === bgTile) {
            const clutterRoll = rng.next();
            if (clutterRoll < 0.08) layout[ry][rx] = 56; // Berry Tree
            else if (clutterRoll < 0.13) layout[ry][rx] = 53; // Signpost
            else if (clutterRoll < 0.18) layout[ry][rx] = 12; // Item Ball
            else if (clutterRoll < 0.20) layout[ry][rx] = 65; // Weather Shrine
            else if (clutterRoll < 0.22) layout[ry][rx] = 66; // Healing Spring
            // Decorative props. More common than POIs so the world feels lived-in.
            else if (clutterRoll < 0.30 && (biome === 'forest' || biome === 'lake' || biome === 'grassland')) layout[ry][rx] = 98; // Bench
            else if (clutterRoll < 0.34 && biome !== 'cave') layout[ry][rx] = 97; // Lamppost
            else if (clutterRoll < 0.37 && biome !== 'cave' && biome !== 'desert') layout[ry][rx] = 99; // Mailbox
        }
    }

    if (poiRoll < 0.05 && dist > 2) {
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
            if (houseType < 0.3) {
                layout[hy][hx] = 30; layout[hy][hx+1] = 31; layout[hy][hx+2] = 32;
                layout[hy+1][hx] = 33; layout[hy+1][hx+1] = 50; layout[hy+1][hx+2] = 35;
                portals[`${hx+1},${hy+1}`] = "center,9,8";
                // Light the entrance and put a mailbox on the path. These make
                // the Pokemon Center feel like a real destination rather than
                // three stacked red tiles.
                decorate(hx - 1, hy + 1, 97);   // lamppost left of building
                decorate(hx + 3, hy + 1, 97);   // lamppost right of building
                decorate(hx + 3, hy + 2, 99);   // mailbox at path
            } else if (houseType < 0.6) {
                layout[hy][hx] = 40; layout[hy][hx+1] = 41; layout[hy][hx+2] = 42;
                layout[hy+1][hx] = 43; layout[hy+1][hx+1] = 50; layout[hy+1][hx+2] = 45;
                portals[`${hx+1},${hy+1}`] = "mart,9,8";
                // Mart gets bench + lamppost for shoppers.
                decorate(hx - 1, hy + 2, 98);
                decorate(hx + 3, hy + 1, 97);
            } else if (houseType < 0.8) {
                // Trade NPC
                layout[hy][hx] = 30; layout[hy][hx+1] = 31; layout[hy][hx+2] = 32;
                layout[hy+1][hx] = 33; layout[hy+1][hx+1] = 50; layout[hy+1][hx+2] = 35;
                npcs[`${hx+2},${hy+2}`] = {
                    id: `trader_${cx}_${cy}`,
                    name: "Trader",
                    sprite: TRAINER_SPRITES.beauty,
                    dialogue: ["I'm looking for a rare specimen.", "Would you trade your lead Pokemon for something special?"],
                    challenge: {
                        type: 'collect',
                        target: 'Rare Monster',
                        reward: { id: 151, name: 'Mew', level: 30, stats: {} as any, baseStats: {} as any, types: ['psychic'], moves: [], sprites: { front_default: '' }, currentHp: 100, maxHp: 100, ivs: {} as any, evs: {} as any, nature: { name: 'Timid' }, ability: { name: 'Synchronize' }, xp: 0, maxXp: 1000 } as any
                    }
                };
            } else {
                // Gym! (Scaled distance)
                const gymBadge = Math.floor(dist / 15) + 1; 
                if (gymBadge <= 8) {
                    // Distinct looks for gyms
                    const roofTile = gymBadge % 2 === 0 ? 30 : 40; // Alternate red and blue roofs
                    const wallTile = gymBadge % 2 === 0 ? 33 : 43;
                    const sideTile = gymBadge % 2 === 0 ? 35 : 45;
                    
                    layout[hy][hx] = roofTile; layout[hy][hx+1] = roofTile + 1; layout[hy][hx+2] = roofTile + 2;
                    layout[hy+1][hx] = wallTile; layout[hy+1][hx+1] = 50; layout[hy+1][hx+2] = sideTile;

                    // Themed teams for Gym Leaders (Creative themes, not just single type!)
                    const themes = [
                        [263, 263], // Brock: "The Sync Starters" (Two Zigzagoon with Harmony Engine)
                        [278, 270, 60], // Misty: "The Rain Dance" (Wingull, Lotad, Poliwag)
                        [81, 100, 309], // Lt. Surge: "The Static Field" (Magnemite, Voltorb, Electrike)
                        [43, 273, 69], // Erika: "The Solar Power" (Oddish, Seedot, Bellsprout)
                        [109, 88, 41], // Koga: "The Poison Trap" (Koffing, Grimer, Zubat)
                        [63, 280, 177], // Sabrina: "The Mind Link" (Abra, Ralts, Natu)
                        [58, 77, 218], // Blaine: "The Heat Wave" (Growlithe, Ponyta, Slugma)
                        [111, 74, 50] // Giovanni: "The Earth Shaker" (Rhyhorn, Geodude, Diglett)
                    ];

                    const leaderNames = [
                        'Brock "The Rock & Roller"',
                        'Misty "The Deep Diver"',
                        'Lt. Surge "The Tech Commando"',
                        'Erika "The Zen Botanist"',
                        'Koga "The Shadow Ninja"',
                        'Sabrina "The Cosmic Oracle"',
                        'Blaine "The Spicy Chef"',
                        'Giovanni "The Shadow CEO"'
                    ];

                    const leaderDialogues = [
                        "Ready to feel the heavy metal rhythm? Let's Rock & Roll!",
                        "The ocean has secrets you haven't even dreamed of. Dive in!",
                        "My team is a finely tuned machine. Can you handle the surge?",
                        "Nature is a delicate balance. Let me show you its hidden power.",
                        "You won't even see us coming. The shadows are our allies.",
                        "I've already seen the outcome of this battle. Care to prove me wrong?",
                        "My kitchen is getting hot! Can you handle the spice?",
                        "Welcome to my office. Let's discuss your... termination."
                    ];

                    // Prefer the curated competitive loadout (data/gymTeams.ts) when one
                    // exists for this badge id. Falls back to the legacy themed roster
                    // below so gyms 9+ (if any are ever added) don't break.
                    const gymLoadout = getGymTeam(gymBadge);
                    const team = gymLoadout ? gymLoadout.loadout.map((l) => l.id) : (themes[gymBadge-1] || [rng.nextInt(1, 151), rng.nextInt(1, 151)]);
                    const level = gymLoadout ? gymLoadout.level : (15 + (gymBadge * 10));
                    const leaderName = gymLoadout
                        ? `${gymLoadout.name} "${gymLoadout.title}"`
                        : (leaderNames[gymBadge-1] || `Leader ${gymBadge}`);

                    trainers[`${hx+1},${hy+2}`] = {
                        id: `gym_${cx}_${cy}`,
                        name: leaderName,
                        sprite: [TRAINER_SPRITES.leader1, TRAINER_SPRITES.leader2, TRAINER_SPRITES.leader3, TRAINER_SPRITES.leader4][(gymBadge-1) % 4],
                        team,
                        level,
                        reward: gymBadge * 2000,
                        dialogue: leaderDialogues[gymBadge-1] || "You think you can handle my team? It's a double battle!",
                        winDialogue: "Impressive. Take this badge.",
                        isGymLeader: true,
                        badgeId: gymBadge,
                        loadout: gymLoadout ? gymLoadout.loadout : undefined,
                    };
                }
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
