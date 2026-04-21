/**
 * First-time biome lore. Each biome announces itself once per lifetime with
 * a short, atmospheric story-tier toast. Keeps worldbuilding ambient.
 */

export interface BiomeLore {
    kicker: string;
    body: string;
}

export const BIOME_LORE: Record<string, BiomeLore> = {
    forest: {
        kicker: 'The Whispering Wood',
        body: 'Old-growth canopy swallows the trail. Legend says trainers who listen can hear their team thinking.',
    },
    lake: {
        kicker: 'The Silver Tide',
        body: 'Fresh water stretches to the horizon. The rain never quite stops here.',
    },
    desert: {
        kicker: 'The Glass Expanse',
        body: 'Crystalline sand glitters under a hammered sun. Shelter is a luxury, not a given.',
    },
    canyon: {
        kicker: 'The Fracture',
        body: 'Walls of striated stone remember every quake. Fire-types feel unusually bold here.',
    },
    cave: {
        kicker: 'The Undervault',
        body: 'Phosphor moss lights the way. Step softly -- the echoes are not always your own.',
    },
    snow: {
        kicker: 'The White Silence',
        body: 'Wind-carved drifts erase footprints within minutes. Warmth is a team effort.',
    },
    rift: {
        kicker: 'The Torn Sky',
        body: 'Reality flickers and re-stitches itself. Capture Permits feel heavier in your hand.',
    },
    town: {
        kicker: 'Checkpoint Reached',
        body: 'Lanterns, merchants, the low hum of civilization. Your team lets out a collective sigh.',
    },
};
