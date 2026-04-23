/**
 * Rift Atelier v2 -- meta progression definitions.
 *
 * Single source of truth for every Talent, Keystone and Vault unlock
 * in the game. The Rift Atelier UI reads from these tables directly;
 * `App.tsx` uses the helper accessors (`hasTalent`, `getKeystoneLevel`,
 * `hasVaultUnlock`) at every effect site so adding / tuning an entry
 * here propagates to both UI and gameplay without any other change.
 *
 * Why three branches?
 *   - Talents  -> run-defining, one-time flags (Essence only, cheap-ish)
 *   - Keystones -> tiered stat tracks (Essence only, level 0..cap)
 *   - Vault    -> expensive utility + "chase" battle mechanics that
 *                 also require rare Rift Tokens on top of Essence.
 *
 * Old saves stored these as `meta.upgrades.*`. See `migrateMeta()` at
 * the bottom of this file for the one-shot conversion.
 */

import type { MetaState } from '../types';

// --- Icon helper -----------------------------------------------------------
const itemIcon = (slug: string) =>
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;

// ---------------------------------------------------------------------------
// TALENTS -- one-time "run-shaping" unlocks. Essence only. Cheap-ish.
// ---------------------------------------------------------------------------
export interface TalentDef {
    id: string;
    name: string;
    desc: string;
    flavor: string;
    cost: number;          // essence
    icon: string;
    accent: string;
    requires?: string[];   // other talent ids that must be owned first
}
export const TALENTS: TalentDef[] = [
    {
        id: 'wild_instinct',
        name: 'Wild Instinct',
        desc: 'Start every run with a pinned Catch Combo on your starter species (count = 0 but tracking is live).',
        flavor: 'Chain from the first step.',
        cost: 40,
        icon: itemIcon('catching-charm'),
        accent: '#a78bfa',
    },
    {
        id: 'aura_sight',
        name: 'Aura Sight',
        desc: 'Alpha and Anomaly grass tiles glow with a beacon of light, visible across the overworld. Pick your fights.',
        flavor: 'The air starts to speak to you.',
        cost: 60,
        icon: itemIcon('odd-incense'),
        accent: '#22d3ee',
    },
    {
        id: 'bounty_broker',
        name: "Bounty Broker",
        desc: 'Trainer Guild boards roll 4 bounties instead of 3 and show one extra reroll per visit.',
        flavor: 'The Guild knows your name now.',
        cost: 50,
        icon: itemIcon('guard-spec'),
        accent: '#34d399',
    },
    {
        id: 'second_wind',
        name: 'Second Wind',
        desc: 'Once per run, the first time your whole team faints, your lead is revived to 50% HP instead (not a death).',
        flavor: 'You are not done yet.',
        cost: 80,
        icon: itemIcon('revival-herb'),
        accent: '#fb923c',
    },
    {
        id: 'sync_inherit',
        name: 'Synchrony',
        desc: 'Nature of your first catch per run is forced to match your starter. Huge for Modest / Adamant runs.',
        flavor: 'Discipline spreads.',
        cost: 55,
        icon: itemIcon('soothe-bell'),
        accent: '#f472b6',
    },
    {
        id: 'rift_catalyst',
        name: 'Rift Catalyst',
        desc: 'Combo Meter starts every battle at 25 instead of 0. Fusions come online sooner.',
        flavor: 'Even silence now hums.',
        cost: 90,
        icon: itemIcon('power-herb'),
        accent: '#c084fc',
    },
    {
        id: 'held_legacy',
        name: 'Held Legacy',
        desc: "Pokémon you catch roll a held-item 25% of the time (normally 0%). Starters included.",
        flavor: 'Everyone comes prepared.',
        cost: 45,
        icon: itemIcon('silk-scarf'),
        accent: '#fbbf24',
    },
    {
        id: 'rift_ledger',
        name: 'Rift Ledger',
        desc: 'All Rift Token awards are doubled in the first hour of a new run.',
        flavor: 'The ink is still wet.',
        cost: 100,
        icon: itemIcon('smoke-ball'),
        accent: '#67e8f9',
    },
];

