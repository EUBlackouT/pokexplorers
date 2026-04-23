/**
 * Competitive gym leader loadouts.
 *
 * Each team is intentionally built around the fusion/sync mechanic -- every
 * gym has at least one "fusion core" pair whose primary types produce a
 * powerful FUSION_CHART entry, and at least one ability from NEW_ABILITIES
 * that rewards the link. Abilities and moves listed here are applied on top
 * of whatever fetchPokemon built, via applyGymLoadout.
 *
 * Levels scale: gym 1 = 15, gym 2 = 20, ..., gym 8 = 50. Per-mon levelDelta
 * lets us keep an "ace" one tier above the rest.
 */

import { GymMonLoadout } from '../types';

export interface GymTeam {
    badgeId: number;
    name: string;
    title: string;
    type: string;
    level: number;
    loadout: GymMonLoadout[];
}

const LEFTOVERS = { id: 'leftovers', name: 'Leftovers' };
const LIFE_ORB = { id: 'life-orb', name: 'Life Orb' };
const CHOICE_BAND = { id: 'choice-band', name: 'Choice Band' };
const CHOICE_SPECS = { id: 'choice-specs', name: 'Choice Specs' };
const CHOICE_SCARF = { id: 'choice-scarf', name: 'Choice Scarf' };
const FOCUS_SASH = { id: 'focus-sash', name: 'Focus Sash' };
const ASSAULT_VEST = { id: 'assault-vest', name: 'Assault Vest' };
const EXPERT_BELT = { id: 'expert-belt', name: 'Expert Belt' };
const SITRUS_BERRY = { id: 'sitrus-berry', name: 'Sitrus Berry' };
const LUM_BERRY = { id: 'lum-berry', name: 'Lum Berry' };

// --- Gym 1: Twig & Toby -- "The Symmetric Raccoons" ------------------------
// Signature gimmick: twin Zigzagoon with the Symmetry ability each holding a
// Sitrus Berry. As either one drops below 50% HP, Sitrus fires + Symmetry
// heals the ally for the same amount -- a self-sustaining berry economy.
// Linoone follows up with Buddy Berry support so hanging on to that Lum Berry
// feels even stickier, and the Mightyena ace cleans up with Jetstream speed.
const GYM_1: GymTeam = {
    badgeId: 1,
    name: 'Twig',
    title: 'Symmetric Raccoons',
    type: 'normal',
    level: 15,
    loadout: [
        {
            id: 263, // Zigzagoon A
            ability: 'Symmetry',
            heldItem: SITRUS_BERRY,
            ensureMoves: ['headbutt', 'tackle', 'sand-attack', 'Normal Wave of Quick Step'],
        },
        {
            id: 263, // Zigzagoon B -- mirror of A, the symmetry pair
            ability: 'Symmetry',
            heldItem: SITRUS_BERRY,
            ensureMoves: ['headbutt', 'tackle', 'sand-attack', 'Normal Wave of Quick Step'],
        },
        {
            id: 264, // Linoone -- keeps the berry loop going and applies pressure
            ability: 'BuddyBerry',
            heldItem: LUM_BERRY,
            ensureMoves: ['extreme-speed', 'headbutt', 'belly-drum', 'rest'],
        },
        {
            id: 262, // Mightyena -- ACE, Jetstream sweeper
            ability: 'Jetstream',
            heldItem: LIFE_ORB,
            ensureMoves: ['crunch', 'play-rough', 'sucker-punch', 'Dark Wave'],
            levelDelta: +2,
        },
    ],
};

// --- Gym 2: Kai -- Rock/Ground, fusion core: Onix + Rhydon (Rock+Ground fusion) ---
const GYM_2: GymTeam = {
    badgeId: 2,
    name: 'Kai',
    title: 'Stone Ward',
    type: 'rock',
    level: 20,
    loadout: [
        {
            id: 74, // Geodude
            ability: 'IronBlood',
            heldItem: FOCUS_SASH,
            ensureMoves: ['Stealth Rock', 'earthquake', 'rock-slide', 'Basalt Burst'],
        },
        {
            id: 95, // Onix -- rock/ground fusion lead
            ability: 'HeavyStance',
            heldItem: LEFTOVERS,
            ensureMoves: ['stone-edge', 'earthquake', 'iron-tail', 'Stealth Rock'],
        },
        {
            id: 112, // Rhydon -- fusion partner
            ability: 'TremorSense',
            heldItem: LIFE_ORB,
            ensureMoves: ['earthquake', 'stone-edge', 'megahorn', 'Basalt Burst'],
        },
        {
            id: 76, // Golem -- ACE, ground/rock
            ability: 'AnchorSync',
            heldItem: CHOICE_BAND,
            ensureMoves: ['earthquake', 'stone-edge', 'Basalt Burst', 'explosion'],
            levelDelta: +2,
        },
    ],
};

