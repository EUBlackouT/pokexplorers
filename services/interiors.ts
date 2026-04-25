import { MapZone, NPCData, InteractableData, TrainerData, Pokemon } from '../types';
import { getGymTeam } from '../data/gymTeams';

// Sprite URLs for NPCs spawned inside interiors. These match the URLs in
// services/mapData.ts' TRAINER_SPRITES map and are duplicated here to avoid
// a circular dependency (mapData.ts imports interiorPortal from this file).
// When adding a new SPRITE entry, prefer re-using a Showdown trainer URL
// that already ships with the game -- fresh assets aren't needed here.
const POKE_SHOWDOWN = 'https://play.pokemonshowdown.com/sprites/trainers';
const SPRITE = {
    nurse:      `${POKE_SHOWDOWN}/nurse.png`,
    scientist:  `${POKE_SHOWDOWN}/scientist.png`,
    // Shopkeeper: the Showdown "worker" sprite reads as a store clerk with
    // apron + clipboard, which fits a Poke Mart counter better than
    // generic trainer art.
    shopkeeper: `${POKE_SHOWDOWN}/worker.png`,
    gentleman:  `${POKE_SHOWDOWN}/gentleman.png`,
    lass:       `${POKE_SHOWDOWN}/lass.png`,
    beauty:     `${POKE_SHOWDOWN}/beauty.png`,
    bugcatcher: `${POKE_SHOWDOWN}/bugcatcher.png`,
    fisherman:  `${POKE_SHOWDOWN}/fisherman.png`,
    veteran:    `${POKE_SHOWDOWN}/veteran.png`,
    hiker:      `${POKE_SHOWDOWN}/hiker.png`,
    youngster:  `${POKE_SHOWDOWN}/youngster.png`,
    psychic:    `${POKE_SHOWDOWN}/psychic.png`,
    sailor:     `${POKE_SHOWDOWN}/sailor.png`,
    // "Elder" isn't a stock Showdown trainer -- we reuse the gentleman
    // sprite (distinguished-looking man) as the retired-trainer stand-in.
    elder:      `${POKE_SHOWDOWN}/gentleman.png`,
    juggler:    `${POKE_SHOWDOWN}/juggler.png`,
    prof:       `${POKE_SHOWDOWN}/oak.png`,
} as const;

// ---------------------------------------------------------------------------
// INTERIOR TILE PALETTE (new, interior-only tiles added by this overhaul).
//
// 200  Pokemon Center healing counter (front) -- wall-like, adjacent NPC heals
// 201  PokeCenter PC terminal                  -- interactable, storage stub
// 202  PokeCenter bench / waiting chair        -- decor
// 203  PokeMart shelf                          -- wall, shows goods
// 204  PokeMart counter                        -- wall, adjacent NPC opens shop
// 205  Fireplace (cozy house)                  -- decor
// 206  Kitchen counter                         -- wall, decor
// 207  Workshop bench                          -- wall, decor
// 208  Bookshelf (tall)                        -- wall, flavor
// 209  Rug red                                 -- floor decor
// 210  Rug blue                                -- floor decor
// 211  Potted plant                            -- decor
// 212  Window (interior)                       -- wall, decor
//
// Rendering is wired in components/Overworld.tsx. Walls are any id whose
// collision flag is true -- that set is maintained in the same file's
// `walls` array. 200-208 and 212 are walls; 209-211 are walkable decor.
// ---------------------------------------------------------------------------

// Small seeded PRNG so the same (chunk x, chunk y, door x, door y) tuple
// always picks the same archetype, NPC species, gift item, etc. -- this is
// what lets the user think "the third house from the fountain always has
// the move tutor". Uses a cheap xmur3/mulberry32 pair.
function makeRng(seed: string) {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    let a = h >>> 0;
    return {
        next(): number {
            a = (a + 0x6D2B79F5) | 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        },
        nextInt(min: number, max: number): number {
            return Math.floor(this.next() * (max - min + 1)) + min;
        },
        pick<T>(arr: readonly T[]): T {
            return arr[Math.floor(this.next() * arr.length)];
        }
    };
}

// ---------------------------------------------------------------------------
// LAYOUT HELPERS
// ---------------------------------------------------------------------------

type Layout = number[][];

/** Build a 20x20 interior frame: walls on the perimeter, wood floor (15)
 *  inside, with a door mat (50) at the south-center tile that leads back
 *  outside. `wallTile` lets us swap between warm-wood, cold-tile, pink,
 *  etc., but defaults to the generic interior wall (1). */
function makeInteriorFrame(wallTile: number = 1, floorTile: number = 15): Layout {
    const w = 20;
    const h = 20;
    const out: Layout = [];
    for (let y = 0; y < h; y++) {
        const row: number[] = [];
        for (let x = 0; x < w; x++) {
            // Confine the playable interior to rows 3..10, cols 5..14 so that
            // the interior feels "small and cozy" inside the 20x20 map. The
            // rest of the canvas is wall (1) which renders as dark void
            // around the room.
            const inRoom = x >= 5 && x <= 14 && y >= 3 && y <= 10;
            if (inRoom) row.push(floorTile);
            else row.push(wallTile);
        }
        out.push(row);
    }
    // Door mat at bottom-center of the room -- this is where the player
    // spawns when entering and where PREV_POS returns to.
    out[10][9] = 50;
    // Widen the doorway with matching floor just below (acts as walkable
    // one-tile corridor out of the room before they step onto the mat).
    out[11][9] = floorTile;
    out[12][9] = floorTile;
    // Two walls flanking the corridor so it reads as "door channel".
    out[11][8] = wallTile;
    out[11][10] = wallTile;
    out[12][8] = wallTile;
    out[12][10] = wallTile;
    return out;
}

