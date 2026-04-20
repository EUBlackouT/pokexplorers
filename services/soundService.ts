// =============================================================================
// Pokémon Explorers - Sound Service
// =============================================================================
// Audio strategy:
//  - Move SFX        -> Official Niantic/TPCi move sounds extracted from
//                       Pokemon GO APKs (PokeMiners repo), keyed by PokeAPI
//                       move slug. Per-type OGG fallback via the pokebedrock
//                       resource pack. Final fallback is our procedural
//                       Web Audio synthesizer (instant, reliable, chiptune-y).
//  - Cries           -> PokeAPI `cries` repo (official latest + legacy OGG)
//                       with Showdown MP3 mirror. Both still live in 2026.
//  - BGM             -> Showdown's official battle BGM CDN (bw-trainer,
//                       xy-trainer, hgss-johto-trainer, spl-elite4, etc.) for
//                       real Pokémon battle music. Procedural chiptune as a
//                       fallback and for the menu / overworld themes.
//  - Server proxy    -> /api/media-proxy (also /api/audio-proxy alias) with
//                       an allow-list for SSRF protection.
// =============================================================================

import { MOVE_SFX_BASE, MOVE_SFX_FILES, MOVE_TYPE_SFX_BASE, MOVE_TYPE_SFX_TYPES } from '../data/moveSounds';
import { LOCAL_MOVE_SFX_BASE, LOCAL_MOVE_SFX_FILES } from '../data/localMoveSounds';
import { MOVE_SFX_ALIASES } from '../data/moveSfxAliases';

// Real gameplay samples from the pokebedrock Minecraft resource pack (community
// rips under fair-use / educational). Used as upgrades over procedural SFX for
// moments that happen often during a battle. All failures silently fall back
// to procedural so the player always gets feedback.
const PBR_BASE = 'https://cdn.jsdelivr.net/gh/smell-of-curry/pokebedrock-res@main/sounds/';
const PBR_SAMPLES = {
    hitSuper:   `${PBR_BASE}gameplay/hit_super_effective.ogg`,
    hurt:       `${PBR_BASE}gameplay/hurt.ogg`,
    heal:       `${PBR_BASE}gameplay/heal.ogg`,
    levelUp:    `${PBR_BASE}gameplay/levelup.ogg`,
    faint:      `${PBR_BASE}gameplay/pokemon_faint.ogg`,
    sendOut:    `${PBR_BASE}gameplay/pokemon_send_out.ogg`,
    battleWin:  `${PBR_BASE}gameplay/battle_win.ogg`,
    moveClick:  `${PBR_BASE}gameplay/battle_move_click.ogg`,
    statUp:     `${PBR_BASE}gameplay/status/stat_rise_up.ogg`,
    statDown:   `${PBR_BASE}gameplay/status/stat_fall_down.ogg`,
};

const MIRRORS = {
    // Both "main" and "master" branches resolve on PokeAPI/cries; we try main
    // first since that's their current default branch.
    POKEAPI_CRIES: [
        // jsDelivr is faster globally and has no rate limits; raw.githubusercontent
        // and play.pokemonshowdown sit here as hot-swap fallbacks.
        'https://cdn.jsdelivr.net/gh/PokeAPI/cries@main/cries/pokemon/latest/',
        'https://cdn.jsdelivr.net/gh/PokeAPI/cries@main/cries/pokemon/legacy/',
        'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/',
        'https://play.pokemonshowdown.com/audio/cries/',
    ]
};

// Real Pokémon trainer-battle music from Showdown's CDN. Procedural chiptune
// ("proc://…") is used for menu + overworld because GameFreak overworld BGM
// isn't hosted anywhere we can legitimately hotlink from.
export const BGM_TRACKS = {
    MENU: 'proc://menu',
    OVERWORLD: 'proc://overworld',
    BATTLE: 'https://play.pokemonshowdown.com/audio/bw-trainer.mp3',
    BATTLE_RIVAL: 'https://play.pokemonshowdown.com/audio/bw-rival.mp3',
    BATTLE_ELITE4: 'https://play.pokemonshowdown.com/audio/spl-elite4.mp3',
    BATTLE_GYM: 'https://play.pokemonshowdown.com/audio/hgss-johto-trainer.mp3',
    BATTLE_CHIPTUNE: 'proc://battle'
};

