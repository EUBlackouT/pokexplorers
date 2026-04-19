
// Reliable Source Mirrors
const MIRRORS = {
    SHOWDOWN_SFX: [
        'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/audio/sfx/',
        'https://play.pokemonshowdown.com/audio/sfx/',
        'https://cdn.jsdelivr.net/gh/smogon/pokemon-showdown@master/audio/sfx/',
        'https://cdn.jsdelivr.net/gh/Zarel/Pokemon-Showdown@master/audio/sfx/'
    ],
    POKEAPI_CRIES: [
        'https://raw.githubusercontent.com/PokeAPI/cries/master/cries/pokemon/latest/',
        'https://raw.githubusercontent.com/PokeAPI/cries/master/cries/pokemon/legacy/',
        'https://play.pokemonshowdown.com/audio/cries/',
        'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/audio/cries/'
    ]
};

export const BGM_TRACKS = {
    MENU: '', 
    OVERWORLD: '', 
    BATTLE: 'https://cdn.pixabay.com/audio/2024/02/14/audio_96716f913e.mp3' 
};

// Web Audio API Context
let audioCtx: AudioContext | null = null;
let bgmSource: AudioBufferSourceNode | null = null;
let bgmGain: GainNode | null = null;
let currentBgmUrl: string | null = null;
let audioUnlocked = false;

// Buffer Cache for performance and reliability
const bufferCache: Map<string, AudioBuffer> = new Map();
const failedUrls: Set<string> = new Set();
let lastError: string | null = null;

// Helper to initialize AudioContext
const initAudio = () => {
    if (audioCtx) {
        return audioCtx;
    }
    try {
        const CtxClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        audioCtx = new CtxClass();
        console.log("[Audio] System Initialized. Current State:", audioCtx.state);
        
        // Listen for state changes
        audioCtx.onstatechange = () => {
            console.log("[Audio] Context State Change:", audioCtx?.state);
            if (audioCtx?.state === 'running') {
                audioUnlocked = true;
            }
        };

        return audioCtx;
    } catch (e) {
        lastError = `Init Fail: ${(e as Error).message}`;
        console.error("[Audio] Init failed", e);
        return null;
    }
};

const showAudioFeedback = (msg: string, isError: boolean = false) => {
    const id = 'audio-feedback-indicator';
    let el = document.getElementById(id);
    if (!el) {
        el = document.createElement('div');
        el.id = id;
        el.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:12px 20px;background:rgba(0,0,0,0.9);font-size:14px;font-weight:bold;pointer-events:none;z-index:99999;border-radius:12px;transition:opacity 0.3s;box-shadow: 0 0 15px rgba(0,0,0,0.5);';
        document.body.appendChild(el);
    }
    el.style.color = isError ? '#ff4444' : '#ffff00';
    el.style.border = `2px solid ${isError ? '#ff4444' : '#ffff00'}`;
    el.innerText = `${isError ? '❌' : '🔈'} ${msg}`;
    el.style.opacity = '1';
    setTimeout(() => { if (el) el.style.opacity = '0'; }, 3000);
};

export const unlockAudio = () => {
    const ctx = initAudio();
    if (ctx) {
        if (ctx.state === 'suspended') {
            console.log("[Audio] Attempting to resume suspended context...");
            ctx.resume().then(() => {
                console.log("[Audio] Context resumed! State:", ctx.state);
                audioUnlocked = true;
                showAudioFeedback("Audio Engine: RUNNING");
                playTestBeep();
            }).catch(err => {
                lastError = `Resume Fail: ${err.message}`;
                console.error("[Audio] Resume failed:", err);
                showAudioFeedback("Audio Resume FAILED", true);
            });
        } else {
            audioUnlocked = true;
            showAudioFeedback("Audio Already Active");
            playTestBeep();
        }
    } else {
        showAudioFeedback("Web Audio Not Supported", true);
    }
};

export const getAudioStatus = () => {
    return {
        state: audioCtx?.state || 'not-initialized',
        unlocked: audioUnlocked,
        cachedBuffers: bufferCache.size,
        failedResources: failedUrls.size,
        lastError
    };
};

export const clearAudioFails = () => {
    failedUrls.clear();
    lastError = null;
    showAudioFeedback("Fails Cleared");
};

// --- Procedural Sound Synthesis (Fixed Silence Issue) ---

const triggerProceduralSound = (type: 'hit' | 'thump' | 'beep' | 'faint') => {
    const ctx = initAudio();
    if (!ctx || ctx.state !== 'running') return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
        case 'hit':
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
            break;
        case 'thump':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(60, now);
            osc.frequency.exponentialRampToValueAtTime(20, now + 0.2);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
            break;
        case 'faint':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.linearRampToValueAtTime(50, now + 0.5);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
            break;
        case 'beep':
        default:
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
            break;
    }
};

export const playTestBeep = () => {
    const ctx = initAudio();
    if (!ctx) return;
    if (ctx.state !== 'running') {
        ctx.resume().then(() => triggerProceduralSound('beep'));
    } else {
        triggerProceduralSound('beep');
    }
    showAudioFeedback("TEST BEEP TRIGGERED");
};

