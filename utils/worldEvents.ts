/**
 * Dynamic world-event scheduler.
 *
 * These events don't live in the procedural chunk layout; instead, App.tsx
 * injects them into the current chunk on demand so the world feels like it
 * changes while you travel:
 *
 *   Wandering Merchant: appears in one specific chunk per real-world hour.
 *     The chunk hashes from the current hour + a secret salt so it feels
 *     random but is consistent across refreshes within the same hour.
 *
 *   Roaming Legendary: one silhouette exists at any given time in a random
 *     discovered-distance chunk. Moves every time the player discovers a new
 *     chunk. Interacting with it starts a legendary battle.
 *
 *   Ghost Trainer: appears in graveyards after the player has interacted
 *     with 3+ graveyard signposts, only at night.
 */

const HOUR_MS = 60 * 60 * 1000;
const HOUR_SALT = 0x9e3779b1;

const hash = (...vals: number[]): number => {
    let h = 2166136261 >>> 0;
    for (const v of vals) {
        h ^= v | 0;
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
};

/** The chunk (cx, cy) hosting the Wandering Merchant for the current hour. */
export const getHourlyMerchantChunk = (now: number = Date.now()): { cx: number; cy: number } => {
    const hourKey = Math.floor(now / HOUR_MS);
    const h = hash(hourKey, HOUR_SALT);
    // Spread merchant across -8..+8 grid so players at every depth can find them.
    const cx = ((h & 0xff) % 17) - 8;
    const cy = (((h >>> 8) & 0xff) % 17) - 8;
    return { cx, cy };
};

/**
 * Roaming legendary picker. Rerolls every `stepsPerMove` discoveries so the
 * silhouette "moves." Returns null until the player has at least `minChunks`
 * chunks discovered (keeps early game clean).
 */
export interface RoamingLegendary {
    cx: number;
    cy: number;
    speciesId: number;
    level: number;
    name: string;
}

const LEGENDARY_POOL: Array<{ id: number; name: string; level: number }> = [
    { id: 144, name: 'Articuno',   level: 55 },
    { id: 145, name: 'Zapdos',     level: 55 },
    { id: 146, name: 'Moltres',    level: 55 },
    { id: 243, name: 'Raikou',     level: 60 },
    { id: 244, name: 'Entei',      level: 60 },
    { id: 245, name: 'Suicune',    level: 60 },
    { id: 380, name: 'Latias',     level: 70 },
    { id: 381, name: 'Latios',     level: 70 },
    { id: 486, name: 'Regigigas',  level: 75 },
    { id: 488, name: 'Cresselia',  level: 72 },
    { id: 641, name: 'Tornadus',   level: 72 },
    { id: 642, name: 'Thundurus',  level: 72 },
];

export const getRoamingLegendary = (
    chunksDiscovered: number,
    playerDepth: number,
): RoamingLegendary | null => {
    const minChunks = 8;
    if (chunksDiscovered < minChunks) return null;
    // One roam "era" per 15 new discoveries.
    const era = Math.floor(chunksDiscovered / 15);
    const h = hash(era, 0x1337c0de);
    const depth = Math.max(5, playerDepth);
    const angle = ((h & 0xffff) / 0xffff) * Math.PI * 2;
    const radius = depth + ((h >>> 16) & 0x7) + 3;
    const cx = Math.round(Math.cos(angle) * radius);
    const cy = Math.round(Math.sin(angle) * radius);
    const pick = LEGENDARY_POOL[h % LEGENDARY_POOL.length];
    return {
        cx,
        cy,
        speciesId: pick.id,
        level: pick.level,
        name: pick.name,
    };
};

/** Ghost-trainer spawn rule: needs >= 3 graveyard interactions AND it's night. */
export const shouldSpawnGhostTrainer = (graveyardsVisited: number, timeOfDay: string): boolean =>
    graveyardsVisited >= 3 && timeOfDay === 'night';