// ---------------------------------------------------------------------------
// KEYSTONES -- tiered stat/utility boosts. Essence only. Level 0..cap.
// ---------------------------------------------------------------------------
// Consolidates the old 15 "slider" upgrades into 6 THEMED tracks so
// each level feels meaningful (no more +5% crit alone). Every keystone
// has a `cap` and a cost curve; costs escalate. `effects` on a given
// level can be queried via the helpers below.
export interface KeystoneDef {
    id: string;
    name: string;
    /** Renamed conceptually; legacy upgrade keys it absorbed (for migration). */
    absorbs: string[];
    desc: string;
    perLevel: string;   // short "+X per level" string for UI
    cost: number;       // base; scales by 1.5^level
    cap: number;
    icon: string;
    accent: string;
}
export const KEYSTONES: KeystoneDef[] = [
    {
        id: 'warden_crest',
        name: 'Warden Crest',
        absorbs: ['attackBoost', 'defenseBoost', 'critBoost'],
        desc: 'Combat mastery. Raises outgoing damage, cuts incoming damage, and sharpens crits. The whole track feeds your damage formula.',
        perLevel: '+5% dmg dealt · -5% dmg taken · +2% crit chance',
        cost: 30,
        cap: 6,
        icon: itemIcon('muscle-band'),
        accent: '#ef4444',
    },
    {
        id: 'swift_ring',
        name: 'Swift Ring',
        absorbs: ['speedBoost', 'healingBoost'],
        desc: 'Footwork and recovery. Your team moves faster in battle and healing items hit harder.',
        perLevel: '+5% speed · +5% healing',
        cost: 20,
        cap: 6,
        icon: itemIcon('swift-wing'),
        accent: '#22d3ee',
    },
    {
        id: 'essence_purse',
        name: 'Essence Purse',
        absorbs: ['essenceMultiplier', 'xpMultiplier', 'startingMoney'],
        desc: 'Run economy. More Essence per win, more XP per KO, and a fatter starting wallet.',
        perLevel: '+10% essence · +10% XP · +$300 start',
        cost: 30,
        cap: 6,
        icon: itemIcon('amulet-coin'),
        accent: '#fbbf24',
    },
    {
        id: 'rift_stability',
        name: 'Rift Stability',
        absorbs: ['riftStability'],
        desc: 'The world scales up more slowly. Each level shaves 10% off distance-based difficulty growth.',
        perLevel: '-10% scaling pressure',
        cost: 40,
        cap: 5,
        icon: itemIcon('timer-ball'),
        accent: '#fb923c',
    },
    {
        id: 'catchers_kit',
        name: "Catcher's Kit",
        absorbs: ['captureBoost', 'shinyChance', 'startingPermits'],
        desc: 'Everything a collector needs. Higher catch rate, better shiny odds, extra starting permits.',
        perLevel: '+5% catch · +1 shiny tier · +1 permit start (max 3)',
        cost: 30,
        cap: 6,
        icon: itemIcon('catching-charm'),
        accent: '#a78bfa',
    },
    {
        id: 'scavenger_cache',
        name: 'Scavenger Cache',
        absorbs: ['lootQuality', 'mercenaryGuild', 'evolutionaryInsight'],
        desc: 'Loot and shops. Drops skew rarer, shops get cheaper, and every run starts with a small stash.',
        perLevel: '+15% drop chance · -4% shop prices · +1 start item',
        cost: 25,
        cap: 6,
        icon: itemIcon('dowsing-machine'),
        accent: '#38bdf8',
    },
];

