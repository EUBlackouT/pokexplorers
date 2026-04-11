
export const BGM_TRACKS = {
    MENU: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Stable Adventure
    OVERWORLD: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // Stable Exploration
    BATTLE: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' // Stable Battle
};

let bgMusic: HTMLAudioElement | null = null;
let currentBgmUrl: string | null = null;

export const playBGM = (url: string, volume: number = 0.3) => {
    if (currentBgmUrl === url && bgMusic && !bgMusic.paused) return;
    
    if (bgMusic) {
        try {
            bgMusic.pause();
            bgMusic.src = ""; // Clear source to free resources
        } catch (e) {
            console.warn("Error pausing BGM:", e);
        }
        bgMusic = null;
    }
    
    try {
        console.log("[BGM] Attempting to play:", url);
        currentBgmUrl = url;
        bgMusic = new Audio();
        bgMusic.src = url;
        bgMusic.volume = volume;
        bgMusic.loop = true;
        bgMusic.preload = 'auto';
        bgMusic.crossOrigin = "anonymous"; // Help with CORS if needed
        
        const playPromise = bgMusic.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                console.warn("BGM play blocked or failed:", e.message);
                if (e.message.includes("not suitable") || e.message.includes("failed") || e.message.includes("supported") || e.name === "NotSupportedError") {
                    console.error("BGM URL failed, trying stable fallback...");
                    const fallbackUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
                    if (url !== fallbackUrl) {
                        playBGM(fallbackUrl, volume);
                    }
                }
            });
        }
    } catch (e) {
        console.error("BGM initialization error", e);
    }
};

export const stopBGM = () => {
    if (bgMusic) {
        bgMusic.pause();
        bgMusic = null;
    }
};

export const playSound = (url: string, volume: number = 0.5) => {
    try {
        const audio = new Audio(url);
        audio.volume = volume;
        // Preload to avoid some "not suitable" errors
        audio.preload = 'auto';
        audio.play().catch(e => {
            if (e.name === 'NotAllowedError') {
                // This is expected if no user interaction has occurred yet
                console.warn("Audio play blocked by browser policy. Interaction required.");
            } else {
                console.warn("Audio play failed:", e.message, "URL:", url);
            }
        });
    } catch (e) {
        console.error("Sound error", e);
    }
};

export const playCry = (pokemonId: number, pokemonName: string) => {
    // Showdown MP3 cries are very reliable and supported by all browsers
    // Format name: lowercase, remove non-alphanumeric
    const cleanName = pokemonName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const url = `https://play.pokemonshowdown.com/audio/cries/${cleanName}.mp3`;
    playSound(url, 0.4);
};

export const playMoveSfx = (type: string) => {
    const typeSounds: Record<string, string> = {
        fire: 'https://play.pokemonshowdown.com/audio/sfx/fireblast.mp3',
        water: 'https://play.pokemonshowdown.com/audio/sfx/surf.mp3',
        electric: 'https://play.pokemonshowdown.com/audio/sfx/thunderbolt.mp3',
        grass: 'https://play.pokemonshowdown.com/audio/sfx/leafstorm.mp3',
        ice: 'https://play.pokemonshowdown.com/audio/sfx/icebeam.mp3',
        fighting: 'https://play.pokemonshowdown.com/audio/sfx/closecombat.mp3',
        normal: 'https://play.pokemonshowdown.com/audio/sfx/tackle.mp3',
        psychic: 'https://play.pokemonshowdown.com/audio/sfx/psychic.mp3',
        ghost: 'https://play.pokemonshowdown.com/audio/sfx/shadowball.mp3',
        dragon: 'https://play.pokemonshowdown.com/audio/sfx/dragonpulse.mp3',
        dark: 'https://play.pokemonshowdown.com/audio/sfx/darkpulse.mp3',
        steel: 'https://play.pokemonshowdown.com/audio/sfx/flashcannon.mp3',
        fairy: 'https://play.pokemonshowdown.com/audio/sfx/moonblast.mp3',
        bug: 'https://play.pokemonshowdown.com/audio/sfx/bugbuzz.mp3',
        rock: 'https://play.pokemonshowdown.com/audio/sfx/stoneedge.mp3',
        ground: 'https://play.pokemonshowdown.com/audio/sfx/earthquake.mp3',
        poison: 'https://play.pokemonshowdown.com/audio/sfx/sludgebomb.mp3',
        flying: 'https://play.pokemonshowdown.com/audio/sfx/bravebird.mp3',
        default: 'https://play.pokemonshowdown.com/audio/sfx/tackle.mp3'
    };

    const url = typeSounds[type] || typeSounds.default;
    playSound(url, 0.3);
};

export const playFaintSfx = () => {
    playSound('https://www.soundjay.com/button/sounds/button-10.mp3', 0.5);
};

export const playLevelUpSfx = () => {
    playSound('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3', 0.5);
};