// ---------------------------------------------------------------------------
// POKEMON CENTER
// ---------------------------------------------------------------------------
// Layout sketch (x=5..14, y=3..10):
//   row 3:  .. 200 200 200 200 200 ..       (healing counter across top)
//   row 4:  .. 15  15  NURSE 15  15 ..      (NPC behind counter gap)
//   row 5:  .. 15  15  15   15  15 ..       (walking space)
//   row 6:  .. 202 15  15   15  201 ..      (bench left, PC right)
//   row 7:  .. 15  15  209  15  15 ..       (rug)
//   row 8:  .. 15  CLERK 15 15  15 ..       (guild clerk)
//   row 9:  .. 15  15  15   15  15 ..
//   row 10: .. wall wall 50  wall wall ..    (door mat)
//
function buildCenter(seed: string, returnTo: string, name: string): MapZone {
    const layout = makeInteriorFrame(1, 15);
    // Healing counter spans row 3 across the room (5..14).
    for (let x = 6; x <= 13; x++) layout[3][x] = 200;
    // Leave a one-tile "service gap" at x=9 so the player can approach the
    // counter to heal.
    layout[3][9] = 15;
    // PC terminal + bench for flavor.
    layout[5][13] = 201;
    layout[5][6]  = 202;
    // Red rug in the middle so the room reads "clinical-but-warm".
    layout[7][9] = 209;
    // Fireplace in the waiting lounge corner (flavor).
    layout[9][13] = 205;

    const npcs: Record<string, NPCData> = {
        // Nurse behind counter at x=9,y=3 (standing ON the gap, facing south).
        // Player interacts from y=4 (one tile south). Heal is wired via the
        // NPC id 'nurse' -- App.tsx handleInteraction has a special path
        // that checks for id === 'nurse' and performs the full-team heal
        // + status cure + fanfare.
        "9,4": {
            id: 'nurse', name: 'Nurse Joy', sprite: SPRITE.nurse,
            facing: 'down',
            dialogue: [
                `Welcome to the ${name}!`,
                "We can restore your Pokemon to full health.",
                "Would you like us to heal your team?"
            ],
        },
        // Guild Clerk -- same behaviour as the existing 'guild_clerk' id,
        // which opens the Bounty Board. Reusing the id lets the existing
        // App.tsx branch handle this without a new special-case.
        "11,8": {
            id: 'guild_clerk', name: 'Guild Clerk', sprite: SPRITE.scientist,
            facing: 'down',
            dialogue: [
                "The Trainer's Guild posts contracts on this board.",
                "Take one, hunt it down, claim your reward."
            ],
        },
    };

    const interactables: Record<string, InteractableData> = {
        // PC terminal -- opens the Pokemon Storage System (boxes, party
        // management) via a dedicated interactable type handled in App.tsx.
        // The interactable lives one tile south of the PC sprite (tile 201
        // at layout[5][13]) so the player can approach from a walkable
        // floor tile.
        "13,6": { type: 'pc', text: [
            "The PC powers on.",
            "Booting Pokemon Storage...",
        ]},
        "6,6":  { type: 'object', text: ["A soft waiting bench. You sit for a moment.", "Your Pokemon seem calmer already."]},
        "13,9": { type: 'object', text: ["A crackling fireplace. Warm and welcoming."]},
    };

    return {
        id: `interior:center:${seed}`,
        name,
        layout,
        portals: { "9,10": returnTo },
        wildLevelRange: [0, 0],
        npcs,
        interactables,
        biome: 'center',
    };
}

// ---------------------------------------------------------------------------
// POKE MART
// ---------------------------------------------------------------------------
function buildMart(seed: string, returnTo: string, name: string): MapZone {
    const layout = makeInteriorFrame(1, 15);
    // Mart counter (tile 204) spans back-of-store, with a gap for the clerk.
    for (let x = 6; x <= 13; x++) layout[4][x] = 204;
    layout[4][9] = 15; // service gap
    // Shelves (tile 203) line the walls with goods.
    for (let y = 5; y <= 8; y++) {
        layout[y][5] = 203;
        layout[y][14] = 203;
    }
    // A central display island (shelves) so the room reads "store".
    layout[6][9] = 203;
    // Blue rug in the middle to distinguish floor from Center.
    layout[8][9] = 210;

    const npcs: Record<string, NPCData> = {
        // Shopkeeper -- id 'shopkeeper' triggers App.tsx's special path
        // that switches GamePhase to SHOP on interact.
        "9,5": {
            id: 'shopkeeper', name: 'Shopkeeper', sprite: SPRITE.shopkeeper,
            facing: 'down',
            dialogue: [
                `Welcome to the ${name}!`,
                "We've got balls, potions, and everything in between.",
                "What can I get you?"
            ],
        },
    };

    const interactables: Record<string, InteractableData> = {
        // Shelves -- flavor tooltips so the player feels the store has stock.
        "5,7":  { type: 'object', text: ["A shelf stacked with assorted Potions."]},
        "14,7": { type: 'object', text: ["Great Balls and Ultra Balls stacked neatly."]},
        "9,6":  { type: 'object', text: ["The display island: today's featured items."]},
    };

    return {
        id: `interior:mart:${seed}`,
        name,
        layout,
        portals: { "9,10": returnTo },
        wildLevelRange: [0, 0],
        npcs,
        interactables,
        biome: 'mart',
    };
}

// ---------------------------------------------------------------------------
// HOUSE ARCHETYPES
// ---------------------------------------------------------------------------

type HouseArchetype =
    | 'cottage_trader'      // NPC wants to trade your lead for a themed gift
    | 'cottage_item_gift'   // one-time free item (tracked per-run via story flag)
    | 'cottage_move_tutor'  // teaches a random move from a themed pool for money
    | 'workshop_trainer'    // trainer challenges you to a battle
    | 'apartment_quest'     // fetch-quest giver
    | 'apartment_lore'      // rumor NPC -- gives hints about next gym/biome
    | 'daycare_house';      // leave a Pokemon to grow stronger over real time

const ARCHETYPES: readonly HouseArchetype[] = [
    'cottage_trader',
    'cottage_item_gift',
    'cottage_move_tutor',
    'workshop_trainer',
    'apartment_quest',
    'apartment_lore',
    'daycare_house',
] as const;

// Three distinct base layouts. `seed` picks which one gets used for a given
// archetype so "a workshop" doesn't always look identical to "a cottage".
function layoutCottage(): Layout {
    const l = makeInteriorFrame(1, 15);
    // Fireplace in upper-left corner, bookshelf on the right wall.
    l[4][6] = 205;
    l[4][7] = 206; // kitchen counter right of fire
    l[5][6] = 211; // potted plant
    l[5][13] = 208;
    l[6][13] = 208;
    l[7][13] = 208;
    // A red rug in the middle.
    l[7][9] = 209;
    // A small table (reuse tile 60-62 existing furniture if needed, else 211).
    l[8][8] = 211;
    return l;
}

function layoutWorkshop(): Layout {
    const l = makeInteriorFrame(1, 15);
    // Workbenches along the back wall.
    for (let x = 6; x <= 13; x++) l[3][x] = 207;
    // Window in the centre so the workshop feels industrial.
    l[3][9] = 212;
    // Tool cabinets / bookshelves along both sides.
    l[5][5] = 208;
    l[6][5] = 208;
    l[5][14] = 208;
    l[6][14] = 208;
    // Central blue rug (protective mat).
    l[7][9] = 210;
    return l;
}

