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

// -----------------------------------------------------------------------------
// Volume controls.
// Module-level multipliers applied on top of the per-sample `volume` values.
// `sfxVolume` affects all short sample playback (moves, cries, UI clicks).
// `bgmVolume` affects the looped background music. Both are 0..1 linear;
// 1.0 means "play at the developer-tuned level", 0.0 silences.
// Persisted to localStorage under `pokexplorers_audio_v1` so preferences
// survive reload without the player needing to tweak sliders every run.
// -----------------------------------------------------------------------------
const AUDIO_PREF_KEY = 'pokexplorers_audio_v1';
interface AudioPrefs { sfx: number; bgm: number; muted: boolean }
const loadAudioPrefs = (): AudioPrefs => {
    if (typeof window === 'undefined') return { sfx: 1, bgm: 1, muted: false };
    try {
        const raw = window.localStorage.getItem(AUDIO_PREF_KEY);
        if (!raw) return { sfx: 1, bgm: 1, muted: false };
        const p = JSON.parse(raw) as Partial<AudioPrefs>;
        return {
            sfx: typeof p.sfx === 'number' ? Math.max(0, Math.min(1, p.sfx)) : 1,
            bgm: typeof p.bgm === 'number' ? Math.max(0, Math.min(1, p.bgm)) : 1,
            muted: !!p.muted,
        };
    } catch { return { sfx: 1, bgm: 1, muted: false }; }
};
const persistAudioPrefs = (p: AudioPrefs): void => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(AUDIO_PREF_KEY, JSON.stringify(p)); } catch { /* noop */ }
};
let _audioPrefs: AudioPrefs = loadAudioPrefs();
export const getSfxVolume = (): number => _audioPrefs.muted ? 0 : _audioPrefs.sfx;
export const getBgmVolume = (): number => _audioPrefs.muted ? 0 : _audioPrefs.bgm;
export const getMuted = (): boolean => _audioPrefs.muted;
export const setSfxVolume = (v: number): void => {
    _audioPrefs = { ..._audioPrefs, sfx: Math.max(0, Math.min(1, v)) };
    persistAudioPrefs(_audioPrefs);
};
export const setBgmVolume = (v: number): void => {
    _audioPrefs = { ..._audioPrefs, bgm: Math.max(0, Math.min(1, v)) };
    persistAudioPrefs(_audioPrefs);
    _applyLiveBgm();
};
export const setMuted = (m: boolean): void => {
    _audioPrefs = { ..._audioPrefs, muted: m };
    persistAudioPrefs(_audioPrefs);
    _applyLiveBgm();
};
// Defined later in the file once `bgmGain` exists; this is a noop until then.
let _applyLiveBgm: () => void = () => { /* replaced after bgmGain is defined */ };

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

// Real Pokémon trainer-battle music from Showdown's CDN, plus our own
// in-house overworld/title tracks served straight from `public/music/`.
//
// The MP3s live next to the bundle so they share an origin with the app
// (no proxy round-trip, no allow-list), which keeps first-play latency
// predictable. Filenames are intentionally web-safe (no spaces or
// non-ASCII): the original artist titles are preserved in CREDITS.md.
//
// `MENU` is kept as an alias to `TITLE` so existing call sites still
// resolve while the rest of the codebase migrates. Procedural chiptune
// (`proc://…`) survives only as a defensive fallback when the file
// fails to load.
export const BGM_TRACKS = {
    /** Pokémon Ultra Sun & Ultra Moon - Title Screen. Played on the
     *  main menu / starter pick. */
    TITLE:        '/music/title.mp3',
    /** Town theme. Played in town biome chunks (the starting town,
     *  Pokémon Centers, Marts neighborhood). */
    TOWN:         '/music/town.mp3',
    /** Route theme variant A. The route theme alternates A/B per chunk
     *  (parity-based), so a player walking through several routes hears
     *  variation without abrupt restarts. */
    ROUTE_A:      '/music/route_a.mp3',
    /** Route theme variant B. See ROUTE_A. */
    ROUTE_B:      '/music/route_b.mp3',
    /** Interior theme. Played inside any building (homes, gyms, marts,
     *  Pokémon Centers, labs). */
    INTERIOR:     '/music/interior.mp3',
    /** Water theme. Played in lake-biome chunks where the player is
     *  surfing / surrounded by water. */
    WATER:        '/music/water.mp3',

    // -- Backwards-compat aliases ------------------------------------
    MENU:         '/music/title.mp3',
    OVERWORLD:    '/music/route_a.mp3',

    // -- Battle & legacy fallbacks -----------------------------------
    BATTLE:        'https://play.pokemonshowdown.com/audio/bw-trainer.mp3',
    BATTLE_RIVAL:  'https://play.pokemonshowdown.com/audio/bw-rival.mp3',
    BATTLE_ELITE4: 'https://play.pokemonshowdown.com/audio/spl-elite4.mp3',
    BATTLE_GYM:    'https://play.pokemonshowdown.com/audio/hgss-johto-trainer.mp3',
    BATTLE_CHIPTUNE: 'proc://battle',
};

