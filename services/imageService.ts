import { GoogleGenAI } from "@google/genai";

// =============================================================================
// Battle Background System
//
// Priority order:
//   1. Pre-baked AI-generated PNGs in /public/bg/bg_<biome>.png
//      (beautiful cel-shaded Pokemon-style arenas, generated once and shipped
//      with the game). These are the default path now.
//   2. If a `GEMINI_API_KEY` is set AND the biome has no pre-baked art,
//      fall back to live Gemini generation.
//   3. Otherwise fall back to a rich SVG gradient data-URL that paints an
//      anime-style biome (instant, offline, AGENTS.md-compliant: no real-life
//      photos, no broken external links).
// =============================================================================

// Pre-baked backgrounds live in /public/bg/ and are served by the dev server
// / static host at `/bg/<filename>`. Every biome listed here has its own
// hand-crafted cel-shaded arena art in the bundle.
const STATIC_BG_PATH = '/bg';
const STATIC_BACKGROUNDS: Record<string, string> = {
    // Regular biomes
    forest:     `${STATIC_BG_PATH}/bg_forest.jpg`,
    tall_grass: `${STATIC_BG_PATH}/bg_tall_grass.jpg`,
    grass:      `${STATIC_BG_PATH}/bg_tall_grass.jpg`,
    town:       `${STATIC_BG_PATH}/bg_town.jpg`,
    desert:     `${STATIC_BG_PATH}/bg_desert.jpg`,
    canyon:     `${STATIC_BG_PATH}/bg_canyon.jpg`,
    snow:       `${STATIC_BG_PATH}/bg_snow.jpg`,
    tundra:     `${STATIC_BG_PATH}/bg_snow.jpg`,
    lake:       `${STATIC_BG_PATH}/bg_lake.jpg`,
    water:      `${STATIC_BG_PATH}/bg_lake.jpg`,
    cave:       `${STATIC_BG_PATH}/bg_cave.jpg`,
    rift:       `${STATIC_BG_PATH}/bg_rift.jpg`,
    interior:   `${STATIC_BG_PATH}/bg_interior.jpg`,
    lab:        `${STATIC_BG_PATH}/bg_interior.jpg`,
    center:     `${STATIC_BG_PATH}/bg_interior.jpg`,
    mart:       `${STATIC_BG_PATH}/bg_interior.jpg`,
    volcano:    `${STATIC_BG_PATH}/bg_volcano.jpg`,
    beach:      `${STATIC_BG_PATH}/bg_beach.jpg`,
    ruins:      `${STATIC_BG_PATH}/bg_ruins.jpg`,
    stadium:    `${STATIC_BG_PATH}/bg_stadium.jpg`,

    // Special scenarios -- used via `opts` flags below, but also addressable
    // by name if a map/chunk ever sets `biome: 'haunted'` etc.
    haunted:    `${STATIC_BG_PATH}/bg_haunted.jpg`,
    graveyard:  `${STATIC_BG_PATH}/bg_graveyard.jpg`,
    shrine:     `${STATIC_BG_PATH}/bg_shrine.jpg`,
    dojo:       `${STATIC_BG_PATH}/bg_dojo.jpg`,
    champion:   `${STATIC_BG_PATH}/bg_champion.jpg`,
    underwater: `${STATIC_BG_PATH}/bg_underwater.jpg`,
    sky_pillar: `${STATIC_BG_PATH}/bg_sky_pillar.jpg`,
    thunder_peak: `${STATIC_BG_PATH}/bg_thunder_peak.jpg`,
    ice_palace: `${STATIC_BG_PATH}/bg_ice_palace.jpg`,
};

/**
 * Absolute URL for the main-menu hero background. The art places flying
 * Dragonites on the left + right thirds and keeps the center empty so the
 * POKE EXPLORERS logo and menu buttons sit on a clean mountain horizon.
 */
export const MENU_BACKGROUND_URL = `${STATIC_BG_PATH}/bg_menu.jpg`;