function layoutApartment(): Layout {
    const l = makeInteriorFrame(1, 15);
    // Small kitchen cluster upper-left.
    l[4][6] = 206;
    l[4][7] = 206;
    l[5][6] = 211;
    // Bed (reuse tile 64 from old furniture vocab).
    l[4][13] = 64;
    // Nightstand + bookshelf.
    l[5][13] = 208;
    l[6][13] = 208;
    // TV (fireplace stand-in tile 205 shows warm glow).
    l[9][6] = 205;
    // Throw rug.
    l[8][9] = 210;
    return l;
}

// Themed gift pools per archetype. Kept small and "feel-good" -- these are
// one-time rewards per run, not run-defining, so we favour breadth over
// power. Prices for the move tutor sit in the 3000-8000 gold band so
// they're aspirational without feeling punishing.
const ARCHETYPE_GIFTS = {
    cottage_item_gift: [
        { id: 'potion',       label: 'a Potion'        },
        { id: 'super-potion', label: 'a Super Potion'  },
        { id: 'revive',       label: 'a Revive'        },
        { id: 'rare-candy',   label: 'a Rare Candy'    },
        { id: 'lucky-egg',    label: 'a Lucky Egg'     },
        { id: 'leftovers',    label: 'Leftovers'       },
        { id: 'choice-band',  label: 'a Choice Band'   },
    ],
    cottage_trader_gifts: [
        // Mid-to-high tier pokemon. IDs kept in Gen 1-3 range to stay safe
        // with the app's species data.
        { id: 185, name: 'Sudowoodo', level: 25 },
        { id: 202, name: 'Wobbuffet', level: 25 },
        { id: 213, name: 'Shuckle',   level: 25 },
        { id: 234, name: 'Stantler',  level: 25 },
        { id: 241, name: 'Miltank',   level: 25 },
        { id: 302, name: 'Sableye',   level: 22 },
        { id: 303, name: 'Mawile',    level: 22 },
        { id: 352, name: 'Kecleon',   level: 25 },
    ],
    move_tutor_moves: [
        { id: 'ice-punch',    label: 'Ice Punch',    price: 6000 },
        { id: 'fire-punch',   label: 'Fire Punch',   price: 6000 },
        { id: 'thunder-punch',label: 'Thunder Punch',price: 6000 },
        { id: 'body-slam',    label: 'Body Slam',    price: 4500 },
        { id: 'dragon-dance', label: 'Dragon Dance', price: 8000 },
        { id: 'swords-dance', label: 'Swords Dance', price: 5500 },
        { id: 'rock-slide',   label: 'Rock Slide',   price: 4500 },
        { id: 'psychic',      label: 'Psychic',      price: 7000 },
    ],
    lore_rumors: [
        "They say the gym far to the east is run by a dragon master with scales for armour.",
        "I heard the Rift tears open wider the further you travel from Pallet Town.",
        "A trader in a gold mask buys rare fossils somewhere in the northern desert.",
        "If you see a blue rock glowing in the caves, don't touch it -- that's raw Tera energy.",
        "My cousin caught a shiny Feebas in a lake west of here. Or so she claims.",
        "The Elite Four entrance only opens once all eight badges are earned. A shame, really -- I'd sell souvenirs there.",
        "Some houses out in the frontier have trainers who fight only double battles. Bring a partner.",
        "Whispers in the wind say a second rift has opened deep in the lava fields. Pack Revives.",
    ],
    trainer_dialogues: [
        { greet: "My partner and I trained for this moment.", win: "You fight like the mountain. Crushing." },
        { greet: "This is my living room. No one loses here.", win: "Alright, alright -- you earned it. Mop's in the closet." },
        { greet: "I saw you at the last gym. Let's see if it was a fluke.", win: "Hah! Not a fluke. Not a fluke at all." },
        { greet: "Enter freely and at your own peril.", win: "Respect. The door's always open to you now." },
        { greet: "You smell like fresh air. I like that.", win: "Go on then, hero. Tell the wind I said hi." },
    ],
} as const;

// ---------------------------------------------------------------------------
// HOUSE BUILDERS
// ---------------------------------------------------------------------------

function buildHouse(seed: string, returnTo: string): MapZone {
    const rng = makeRng(seed);
    const archetype: HouseArchetype = rng.pick(ARCHETYPES);

    switch (archetype) {
        case 'cottage_trader':      return buildCottageTrader(seed, returnTo, rng);
        case 'cottage_item_gift':   return buildCottageItemGift(seed, returnTo, rng);
        case 'cottage_move_tutor':  return buildCottageMoveTutor(seed, returnTo, rng);
        case 'workshop_trainer':    return buildWorkshopTrainer(seed, returnTo, rng);
        case 'apartment_quest':     return buildApartmentQuest(seed, returnTo, rng);
        case 'apartment_lore':      return buildApartmentLore(seed, returnTo, rng);
        case 'daycare_house':       return buildDaycareHouse(seed, returnTo);
    }
}

/** Daycare cottage. Always uses the same friendly Daycare Lady NPC --
 *  archetype is randomly rolled like the others, but inside the house
 *  it's deterministic so the player can rely on it as a known utility.
 *  The deposit/withdraw flow lives in App.tsx (`npc.id.startsWith
 *  ('daycare_')`) and reads/writes `playerState.daycare`. */
function buildDaycareHouse(seed: string, returnTo: string): MapZone {
    const layout = layoutCottage();
    // Cradle decor: an extra rug + a Pokemon-bed analogue.
    layout[6][7]  = 209;
    layout[6][11] = 209;
    layout[5][9]  = 211; // potted plant -- "garden vibe"
    return {
        id: `interior:house:${seed}`,
        name: 'Pokemon Daycare',
        layout,
        portals: { "9,10": returnTo },
        wildLevelRange: [0, 0],
        npcs: {
            "9,5": {
                id: `daycare_${seed}`,
                name: 'Daycare Lady',
                sprite: SPRITE.beauty,
                facing: 'down',
                dialogue: [
                    "Welcome to the Pokemon Daycare!",
                    "I'll look after one of your Pokemon while you adventure.",
                    "They'll grow stronger every minute you're away.",
                ],
            },
        },
        interactables: {
            "13,6": { type: 'object', text: ["A bulletin board: 'No more than one boarder per trainer, please.'"] },
            "6,4":  { type: 'object', text: ["A warm fireplace, perfect napping for tired Pokemon."] },
        },
        biome: 'interior',
    };
}