let audioCtx: AudioContext | null = null;
// =============================================================================
// BGM crossfade state.
// ---------------------------------------------------------------------------
// To support smooth transitions (e.g. interior -> town) we keep a small slot
// list of in-flight BGM channels. Each slot owns its source + gain. When the
// caller asks for a new track we add a new slot at full target gain (ramped
// up from 0) and ramp the existing slots' gains down to 0 over the same
// fade window. Slots auto-clean themselves once their gain hits 0.
//
// `bgmBaseGain` is the developer-intended level for the currently-playing
// track (computed at play time). We multiply by `getBgmVolume()` when
// setting the live node gain so that settings sliders can live-adjust
// without destroying the per-track tuning.
// =============================================================================
interface BgmSlot {
    url: string;
    source: AudioBufferSourceNode | null;   // null for procedural tracks
    gain: GainNode | null;                  // null for procedural tracks
    procTheme: string | null;               // proc://<theme> identifier or null
    baseGain: number;                       // dev-tuned target volume
    fadeOutTimer: number | null;            // setTimeout id for cleanup
}
let bgmSlots: BgmSlot[] = [];
let bgmBaseGain: number = 1;
_applyLiveBgm = () => {
    // Re-apply the user's volume setting to whichever slot is currently the
    // "active" one (most recent, last in array). Older fading slots keep
    // their fade ramp; we don't want a settings slider tweak mid-fade to
    // cancel the fade.
    try {
        const live = bgmSlots[bgmSlots.length - 1];
        if (live && live.gain) {
            const ctx = audioCtx;
            const now = ctx ? ctx.currentTime : 0;
            live.gain.gain.cancelScheduledValues(now);
            live.gain.gain.setValueAtTime(live.baseGain * getBgmVolume(), now);
        }
    } catch { /* noop */ }
};
let currentBgmUrl: string | null = null;
let audioUnlocked = false;