/**
 * Legendary species -> ideal arena mapping. Hand-picked so each roaming
 * legendary feels like it belongs to the right sacred place:
 *   Ice birds + Regice-flavoured mons -> ice_palace
 *   Electric legendaries             -> thunder_peak
 *   Flying / dragon / weather trios  -> sky_pillar
 *   Water legendaries                -> underwater
 *   Psychic / lunar                  -> shrine
 *   Fire                             -> volcano (already in rotation)
 *   Normal mythic brutes             -> ruins (already in rotation)
 */
const LEGENDARY_ARENA_BY_SPECIES: Record<number, string> = {
    144: 'ice_palace',   // Articuno
    145: 'thunder_peak', // Zapdos
    146: 'sky_pillar',   // Moltres
    243: 'thunder_peak', // Raikou
    244: 'volcano',      // Entei
    245: 'underwater',   // Suicune
    380: 'sky_pillar',   // Latias
    381: 'sky_pillar',   // Latios
    486: 'ruins',        // Regigigas
    488: 'shrine',       // Cresselia
    641: 'sky_pillar',   // Tornadus
    642: 'thunder_peak', // Thundurus
};

export interface StaticBgOpts {
    /** Gym leader fight -> grand stadium arena. */
    gym?: boolean;
    /** Rift Champion / final boss -> champion throne room. */
    champion?: boolean;
    /** Fighting-type trainer / dojo master -> dojo interior. */
    dojo?: boolean;
    /** Ghost trainer reveal fight -> haunted mansion. */
    haunted?: boolean;
    /** Shrine-guardian encounter -> torii + lanterns. */
    shrine?: boolean;
    /**
     * Roaming legendary fight. If `legendarySpeciesId` is known we auto-pick
     * the thematically-correct arena (sky pillar, ice palace, etc).
     */
    legendary?: boolean;
    legendarySpeciesId?: number;
}

/**
 * Pick the right pre-baked background for a biome/context. Exposed so that
 * other surfaces (shop, gym intro cutscene, etc.) can reuse the same art.
 * Returns an absolute URL on the current origin, or null if we have no static
 * art for the given combination (caller should then fall back to AI/SVG).
 *
 * Precedence: champion > gym > legendary > haunted > shrine > dojo > biome.
 */
export const getStaticBackground = (biome: string, opts?: StaticBgOpts): string | null => {
    if (opts?.champion) return STATIC_BACKGROUNDS.champion;
    if (opts?.gym) return STATIC_BACKGROUNDS.stadium;
    if (opts?.legendary) {
        if (opts.legendarySpeciesId && LEGENDARY_ARENA_BY_SPECIES[opts.legendarySpeciesId]) {
            const key = LEGENDARY_ARENA_BY_SPECIES[opts.legendarySpeciesId];
            return STATIC_BACKGROUNDS[key] || null;
        }
        // Generic mythic/legendary with no species hint -> sky pillar feels
        // always-appropriate.
        return STATIC_BACKGROUNDS.sky_pillar;
    }
    if (opts?.haunted) return STATIC_BACKGROUNDS.haunted;
    if (opts?.shrine) return STATIC_BACKGROUNDS.shrine;
    if (opts?.dojo) return STATIC_BACKGROUNDS.dojo;
    return STATIC_BACKGROUNDS[biome] || null;
};

// A visually distinct atmospheric gradient per biome. Rendered as an SVG data
// URL so the browser can display it directly in <div style={{backgroundImage}}>
// without any network round-trip.
const CSS_BACKGROUNDS: Record<string, string> = {
    forest:     svgBg('#0a3d1a', '#56a66c', '#d9f0a3', 'forest'),
    tall_grass: svgBg('#1e5630', '#84cc16', '#ecfccb', 'grass'),
    town:       svgBg('#1e3a8a', '#60a5fa', '#dbeafe', 'town'),
    desert:     svgBg('#92400e', '#fbbf24', '#fef3c7', 'desert'),
    canyon:     svgBg('#7c2d12', '#c2410c', '#fed7aa', 'canyon'),
    snow:       svgBg('#1e3a5f', '#93c5fd', '#f0f9ff', 'snow'),
    lake:       svgBg('#0c4a6e', '#38bdf8', '#e0f2fe', 'lake'),
    cave:       svgBg('#1c1917', '#57534e', '#a8a29e', 'cave'),
    rift:       svgBg('#2e1065', '#8b5cf6', '#f0abfc', 'rift'),
    interior:   svgBg('#451a03', '#a16207', '#fde68a', 'interior'),
    lab:        svgBg('#0f172a', '#60a5fa', '#e2e8f0', 'lab'),
    center:     svgBg('#7f1d1d', '#f87171', '#fecaca', 'center'),
    mart:       svgBg('#0f3460', '#3b82f6', '#dbeafe', 'mart'),
    volcano:    svgBg('#3f0404', '#ef4444', '#fde68a', 'volcano'),
    beach:      svgBg('#0e7490', '#fde68a', '#fef9c3', 'beach'),
    ruins:      svgBg('#292524', '#a8a29e', '#e7e5e4', 'ruins'),
};