function buildCottageTrader(seed: string, returnTo: string, rng: ReturnType<typeof makeRng>): MapZone {
    const layout = layoutCottage();
    const gift = rng.pick(ARCHETYPE_GIFTS.cottage_trader_gifts);
    // Reuse the existing 'collect'/'Trader' path in App.tsx by naming the
    // NPC "Trader" and giving it a challenge.collect payload with the
    // reward shaped like a Pokemon. That path already swaps the lead mon
    // for the reward.
    const reward: Pokemon = {
        id: gift.id,
        name: gift.name,
        level: gift.level,
        stats: {} as any,
        baseStats: {} as any,
        types: [],
        moves: [],
        sprites: { front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${gift.id}.png` },
        currentHp: 0,
        maxHp: 0,
        ivs: {} as any,
        evs: {} as any,
        nature: { name: 'Hardy' },
        ability: { name: 'Synchronize' },
        xp: 0,
        maxXp: 1000,
    } as any;
    return {
        id: `interior:house:${seed}`,
        name: 'Trader\'s Cottage',
        layout,
        portals: { "9,10": returnTo },
        wildLevelRange: [0, 0],
        npcs: {
            "9,5": {
                id: `trader_${seed}`,
                name: 'Trader',
                sprite: SPRITE.beauty,
                facing: 'down',
                dialogue: [
                    `Oh! A visitor. I've been hoping to trade my ${gift.name}.`,
                    "Would you give me your lead Pokemon for them?",
                    "(This trade is permanent.)"
                ],
                challenge: { type: 'collect', target: 'Rare Monster', reward },
            },
        },
        interactables: {
            "6,4": { type: 'object', text: ["An old fireplace glows warmly."]},
            "13,6": { type: 'object', text: ["A bookshelf stuffed with travel journals."]},
        },
        biome: 'interior',
    };
}

function buildCottageItemGift(seed: string, returnTo: string, rng: ReturnType<typeof makeRng>): MapZone {
    const layout = layoutCottage();
    const gift = rng.pick(ARCHETYPE_GIFTS.cottage_item_gift);
    const giver = rng.pick([
        { name: 'Old Woman',  sprite: SPRITE.elder,     greet: "My grandson left for his journey years ago.", hand: `Here, take ${gift.label}. It's been sitting in a drawer since.` },
        { name: 'Young Boy',  sprite: SPRITE.youngster, greet: "Mum said I couldn't use this until I was ten.", hand: `You look old enough. Take ${gift.label}!` },
        { name: 'Hiker',      sprite: SPRITE.hiker,     greet: "I found too many on the mountain trail.", hand: `Take ${gift.label}, I've got more.` },
        { name: 'Sailor',     sprite: SPRITE.sailor,    greet: "Washed up on shore last week, that one.", hand: `It's ${gift.label} -- yours if you want it.` },
    ]);
    // We flag the gift as claimed via a story flag specific to this seed so
    // the player can't double-dip. Flag is written by App.tsx's gift path
    // (new branch keyed on id === `gift_house_${seed}`).
    return {
        id: `interior:house:${seed}`,
        name: `${giver.name}'s Home`,
        layout,
        portals: { "9,10": returnTo },
        wildLevelRange: [0, 0],
        npcs: {
            "9,5": {
                id: `gift_house_${seed}`,
                name: giver.name,
                sprite: giver.sprite,
                facing: 'down',
                // Stash the gift on the dialogue itself -- App.tsx reads it
                // via a dedicated branch that checks the id prefix.
                dialogue: [giver.greet, giver.hand, `__GIFT__${gift.id}`],
            },
        },
        interactables: {},
        biome: 'interior',
    };
}

function buildCottageMoveTutor(seed: string, returnTo: string, rng: ReturnType<typeof makeRng>): MapZone {
    const layout = layoutCottage();
    const move = rng.pick(ARCHETYPE_GIFTS.move_tutor_moves);
    return {
        id: `interior:house:${seed}`,
        name: 'Move Tutor\'s Den',
        layout,
        portals: { "9,10": returnTo },
        wildLevelRange: [0, 0],
        npcs: {
            "9,5": {
                id: `tutor_${seed}`,
                name: 'Move Tutor',
                sprite: SPRITE.psychic,
                facing: 'down',
                dialogue: [
                    "Ah. A trainer with potential.",
                    `I can teach your lead Pokemon ${move.label} for $${move.price}.`,
                    `__TUTOR__${move.id}__${move.price}`
                ],
            },
        },
        interactables: {},
        biome: 'interior',
    };
}

function buildWorkshopTrainer(seed: string, returnTo: string, rng: ReturnType<typeof makeRng>): MapZone {
    const layout = layoutWorkshop();
    const voice = rng.pick(ARCHETYPE_GIFTS.trainer_dialogues);
    // Level scales off the seed-hash magnitude so further-out houses host
    // tougher trainers. This is a rough proxy for "distance from town".
    const seedNum = Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0);
    const level = 20 + (seedNum % 40);
    const reward = 600 + (seedNum % 8) * 200;
    const teamSpecies = [
        1 + ((seedNum * 31) % 386),
        1 + ((seedNum * 67) % 386),
    ];
    const trainer: TrainerData = {
        id: `workshop_trainer_${seed}`,
        name: 'Workshop Trainer',
        sprite: SPRITE.veteran,
        team: teamSpecies,
        level,
        reward,
        dialogue: voice.greet,
        winDialogue: voice.win,
    };
    return {
        id: `interior:house:${seed}`,
        name: 'Trainer\'s Workshop',
        layout,
        portals: { "9,10": returnTo },
        wildLevelRange: [0, 0],
        trainers: {
            // Standing behind the central rug, facing the door.
            "9,5": trainer,
        },
        interactables: {
            "6,3": { type: 'object', text: ["A workbench scattered with half-finished Pokeballs."]},
            "13,5": { type: 'object', text: ["A rack of practice targets, scorched in places."]},
        },
        biome: 'interior',
    };
}