let audioCtx: AudioContext | null = null;
let bgmSource: AudioBufferSourceNode | null = null;
let bgmGain: GainNode | null = null;
let currentBgmUrl: string | null = null;
let audioUnlocked = false;

// Procedural BGM state
let procBgmTimer: number | null = null;
let procBgmActive: string | null = null;

const bufferCache: Map<string, AudioBuffer> = new Map();
const failedUrls: Set<string> = new Set();
let lastError: string | null = null;

const initAudio = () => {
    if (audioCtx) return audioCtx;
    try {
        const CtxClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        audioCtx = new CtxClass();
        console.log("[Audio] System Initialized. State:", audioCtx.state);
        audioCtx.onstatechange = () => {
            console.log("[Audio] Context State:", audioCtx?.state);
            if (audioCtx?.state === 'running') audioUnlocked = true;
        };
        return audioCtx;
    } catch (e) {
        lastError = `Init Fail: ${(e as Error).message}`;
        console.error("[Audio] Init failed", e);
        return null;
    }
};

export const unlockAudio = () => {
    const ctx = initAudio();
    if (!ctx) {
        console.warn("[Audio] Web Audio not supported in this browser.");
        return;
    }
    if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
            audioUnlocked = true;
            prefetchCannedSamples();
        }).catch(err => {
            lastError = `Resume Fail: ${err.message}`;
            console.warn("[Audio] Resume failed:", err.message);
        });
    } else {
        audioUnlocked = true;
        prefetchCannedSamples();
    }
};

export const getAudioStatus = () => ({
    state: audioCtx?.state || 'not-initialized',
    unlocked: audioUnlocked,
    cachedBuffers: bufferCache.size,
    failedResources: failedUrls.size,
    lastError
});

export const clearAudioFails = () => {
    failedUrls.clear();
    lastError = null;
};

// =============================================================================
// Procedural SFX Synthesis
// =============================================================================
// Pokémon's audio was all synthesized on-chip. This gives us rich, instant,
// reliable move sounds without any external asset dependency.
// =============================================================================

const makeNoiseBuffer = (ctx: AudioContext, duration = 0.5): AudioBuffer => {
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
};

const playNoise = (
    ctx: AudioContext,
    duration: number,
    filterType: BiquadFilterType,
    filterFreq: number,
    filterQ: number,
    volume: number,
    freqRamp?: { to: number; time: number }
) => {
    const src = ctx.createBufferSource();
    src.buffer = makeNoiseBuffer(ctx, duration + 0.05);
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);
    filter.Q.value = filterQ;
    if (freqRamp) {
        filter.frequency.exponentialRampToValueAtTime(freqRamp.to, ctx.currentTime + freqRamp.time);
    }
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + duration + 0.05);
};

const playTone = (
    ctx: AudioContext,
    type: OscillatorType,
    startFreq: number,
    endFreq: number,
    duration: number,
    volume: number,
    delay: number = 0
) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    const t0 = ctx.currentTime + delay;
    osc.frequency.setValueAtTime(startFreq, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t0 + duration);
    gain.gain.setValueAtTime(0.0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
};