const loadBuffer = async (url: string): Promise<AudioBuffer | null> => {
    const ctx = initAudio();
    if (!ctx) return null;
    if (bufferCache.has(url)) return bufferCache.get(url)!;
    if (failedUrls.has(url)) return null;

    try {
        // Use the internal server proxy to bypass browser CORS/sandbox rules
        const proxyUrl = `/api/audio-proxy?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        
        if (!response.ok) throw new Error(`Proxy HTTP ${response.status}`);
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) throw new Error("Received HTML instead of AudioData");

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        bufferCache.set(url, audioBuffer);
        return audioBuffer;
    } catch (e) {
        lastError = `Fail: ${url.split('/').slice(-2).join('/')} (${(e as Error).message})`;
        console.warn(`[Audio] Load failed for ${url}:`, (e as Error).message);
        failedUrls.add(url);
        return null;
    }
};

const playCascadingSound = async (file: string, mirrorList: string[], ext: string, volume: number = 0.5) => {
    const ctx = initAudio();
    if (!ctx) return;
    
    if (ctx.state === 'suspended') ctx.resume();

    let buffer: AudioBuffer | null = null;
    
    for (const mirror of mirrorList) {
        const url = `${mirror}${file}.${ext}`;
        buffer = await loadBuffer(url);
        if (buffer) break;
    }
    
    if (!buffer) {
        // Procedural Fallbacks - ensuring sound ALWAYS plays
        if (file === 'faint') {
            triggerProceduralSound('faint');
        } else if (file === 'hit' || file === 'damage') {
            triggerProceduralSound('hit');
        } else if (mirrorList === MIRRORS.SHOWDOWN_SFX) {
            // Try 'damage' if 'hit' failed
            if (file === 'hit') {
                playCascadingSound('damage', MIRRORS.SHOWDOWN_SFX, 'mp3', volume);
            } else {
                triggerProceduralSound('hit');
            }
        } else if (mirrorList === MIRRORS.POKEAPI_CRIES) {
            triggerProceduralSound('thump');
        }
        return;
    }

    try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gainNode = ctx.createGain();
        gainNode.gain.value = volume;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
        showAudioFeedback(`${file.toUpperCase()} OK`);
    } catch (e) {
        lastError = `Play Fail: ${(e as Error).message}`;
        console.error("[Audio] Playback trigger failed", e);
    }
};

export const playSound = async (url: string, volume: number = 0.5) => {
    if (!url) return;
    const ctx = initAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const buffer = await loadBuffer(url);
    if (!buffer) {
        triggerProceduralSound('beep');
        return;
    }
    
    try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gainNode = ctx.createGain();
        gainNode.gain.value = volume;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
    } catch (e) {}
};

export const playCry = (pokemonId: number, pokemonName: string) => {
    // Try ID (PokeAPI style)
    playCascadingSound(pokemonId.toString(), MIRRORS.POKEAPI_CRIES, 'ogg', 0.4);
    // Also try Name (Showdown style)
    const normalizedName = pokemonName.toLowerCase().replace(/[^a-z0-9]/g, '');
    playCascadingSound(normalizedName, MIRRORS.POKEAPI_CRIES, 'mp3', 0.4);
};

export const playMoveSfx = (type: string, moveName?: string, sfxUrl?: string) => {
    const typeSfx: Record<string, string> = {
        fire: 'fireblast', water: 'surf', electric: 'thunderbolt', grass: 'leafstorm',
        ice: 'icebeam', fighting: 'closecombat', psychic: 'psychic', ghost: 'shadowball',
        dragon: 'dragonpulse', dark: 'darkpulse', steel: 'flashcannon', fairy: 'moonblast',
        bug: 'bugbuzz', rock: 'stoneedge', ground: 'earthquake', poison: 'sludgebomb',
        flying: 'bravebird'
    };

    const specificSfx: Record<string, string> = {
        'hyper-beam': 'hyperbeam', 'hydro-pump': 'hydropump', 'flamethrower': 'flamethrower',
        'thunderbolt': 'thunderbolt', 'solar-beam': 'solarbeam', 'explosion': 'explosion',
        'ember': 'flamethrower', 'tackle': 'tackle', 'astonish': 'shadowball',
        'payback': 'darkpulse', 'mud-slap': 'mudslap', 'sweet-kiss': 'moonblast'
    };

    if (sfxUrl) {
        playSound(sfxUrl, 0.6);
        return;
    }

    const normalized = moveName?.toLowerCase().trim().replace(/\s+/g, '-') || '';
    const file = specificSfx[normalized] || typeSfx[type.toLowerCase()] || 'tackle';
    playCascadingSound(file, MIRRORS.SHOWDOWN_SFX, 'mp3', 0.6);
};

export const playEffectivenessSfx = (effectiveness: number) => {
    const file = effectiveness > 1 ? 'super-effective' : (effectiveness < 1 ? 'not-very-effective' : 'hit');
    playCascadingSound(file, MIRRORS.SHOWDOWN_SFX, 'mp3', 0.4);
};

export const playFaintSfx = () => playCascadingSound('faint', MIRRORS.SHOWDOWN_SFX, 'mp3', 0.5);

export const playBGM = async (url: string, volume: number = 0.3) => {
    const ctx = initAudio();
    if (!ctx || !url || currentBgmUrl === url) return;
    stopBGM();
    currentBgmUrl = url;
    try {
        const buffer = await loadBuffer(url);
        if (!buffer) return;
        bgmSource = ctx.createBufferSource();
        bgmSource.buffer = buffer;
        bgmSource.loop = true;
        bgmGain = ctx.createGain();
        bgmGain.gain.value = volume;
        bgmSource.connect(bgmGain);
        bgmGain.connect(ctx.destination);
        bgmSource.start(0);
        console.log("[Audio] BGM Started:", url);
    } catch (e) {
        lastError = `BGM Fail: ${(e as Error).message}`;
        console.error("[Audio] BGM Playback failed", e);
    }
};

export const stopBGM = () => {
    if (bgmSource) {
        try { bgmSource.stop(); bgmSource.disconnect(); } catch (e) {}
        bgmSource = null;
    }
    if (bgmGain) { try { bgmGain.disconnect(); } catch (e) {} bgmGain = null; }
    currentBgmUrl = null;
};

export const playLevelUpSfx = () => playSound('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3', 0.5);