function buildApartmentQuest(seed: string, returnTo: string, rng: ReturnType<typeof makeRng>): MapZone {
    const layout = layoutApartment();
    // Pick a fetch target from a small pool. Completion is checked against
    // playerState.inventory inside App.tsx's quest branch.
    const quest = rng.pick([
        { item: 'potion',     label: 'Potions',     count: 3, cash: 1500 },
        { item: 'poke-ball',  label: 'Poke Balls',  count: 5, cash: 2000 },
        { item: 'revive',     label: 'Revives',     count: 2, cash: 2500 },
        { item: 'rare-candy', label: 'Rare Candies',count: 1, cash: 3500 },
    ]);
    return {
        id: `interior:house:${seed}`,
        name: `Apartment ${seed.slice(-3).toUpperCase()}`,
        layout,
        portals: { "9,10": returnTo },
        wildLevelRange: [0, 0],
        npcs: {
            "9,5": {
                id: `quest_${seed}`,
                name: rng.pick(['Retired Nurse', 'Researcher', 'Delivery Runner', 'Worried Parent']),
                sprite: rng.pick([SPRITE.lass, SPRITE.gentleman, SPRITE.scientist, SPRITE.bugcatcher]),
                facing: 'down',
                dialogue: [
                    `I need ${quest.count} ${quest.label} urgently.`,
                    `Bring them and I'll pay you $${quest.cash}.`,
                    `__QUEST__${quest.item}__${quest.count}__${quest.cash}`
                ],
            },
        },
        interactables: {},
        biome: 'interior',
    };
}

function buildApartmentLore(seed: string, returnTo: string, rng: ReturnType<typeof makeRng>): MapZone {
    const layout = layoutApartment();
    // Two-line rumor -- first line is flavor, second is an actual hint.
    const rumor = rng.pick(ARCHETYPE_GIFTS.lore_rumors);
    const speaker = rng.pick([
        { name: 'Retired Elite Trainer', sprite: SPRITE.elder },
        { name: 'Wandering Bard',        sprite: SPRITE.juggler },
        { name: 'Fisherman on Holiday',  sprite: SPRITE.fisherman },
        { name: 'Bug Expert',            sprite: SPRITE.bugcatcher },
    ]);
    return {
        id: `interior:house:${seed}`,
        name: `${speaker.name}'s Apartment`,
        layout,
        portals: { "9,10": returnTo },
        wildLevelRange: [0, 0],
        npcs: {
            "9,5": {
                id: `lore_${seed}`,
                name: speaker.name,
                sprite: speaker.sprite,
                facing: 'down',
                dialogue: [`${speaker.name} looks up from a worn notebook.`, rumor, "Best of luck out there."],
            },
        },
        interactables: {},
        biome: 'interior',
    };
}

// ---------------------------------------------------------------------------
// PUBLIC ENTRY POINT
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// GYM INTERIORS
// ---------------------------------------------------------------------------
//
// Each gym is a unique, hand-designed interior themed for the leader's
// type. Difficulty scales with badge index: gym 1 has 1 mook trainer,
// gyms 2-3 have 2 mooks, gyms 4-6 have 3 mooks, gyms 7-8 have 4 mooks.
//
// All gyms share a "march to the back" layout:
//   - Door mat at (10, 17) -- player enters here and PREV_POSes here.
//   - Leader at (10, 4) -- back of the room.
//   - Mook trainers placed in lanes between door and leader.
//   - Walls/decor are type-themed via tile palette.
//
// Defeat handling:
//   - The interior builder accepts `defeatedIds` (the player's
//     defeatedTrainers list) so we can omit trainers the player has
//     already beaten, letting them walk freely through cleared gyms.
//   - Each trainer ID is stable across runs: `gym{badge}_mook{i}` for
//     mooks, `gym_leader_${badge}` for the leader. Migration in App.tsx
//     pre-fills these ids for any player whose `badges` count covers
//     the gym so old saves still see beaten gyms as cleared.
// ---------------------------------------------------------------------------

interface GymTheme {
    /** Floor tile id used for the playable walkway. */
    floor: number;
    /** Wall tile id used for partitions inside the gym (perimeter is 1). */
    wall: number;
    /** Decor tile id sprinkled along the walls for theme. */
    decor: number;
    /** Sprite key from SPRITE for the mook trainer baseline. */
    mookSprite: string;
    /** Display name used for the gym. */
    title: string;
    /** Type color used in the lobby sign (decorative). */
    accent: string;
}

const GYM_THEMES: Record<number, GymTheme> = {
    1: { floor: 15, wall: 207, decor: 211, mookSprite: SPRITE.youngster, title: 'Pallet Gym',     accent: 'normal' },
    2: { floor: 15, wall: 1,   decor: 71,  mookSprite: SPRITE.hiker,     title: 'Pewter Gym',     accent: 'rock' },
    3: { floor: 15, wall: 203, decor: 70,  mookSprite: SPRITE.fisherman, title: 'Cerulean Gym',   accent: 'water' },
    4: { floor: 15, wall: 207, decor: 212, mookSprite: SPRITE.juggler,   title: 'Vermilion Gym',  accent: 'electric' },
    5: { floor: 15, wall: 208, decor: 211, mookSprite: SPRITE.beauty,    title: 'Fuchsia Gym',    accent: 'poison' },
    6: { floor: 210, wall: 1,  decor: 209, mookSprite: SPRITE.psychic,   title: 'Saffron Gym',    accent: 'psychic' },
    7: { floor: 15, wall: 1,   decor: 70,  mookSprite: SPRITE.lass,      title: 'Glacier Gym',    accent: 'ice' },
    8: { floor: 209, wall: 208, decor: 211, mookSprite: SPRITE.veteran,  title: 'Indigo Gym',     accent: 'dragon' },
};

