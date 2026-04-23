
/**
 * Bounty system for the Trainer's Guild. A Guild Clerk NPC inside any
 * Pokémon Center posts a rotating set of 3 bounties; players claim
 * rewards once completion conditions are met. Bounties are intentionally
 * bite-sized so they feel achievable in one or two chunks of travel and
 * stay relevant as the player explores between gyms.
 *
 * Scaling: reward money and item tier rise with bounty `tier` (common /
 * rare / epic). Epic bounties rarely roll and gate the fusion-tier held
 * items (chrono-prism, harmony-bell, rift-shard, etc.) so there's a clear
 * "premium" path distinct from the everyday cash grind.
 */

export type BountyTier = 'common' | 'rare' | 'epic';

export type BountyKind =
    | 'catch_type'          // Catch N Pokémon of type T
    | 'catch_any'           // Catch any N Pokémon
    | 'catch_combo'         // Reach a catch-combo of N on any species
    | 'defeat_trainers'     // Defeat N trainers in the wild
    | 'visit_biomes'        // Visit N distinct biomes
    | 'rift_distance';      // Travel N chunks from origin (maxDistanceReached)

export interface BountyTemplate {
    id: string;
    kind: BountyKind;
    tier: BountyTier;
    /** Produces a concrete description + targetCount for a fresh bounty roll. */
    materialize: (ctx: { playerBadges: number; maxDistance: number }) => {
        description: string;
        targetCount: number;
        targetType?: string;
        targetTrainerKind?: string;
    };
    reward: {
        money: number;
        itemId?: string;      // exact id from services/itemData.ts
        /** Probability-weighted item pools for variety; if set overrides itemId. */
        itemPool?: string[];
        pokemonId?: number;   // optional species gift
        level?: number;       // gift Pokémon level
    };
}

// --- COMMON tier (money + mid-tier items) --------------------------------
const COMMON_TEMPLATES: BountyTemplate[] = [
    {
        id: 'common_catch_any_5',
        kind: 'catch_any',
        tier: 'common',
        materialize: () => ({ description: 'Catch any 5 Pokémon.', targetCount: 5 }),
        reward: { money: 2500, itemPool: ['super-potion', 'sitrus-berry', 'lum-berry', 'oran-berry', 'great-ball'] },
    },
    {
        id: 'common_catch_water_3',
        kind: 'catch_type',
        tier: 'common',
        materialize: () => ({ description: 'Catch 3 Water-type Pokémon.', targetCount: 3, targetType: 'water' }),
        reward: { money: 3000, itemPool: ['mystic-water', 'sitrus-berry', 'waterstone'] },
    },
    {
        id: 'common_catch_grass_3',
        kind: 'catch_type',
        tier: 'common',
        materialize: () => ({ description: 'Catch 3 Grass-type Pokémon.', targetCount: 3, targetType: 'grass' }),
        reward: { money: 3000, itemPool: ['miracle-seed', 'big-root', 'leafstone'] },
    },
    {
        id: 'common_catch_fire_3',
        kind: 'catch_type',
        tier: 'common',
        materialize: () => ({ description: 'Catch 3 Fire-type Pokémon.', targetCount: 3, targetType: 'fire' }),
        reward: { money: 3000, itemPool: ['charcoal', 'firestone', 'flame-orb'] },
    },
    {
        id: 'common_defeat_trainers_3',
        kind: 'defeat_trainers',
        tier: 'common',
        materialize: () => ({ description: 'Defeat 3 wild trainers.', targetCount: 3 }),
        reward: { money: 3500, itemPool: ['revive', 'hyper-potion', 'adrenaline-orb'] },
    },
];