// --- Gym 3: Aya -- Water/Ice, rain+freeze synergy ---
const GYM_3: GymTeam = {
    badgeId: 3,
    name: 'Aya',
    title: 'Tide Oracle',
    type: 'water',
    level: 25,
    loadout: [
        {
            id: 186, // Politoed -- rain setter
            ability: 'RainDishPlus',
            heldItem: LEFTOVERS,
            ensureMoves: ['Rain Dance', 'hydro-pump', 'ice-beam', 'focus-blast'],
        },
        {
            id: 91, // Cloyster
            ability: 'FrostbiteSkin',
            heldItem: LIFE_ORB,
            ensureMoves: ['Permafrost Ray', 'hydro-pump', 'rock-blast', 'Water Wave'],
        },
        {
            id: 121, // Starmie
            ability: 'Battery',
            heldItem: CHOICE_SPECS,
            ensureMoves: ['hydro-pump', 'psychic', 'thunderbolt', 'Water Wave'],
        },
        {
            id: 131, // Lapras -- ACE
            ability: 'SoulLink',
            heldItem: ASSAULT_VEST,
            ensureMoves: ['surf', 'Permafrost Ray', 'thunderbolt', 'freeze-dry'],
            levelDelta: +2,
        },
    ],
};

// --- Gym 4: Volk -- Electric, speed+sync engine ---
const GYM_4: GymTeam = {
    badgeId: 4,
    name: 'Volk',
    title: 'Live Wire',
    type: 'electric',
    level: 30,
    loadout: [
        {
            id: 101, // Electrode -- lead, sets up
            ability: 'ArcSurge',
            heldItem: FOCUS_SASH,
            ensureMoves: ['Electric Terrain', 'thunder-wave', 'explosion', 'thunderbolt'],
        },
        {
            id: 26, // Raichu
            ability: 'Overclock',
            heldItem: LIFE_ORB,
            ensureMoves: ['Arc Cannon', 'thunderbolt', 'grass-knot', 'focus-blast'],
        },
        {
            id: 135, // Jolteon
            ability: 'SyncPulse',
            heldItem: CHOICE_SPECS,
            ensureMoves: ['thunderbolt', 'Arc Cannon', 'shadow-ball', 'volt-switch'],
        },
        {
            id: 145, // Zapdos -- ACE
            ability: 'StormRider',
            heldItem: LEFTOVERS,
            ensureMoves: ['thunderbolt', 'hurricane', 'heat-wave', 'roost'],
            levelDelta: +3,
        },
    ],
};

// --- Gym 5: Sable -- Poison/Dark, attrition + status ---
const GYM_5: GymTeam = {
    badgeId: 5,
    name: 'Sable',
    title: 'Venom Harlequin',
    type: 'poison',
    level: 35,
    loadout: [
        {
            id: 110, // Weezing -- sets
            ability: 'VenomousAura',
            heldItem: LEFTOVERS,
            ensureMoves: ['Toxic', 'sludge-bomb', 'will-o-wisp', 'fire-blast'],
        },
        {
            id: 94, // Gengar
            ability: 'HexDrive',
            heldItem: CHOICE_SPECS,
            ensureMoves: ['shadow-ball', 'sludge-bomb', 'Dark Wave', 'focus-blast'],
        },
        {
            id: 169, // Crobat
            ability: 'Jetstream',
            heldItem: LIFE_ORB,
            ensureMoves: ['cross-poison', 'brave-bird', 'u-turn', 'super-fang'],
        },
        {
            id: 630, // Mandibuzz -- ACE
            ability: 'GrimRecovery',
            heldItem: LEFTOVERS,
            ensureMoves: ['foul-play', 'roost', 'Dark Wave', 'Toxic'],
            levelDelta: +3,
        },
    ],
};