// Generate a compact SVG background data URL. Paints a stylised horizon:
// - sky gradient (deepColor -> midColor -> bright)
// - an anime-style landscape silhouette at the bottom
// - biome-specific flourishes (trees, dunes, rocks, snow drifts, etc.)
function svgBg(deep: string, mid: string, bright: string, biome: string): string {
    const flourish = biomeFlourish(biome, mid, deep);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0%' stop-color='${deep}'/>
      <stop offset='55%' stop-color='${mid}'/>
      <stop offset='100%' stop-color='${bright}'/>
    </linearGradient>
    <radialGradient id='sun' cx='75%' cy='30%' r='35%'>
      <stop offset='0%' stop-color='${bright}' stop-opacity='0.7'/>
      <stop offset='100%' stop-color='${bright}' stop-opacity='0'/>
    </radialGradient>
  </defs>
  <rect width='800' height='450' fill='url(#sky)'/>
  <circle cx='600' cy='135' r='200' fill='url(#sun)'/>
  ${flourish}
  <path d='M0 370 Q200 340 400 360 T800 365 L800 450 L0 450 Z' fill='${deep}' opacity='0.75'/>
</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function biomeFlourish(biome: string, mid: string, deep: string): string {
    switch (biome) {
        case 'forest':
        case 'tall_grass': {
            let trees = '';
            for (let i = 0; i < 7; i++) {
                const x = 60 + i * 110;
                const y = 310 + (i % 2) * 12;
                trees += `<polygon points='${x},${y} ${x - 30},${y + 70} ${x + 30},${y + 70}' fill='${deep}' opacity='0.85'/>`;
                trees += `<polygon points='${x},${y - 20} ${x - 25},${y + 40} ${x + 25},${y + 40}' fill='${deep}' opacity='0.9'/>`;
            }
            return trees;
        }
        case 'desert':
        case 'canyon':
            return `<path d='M0 360 Q150 320 300 360 T600 355 T800 360 L800 450 L0 450 Z' fill='${mid}' opacity='0.4'/>
                    <polygon points='620,330 640,240 660,330' fill='${deep}' opacity='0.6'/>
                    <polygon points='100,340 130,260 160,340' fill='${deep}' opacity='0.55'/>`;
        case 'snow':
            return `<circle cx='120' cy='340' r='18' fill='white' opacity='0.8'/>
                    <circle cx='280' cy='360' r='22' fill='white' opacity='0.8'/>
                    <circle cx='550' cy='345' r='16' fill='white' opacity='0.8'/>
                    <circle cx='700' cy='355' r='20' fill='white' opacity='0.8'/>`;
        case 'lake':
        case 'beach':
            return `<path d='M0 370 Q200 350 400 370 T800 368 L800 450 L0 450 Z' fill='${mid}' opacity='0.5'/>
                    <path d='M0 395 Q200 378 400 395 T800 392' stroke='white' stroke-width='2' fill='none' opacity='0.5'/>`;
        case 'cave':
        case 'ruins':
            return `<polygon points='0,320 80,250 160,320' fill='${deep}'/>
                    <polygon points='600,340 700,230 800,340' fill='${deep}'/>
                    <polygon points='300,350 400,280 500,350' fill='${deep}' opacity='0.7'/>`;
        case 'rift':
            return `<circle cx='400' cy='200' r='80' fill='${mid}' opacity='0.3'/>
                    <circle cx='400' cy='200' r='50' fill='${mid}' opacity='0.5'/>
                    <circle cx='400' cy='200' r='20' fill='white' opacity='0.8'/>`;
        case 'volcano':
            return `<polygon points='350,350 500,150 650,350' fill='${deep}'/>
                    <polygon points='450,200 500,150 550,200' fill='${mid}'/>
                    <circle cx='500' cy='180' r='15' fill='yellow' opacity='0.9'/>`;
        case 'town':
        case 'center':
        case 'mart':
        case 'interior':
        case 'lab':
            return `<rect x='100' y='280' width='80' height='80' fill='${deep}' opacity='0.85'/>
                    <polygon points='100,280 140,240 180,280' fill='${mid}' opacity='0.9'/>
                    <rect x='280' y='260' width='100' height='100' fill='${deep}' opacity='0.85'/>
                    <polygon points='280,260 330,220 380,260' fill='${mid}' opacity='0.9'/>
                    <rect x='500' y='290' width='80' height='70' fill='${deep}' opacity='0.85'/>`;
        default:
            return '';
    }
}

const generatedBackgroundsCache: Record<string, string> = {};

export const generateBattleBackground = async (
    biome: string,
    tileType?: number,
    forceStatic?: boolean,
    opts?: StaticBgOpts
): Promise<string> => {
    // Build a stable cache key that folds in scenario flags so a gym fight
    // and a wild fight in the same biome don't share a cached background.
    const scenarioKey = [
        opts?.gym && 'gym',
        opts?.champion && 'champion',
        opts?.legendary && `legendary${opts?.legendarySpeciesId ?? ''}`,
        opts?.haunted && 'haunted',
        opts?.shrine && 'shrine',
        opts?.dojo && 'dojo',
    ].filter(Boolean).join('-') || 'default';
    const cacheKey = `${biome}_${tileType || 'default'}_${scenarioKey}`;
    if (generatedBackgroundsCache[cacheKey]) return generatedBackgroundsCache[cacheKey];

    // 1. Prefer the pre-baked cel-shaded PNG whenever we have one. This is
    //    the new default path -- gorgeous hand-crafted art, instant load,
    //    deterministic across players in multiplayer.
    const staticUrl = getStaticBackground(biome, opts);
    if (staticUrl) {
        generatedBackgroundsCache[cacheKey] = staticUrl;
        return staticUrl;
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Multiplayer / no key -> SVG fallback (instant, deterministic)
    if (!apiKey || forceStatic) {
        return CSS_BACKGROUNDS[biome] || CSS_BACKGROUNDS.forest;
    }

    // Try Gemini for infinite variety
    try {
        const ai = new GoogleGenAI({ apiKey });
        let context = `a ${biome} environment`;
        if (tileType === 2) context += " with tall grass in the foreground";
        if (tileType === 3) context += " near a lake or water source";
        if (tileType === 7) context += " in a dark cave or canyon";
        if (tileType === 25) context += " in a sandy desert area";
        if (tileType === 26) context += " in a snowy tundra";

        const prompt = `A high-quality 2D anime-style Pokémon battle background for ${context}.
Vibrant colors, clean cel-shaded lines, 2D anime aesthetic, no realistic textures, no real-world buildings, no characters.
The scene should look like a classic Pokémon battle arena in the ${biome} with a clear ground for the monsters to stand on.
Wide shot, 16:9 aspect ratio, cinematic lighting.`;

        console.log('[BattleBG] Generating AI background for:', biome);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "16:9" } } as any,
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if ((part as any).inlineData) {
                const base64Data = (part as any).inlineData.data as string;
                const imageUrl = `data:image/png;base64,${base64Data}`;
                generatedBackgroundsCache[cacheKey] = imageUrl;
                return imageUrl;
            }
        }
    } catch (error) {
        console.warn('[BattleBG] AI generation failed, falling back to static.', error);
    }

    return CSS_BACKGROUNDS[biome] || CSS_BACKGROUNDS.forest;
};