// ---------------------------------------------------------------------------
// VAULT -- the "chase" tier. Every entry costs Rift Tokens + Essence.
// ---------------------------------------------------------------------------
export interface VaultDef {
    id: string;
    name: string;
    desc: string;
    flavor: string;
    tokenCost: number;
    essenceCost: number;
    tier: 'utility' | 'mechanic';
    icon: string;
    accent: string;
    /** Owned talents / vault unlocks required before this shows as buyable. */
    requires?: string[];
}
export const VAULT: VaultDef[] = [
    // --- Utility tier (small, quality-of-life) ---
    {
        id: 'field_theorist',
        name: 'Field Theorist',
        desc: 'Weather AND terrain you set last +2 turns. Your rain, your problem.',
        flavor: 'The sky answers when you call.',
        tokenCost: 2,
        essenceCost: 80,
        tier: 'utility',
        icon: itemIcon('damp-rock'),
        accent: '#0ea5e9',
    },
    {
        id: 'fusion_glossary',
        name: 'Fusion Glossary',
        desc: 'The Pause menu gains a FUSION CODEX page revealing every valid recipe in the game. No more blind experimenting.',
        flavor: 'The pages fill themselves.',
        tokenCost: 3,
        essenceCost: 100,
        tier: 'utility',
        icon: itemIcon('pair-of-tickets'),
        accent: '#22d3ee',
    },
    {
        id: 'quick_swap',
        name: 'Quick Swap',
        desc: 'After defeating an enemy Pokémon, your next switch that turn costs zero tempo (enemy has already been removed).',
        flavor: 'You move before they collapse.',
        tokenCost: 4,
        essenceCost: 140,
        tier: 'utility',
        icon: itemIcon('eject-button'),
        accent: '#84cc16',
    },
    {
        id: 'team_slot_7',
        name: 'Seventh Seal',
        desc: 'Your roster can hold a 7th reserve Pokémon. Your active party in battle still deploys six at most.',
        flavor: 'There was always a seventh.',
        tokenCost: 6,
        essenceCost: 220,
        tier: 'utility',
        icon: itemIcon('great-ball'),
        accent: '#7dd3fc',
    },

    // --- Mechanic tier (the marquee chase unlocks) ---
    {
        id: 'tera',
        name: 'Terastallization',
        desc: 'In battle, pay your Tera crystal (one per Pokémon per battle) to override that mon\'s type with a single Tera type. 2x STAB on the new type; defensive typing becomes the new type only.',
        flavor: 'Your soul is a single gem.',
        tokenCost: 10,
        essenceCost: 250,
        tier: 'mechanic',
        icon: itemIcon('gold-bottle-cap'),
        accent: '#c084fc',
    },
    {
        id: 'mega',
        name: 'Mega Evolution',
        desc: 'Once per battle, a held Mega Stone lets one Pokémon power up for the rest of the fight: +30% Atk / Sp.Atk, +20% Def / Sp.Def.',
        flavor: 'A bond is a key.',
        tokenCost: 12,
        essenceCost: 300,
        tier: 'mechanic',
        icon: itemIcon('mega-stone'),
        accent: '#f472b6',
    },
    {
        id: 'zmove',
        name: 'Z-Moves',
        desc: 'Once per battle, charge a Z-crystal to turn your next attack into a Z-Move: 1.8x damage, cannot miss, pierces Protect.',
        flavor: 'One move to say everything.',
        tokenCost: 10,
        essenceCost: 250,
        tier: 'mechanic',
        icon: itemIcon('z-ring'),
        accent: '#fbbf24',
    },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

export function hasTalent(meta: MetaState | undefined, id: string): boolean {
    return !!meta?.talents?.includes(id);
}

export function hasVaultUnlock(meta: MetaState | undefined, id: string): boolean {
    return !!meta?.vaultUnlocks?.includes(id);
}

/**
 * Returns the current keystone level (0..cap). Respects legacy `upgrades`
 * entries for any pre-migration save that still has them -- we take the
 * MAX over the legacy tracks the keystone absorbed. Intended to be the
 * *only* way gameplay code reads stat-upgrade levels.
 */
export function getKeystoneLevel(meta: MetaState | undefined, id: string): number {
    if (!meta) return 0;
    const explicit = meta.keystones?.[id];
    if (typeof explicit === 'number' && explicit > 0) return explicit;
    const def = KEYSTONES.find(k => k.id === id);
    if (!def || !meta.upgrades) return explicit ?? 0;
    let best = 0;
    for (const key of def.absorbs) {
        const v = (meta.upgrades as any)[key];
        if (typeof v === 'number' && v > best) best = v;
    }
    return best;
}

/** Keystone cost for a purchase from `level` -> `level+1`. Scales 1.5x. */
export function getKeystoneCost(def: KeystoneDef, level: number): number {
    return Math.floor(def.cost * Math.pow(1.5, level));
}

/** Total essence that has been invested into this keystone so far. */
export function getKeystoneSpent(def: KeystoneDef, level: number): number {
    let total = 0;
    for (let i = 0; i < level; i++) total += getKeystoneCost(def, i);
    return total;
}

/** Refract (refund) rate. 80% of essence spent is returned. */
export const REFRACT_RATE = 0.8;

// ---------------------------------------------------------------------------
// LEGACY-UPGRADE TRANSLATIONS (used by gameplay code that still reads
// specific stat numbers: the percentages for old upgrades lived "outside"
// the data file. Keystone levels are denominated in the NEW curves --
// see the `perLevel` text and the helpers below.)
//
// Gameplay code in App.tsx should call these instead of raw level math
// so tuning changes here propagate everywhere.
// ---------------------------------------------------------------------------

// NB: damage and speed formulas are applied inside `calculateDamage` in
// services/pokeService.ts, which uses a fixed per-level slope (5% dmg,
// 5% dmg taken, 2% crit, 5% speed). We pass the keystone level directly
// so the UI text stays honest. Changing those formulas lives in pokeService.
export function warden_level(meta: MetaState | undefined): number {
    return getKeystoneLevel(meta, 'warden_crest');
}
export function swift_level(meta: MetaState | undefined): number {
    return getKeystoneLevel(meta, 'swift_ring');
}
export function swift_healMult(meta: MetaState | undefined): number {
    const l = getKeystoneLevel(meta, 'swift_ring');
    return 1 + l * 0.05;
}
export function purse_essenceMult(meta: MetaState | undefined): number {
    const l = getKeystoneLevel(meta, 'essence_purse');
    return 1 + l * 0.1;
}
export function purse_xpMult(meta: MetaState | undefined): number {
    const l = getKeystoneLevel(meta, 'essence_purse');
    return 1 + l * 0.1;
}
export function purse_startingMoney(meta: MetaState | undefined): number {
    const l = getKeystoneLevel(meta, 'essence_purse');
    return 500 + l * 300;
}
export function stability_scalingMult(meta: MetaState | undefined): number {
    const l = getKeystoneLevel(meta, 'rift_stability');
    return 1 - l * 0.1;
}
export function catchers_catchMult(meta: MetaState | undefined): number {
    const l = getKeystoneLevel(meta, 'catchers_kit');
    return 1 + l * 0.05;
}
export function catchers_shinyTier(meta: MetaState | undefined): number {
    return getKeystoneLevel(meta, 'catchers_kit');
}
export function catchers_permitBonus(meta: MetaState | undefined): number {
    return Math.min(3, getKeystoneLevel(meta, 'catchers_kit'));
}
export function scavenger_dropBonus(meta: MetaState | undefined): number {
    const l = getKeystoneLevel(meta, 'scavenger_cache');
    return l * 0.15;
}
export function scavenger_shopDiscount(meta: MetaState | undefined): number {
    // Returns a LEVEL-like number so existing ShopMenu math keeps working.
    // Old shop logic consumed `discount` as `upgrades.evolutionaryInsight`
    // multiplied internally -- we route keystone level in there.
    return getKeystoneLevel(meta, 'scavenger_cache');
}
export function scavenger_startItems(meta: MetaState | undefined): number {
    return Math.min(3, getKeystoneLevel(meta, 'scavenger_cache'));
}

// ---------------------------------------------------------------------------
// TOKEN AWARD TABLE
// ---------------------------------------------------------------------------
// Centralised so the UI can show the earn-rates on the Vault tab and the
// gameplay code reads the same numbers.
export const TOKEN_AWARDS = {
    gymLeader: 2,
    rivalMilestone: 3,
    alphaCatch: 1,
    anomalyCatch: 1,
    outbreakFirstEncounter: 1,
    riftTrialClear: 2,
    championClear: 10, // for the "Rift Champion" E4-equivalent capstone
} as const;

// ---------------------------------------------------------------------------
// MIGRATION -- v1 -> v2 meta state
// ---------------------------------------------------------------------------

export function emptyMeta(): MetaState {
    return {
        riftEssence: 0,
        riftTokens: 0,
        unlockedStarters: [1, 4, 7, 25, 133],
        unlockedPacks: [],
        mainQuestProgress: { currentQuestId: 'q1', completedQuests: [] },
        talents: [],
        vaultUnlocks: [],
        keystones: {},
    };
}

/**
 * Translate a pre-v2 MetaState into the new shape. Idempotent: safe to
 * run on an already-migrated save. Preserves essence, packs, starters
 * and quest progress verbatim.
 */
export function migrateMeta(meta: MetaState | undefined): MetaState {
    const base = emptyMeta();
    if (!meta) return base;
    const out: MetaState = {
        ...base,
        ...meta,
        talents: Array.isArray(meta.talents) ? meta.talents : [],
        vaultUnlocks: Array.isArray(meta.vaultUnlocks) ? meta.vaultUnlocks : [],
        keystones: { ...(meta.keystones || {}) },
        riftTokens: typeof meta.riftTokens === 'number' ? meta.riftTokens : 0,
    };
    // Fold legacy `upgrades.*` values into keystones if they haven't
    // already been translated. We take the MAX value over all absorbed
    // tracks because the player "bought 5 ranks of muscle band" should
    // map to "5 ranks of Warden Crest", not 15.
    if (meta.upgrades) {
        let migrated = false;
        for (const def of KEYSTONES) {
            if (out.keystones[def.id] && out.keystones[def.id] > 0) continue;
            let best = 0;
            for (const key of def.absorbs) {
                const v = (meta.upgrades as any)[key];
                if (typeof v === 'number' && v > best) best = Math.min(def.cap, v);
            }
            if (best > 0) {
                out.keystones[def.id] = best;
                migrated = true;
            }
        }
        if (migrated) {
            // Clear legacy upgrades after folding so new writes stay clean.
            out.upgrades = {
                startingMoney: 0, attackBoost: 0, defenseBoost: 0, xpMultiplier: 0,
                startingPermits: 0, shinyChance: 0, lootQuality: 0, riftStability: 0,
                mercenaryGuild: 0, evolutionaryInsight: 0, speedBoost: 0, critBoost: 0,
                healingBoost: 0, captureBoost: 0, essenceMultiplier: 0,
            };
        }
    }
    return out;
}