// --- RARE tier (evolution stones, strong battle items) -------------------
const RARE_TEMPLATES: BountyTemplate[] = [
    {
        id: 'rare_catch_flying_5',
        kind: 'catch_type',
        tier: 'rare',
        materialize: () => ({ description: 'Catch 5 Flying-type Pokémon.', targetCount: 5, targetType: 'flying' }),
        reward: { money: 6000, itemPool: ['sharp-beak', 'focus-sash', 'choice-scarf'] },
    },
    {
        id: 'rare_catch_electric_5',
        kind: 'catch_type',
        tier: 'rare',
        materialize: () => ({ description: 'Catch 5 Electric-type Pokémon.', targetCount: 5, targetType: 'electric' }),
        reward: { money: 6000, itemPool: ['magnet', 'light-ball', 'thunderstone'] },
    },
    {
        id: 'rare_catch_psychic_4',
        kind: 'catch_type',
        tier: 'rare',
        materialize: () => ({ description: 'Catch 4 Psychic-type Pokémon.', targetCount: 4, targetType: 'psychic' }),
        reward: { money: 7000, itemPool: ['twisted-spoon', 'choice-specs', 'wise-glasses'] },
    },
    {
        id: 'rare_defeat_trainers_6',
        kind: 'defeat_trainers',
        tier: 'rare',
        materialize: () => ({ description: 'Defeat 6 wild trainers.', targetCount: 6 }),
        reward: { money: 8000, itemPool: ['leftovers', 'life-orb', 'expert-belt', 'assault-vest'] },
    },
    {
        id: 'rare_visit_biomes_4',
        kind: 'visit_biomes',
        tier: 'rare',
        materialize: () => ({ description: 'Explore 4 distinct biomes.', targetCount: 4 }),
        reward: { money: 7500, itemPool: ['amulet-coin', 'lucky-egg', 'eviolite'] },
    },
    {
        id: 'rare_catch_combo_10',
        kind: 'catch_combo',
        tier: 'rare',
        materialize: () => ({ description: 'Build a catch combo of 10.', targetCount: 10 }),
        reward: { money: 6500, itemPool: ['scope-lens', 'focus-band', 'quick-claw'] },
    },
];

// --- EPIC tier (fusion items, rare candy, master ball) -------------------
const EPIC_TEMPLATES: BountyTemplate[] = [
    {
        id: 'epic_defeat_trainers_10',
        kind: 'defeat_trainers',
        tier: 'epic',
        materialize: () => ({ description: 'Defeat 10 wild trainers.', targetCount: 10 }),
        reward: { money: 15000, itemPool: ['fusion-core', 'chrono-prism', 'harmony-bell'] },
    },
    {
        id: 'epic_catch_combo_20',
        kind: 'catch_combo',
        tier: 'epic',
        materialize: () => ({ description: 'Build a catch combo of 20.', targetCount: 20 }),
        reward: { money: 15000, itemPool: ['chrono-prism', 'link-crystal', 'rift-shard'] },
    },
    {
        id: 'epic_rift_distance',
        kind: 'rift_distance',
        tier: 'epic',
        materialize: (ctx) => {
            // Scale target distance with what the player has already reached,
            // but always at least +8 chunks so it represents an actual trek.
            const current = ctx.maxDistance || 0;
            const target = current + 8;
            return { description: `Reach a world distance of ${target} chunks.`, targetCount: target };
        },
        reward: { money: 12000, itemPool: ['dual-pendant', 'rare-candy', 'master-ball'] },
    },
    {
        id: 'epic_visit_biomes_7',
        kind: 'visit_biomes',
        tier: 'epic',
        materialize: () => ({ description: 'Explore 7 distinct biomes.', targetCount: 7 }),
        reward: { money: 18000, itemPool: ['rift-shard', 'link-crystal', 'master-ball'] },
    },
];

export const BOUNTY_TEMPLATES: Record<string, BountyTemplate> = Object.fromEntries(
    [...COMMON_TEMPLATES, ...RARE_TEMPLATES, ...EPIC_TEMPLATES].map(b => [b.id, b])
);

const TEMPLATE_LIST = [...COMMON_TEMPLATES, ...RARE_TEMPLATES, ...EPIC_TEMPLATES];

const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * Rolls a fresh slate of 3 bounties, weighted 2x common : 1x rare : ~0.5x
 * epic (so epics appear roughly 1 in every 3-4 rerolls). Guarantees no
 * duplicate template IDs within a single slate.
 */