// --- Gym 6: Nyx -- Ghost/Psychic, sync gauge abuse ---
const GYM_6: GymTeam = {
    badgeId: 6,
    name: 'Nyx',
    title: 'Dream Conduit',
    type: 'psychic',
    level: 40,
    loadout: [
        {
            id: 65, // Alakazam
            ability: 'SyncStrike',
            heldItem: LIFE_ORB,
            ensureMoves: ['psychic', 'shadow-ball', 'focus-blast', 'Mind Fracture'],
        },
        {
            id: 282, // Gardevoir -- fusion partner (Psychic/Fairy)
            ability: 'Resonance',
            heldItem: CHOICE_SPECS,
            ensureMoves: ['psychic', 'moonblast', 'Mind Fracture', 'Soul Resonance'],
        },
        {
            id: 477, // Dusknoir
            ability: 'GrimRecovery',
            heldItem: LEFTOVERS,
            ensureMoves: ['shadow-punch', 'earthquake', 'ice-punch', 'trick-room'],
        },
        {
            id: 609, // Chandelure -- ACE
            ability: 'AshenBody',
            heldItem: CHOICE_SCARF,
            ensureMoves: ['shadow-ball', 'fire-blast', 'energy-ball', 'Soul Resonance'],
            levelDelta: +3,
        },
    ],
};

// --- Gym 7: Rowan -- Ice/Steel, fortress & tempo ---
const GYM_7: GymTeam = {
    badgeId: 7,
    name: 'Rowan',
    title: 'Frozen Bastion',
    type: 'ice',
    level: 45,
    loadout: [
        {
            id: 473, // Mamoswine
            ability: 'HeavyStance',
            heldItem: LIFE_ORB,
            ensureMoves: ['earthquake', 'icicle-crash', 'rock-slide', 'ice-shard'],
        },
        {
            id: 375, // Metang -- steel fusion partner
            ability: 'FusionMaster',
            heldItem: EXPERT_BELT,
            ensureMoves: ['meteor-mash', 'Iron Waltz', 'zen-headbutt', 'ice-punch'],
        },
        {
            id: 478, // Froslass
            ability: 'FrostbiteSkin',
            heldItem: FOCUS_SASH,
            ensureMoves: ['Permafrost Ray', 'shadow-ball', 'destiny-bond', 'Spikes'],
        },
        {
            id: 376, // Metagross -- ACE (Steel/Psychic)
            ability: 'HarmonyEngine',
            heldItem: ASSAULT_VEST,
            ensureMoves: ['meteor-mash', 'Iron Waltz', 'psychic', 'earthquake'],
            levelDelta: +3,
        },
    ],
};

// --- Gym 8: Astra -- Dragon/Champion, full fusion engine ---
const GYM_8: GymTeam = {
    badgeId: 8,
    name: 'Astra',
    title: 'Skybreaker Champion',
    type: 'dragon',
    level: 50,
    loadout: [
        {
            id: 130, // Gyarados -- lead, sets tempo
            ability: 'Jetstream',
            heldItem: LIFE_ORB,
            ensureMoves: ['waterfall', 'crunch', 'Dragon Dance', 'ice-fang'],
        },
        {
            id: 149, // Dragonite -- fusion anchor
            ability: 'FusionMaster',
            heldItem: LEFTOVERS,
            ensureMoves: ['Aether Roar', 'Dragon Dance', 'earthquake', 'extreme-speed'],
        },
        {
            id: 373, // Salamence -- fusion partner (Dragon/Flying with Dragonite)
            ability: 'HarmonyEngine',
            heldItem: LIFE_ORB,
            ensureMoves: ['Aether Roar', 'Crosswind', 'earthquake', 'Dragon Dance'],
        },
        {
            id: 445, // Garchomp
            ability: 'TremorSense',
            heldItem: CHOICE_BAND,
            ensureMoves: ['earthquake', 'Aether Roar', 'stone-edge', 'Swords Dance'],
        },
        {
            id: 635, // Hydreigon -- ACE
            ability: 'Feedback',
            heldItem: CHOICE_SPECS,
            ensureMoves: ['Aether Roar', 'Dark Wave', 'flamethrower', 'earth-power'],
            levelDelta: +4,
        },
    ],
};

const GYMS: Record<number, GymTeam> = {
    1: GYM_1, 2: GYM_2, 3: GYM_3, 4: GYM_4,
    5: GYM_5, 6: GYM_6, 7: GYM_7, 8: GYM_8,
};

export const getGymTeam = (badgeId: number): GymTeam | null =>
    GYMS[badgeId] ?? null;

export const getAllGymTeams = (): GymTeam[] =>
    Object.values(GYMS).sort((a, b) => a.badgeId - b.badgeId);