const synthByType: Record<string, (ctx: AudioContext, vol: number) => void> = {
    fire: (ctx, v) => {
        playNoise(ctx, 0.45, 'bandpass', 900, 2, v * 0.5, { to: 150, time: 0.45 });
        playTone(ctx, 'sawtooth', 180, 40, 0.4, v * 0.25);
    },
    water: (ctx, v) => {
        playNoise(ctx, 0.5, 'bandpass', 1200, 4, v * 0.5, { to: 400, time: 0.5 });
        playTone(ctx, 'sine', 600, 200, 0.45, v * 0.2);
    },
    ice: (ctx, v) => {
        playNoise(ctx, 0.35, 'highpass', 3000, 1, v * 0.45);
        playTone(ctx, 'triangle', 1800, 800, 0.3, v * 0.25);
        playTone(ctx, 'triangle', 2600, 1200, 0.3, v * 0.18, 0.05);
    },
    electric: (ctx, v) => {
        for (let i = 0; i < 4; i++) {
            playTone(ctx, 'square', 800 + Math.random() * 800, 300, 0.08, v * 0.35, i * 0.06);
        }
        playNoise(ctx, 0.25, 'highpass', 2500, 1, v * 0.3);
    },
    grass: (ctx, v) => {
        playNoise(ctx, 0.4, 'bandpass', 600, 3, v * 0.35, { to: 200, time: 0.4 });
        playTone(ctx, 'triangle', 440, 220, 0.35, v * 0.2);
    },
    bug: (ctx, v) => {
        for (let i = 0; i < 8; i++) {
            playTone(ctx, 'square', 900, 700, 0.04, v * 0.2, i * 0.04);
        }
    },
    poison: (ctx, v) => {
        playTone(ctx, 'sawtooth', 320, 90, 0.45, v * 0.3);
        playNoise(ctx, 0.35, 'lowpass', 800, 0.5, v * 0.25);
    },
    psychic: (ctx, v) => {
        playTone(ctx, 'sine', 400, 1600, 0.4, v * 0.3);
        playTone(ctx, 'sine', 800, 400, 0.4, v * 0.25, 0.1);
    },
    ghost: (ctx, v) => {
        playTone(ctx, 'sawtooth', 120, 400, 0.6, v * 0.3);
        playTone(ctx, 'sawtooth', 130, 380, 0.6, v * 0.2, 0.02);
    },
    dragon: (ctx, v) => {
        playTone(ctx, 'sawtooth', 140, 60, 0.55, v * 0.4);
        playNoise(ctx, 0.4, 'bandpass', 350, 2, v * 0.3);
    },
    dark: (ctx, v) => {
        playTone(ctx, 'sawtooth', 200, 50, 0.5, v * 0.35);
        playNoise(ctx, 0.3, 'lowpass', 400, 0.5, v * 0.25);
    },
    steel: (ctx, v) => {
        playNoise(ctx, 0.25, 'highpass', 4000, 2, v * 0.4);
        playTone(ctx, 'square', 1200, 600, 0.2, v * 0.25);
    },
    fairy: (ctx, v) => {
        [880, 1318, 1760].forEach((f, i) => {
            playTone(ctx, 'triangle', f, f * 1.5, 0.2, v * 0.2, i * 0.06);
        });
    },
    fighting: (ctx, v) => {
        playNoise(ctx, 0.15, 'lowpass', 400, 0.5, v * 0.5);
        playTone(ctx, 'square', 150, 40, 0.18, v * 0.4);
    },
    rock: (ctx, v) => {
        playNoise(ctx, 0.35, 'lowpass', 600, 1, v * 0.55);
        playTone(ctx, 'square', 110, 50, 0.3, v * 0.35);
    },
    ground: (ctx, v) => {
        playNoise(ctx, 0.5, 'lowpass', 200, 0.5, v * 0.6);
        playTone(ctx, 'sine', 80, 30, 0.5, v * 0.4);
    },
    flying: (ctx, v) => {
        playNoise(ctx, 0.4, 'highpass', 1500, 1, v * 0.35, { to: 3000, time: 0.4 });
        playTone(ctx, 'triangle', 600, 1200, 0.3, v * 0.2);
    },
    normal: (ctx, v) => {
        playTone(ctx, 'square', 200, 100, 0.12, v * 0.5);
    }
};

const triggerProceduralSound = (type: 'hit' | 'thump' | 'beep' | 'faint' | 'super' | 'notvery' | 'levelup') => {
    const ctx = initAudio();
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;

    if (type === 'hit') {
        playNoise(ctx, 0.12, 'lowpass', 500, 0.5, 0.45);
        playTone(ctx, 'square', 180, 40, 0.13, 0.25);
    } else if (type === 'thump') {
        playTone(ctx, 'sine', 60, 20, 0.25, 0.5);
    } else if (type === 'faint') {
        playTone(ctx, 'sawtooth', 220, 50, 0.55, 0.35);
        playTone(ctx, 'sawtooth', 180, 30, 0.55, 0.3, 0.1);
    } else if (type === 'super') {
        [660, 990, 1320, 1760].forEach((f, i) =>
            playTone(ctx, 'square', f, f, 0.1, 0.25, i * 0.06));
    } else if (type === 'notvery') {
        playTone(ctx, 'triangle', 220, 110, 0.3, 0.2);
    } else if (type === 'levelup') {
        [523.25, 659.25, 783.99, 1046.50].forEach((f, i) =>
            playTone(ctx, 'triangle', f, f, 0.18, 0.22, i * 0.09));
    } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.3);
    }
};