// Procedural BGM state. `procBgmActive` is the theme string of the
// proc://<theme> currently being scheduled; setting it to null tells the
// scheduler loop to bail on its next iteration.
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
            prefetchOverworldMusic();
        }).catch(err => {
            lastError = `Resume Fail: ${err.message}`;
            console.warn("[Audio] Resume failed:", err.message);
        });
    } else {
        audioUnlocked = true;
        prefetchCannedSamples();
        prefetchOverworldMusic();
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
        gain.gain.value = volume * getSfxVolume();
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
        gain.gain.value = volume * getSfxVolume();
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
        gain.gain.value = volume * getSfxVolume();
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

/**
 * Short punchy sting for a loss / white-out so the trainer BGM can clear
 * before the title theme comes back — matches the cadence of classic
 * Pokémon "expedition ends" beats without requiring a licensed jingle file.
 */
export const playBattleLossSting = (): void => {
    const ctx = initAudio();
    if (!ctx || ctx.state !== 'running') return;
    const v = getSfxVolume() * 0.34;
    [392, 349.23, 311.13, 277.18, 246.94].forEach((f, i) =>
        playTone(ctx, 'triangle', f, f * 0.97, 0.28, v, i * 0.11));
};

/** Light "whoosh away" sting for fled wild battles — quieter than victory. */
export const playBattleFleeSting = (): void => {
    const ctx = initAudio();
    if (!ctx || ctx.state !== 'running') return;
    const v = getSfxVolume() * 0.22;
    [659.25, 523.25, 392].forEach((f, i) =>
        playTone(ctx, 'triangle', f, f, 0.12, v, i * 0.07));
};

/**
 * Cinematic evolution sequence SFX. Three cues stacked on a timeline so a
 * UI component can just call `playEvolutionStart()`, let the animation run,
 * and call `playEvolutionComplete()` at the reveal frame.
 */
export const playEvolutionStart = (): void => {
    const ctx = initAudio();
    if (!ctx || ctx.state !== 'running') return;
    // Rising arpeggio -- classic evolution "here we go" riff.
    [392, 523.25, 659.25, 783.99, 987.77].forEach((f, i) =>
        playTone(ctx, 'triangle', f, f, 0.22, 0.22 * getSfxVolume(), i * 0.11));
    // Low shimmer bed.
    playNoise(ctx, 2.8, 'bandpass', 1400, 6, 0.08 * getSfxVolume(), { to: 2200, time: 2.8 });
};

export const playEvolutionPulse = (): void => {
    const ctx = initAudio();
    if (!ctx || ctx.state !== 'running') return;
    // Short shimmer used per silhouette flip.
    playTone(ctx, 'sine', 1200, 1800, 0.18, 0.12 * getSfxVolume());
};

export const playEvolutionComplete = (): void => {
    const ctx = initAudio();
    if (!ctx || ctx.state !== 'running') return;
    // Ta-da! Big major-chord release.
    [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((f, i) =>
        playTone(ctx, 'triangle', f, f, 0.45, 0.26 * getSfxVolume(), i * 0.04));
    // Noise burst punctuation.
    playNoise(ctx, 0.25, 'highpass', 3000, 0.6, 0.15 * getSfxVolume());
};

export const playMoveClickSfx = () => {
    playSample(PBR_SAMPLES.moveClick, 0.4, () => triggerProceduralSound('beep'));
};

/**
 * Stat-rise / stat-fall cues. Used by the battle popup layer when a stat
 * change resolves so the player gets an audible confirmation in addition
 * to the visual buff burst. The procedural fallbacks are a rising or
 * falling 3-tone arpeggio so even with the canned sample missing, the
 * pitch direction telegraphs which way the stat moved. Magnitude (1 vs 2)
 * is conveyed by playing two stacked rises on a "sharply" change.
 */
export const playStatUpSfx = (sharply: boolean = false): void => {
    playSample(PBR_SAMPLES.statUp, sharply ? 0.7 : 0.55, () => {
        const ctx = initAudio();
        if (!ctx || ctx.state !== 'running') return;
        const v = getSfxVolume() * 0.28;
        const tones = sharply ? [392, 523.25, 659.25, 783.99, 987.77] : [523.25, 659.25, 783.99];
        tones.forEach((f, i) => playTone(ctx, 'triangle', f, f, 0.13, v, i * 0.06));
    });
};

export const playStatDownSfx = (sharply: boolean = false): void => {
    playSample(PBR_SAMPLES.statDown, sharply ? 0.7 : 0.55, () => {
        const ctx = initAudio();
        if (!ctx || ctx.state !== 'running') return;
        const v = getSfxVolume() * 0.28;
        const tones = sharply ? [659.25, 523.25, 415.30, 329.63, 261.63] : [523.25, 415.30, 329.63];
        tones.forEach((f, i) => playTone(ctx, 'triangle', f, f, 0.16, v, i * 0.07));
    });
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

const startProceduralBGM = (theme: string, volume: number, slot: BgmSlot) => {
    const ctx = initAudio();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const spec = THEMES[theme];
    if (!spec) {
        console.warn("[Audio] Unknown procedural theme:", theme);
        return;
    }

    procBgmActive = theme;
    slot.procTheme = theme;
    slot.gain = ctx.createGain();
    slot.baseGain = volume * spec.volume / 0.2;
    // Live gain is set by crossfadeBGM's ramp; we just connect the node here.
    slot.gain.gain.value = 0;
    slot.gain.connect(ctx.destination);

    const loopBeats = Math.max(totalBeats(spec.melody), totalBeats(spec.bass));
    const loopDur = loopBeats * (60 / spec.bpm);

    let nextStart = ctx.currentTime + 0.05;
    const scheduleOne = () => {
        if (procBgmActive !== theme || !slot.gain) return;
        scheduleLoop(ctx, slot.gain, spec, nextStart);
        nextStart += loopDur;
        const msUntilNext = Math.max(100, (nextStart - ctx.currentTime - 0.3) * 1000);
        procBgmTimer = window.setTimeout(scheduleOne, msUntilNext);
    };
    scheduleOne();
    console.log("[Audio] Procedural BGM started:", theme);
};

// =============================================================================
// BGM CROSSFADE
// ---------------------------------------------------------------------------
// Default fade window for context-driven swaps (interior <-> town, route ->
// water, etc). Long enough to feel musical, short enough that nobody waits
// on the next track. Tweakable per-call via the second arg of playBGM.
// =============================================================================
const DEFAULT_FADE_MS = 1600;

const teardownSlot = (slot: BgmSlot) => {
    if (slot.fadeOutTimer !== null) {
        clearTimeout(slot.fadeOutTimer);
        slot.fadeOutTimer = null;
    }
    if (slot.source) {
        try { slot.source.stop(); slot.source.disconnect(); } catch {}
        slot.source = null;
    }
    if (slot.gain) {
        try { slot.gain.disconnect(); } catch {}
        slot.gain = null;
    }
    if (slot.procTheme) {
        // Killing the active proc theme tells the scheduler loop to stop
        // queueing the next bar. Any already-scheduled tail notes still
        // ring out through the ramp-down gain, which is what we want.
        if (procBgmActive === slot.procTheme) {
            procBgmActive = null;
            if (procBgmTimer !== null) {
                clearTimeout(procBgmTimer);
                procBgmTimer = null;
            }
        }
        slot.procTheme = null;
    }
};

const fadeOutAndDispose = (slot: BgmSlot, fadeMs: number) => {
    const ctx = audioCtx;
    if (!ctx || !slot.gain) {
        teardownSlot(slot);
        return;
    }
    try {
        const now = ctx.currentTime;
        slot.gain.gain.cancelScheduledValues(now);
        // Hold the current value, then ramp linearly to 0. linear (not
        // exponential) keeps the equal-power crossfade with the incoming
        // track perceptually flat at the midpoint.
        slot.gain.gain.setValueAtTime(slot.gain.gain.value, now);
        slot.gain.gain.linearRampToValueAtTime(0.0001, now + fadeMs / 1000);
    } catch { /* noop */ }
    slot.fadeOutTimer = window.setTimeout(() => teardownSlot(slot), fadeMs + 100);
};

/**
 * Play a BGM track with a soft crossfade from whatever's currently playing.
 *
 * - If `url` is the current track and a slot is alive, this is a no-op.
 * - If `url` is a `proc://` theme, it boots the procedural scheduler.
 * - Otherwise it streams the MP3 (using the buffer cache) and starts a
 *   looped AudioBufferSource through a fresh gain node, ramping up from 0.
 *
 * The previous slot (if any) is faded down in parallel and torn down once
 * its ramp completes. This means walking from a building (interior.mp3)
 * out into town (town.mp3) doesn't audibly stop/start -- the two tracks
 * blend for ~1.6s.
 */
/** Outcomes used when fading trainer battle music into field/title tracks. */
export type BattleMusicExitOutcome = 'victory' | 'defeat' | 'flee';

let battleTransitionTimers: number[] = [];

const clearBattleTransitionTimers = (): void => {
    battleTransitionTimers.forEach((id) => clearTimeout(id));
    battleTransitionTimers = [];
};

/**
 * Fade out the trainer battle loop, play a win/defeat/flee sting with a
 * short breathable pause, then crossfade into `nextUrl` (typically field
 * music or `TITLE` after a wipe).
 *
 * Cancels any prior pending battle-exit sequence when called again or when
 * `playBGM`/`stopBGM` fires mid-schedule so field music can't sneak in late.
 */
export const transitionFromBattleMusic = (
    outcome: BattleMusicExitOutcome,
    nextUrl: string,
    volume = 0.3,
): void => {
    clearBattleTransitionTimers();

    const fadeBattleMs =
        outcome === 'flee' ? 300 : outcome === 'defeat' ? 440 : 380;

    fadeOutBGM(fadeBattleMs);

    battleTransitionTimers.push(window.setTimeout(() => {
        if (outcome === 'victory') playBattleWinSfx();
        else if (outcome === 'defeat') playBattleLossSting();
        else playBattleFleeSting();
    }, Math.floor(fadeBattleMs * 0.42)));

    const silenceTailMs =
        outcome === 'victory' ? 920 :
        outcome === 'defeat' ? 1300 :
        620;

    battleTransitionTimers.push(window.setTimeout(() => {
        clearBattleTransitionTimers();
        void playBGM(nextUrl, volume);
    }, fadeBattleMs + silenceTailMs));
};

export const playBGM = async (url: string, volume: number = 0.3, fadeMs: number = DEFAULT_FADE_MS): Promise<void> => {
    clearBattleTransitionTimers();
    const ctx = initAudio();
    if (!ctx || !url) return;
    if (currentBgmUrl === url && bgmSlots.length > 0) {
        const live = bgmSlots[bgmSlots.length - 1];
        if (live.fadeOutTimer === null) return; // already actively playing
    }

    currentBgmUrl = url;

    // 1. Dispose any old slots: ramp them down to 0 over the fade window.
    const oldSlots = bgmSlots.slice();
    bgmSlots = [];
    for (const slot of oldSlots) {
        fadeOutAndDispose(slot, fadeMs);
        bgmSlots.push(slot); // keep reference until teardown so volume slider can find it
    }

    // 2. Boot a fresh slot for the new track.
    const newSlot: BgmSlot = {
        url,
        source: null,
        gain: null,
        procTheme: null,
        baseGain: volume,
        fadeOutTimer: null,
    };
    bgmBaseGain = volume;

    if (url.startsWith('proc://')) {
        startProceduralBGM(url.replace('proc://', ''), volume, newSlot);
    } else {
        try {
            const buffer = await loadBuffer(url);
            // RACE GUARD: if another playBGM() call superseded us during
            // the fetch (player walked from town -> route -> water in <1s),
            // drop this slot silently. Without this, the late-arriving
            // buffer would push a third slot that doesn't match
            // currentBgmUrl, leaving two competing tracks layered.
            if (currentBgmUrl !== url) {
                return;
            }
            if (!buffer) {
                // Fetch failed (404, decode error). Drop the slot and bail
                // rather than committing the player to silence; resetting
                // currentBgmUrl lets the next call retry.
                if (currentBgmUrl === url) currentBgmUrl = null;
                return;
            }
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.loop = true;
            const gain = ctx.createGain();
            gain.gain.value = 0;
            source.connect(gain).connect(ctx.destination);
            source.start(0);
            newSlot.source = source;
            newSlot.gain = gain;
            console.log("[Audio] BGM started (crossfading in):", url);
        } catch (e) {
            lastError = `BGM Fail: ${(e as Error).message}`;
            console.error("[Audio] BGM Playback failed", e);
            if (currentBgmUrl === url) currentBgmUrl = null;
            return;
        }
    }

    // 3. Ramp the new slot up from 0 to its target gain.
    if (newSlot.gain) {
        const now = ctx.currentTime;
        try {
            newSlot.gain.gain.cancelScheduledValues(now);
            newSlot.gain.gain.setValueAtTime(0.0001, now);
            newSlot.gain.gain.linearRampToValueAtTime(
                newSlot.baseGain * getBgmVolume(),
                now + fadeMs / 1000,
            );
        } catch { /* noop */ }
    }

    bgmSlots.push(newSlot);

    // 4. Garbage-collect torn-down slots from the array (they're already
    //    audio-disposed by fadeOutAndDispose's setTimeout).
    setTimeout(() => {
        bgmSlots = bgmSlots.filter(s => s.gain !== null || s.procTheme !== null);
    }, fadeMs + 200);
};

/**
 * Hard stop all BGM with no fade. Clears any scheduled battle-exit sting.
 */
export const stopBGM = (): void => {
    clearBattleTransitionTimers();
    for (const slot of bgmSlots) teardownSlot(slot);
    bgmSlots = [];
    if (procBgmTimer !== null) {
        clearTimeout(procBgmTimer);
        procBgmTimer = null;
    }
    procBgmActive = null;
    currentBgmUrl = null;
};

/**
 * Soft stop: fade out whatever's playing without scheduling a replacement.
 * Useful when the player enters a phase that should be silent (e.g. a
 * cutscene) without the abrupt cut of stopBGM().
 */
export const fadeOutBGM = (fadeMs: number = DEFAULT_FADE_MS): void => {
    for (const slot of bgmSlots) fadeOutAndDispose(slot, fadeMs);
    currentBgmUrl = null;
    setTimeout(() => {
        bgmSlots = bgmSlots.filter(s => s.gain !== null || s.procTheme !== null);
    }, fadeMs + 200);
};

/**
 * Pre-warm the in-house overworld music so the first crossfade is already
 * decoded. Call from `unlockAudio()` so the network round-trip happens in
 * the background while the player is on the main menu.
 *
 * Total payload is ~12MB across 6 tracks; for users on slow links this
 * still arrives well before they finish picking a starter.
 */
export const prefetchOverworldMusic = (): void => {
    const urls = [
        BGM_TRACKS.TITLE,
        BGM_TRACKS.TOWN,
        BGM_TRACKS.ROUTE_A,
        BGM_TRACKS.ROUTE_B,
        BGM_TRACKS.INTERIOR,
        BGM_TRACKS.WATER,
    ];
    for (const u of urls) {
        if (!bufferCache.has(u) && !failedUrls.has(u)) void loadBuffer(u);
    }
};
