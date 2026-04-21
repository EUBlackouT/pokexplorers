/**
 * Centralized progression math (level caps, party floor, auto-scaling).
 *
 * Design:
 *   - `getPlayerLevelCap(badges)` is a hard unlock -- trainable ceiling. Badges
 *     are the only input; earning a badge gives +10 ceiling.
 *   - `getWildLevelCap(badges, distance)` and `getPartyFloor(badges, distance)`
 *     smoothly ramp WITHIN a badge tier based on how far the player has pushed
 *     from spawn. Previously these stepped abruptly at badge boundaries (0b→1b
 *     was a +10 jump in wild difficulty the instant you won a gym), which made
 *     progression feel lumpy in both directions. The ramp approach gives a
 *     continuous curve that crosses each badge threshold at exactly the point
 *     the badge grants.
 *
 *     Example trajectory (wild cap):
 *       badge 0, dist 0  →  5   (starter territory, level-5 mon meets level-2-5)
 *       badge 0, dist 5  →  10
 *       badge 0, dist 10 →  15  (gym 1 at 15)
 *       badge 1, dist 0  →  15  (same as above -- no jump!)
 *       badge 1, dist 10 →  25  (gym 2)
 *       ...
 */

import { Pokemon, StatBlock } from '../types';
import { calculateStatsFull } from '../services/pokeService';

/** Player cap grows 10 levels per badge, starting at 15. */
export const LEVEL_CAP_BASE = 15;
export const LEVEL_CAP_PER_BADGE = 10;

/** Tier base for wild cap: starter-area difficulty at 0 badges is 5. */
export const WILD_TIER_BASE = 5;
export const WILD_TIER_SPAN = LEVEL_CAP_PER_BADGE;   // each tier spans 10 levels

/** Distance (in chunks) over which a single badge tier's wild ramp plays out. */
export const DIST_PER_BADGE_RAMP = 10;

/** Party floor stays `FLOOR_GAP` below the wild cap so the player is always
 *  slightly-but-not-absurdly weaker than the wilds right in front of them. */
export const FLOOR_GAP = 3;

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

export const getPlayerLevelCap = (badges: number): number =>
    LEVEL_CAP_BASE + badges * LEVEL_CAP_PER_BADGE;

/**
 * Smooth wild-level cap within a badge tier.
 *
 * `distance` should be the chunk-distance of the location being checked (e.g.
 * the patch of grass the battle is starting in). Using current position (not
 * max-reached) means walking back to spawn also makes the wilds back there
 * gentle again, which is correct: the cap represents "how strong are wilds
 * HERE", not "how strong is the player".
 */
export const getWildLevelCap = (badges: number, distance = 0): number => {
    const tierBase = WILD_TIER_BASE + badges * LEVEL_CAP_PER_BADGE;
    const ramp = clamp01(distance / DIST_PER_BADGE_RAMP);
    return Math.floor(tierBase + ramp * WILD_TIER_SPAN);
};

/**
 * Smooth party floor. `distance` should be the player's MAX-reached distance
 * (monotonic) so a bench mon that was caught deep never drops its floor when
 * you walk back to town. At 0 badges and 0 distance the floor is 5 -- i.e. the
 * starter's own level -- so the anti-grind floor never LOWERS a Pokemon; it
 * only prevents them being left behind as you push farther.
 */
export const getPartyFloor = (badges: number, distance = 0): number => {
    const cap = getWildLevelCap(badges, distance);
    return Math.max(5, cap - FLOOR_GAP);
};

/**
 * Scale a single Pokemon to an exact level, recomputing stats and preserving
 * HP ratio so auto-scaling never accidentally kills / over-heals a mon.
 */
export const scalePokemonToLevel = (p: Pokemon, targetLevel: number): Pokemon => {
    if (targetLevel === p.level) return p;
    const hpRatio = p.maxHp > 0 ? Math.max(0, Math.min(1, p.currentHp / p.maxHp)) : 1;
    const newStats: StatBlock = calculateStatsFull(p.baseStats, p.ivs, p.evs, targetLevel, p.nature);
    const newMaxHp = newStats.hp;
    const newCurrentHp = p.isFainted ? 0 : Math.round(newMaxHp * hpRatio);
    return {
        ...p,
        level: targetLevel,
        xp: 0,
        maxXp: Math.floor(Math.pow(targetLevel, 2) * 10),
        stats: newStats,
        maxHp: newMaxHp,
        currentHp: newCurrentHp,
    };
};

/**
 * Auto-scale a whole team to at least the party floor. Members already at or
 * above the floor are untouched so progression isn't flattened — this is a
 * safety net, not a clamp.
 */
export const autoScaleTeamToFloor = (
    team: Pokemon[],
    badges: number,
    distance = 0,
): Pokemon[] => {
    const floor = getPartyFloor(badges, distance);
    return team.map(p => (p.level < floor ? scalePokemonToLevel(p, floor) : p));
};
