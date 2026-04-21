/**
 * Explorer Score system -- the "reason to go far."
 *
 * Score is computed from a handful of metrics weighted so that depth matters
 * the most (1 chunk of distance = 100 points vs a shiny's 500, but you can
 * stack hundreds of chunks). That keeps the 8-badge goal achievable for any
 * player while leaving a meaningful endgame chase for the leaderboard.
 *
 * Titles are purely cosmetic but gate progression rewards (see DEPTH_PERKS)
 * that provide modest quality-of-life boosts the further you travel.
 */

export interface ScoreInputs {
    farthestDistance: number;
    chunksDiscovered: number;
    badges: number;
    totalCaptures: number;
    shiniesCaught: number;
    trainersDefeated: number;
    biggestStreak: number;
    totalMoneyEarned: number;
    riftStabilityCleared?: boolean; // +big bonus
}

export interface ScoreBreakdown {
    label: string;
    raw: number;
    weight: number;
    contribution: number;
}

export interface ExplorerScore {
    total: number;
    breakdown: ScoreBreakdown[];
    title: string;
    titleIndex: number;
    nextTitle: string | null;
    nextTitleAt: number | null;
}

export const WEIGHTS: Record<keyof ScoreInputs, number> = {
    farthestDistance: 100,
    chunksDiscovered: 10,
    badges: 1000,
    totalCaptures: 15,
    shiniesCaught: 500,
    trainersDefeated: 30,
    biggestStreak: 50,
    totalMoneyEarned: 0.1,
    riftStabilityCleared: 10000 as unknown as number,
};

export const TITLES: Array<{ at: number; name: string }> = [
    { at: 0,   name: 'Novice'               },
    { at: 5,   name: 'Wanderer'             },
    { at: 15,  name: 'Pathfinder'           },
    { at: 30,  name: 'Voyager'              },
    { at: 60,  name: 'Rift Scout'           },
    { at: 100, name: 'Rift-Touched'         },
    { at: 150, name: 'Edgewalker'           },
    { at: 200, name: 'Champion of the Wild' },
    { at: 300, name: 'Horizonbreaker'       },
];

/** Depth milestones that unlock gameplay perks. Applied via story flags. */
export interface DepthPerk {
    dist: number;
    flag: string;
    title: string;
    description: string;
}

export const DEPTH_PERKS: DepthPerk[] = [
    {
        dist: 10,
        flag: 'perk_permit10',
        title: '+1 Starting Permit',
        description: 'Next run begins with an extra capture permit.',
    },
    {
        dist: 25,
        flag: 'perk_xp25',
        title: '+10% Permanent XP',
        description: 'Every Pokemon gains 10% more XP from here on.',
    },
    {
        dist: 50,
        flag: 'perk_legendaries',
        title: 'Legendary Spawns Unlocked',
        description: 'Boss chunks past this distance can host legendary encounters.',
    },
    {
        dist: 75,
        flag: 'perk_essence',
        title: '+1 Rift Essence per 5 captures',
        description: 'Your Pokedex entries start paying out Rift Essence.',
    },
    {
        dist: 100,
        flag: 'perk_riftsafe',
        title: 'Stable Rifts',
        description: 'Rift portal tiles no longer damage you.',
    },
    {
        dist: 150,
        flag: 'perk_eliteaccess',
        title: 'Elite Access',
        description: 'Elite Four buildings are now marked on your map.',
    },
    {
        dist: 200,
        flag: 'perk_horizon',
        title: 'Horizon Call',
        description: 'Wild Pokemon past this point roll an extra move slot.',
    },
];

export const computeExplorerScore = (inputs: ScoreInputs): ExplorerScore => {
    const entries: ScoreBreakdown[] = [
        { label: 'Farthest Distance', raw: inputs.farthestDistance, weight: WEIGHTS.farthestDistance, contribution: inputs.farthestDistance * WEIGHTS.farthestDistance },
        { label: 'Chunks Discovered', raw: inputs.chunksDiscovered, weight: WEIGHTS.chunksDiscovered, contribution: inputs.chunksDiscovered * WEIGHTS.chunksDiscovered },
        { label: 'Badges Earned',     raw: inputs.badges,           weight: WEIGHTS.badges,           contribution: inputs.badges * WEIGHTS.badges },
        { label: 'Pokemon Caught',    raw: inputs.totalCaptures,    weight: WEIGHTS.totalCaptures,    contribution: inputs.totalCaptures * WEIGHTS.totalCaptures },
        { label: 'Shiny Catches',     raw: inputs.shiniesCaught,    weight: WEIGHTS.shiniesCaught,    contribution: inputs.shiniesCaught * WEIGHTS.shiniesCaught },
        { label: 'Trainers Defeated', raw: inputs.trainersDefeated, weight: WEIGHTS.trainersDefeated, contribution: inputs.trainersDefeated * WEIGHTS.trainersDefeated },
        { label: 'Best Win Streak',   raw: inputs.biggestStreak,    weight: WEIGHTS.biggestStreak,    contribution: inputs.biggestStreak * WEIGHTS.biggestStreak },
        { label: 'Money Earned',      raw: inputs.totalMoneyEarned, weight: WEIGHTS.totalMoneyEarned, contribution: Math.floor(inputs.totalMoneyEarned * WEIGHTS.totalMoneyEarned) },
    ];
    if (inputs.riftStabilityCleared) {
        entries.push({
            label: 'Rift Cleared',
            raw: 1,
            weight: 10000,
            contribution: 10000,
        });
    }
    const total = Math.floor(entries.reduce((a, b) => a + b.contribution, 0));

    let titleIndex = 0;
    for (let i = TITLES.length - 1; i >= 0; i--) {
        if (inputs.farthestDistance >= TITLES[i].at) {
            titleIndex = i;
            break;
        }
    }
    const next = TITLES[titleIndex + 1];
    return {
        total,
        breakdown: entries,
        title: TITLES[titleIndex].name,
        titleIndex,
        nextTitle: next?.name ?? null,
        nextTitleAt: next?.at ?? null,
    };
};

/** Given a current distance, returns any perks newly unlocked compared to a known set of flags. */
export const getNewlyUnlockedPerks = (distance: number, existingFlags: string[]): DepthPerk[] => {
    const seen = new Set(existingFlags);
    return DEPTH_PERKS.filter((p) => distance >= p.dist && !seen.has(p.flag));
};