// =============================================================================
// Asset loading (cries, BGM, move SFX)
// =============================================================================

/**
 * True when `url` points at our own origin (or is a relative path) and can be
 * fetched directly without going through the cross-origin media proxy.
 *
 * This matters for /sfx/moves/*.mp3 served from public/: the proxy has a
 * strict allow-list of external CDNs, so proxying a same-origin URL 403s and
 * poisons the failedUrls set, making subsequent plays fall through to the
 * procedural synth forever.
 */
const isSameOriginUrl = (url: string): boolean => {
    if (url.startsWith('/') && !url.startsWith('//')) return true;
    if (typeof window === 'undefined') return false;
    try {
        const parsed = new URL(url, window.location.href);
        return parsed.origin === window.location.origin;
    } catch {
        return false;
    }
};

const loadBuffer = async (url: string): Promise<AudioBuffer | null> => {
    const ctx = initAudio();
    if (!ctx) return null;
    if (bufferCache.has(url)) return bufferCache.get(url)!;
    if (failedUrls.has(url)) return null;

    try {
        const fetchUrl = isSameOriginUrl(url)
            ? url
            : `/api/media-proxy?url=${encodeURIComponent(url)}`;
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
            throw new Error("Received HTML instead of audio");
        }
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

const playCascadingSound = async (file: string, mirrorList: string[], ext: string, volume: number = 0.5): Promise<boolean> => {
    const ctx = initAudio();
    if (!ctx) return false;
    if (ctx.state === 'suspended') ctx.resume();

    let buffer: AudioBuffer | null = null;
    for (const mirror of mirrorList) {
        const url = `${mirror}${file}.${ext}`;
        buffer = await loadBuffer(url);
        if (buffer) break;
    }
    if (!buffer) return false;

    try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = volume;
        source.connect(gain).connect(ctx.destination);
        source.start(0);
        return true;
    } catch (e) {
        lastError = `Play Fail: ${(e as Error).message}`;
        return false;
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
        const gain = ctx.createGain();
        gain.gain.value = volume;
        source.connect(gain).connect(ctx.destination);
        source.start(0);
    } catch {}
};

// =============================================================================
// Public API
// =============================================================================

export const playCry = async (pokemonId: number, pokemonName: string) => {
    // PokeAPI cries repo keys by numeric ID (.ogg); Showdown keys by name (.mp3).
    // Try the OGG cascade first, and only fall back to Showdown MP3 if the
    // entire PokeAPI path misses -- previously both fired and cries doubled up.
    const oggMirrors = MIRRORS.POKEAPI_CRIES.filter((m) => !m.includes('showdown'));
    const mp3Mirrors = MIRRORS.POKEAPI_CRIES.filter((m) => m.includes('showdown'));
    const oggOk = await playCascadingSound(pokemonId.toString(), oggMirrors, 'ogg', 0.4);
    if (oggOk) return;
    const normalizedName = pokemonName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const mp3Ok = await playCascadingSound(normalizedName, mp3Mirrors, 'mp3', 0.4);
    if (!mp3Ok) triggerProceduralSound('thump');
};