export const rollBounties = (ctx: { playerBadges: number; maxDistance: number; slateSize?: number }) => {
    const size = ctx.slateSize ?? 3;
    const weighted: BountyTemplate[] = [];
    COMMON_TEMPLATES.forEach(t => { weighted.push(t, t); });           // weight 2
    RARE_TEMPLATES.forEach(t => { weighted.push(t); });                // weight 1
    // Epics: only push half the list per roll so slates mix common+rare+epic.
    if (Math.random() < 0.6) weighted.push(pickRandom(EPIC_TEMPLATES));
    weighted.push(pickRandom(EPIC_TEMPLATES));                          // still add one reliably

    const picked: BountyTemplate[] = [];
    const usedIds = new Set<string>();
    while (picked.length < size && weighted.length > 0) {
        const idx = Math.floor(Math.random() * weighted.length);
        const t = weighted[idx];
        weighted.splice(idx, 1);
        if (usedIds.has(t.id)) continue;
        usedIds.add(t.id);
        picked.push(t);
    }
    // Guard: if we ran out of weights (rare), fall back to random distinct.
    while (picked.length < size) {
        const t = pickRandom(TEMPLATE_LIST);
        if (!usedIds.has(t.id)) { picked.push(t); usedIds.add(t.id); }
    }

    return materializeSlate(picked, ctx);
};

const materializeSlate = (picked: BountyTemplate[], ctx: { playerBadges: number; maxDistance: number }) => {
    return picked.map(t => {
        const mat = t.materialize(ctx);
        const rewardItemId = t.reward.itemPool
            ? pickRandom(t.reward.itemPool)
            : t.reward.itemId;
        return {
            id: `${t.id}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
            templateId: t.id,
            description: mat.description,
            targetSpeciesId: undefined as number | undefined,
            targetType: mat.targetType,
            targetTrainerKind: mat.targetTrainerKind,
            targetCount: mat.targetCount,
            progress: 0,
            rewardMoney: t.reward.money,
            rewardItemId,
            rewardPokemonId: t.reward.pokemonId,
            rewardLevel: t.reward.level,
            tier: t.tier,
        };
    });
};

export type ActiveBounty = ReturnType<typeof rollBounties>[number];

/**
 * Pure progress-update helper. Given the current slate and an event,
 * returns a new slate with `progress` values bumped. The caller decides
 * when to claim completed bounties (via the UI).
 */
export const applyBountyEvent = (
    bounties: ActiveBounty[] | undefined,
    event:
        | { type: 'catch'; typeIds: string[] }         // types of the caught mon
        | { type: 'trainer_defeat' }
        | { type: 'biome_visit'; distinctCount: number }
        | { type: 'combo_update'; count: number }
        | { type: 'distance_update'; distance: number },
): ActiveBounty[] | undefined => {
    if (!bounties || bounties.length === 0) return bounties;
    return bounties.map(b => {
        if (b.progress >= b.targetCount) return b; // done, no further ticks
        const template = BOUNTY_TEMPLATES[b.templateId];
        if (!template) return b;
        let delta = 0;
        let absolute: number | null = null;
        switch (template.kind) {
            case 'catch_any':
                if (event.type === 'catch') delta = 1;
                break;
            case 'catch_type':
                if (event.type === 'catch' && b.targetType && event.typeIds.includes(b.targetType)) delta = 1;
                break;
            case 'defeat_trainers':
                if (event.type === 'trainer_defeat') delta = 1;
                break;
            case 'visit_biomes':
                if (event.type === 'biome_visit') absolute = event.distinctCount;
                break;
            case 'catch_combo':
                if (event.type === 'combo_update') absolute = event.count;
                break;
            case 'rift_distance':
                if (event.type === 'distance_update') absolute = event.distance;
                break;
        }
        if (delta > 0) {
            return { ...b, progress: Math.min(b.targetCount, b.progress + delta) };
        }
        if (absolute !== null) {
            return { ...b, progress: Math.min(b.targetCount, Math.max(b.progress, absolute)) };
        }
        return b;
    });
};

export const isBountyComplete = (b: ActiveBounty) => b.progress >= b.targetCount;
