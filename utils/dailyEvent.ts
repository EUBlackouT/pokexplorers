/**
 * Daily world events.
 *
 * Picks one event per wall-clock calendar day and caches it. Gives players a
 * reason to keep coming back -- different days have different vibes (shiny
 * hunts, rock rushes, merchant discounts, XP bonuses, etc.). All effects are
 * purely cosmetic or minor numeric tweaks, never blocking.
 */

export type DailyEventId =
    | 'meteor-shower'
    | 'berry-bloom'
    | 'rift-wind'
    | 'merchant-caravan'
    | 'lucky-day'
    | 'heatwave'
    | 'aurora'
    | 'calm-day';

export interface DailyEvent {
    id: DailyEventId;
    title: string;
    flavor: string;
    /** XP earned from battles is multiplied by this. */
    xpMult: number;
    /** Money earned from all sources is multiplied by this. */
    moneyMult: number;
    /** Encounter rate multiplier. */
    encounterMult: number;
    /** Extra shiny odds multiplier. */
    shinyMult: number;
}

const EVENTS: DailyEvent[] = [
    {
        id: 'meteor-shower',
        title: 'Meteor Shower',
        flavor: 'Stones are falling from the sky. Rock- and Rift-types are restless.',
        xpMult: 1.0,
        moneyMult: 1.0,
        encounterMult: 1.1,
        shinyMult: 2.0,
    },
    {
        id: 'berry-bloom',
        title: 'Berry Bloom',
        flavor: 'The berry trees are heavy today. Keep your eyes open.',
        xpMult: 1.0,
        moneyMult: 1.2,
        encounterMult: 0.9,
        shinyMult: 1.0,
    },
    {
        id: 'rift-wind',
        title: 'Rift Wind',
        flavor: 'A strange wind blows from the east. Wild Pokemon fight harder, but reward more.',
        xpMult: 1.3,
        moneyMult: 1.1,
        encounterMult: 1.2,
        shinyMult: 1.0,
    },
    {
        id: 'merchant-caravan',
        title: 'Merchant Caravan Passes',
        flavor: 'Traders move in bulk today. Everyone pays more for captures.',
        xpMult: 1.0,
        moneyMult: 1.5,
        encounterMult: 1.0,
        shinyMult: 1.0,
    },
    {
        id: 'lucky-day',
        title: 'Lucky Day',
        flavor: 'The coin landed on its edge this morning. Everything feels easier.',
        xpMult: 1.2,
        moneyMult: 1.2,
        encounterMult: 1.0,
        shinyMult: 1.5,
    },
    {
        id: 'heatwave',
        title: 'Heatwave',
        flavor: 'A dry heat bakes the land. Fire types are confident, Water types struggle.',
        xpMult: 1.0,
        moneyMult: 1.0,
        encounterMult: 1.0,
        shinyMult: 1.0,
    },
    {
        id: 'aurora',
        title: 'Aurora Drift',
        flavor: 'Lights dance across the sky. Rare Pokemon move closer to the edges of their ranges.',
        xpMult: 1.0,
        moneyMult: 1.0,
        encounterMult: 1.3,
        shinyMult: 1.8,
    },
    {
        id: 'calm-day',
        title: 'Calm Day',
        flavor: 'Nothing unusual. Perfect weather for training.',
        xpMult: 1.15,
        moneyMult: 1.0,
        encounterMult: 1.0,
        shinyMult: 1.0,
    },
];

// Deterministic pick by yyyymmdd so the same day always gives the same event.
const dayKey = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const hashString = (s: string): number => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
    return h;
};

let cached: DailyEvent | null = null;
let cachedKey: string | null = null;

export const getDailyEvent = (): DailyEvent => {
    const key = dayKey();
    if (cached && cachedKey === key) return cached;
    const idx = hashString(key) % EVENTS.length;
    cached = EVENTS[idx];
    cachedKey = key;
    return cached;
};