/** Mook trainer flavor lines per gym, mostly themed by type. */
const MOOK_LINES: Record<number, Array<{ greet: string; win: string }>> = {
    1: [
        { greet: "Welcome to the Pallet Gym! Let's warm you up.", win: "Wow, you're sharper than I expected!" },
    ],
    2: [
        { greet: "Boulders, like trainers, must be moved to pass.", win: "Hmph! Solid effort, kid." },
        { greet: "I quarry rocks AND opponents.",                   win: "Crushed... fairly." },
    ],
    3: [
        { greet: "The current is strong here. Stay afloat.",        win: "Nicely done. Try not to slip on the way to the leader." },
        { greet: "Swimmers train in cold water. So do their Pokemon.", win: "Good battle! Aya is right above." },
    ],
    4: [
        { greet: "I'll shock you back to the door!",                win: "Argh! You earthed me out." },
        { greet: "Static crackles in your hair already.",           win: "Volk is going to enjoy you." },
        { greet: "Lights out, challenger.",                          win: "Lights stay on, then." },
    ],
    5: [
        { greet: "Mind the sludge. Some of it bites.",              win: "Tch. The Madame won't be amused." },
        { greet: "Poison settles slowly. So does despair.",         win: "Then go on. You wasted my afternoon." },
        { greet: "Sable trained me herself.",                        win: "Apparently not enough." },
    ],
    6: [
        { greet: "I sensed your arrival three tiles ago.",          win: "Hmm. The future was less certain than I hoped." },
        { greet: "Your aura flickers with confidence.",             win: "And the flicker was right." },
        { greet: "I dreamt I would lose. So inconvenient.",         win: "At least my dreams are accurate." },
    ],
    7: [
        { greet: "Step lightly! The ice doesn't forgive.",          win: "Good footing. Good Pokemon." },
        { greet: "I trained on glaciers. You trained on grass.",    win: "Glaciers melt, I suppose." },
        { greet: "Cold sharpens reflexes -- mine, anyway.",         win: "Yours sharper still." },
        { greet: "Slipping is half the gym puzzle.",                 win: "And you slipped less than I did. Go on." },
    ],
    8: [
        { greet: "The dragon's breath is hot. So is my Charcoal.",  win: "By the scales -- impressive!" },
        { greet: "Few reach this hall. Fewer leave with the badge.", win: "You may yet be one of those few." },
        { greet: "Astra rarely battles personally. Don't disappoint.", win: "Then she will. Go." },
        { greet: "I am the last warden. Pass me, and you face her.", win: "Pass me you have." },
    ],
};

/** Build a 20x20 gym shell themed for `theme`. Returns the layout plus
 *  the door-mat coords so callers can wire portals consistently. The
 *  inner playable area is (3..16, 3..16). */
function makeGymFrame(theme: GymTheme): Layout {
    const w = 20, h = 20;
    const out: Layout = [];
    for (let y = 0; y < h; y++) {
        const row: number[] = [];
        for (let x = 0; x < w; x++) {
            const inRoom = x >= 3 && x <= 16 && y >= 2 && y <= 16;
            row.push(inRoom ? theme.floor : 1);
        }
        out.push(row);
    }
    // Door mat at south-center.
    out[17][10] = 50;
    // Channel south of the room (the door tunnels through the bottom wall).
    out[17][10] = 50;
    out[16][10] = theme.floor;
    // Side walls for the channel so it's clearly a doorway.
    out[16][9] = 1;
    out[16][11] = 1;

    // Decor on the back wall behind the leader (y=2 is interior wall row,
    // we paint decor on y=2 at flanking positions).
    out[2][6]  = theme.decor;
    out[2][8]  = theme.decor;
    out[2][12] = theme.decor;
    out[2][14] = theme.decor;
    return out;
}

/** Place a horizontal partition wall across the gym at `y` from x1..x2,
 *  with optional gaps. Used to channel the player through specific lanes
 *  guarded by mook trainers. */
function rowWall(layout: Layout, y: number, x1: number, x2: number, wallTile: number, gaps: number[] = []) {
    for (let x = x1; x <= x2; x++) {
        if (gaps.includes(x)) continue;
        layout[y][x] = wallTile;
    }
}

/** Helper: build a mook trainer record. Levels are derived from the gym
 *  leader's level so mooks are slightly weaker (-3 to -1 levels). Teams
 *  use stock Gen 1-3 species themed by the gym's type so they don't
 *  require dedicated loadout data. */
function buildGymMook(badgeId: number, mookIdx: number, leaderLevel: number, theme: GymTheme): TrainerData {
    const mookLevel = Math.max(5, leaderLevel - 3 + mookIdx);
    const teamPool: Record<number, number[]> = {
        1: [263, 270, 397, 396],            // normal: zigzagoon, lotad, starly, staravia
        2: [74, 95, 246, 304],              // rock: geodude, onix, larvitar, aron
        3: [60, 79, 116, 320],              // water: poliwag, slowpoke, horsea, wailmer
        4: [25, 81, 100, 309],              // electric: pikachu, magnemite, voltorb, electrike
        5: [23, 41, 88, 316],               // poison: ekans, zubat, grimer, gulpin
        6: [63, 96, 280, 325],              // psychic: abra, drowzee, ralts, spoink
        7: [86, 220, 361, 363],             // ice: seel, swinub, snorunt, spheal
        8: [147, 246, 371, 333],            // dragon: dratini, larvitar, bagon, swablu
    };
    const pool = teamPool[badgeId] ?? [263];
    const team = [pool[mookIdx % pool.length]];
    if (mookIdx >= 1) team.push(pool[(mookIdx + 1) % pool.length]);
    const lines = MOOK_LINES[badgeId] ?? [{ greet: "Let's battle!", win: "Good fight." }];
    const line = lines[mookIdx % lines.length];
    return {
        id: `gym${badgeId}_mook${mookIdx}`,
        name: `${theme.title} Trainer`,
        sprite: theme.mookSprite,
        team,
        level: mookLevel,
        reward: 200 + badgeId * 50,
        dialogue: line.greet,
        winDialogue: line.win,
    };
}

/** Build the gym leader trainer. Uses `getGymTeam` for loadout / level if
 *  available, falling back to a stock theme. ID is `gym_leader_<badge>`. */
function buildGymLeaderTrainer(badgeId: number): TrainerData {
    const gymLoadout = getGymTeam(badgeId);
    const fallbackThemes = [
        [263, 263], [278, 270, 60], [81, 100, 309], [43, 273, 69],
        [109, 88, 41], [63, 280, 177], [58, 77, 218], [111, 74, 50],
    ];
    const fallbackNames = [
        'Twig', 'Kai', 'Aya', 'Volk', 'Sable', 'Nyx', 'Rowan', 'Astra',
    ];
    const team = gymLoadout ? gymLoadout.loadout.map(l => l.id) : fallbackThemes[badgeId - 1];
    const level = gymLoadout ? gymLoadout.level : 15 + badgeId * 5;
    const name = gymLoadout ? `${gymLoadout.name} "${gymLoadout.title}"` : fallbackNames[badgeId - 1];
    return {
        id: `gym_leader_${badgeId}`,
        name,
        sprite: [
            `${POKE_SHOWDOWN}/brock.png`,
            `${POKE_SHOWDOWN}/misty.png`,
            `${POKE_SHOWDOWN}/lt-surge.png`,
            `${POKE_SHOWDOWN}/erika.png`,
            `${POKE_SHOWDOWN}/koga.png`,
            `${POKE_SHOWDOWN}/sabrina.png`,
            `${POKE_SHOWDOWN}/blaine.png`,
            `${POKE_SHOWDOWN}/giovanni.png`,
        ][(badgeId - 1) % 8],
        team,
        level,
        reward: badgeId * 2000,
        dialogue: "Another challenger reaches my hall. Show me your strength!",
        winDialogue: "Impressive. Take this badge.",
        isGymLeader: true,
        badgeId,
        loadout: gymLoadout ? gymLoadout.loadout : undefined,
    };
}