const moveNameToSlug = (raw?: string): string => {
    if (!raw) return '';
    return raw
        .toLowerCase()
        .trim()
        .replace(/['’`]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
};

const playProceduralMove = (type: string, moveName?: string) => {
    const ctx = initAudio();
    if (!ctx || ctx.state !== 'running') return;
    const synth = synthByType[type?.toLowerCase?.() || 'normal'] || synthByType.normal;
    synth(ctx, 0.55);
    const slug = moveNameToSlug(moveName);
    if (slug === 'explosion' || slug === 'self-destruct') {
        setTimeout(() => triggerProceduralSound('thump'), 60);
        setTimeout(() => triggerProceduralSound('hit'), 120);
    } else if (slug === 'hyper-beam' || slug === 'solar-beam' || slug === 'giga-impact') {
        playTone(ctx, 'sawtooth', 1200, 200, 0.7, 0.3);
    }
};

const playDecoded = (buffer: AudioBuffer, volume: number) => {
    const ctx = initAudio();
    if (!ctx) return;
    try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = volume;
        source.connect(gain).connect(ctx.destination);
        source.start(0);
    } catch (e) {
        lastError = `Play Fail: ${(e as Error).message}`;
    }
};

/**
 * Resolve a `pgo:move-slug` pseudo-URL (or an explicit PokeAPI slug string) to
 * the PokeMiners WAV URL. Returns null if the slug isn't in our map.
 */
const resolvePgoUrl = (spec: string): string | null => {
    const slug = spec.startsWith('pgo:') ? spec.slice(4) : spec;
    const file = MOVE_SFX_FILES[moveNameToSlug(slug)];
    return file ? MOVE_SFX_BASE + encodeURIComponent(file) : null;
};

/**
 * Resolve a slug to the LOCAL pack URL, expanding through Gen 8+ aliases when
 * the exact slug isn't in the pack. Returns null if nothing matches.
 */
const resolveLocalMoveUrl = (rawSlug: string): string | null => {
    if (!rawSlug) return null;
    const direct = LOCAL_MOVE_SFX_FILES[rawSlug];
    if (direct) return LOCAL_MOVE_SFX_BASE + direct;
    const aliased = MOVE_SFX_ALIASES[rawSlug];
    if (aliased) {
        const aliasFile = LOCAL_MOVE_SFX_FILES[aliased];
        if (aliasFile) return LOCAL_MOVE_SFX_BASE + aliasFile;
    }
    return null;
};

/**
 * Resolve the URL for a move. Priority cascade:
 *   1. Local curated pack (Gen 1-7 + alias expansion)  -- highest quality
 *   2. PokeMiners per-move WAV                         -- Pokemon GO rips
 *   3. Per-type OGG from pokebedrock                   -- generic fallback
 * Returns null if nothing matches (caller falls back to procedural synth).
 */
const resolveMoveSfxUrl = (type: string, moveName?: string): string | null => {
    const slug = moveNameToSlug(moveName);
    if (slug) {
        const local = resolveLocalMoveUrl(slug);
        if (local) return local;
        const pgo = MOVE_SFX_FILES[slug];
        if (pgo) return MOVE_SFX_BASE + encodeURIComponent(pgo);
    }
    const normalizedType = (type || 'normal').toLowerCase();
    if ((MOVE_TYPE_SFX_TYPES as readonly string[]).includes(normalizedType)) {
        return `${MOVE_TYPE_SFX_BASE}${normalizedType}.ogg`;
    }
    return null;
};

/**
 * Fire-and-forget "cache or procedural" helper: plays a cached buffer instantly
 * or falls back to a procedural synth + warms the cache in the background.
 * Used by all gameplay-event SFX (level-up, faint, etc.) so the first play is
 * never silent, and all subsequent plays are real audio.
 */
const playSample = (url: string, volume: number, proceduralFallback: () => void): void => {
    const ctx = initAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (bufferCache.has(url)) {
        playDecoded(bufferCache.get(url)!, volume);
        return;
    }
    if (!failedUrls.has(url)) {
        void loadBuffer(url);
    }
    proceduralFallback();
};

/**
 * Pre-fetch move SFX so the first in-battle play is instant. Call this when
 * the battle starts with the moves of all participating Pokémon. Safe to call
 * with unknown moves -- unmapped slugs just skip the fetch.
 *
 * Also warms any custom `sfx` override a move carries (including `pgo:` form),
 * so custom moves like Emberlance get their PokeMiners analog ready before
 * the move actually fires.
 */
export const prefetchMoveSfx = (moves: Array<{ type?: string; name?: string; sfx?: string }>): void => {
    const ctx = initAudio();
    if (!ctx) return;
    const urls = new Set<string>();
    for (const m of moves) {
        const baseUrl = resolveMoveSfxUrl(m.type || 'normal', m.name);
        if (baseUrl) urls.add(baseUrl);
        if (m.sfx) {
            const overrideUrl = m.sfx.startsWith('pgo:') ? resolvePgoUrl(m.sfx) : m.sfx;
            if (overrideUrl) urls.add(overrideUrl);
        }
    }
    urls.forEach((u) => { void loadBuffer(u); });
};

/**
 * Play a move's sound effect.
 *
 * Cascade (first win stops the chain):
 *   1. Explicit `sfxUrl` override (custom-move banks; supports `pgo:slug`).
 *   2. Local Gen 1-7 pack / Gen 8+ alias expansion.
 *   3. PokeMiners Pokemon GO WAV.
 *   4. Per-type OGG (pokebedrock).
 *   5. Procedural Web Audio synth.
 *
 * Strategy:
 *   - A cached buffer plays synchronously (zero latency).
 *   - For SAME-ORIGIN candidates (the local pack) we briefly await the fetch
 *     on the first play -- fetches are <100ms on localhost, which is well
 *     inside the attack-animation window, and playing the real sample beats
 *     firing a procedural "boink" as a placeholder. A 350 ms timeout guards
 *     against unexpectedly slow disk/network so audio is never stuck.
 *   - For cross-origin candidates we keep the "procedural now, real later"
 *     strategy since CDN round-trips can be 200-800 ms.
 */
export const playMoveSfx = (type: string, moveName?: string, sfxUrl?: string): void => {
    const ctx = initAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const candidates: string[] = [];
    if (sfxUrl) {
        const resolved = sfxUrl.startsWith('pgo:') ? resolvePgoUrl(sfxUrl) : sfxUrl;
        if (resolved) candidates.push(resolved);
    }
    const fallback = resolveMoveSfxUrl(type, moveName);
    if (fallback && !candidates.includes(fallback)) candidates.push(fallback);

    // Fast path: any candidate already decoded -> play it instantly.
    for (const url of candidates) {
        if (bufferCache.has(url)) {
            playDecoded(bufferCache.get(url)!, 0.7);
            return;
        }
    }

    // Slow path: prefer awaiting a same-origin candidate over firing procedural.
    const localUrl = candidates.find((u) => isSameOriginUrl(u) && !failedUrls.has(u));
    if (localUrl) {
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 350));
        Promise.race([loadBuffer(localUrl), timeout]).then((buf) => {
            if (buf) {
                playDecoded(buf, 0.7);
            } else {
                // Fetch still in flight or it failed outright; warm any remaining
                // cross-origin candidates for next time and use procedural now.
                for (const url of candidates) {
                    if (url !== localUrl && !failedUrls.has(url)) void loadBuffer(url);
                }
                playProceduralMove(type, moveName);
            }
        });
        return;
    }

    // Only cross-origin candidates left: warm them in background, procedural now.
    for (const url of candidates) {
        if (!failedUrls.has(url)) void loadBuffer(url);
    }
    playProceduralMove(type, moveName);
};

