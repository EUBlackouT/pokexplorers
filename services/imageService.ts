
import { GoogleGenAI } from "@google/genai";

const BATTLE_BACKGROUNDS: Record<string, string[]> = {
    forest: [
        'https://play.pokemonshowdown.com/fx/bg/forest.jpg'
    ],
    tall_grass: [
        'https://play.pokemonshowdown.com/fx/bg/grass.jpg'
    ],
    town: [
        'https://play.pokemonshowdown.com/fx/bg/city.jpg'
    ],
    desert: [
        'https://play.pokemonshowdown.com/fx/bg/desert.jpg'
    ],
    canyon: [
        'https://play.pokemonshowdown.com/fx/bg/mountain.jpg'
    ],
    snow: [
        'https://play.pokemonshowdown.com/fx/bg/snow.jpg'
    ],
    lake: [
        'https://play.pokemonshowdown.com/fx/bg/water.jpg'
    ],
    cave: [
        'https://play.pokemonshowdown.com/fx/bg/cave.jpg'
    ],
    rift: [
        'https://play.pokemonshowdown.com/fx/bg/space.jpg'
    ],
    interior: [
        'https://play.pokemonshowdown.com/fx/bg/room.jpg'
    ],
    lab: [
        'https://play.pokemonshowdown.com/fx/bg/lab.jpg'
    ],
    center: [
        'https://play.pokemonshowdown.com/fx/bg/center.jpg'
    ],
    mart: [
        'https://play.pokemonshowdown.com/fx/bg/mart.jpg'
    ]
};

// Cache for generated backgrounds to avoid redundant API calls during a session
const generatedBackgroundsCache: Record<string, string> = {};

export const generateBattleBackground = async (biome: string, tileType?: number, forceStatic?: boolean): Promise<string> => {
    const cacheKey = `${biome}_${tileType || 'default'}`;
    
    // 1. Check Cache first
    if (generatedBackgroundsCache[cacheKey]) {
        return generatedBackgroundsCache[cacheKey];
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // 2. If no API key or forceStatic (multiplayer), use the high-quality static anime library immediately
    if (!apiKey || forceStatic) {
        const backgrounds = BATTLE_BACKGROUNDS[biome] || BATTLE_BACKGROUNDS.forest;
        return backgrounds[Math.floor(Math.random() * backgrounds.length)];
    }

    // 3. If API key exists, attempt AI generation for infinite variety
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
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                imageConfig: {
                    aspectRatio: "16:9"
                }
            }
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64Data = part.inlineData.data;
                const imageUrl = `data:image/png;base64,${base64Data}`;
                generatedBackgroundsCache[cacheKey] = imageUrl;
                return imageUrl;
            }
        }
    } catch (error) {
        console.warn('[BattleBG] AI generation failed or timed out, falling back to static.');
    }

    // 4. Final Fallback
    const backgrounds = BATTLE_BACKGROUNDS[biome] || BATTLE_BACKGROUNDS.forest;
    return backgrounds[Math.floor(Math.random() * backgrounds.length)];
};