/** Public entry point used by App.tsx interior resolver. `defeatedIds` is
 *  the list of trainer ids the player has already beaten this run --
 *  any matching mook / leader is omitted so cleared gyms read as empty. */
export function buildGym(badgeId: number, returnTo: string, defeatedIds: string[] = []): MapZone {
    const theme = GYM_THEMES[badgeId] ?? GYM_THEMES[1];
    const layout = makeGymFrame(theme);
    const trainers: Record<string, TrainerData> = {};

    // Per-gym hand-curated layouts. Each places partition walls + mook
    // trainers so the player has to defeat them in turn to reach the leader.
    // The number of mooks scales with badge index (1 for gym 1, up to 4 for
    // gym 8). We deliberately keep most layouts walkable to avoid frustrating
    // dead-end mazes -- the *gating* comes from the trainers, not the walls.

    if (badgeId === 1) {
        // Gym 1 -- single mook on a partition. Easy intro.
        rowWall(layout, 10, 5, 14, theme.wall, [10]);
        const m1 = buildGymMook(1, 0, 15, theme);
        if (!defeatedIds.includes(m1.id)) trainers["10,11"] = m1;
    } else if (badgeId === 2) {
        // ROCK -- TWO partitions with boulder push gaps. Classic Brock
        // layout: 71 boulders the player must shove aside, 2 mooks.
        rowWall(layout, 12, 4, 15, theme.wall, [7, 13]);
        rowWall(layout,  8, 4, 15, theme.wall, [10]);
        // Boulders blocking the gaps. Players push them with the existing
        // boulder mechanic in handleMapMove; once shoved aside they unblock.
        layout[12][7]  = 71;
        layout[12][13] = 71;
        const m1 = buildGymMook(2, 0, 20, theme);
        const m2 = buildGymMook(2, 1, 20, theme);
        if (!defeatedIds.includes(m1.id)) trainers["6,10"] = m1;
        if (!defeatedIds.includes(m2.id)) trainers["14,10"] = m2;
    } else if (badgeId === 3) {
        // WATER -- ice slide entry + 2 mooks. Tile 70 is the slide tile,
        // already implemented in App.tsx handleMapMove.
        for (let x = 4; x <= 15; x++) layout[14][x] = 70;
        rowWall(layout, 10, 4, 15, theme.wall, [6, 13]);
        const m1 = buildGymMook(3, 0, 25, theme);
        const m2 = buildGymMook(3, 1, 25, theme);
        if (!defeatedIds.includes(m1.id)) trainers["6,8"] = m1;
        if (!defeatedIds.includes(m2.id)) trainers["13,8"] = m2;
    } else if (badgeId === 4) {
        // ELECTRIC -- switch & barrier puzzle.
        // Two partition rows. Each is gated by electric fences (214 / 219)
        // at the only crossing points. The fences are walls until the
        // corresponding pressure plate (213 alpha / 218 beta) is stepped on
        // -- toggling them across the entire map. Plates are placed on
        // opposite ends of the gym so the player snakes left/right between
        // partitions instead of just walking straight up.
        //
        // Layout (gaps marked):
        //
        //   y= 8 ##############     <- full wall except 6,13 = beta fences
        //         m2          m3      mid mooks gate paths north
        //   y=10 ............         floor
        //                        18  <- beta switch on right
        //   y=11 ............         floor
        //   y=13 ##############     <- full wall except 6,13 = alpha fences
        //         m1                  south mook on south of fence
        //   y=14 13 .............    <- alpha switch on left, floor
        //   y=17                     door mat at 10,17
        rowWall(layout, 13, 4, 15, theme.wall, [6, 13]);
        layout[13][6]  = 214;   // alpha fence (left gate)
        layout[13][13] = 214;   // alpha fence (right gate)
        layout[14][4]  = 213;   // alpha pressure plate (left dead-end)

        rowWall(layout,  8, 4, 15, theme.wall, [6, 13]);
        layout[8][6]   = 219;   // beta fence (left gate)
        layout[8][13]  = 219;   // beta fence (right gate)
        layout[9][15]  = 218;   // beta pressure plate (right dead-end)

        const m1 = buildGymMook(4, 0, 30, theme);
        const m2 = buildGymMook(4, 1, 30, theme);
        const m3 = buildGymMook(4, 2, 30, theme);
        // m1 stands south of the lower fence, blocking the alpha plate
        // approach -- you fight him to safely step left to the plate.
        if (!defeatedIds.includes(m1.id)) trainers["6,14"]  = m1;
        // m2 / m3 patrol the upper hall between the two partitions, gating
        // the north fences.
        if (!defeatedIds.includes(m2.id)) trainers["6,10"]  = m2;
        if (!defeatedIds.includes(m3.id)) trainers["13,10"] = m3;
    } else if (badgeId === 5) {
        // POISON -- tight, twisty corridor with 3 mooks.
        rowWall(layout, 14, 4, 15, theme.wall, [4]);
        rowWall(layout, 11, 4, 15, theme.wall, [15]);
        rowWall(layout,  8, 4, 15, theme.wall, [4]);
        rowWall(layout,  5, 4, 15, theme.wall, [15]);
        const m1 = buildGymMook(5, 0, 35, theme);
        const m2 = buildGymMook(5, 1, 35, theme);
        const m3 = buildGymMook(5, 2, 35, theme);
        if (!defeatedIds.includes(m1.id)) trainers["4,12"]  = m1;
        if (!defeatedIds.includes(m2.id)) trainers["15,9"]  = m2;
        if (!defeatedIds.includes(m3.id)) trainers["4,6"]   = m3;
    } else if (badgeId === 6) {
        // PSYCHIC -- teleport pad puzzle.
        // South room and north room are split by a complete wall at y=8
        // with NO physical gap. Two pad pairs (blue / purple) bridge the
        // wall -- stepping on a pad warps the player to the matching color
        // pad on the other side. The first partition (y=11) keeps a single
        // narrow center channel guarded by a mook so the entry funnels into
        // the pad chamber.
        //
        //   y= 4              LEADER
        //   y= 5     m2            m3       mooks gate the leader's hall
        //   y= 6     [216]      [217]       blue / purple north pads
        //   y= 8 ##################          full wall, no gap
        //   y=10     [216]      [217]       blue / purple south pads
        //   y=11 ##############              center-only gap, m1 here
        //   y=17                              door mat at 10,17
        rowWall(layout, 11, 4, 15, theme.wall, [10]);
        rowWall(layout,  8, 4, 15, theme.wall);                 // solid wall

        layout[10][6]  = 216;  // blue pad (south)
        layout[6][6]   = 216;  // blue pad (north) -- pair of 216
        layout[10][13] = 217;  // purple pad (south)
        layout[6][13]  = 217;  // purple pad (north) -- pair of 217

        const m1 = buildGymMook(6, 0, 40, theme);
        const m2 = buildGymMook(6, 1, 40, theme);
        const m3 = buildGymMook(6, 2, 40, theme);
        if (!defeatedIds.includes(m1.id)) trainers["10,10"] = m1; // center gate
        if (!defeatedIds.includes(m2.id)) trainers["6,5"]   = m2; // blue exit
        if (!defeatedIds.includes(m3.id)) trainers["13,5"]  = m3; // purple exit
    } else if (badgeId === 7) {
        // ICE -- big slide field plus 4 mooks. The slides do most of the
        // puzzle work, mooks gate the exits of slide regions.
        for (let y = 8; y <= 14; y++) {
            for (let x = 4; x <= 15; x++) {
                if ((x + y) % 2 === 0) layout[y][x] = 70;
            }
        }
        rowWall(layout, 7, 4, 15, theme.wall, [6, 13]);
        const m1 = buildGymMook(7, 0, 45, theme);
        const m2 = buildGymMook(7, 1, 45, theme);
        const m3 = buildGymMook(7, 2, 45, theme);
        const m4 = buildGymMook(7, 3, 45, theme);
        if (!defeatedIds.includes(m1.id)) trainers["6,5"]   = m1;
        if (!defeatedIds.includes(m2.id)) trainers["13,5"]  = m2;
        if (!defeatedIds.includes(m3.id)) trainers["4,15"]  = m3;
        if (!defeatedIds.includes(m4.id)) trainers["15,15"] = m4;
    } else if (badgeId === 8) {
        // DRAGON -- grand throne room. 4 mooks at the cardinal partitions.
        rowWall(layout, 13, 4, 15, theme.wall, [10]);
        rowWall(layout,  9, 4, 15, theme.wall, [6, 13]);
        rowWall(layout,  6, 4, 15, theme.wall, [10]);
        const m1 = buildGymMook(8, 0, 50, theme);
        const m2 = buildGymMook(8, 1, 50, theme);
        const m3 = buildGymMook(8, 2, 50, theme);
        const m4 = buildGymMook(8, 3, 50, theme);
        if (!defeatedIds.includes(m1.id)) trainers["10,14"] = m1;
        if (!defeatedIds.includes(m2.id)) trainers["6,11"]  = m2;
        if (!defeatedIds.includes(m3.id)) trainers["13,11"] = m3;
        if (!defeatedIds.includes(m4.id)) trainers["10,7"]  = m4;
    }

    // Leader at the back. If already beaten, replace with a Council NPC
    // so re-entering a cleared gym still feels alive.
    const leaderId = `gym_leader_${badgeId}`;
    const leaderDefeated = defeatedIds.includes(leaderId);
    const npcs: Record<string, NPCData> = {};
    if (!leaderDefeated) {
        trainers["10,4"] = buildGymLeaderTrainer(badgeId);
    } else {
        npcs["10,4"] = {
            id: `gym_council_${badgeId}`,
            name: `${GYM_THEMES[badgeId]?.title ?? 'Gym'} Steward`,
            sprite: SPRITE.elder,
            facing: 'down',
            dialogue: [
                `You've already earned this gym's badge.`,
                `Train hard for what comes next, challenger.`,
            ],
        };
    }
    // A "ribbon line" of decor on the floor leading from door mat to leader
    // makes the path obvious and looks ceremonial.
    layout[15][10] = theme.decor;

    return {
        id: `interior:gym:${badgeId}`,
        name: theme.title,
        layout,
        portals: { "10,17": returnTo },
        wildLevelRange: [0, 0],
        npcs,
        trainers,
        interactables: {
            "10,3": { type: 'object', text: [
                `A plaque for the ${theme.title}.`,
                leaderDefeated
                    ? `Etched: "Cleared. Badge claimed."`
                    : `Etched: "Defeat the leader. Earn the badge. Earn your way."`,
            ]},
        },
        biome: 'gym',
    };
}