export const playEffectivenessSfx = (effectiveness: number) => {
    if (effectiveness > 1) {
        playSample(PBR_SAMPLES.hitSuper, 0.65, () => triggerProceduralSound('super'));
    } else if (effectiveness < 1) {
        triggerProceduralSound('notvery');
    } else {
        triggerProceduralSound('hit');
    }
};

export const playFaintSfx = () => {
    playSample(PBR_SAMPLES.faint, 0.6, () => triggerProceduralSound('faint'));
};

export const playLevelUpSfx = () => {
    playSample(PBR_SAMPLES.levelUp, 0.55, () => triggerProceduralSound('levelup'));
};

export const playSendOutSfx = () => {
    playSample(PBR_SAMPLES.sendOut, 0.55, () => triggerProceduralSound('beep'));
};

export const playBattleWinSfx = () => {
    playSample(PBR_SAMPLES.battleWin, 0.55, () => triggerProceduralSound('levelup'));
};

export const playMoveClickSfx = () => {
    playSample(PBR_SAMPLES.moveClick, 0.4, () => triggerProceduralSound('beep'));
};

/**
 * Eagerly prefetch the most common gameplay samples so the first time they're
 * needed, they're already in cache. Called on audio unlock.
 */
const prefetchCannedSamples = () => {
    const ctx = initAudio();
    if (!ctx) return;
    Object.values(PBR_SAMPLES).forEach((u) => { void loadBuffer(u); });
};

// =============================================================================
// Procedural Chiptune BGM Engine
// =============================================================================
// Lightweight 8-bit music generator. Schedules Web Audio notes ahead of time
// via requestAnimationFrame-style lookahead. All tracks loop indefinitely.
// Theme key is the part after `proc://` in BGM_TRACKS values.
// =============================================================================

// Note helpers: MIDI-style number -> frequency. 69 = A4 = 440Hz.
const n2f = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// Track format: [midiNote | 0 for rest, durationInBeats]
type Note = [number, number];

// C major adventurous theme (menu)
const MENU_MELODY: Note[] = [
    [72, 1], [76, 1], [79, 1], [84, 1],
    [83, 1], [79, 1], [76, 1], [72, 1],
    [74, 1], [77, 1], [81, 1], [86, 1],
    [84, 1], [81, 1], [77, 1], [74, 1],
    [72, 2], [79, 2],
    [77, 1], [76, 1], [74, 1], [72, 1],
];
const MENU_BASS: Note[] = [
    [48, 2], [48, 2], [53, 2], [53, 2],
    [50, 2], [50, 2], [55, 2], [55, 2],
    [48, 2], [55, 2], [53, 2], [50, 2],
];

// Bouncy walking-pace overworld melody (D major)
const OVW_MELODY: Note[] = [
    [74, 0.5], [78, 0.5], [81, 1], [78, 0.5], [74, 0.5],
    [76, 0.5], [79, 0.5], [83, 1], [79, 0.5], [76, 0.5],
    [78, 0.5], [81, 0.5], [85, 1], [81, 0.5], [78, 0.5],
    [76, 0.5], [79, 0.5], [83, 1], [81, 0.5], [78, 1.5],
    [74, 0.5], [78, 0.5], [81, 0.5], [85, 0.5], [83, 2],
];
const OVW_BASS: Note[] = [
    [50, 1], [57, 1], [50, 1], [57, 1],
    [52, 1], [59, 1], [52, 1], [59, 1],
    [54, 1], [61, 1], [54, 1], [61, 1],
    [52, 1], [59, 1], [50, 1], [57, 1],
];

// Intense battle theme (A minor harmonic)
const BATTLE_MELODY: Note[] = [
    [69, 0.5], [72, 0.5], [76, 0.5], [80, 0.5], [81, 1], [80, 0.5], [76, 0.5],
    [74, 0.5], [77, 0.5], [80, 0.5], [77, 0.5], [74, 1], [69, 1],
    [71, 0.5], [74, 0.5], [77, 0.5], [81, 0.5], [83, 1], [81, 0.5], [77, 0.5],
    [76, 0.5], [79, 0.5], [83, 0.5], [86, 0.5], [84, 2],
];
const BATTLE_BASS: Note[] = [
    [33, 0.5], [33, 0.5], [40, 0.5], [40, 0.5],
    [33, 0.5], [33, 0.5], [40, 0.5], [40, 0.5],
    [38, 0.5], [38, 0.5], [45, 0.5], [45, 0.5],
    [31, 0.5], [31, 0.5], [38, 0.5], [38, 0.5],
    [35, 0.5], [35, 0.5], [42, 0.5], [42, 0.5],
    [33, 0.5], [33, 0.5], [40, 0.5], [40, 0.5],
];

type ThemeSpec = { melody: Note[]; bass: Note[]; bpm: number; hasDrums: boolean; leadWave: OscillatorType; volume: number };
const THEMES: Record<string, ThemeSpec> = {
    menu:      { melody: MENU_MELODY,   bass: MENU_BASS,   bpm: 100, hasDrums: false, leadWave: 'triangle', volume: 0.18 },
    overworld: { melody: OVW_MELODY,    bass: OVW_BASS,    bpm: 124, hasDrums: false, leadWave: 'square',   volume: 0.14 },
    battle:    { melody: BATTLE_MELODY, bass: BATTLE_BASS, bpm: 168, hasDrums: true,  leadWave: 'square',   volume: 0.16 },
};

// Total beats in a track = sum of durations in the longer of melody/bass.
const totalBeats = (notes: Note[]) => notes.reduce((s, [, d]) => s + d, 0);

const scheduleNote = (
    ctx: AudioContext,
    dest: GainNode,
    wave: OscillatorType,
    freq: number,
    startTime: number,
    duration: number,
    peakGain: number
) => {
    if (freq <= 0) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, startTime);
    g.gain.setValueAtTime(0.0, startTime);
    g.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
    g.gain.setValueAtTime(peakGain, startTime + Math.max(0.02, duration - 0.05));
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(g).connect(dest);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
};