export type InteriorKind = 'center' | 'mart' | 'house' | 'gym';

/** Materialize an interior MapZone. `seed` is a stable per-instance key
 *  (e.g. "c_3_-2_11_7" for a building at chunk (3,-2) with door at
 *  (11,7)). For gyms the seed IS the badge id (string).
 *  `returnTo` is the portal destination string the door mat exits to.
 *  `defeatedIds` is forwarded to gym builds for trainer culling.
 */
export function resolveInterior(kind: InteriorKind, seed: string, returnTo: string, defeatedIds: string[] = []): MapZone {
    switch (kind) {
        case 'center': return buildCenter(seed, returnTo, 'Pokemon Center');
        case 'mart':   return buildMart(seed, returnTo, 'Poke Mart');
        case 'house':  return buildHouse(seed, returnTo);
        case 'gym':    return buildGym(parseInt(seed, 10), returnTo, defeatedIds);
    }
}

/** Helper used by mapData chunk generation to build a portal destination
 *  string with a stable per-instance seed. Door x/y are the tile coords of
 *  the door mat in the outdoor chunk so re-entering the same building gives
 *  the same interior contents. */
export function interiorPortal(kind: InteriorKind, cx: number, cy: number, dx: number, dy: number): string {
    return `interior:${kind}:c_${cx}_${cy}_${dx}_${dy},9,10`;
}

/** Build a gym portal pointing at the gym interior for a given badge.
 *  The interior's seed IS the badge id (1-8), so the cache hit is global
 *  rather than per-instance like houses/marts -- there is exactly one
 *  Pewter Gym in the world even if its building is rendered in chunk
 *  (cx,cy). */
export function gymPortal(badgeId: number): string {
    return `interior:gym:${badgeId},10,17`;
}