const scheduleDrum = (ctx: AudioContext, dest: GainNode, startTime: number, kick: boolean) => {
    if (kick) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, startTime);
        osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.12);
        g.gain.setValueAtTime(0.5, startTime);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.13);
        osc.connect(g).connect(dest);
        osc.start(startTime);
        osc.stop(startTime + 0.15);
    } else {
        // Snare: short noise burst
        const buf = makeNoiseBuffer(ctx, 0.15);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1800;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.35, startTime);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.13);
        src.connect(filter).connect(g).connect(dest);
        src.start(startTime);
        src.stop(startTime + 0.15);
    }
};

const scheduleLoop = (ctx: AudioContext, dest: GainNode, theme: ThemeSpec, startTime: number) => {
    const beatDur = 60 / theme.bpm;

    let t = startTime;
    for (const [note, dur] of theme.melody) {
        const d = dur * beatDur * 0.95;
        if (note > 0) scheduleNote(ctx, dest, theme.leadWave, n2f(note), t, d, 0.22);
        t += dur * beatDur;
    }
    const melodyEnd = t;

    t = startTime;
    for (const [note, dur] of theme.bass) {
        const d = dur * beatDur * 0.95;
        if (note > 0) scheduleNote(ctx, dest, 'triangle', n2f(note), t, d, 0.3);
        t += dur * beatDur;
    }

    if (theme.hasDrums) {
        const beats = Math.max(totalBeats(theme.melody), totalBeats(theme.bass));
        for (let b = 0; b < beats; b++) {
            const tt = startTime + b * beatDur;
            if (b % 2 === 0) scheduleDrum(ctx, dest, tt, true);
            if (b % 4 === 2) scheduleDrum(ctx, dest, tt, false);
        }
    }

    return melodyEnd;
};

const startProceduralBGM = (theme: string, volume: number) => {
    const ctx = initAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const spec = THEMES[theme];
    if (!spec) {
        console.warn("[Audio] Unknown procedural theme:", theme);
        return;
    }

    procBgmActive = theme;
    bgmGain = ctx.createGain();
    bgmGain.gain.value = volume * spec.volume / 0.2;
    bgmGain.connect(ctx.destination);

    const loopBeats = Math.max(totalBeats(spec.melody), totalBeats(spec.bass));
    const loopDur = loopBeats * (60 / spec.bpm);

    let nextStart = ctx.currentTime + 0.05;
    const scheduleOne = () => {
        if (procBgmActive !== theme || !bgmGain) return;
        scheduleLoop(ctx, bgmGain, spec, nextStart);
        nextStart += loopDur;
        // schedule next iteration slightly before the current loop ends
        const msUntilNext = Math.max(100, (nextStart - ctx.currentTime - 0.3) * 1000);
        procBgmTimer = window.setTimeout(scheduleOne, msUntilNext);
    };
    scheduleOne();
    console.log("[Audio] Procedural BGM started:", theme);
};

// =============================================================================

export const playBGM = async (url: string, volume: number = 0.3) => {
    const ctx = initAudio();
    if (!ctx || !url || currentBgmUrl === url) return;
    stopBGM();
    currentBgmUrl = url;

    // Procedural theme?
    if (url.startsWith('proc://')) {
        startProceduralBGM(url.replace('proc://', ''), volume);
        return;
    }

    try {
        const buffer = await loadBuffer(url);
        if (!buffer) return;
        bgmSource = ctx.createBufferSource();
        bgmSource.buffer = buffer;
        bgmSource.loop = true;
        bgmGain = ctx.createGain();
        bgmGain.gain.value = volume;
        bgmSource.connect(bgmGain).connect(ctx.destination);
        bgmSource.start(0);
        console.log("[Audio] BGM Started:", url);
    } catch (e) {
        lastError = `BGM Fail: ${(e as Error).message}`;
        console.error("[Audio] BGM Playback failed", e);
    }
};

export const stopBGM = () => {
    if (bgmSource) {
        try { bgmSource.stop(); bgmSource.disconnect(); } catch {}
        bgmSource = null;
    }
    if (bgmGain) { try { bgmGain.disconnect(); } catch {} bgmGain = null; }
    if (procBgmTimer !== null) {
        clearTimeout(procBgmTimer);
        procBgmTimer = null;
    }
    procBgmActive = null;
    currentBgmUrl = null;
};
