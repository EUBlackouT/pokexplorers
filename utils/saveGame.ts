/**
 * Save game system.
 *
 * Pokexplorers is a single-run, procedurally-generated world, so the "save"
 * here is really a continuous snapshot of `playerState` (party, inventory,
 * badges, quests, discoveries, meta upgrades, etc.). We don't snapshot
 * battle state -- any attempt to save mid-battle would either need to
 * serialize animated VFX timers or require a surgical "pause then resume"
 * engine, which is out of scope.
 *
 * Storage layout:
 *   localStorage[`pokexplorers_save_v1`] -> { version, savedAt, player }
 *
 * The version tag lets us do migrations later without trashing existing
 * saves. If the shape in `types.ts` ever grows breaking fields, bump to
 * v2 and add a migration branch here.
 */

import type { PlayerGlobalState } from '../types';

const SAVE_KEY = 'pokexplorers_save_v1';
const CURRENT_VERSION = 1;

export interface SaveFile {
    version: number;
    savedAt: number;
    player: PlayerGlobalState;
}

const isBrowser = (): boolean =>
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const hasSave = (): boolean => {
    if (!isBrowser()) return false;
    try {
        return window.localStorage.getItem(SAVE_KEY) !== null;
    } catch {
        return false;
    }
};

export const loadSave = (): SaveFile | null => {
    if (!isBrowser()) return null;
    try {
        const raw = window.localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as SaveFile;
        if (!parsed.player || typeof parsed.version !== 'number') return null;
        return parsed;
    } catch (err) {
        console.warn('[save] Failed to parse save file:', err);
        return null;
    }
};

export const writeSave = (player: PlayerGlobalState): SaveFile | null => {
    if (!isBrowser()) return null;
    try {
        const file: SaveFile = { version: CURRENT_VERSION, savedAt: Date.now(), player };
        window.localStorage.setItem(SAVE_KEY, JSON.stringify(file));
        return file;
    } catch (err) {
        // QuotaExceededError is the main failure mode here (team with lots
        // of captured mon + discoveredChunks can run ~1-2MB). We surface
        // nothing to the caller; `writeSave` returning null is the signal.
        console.warn('[save] Failed to write save:', err);
        return null;
    }
};

export const deleteSave = (): void => {
    if (!isBrowser()) return;
    try {
        window.localStorage.removeItem(SAVE_KEY);
    } catch { /* noop */ }
};

/** Last-saved timestamp or null if no save exists. */
export const getLastSavedAt = (): number | null => {
    const s = loadSave();
    return s ? s.savedAt : null;
};

// --- Export / Import helpers ------------------------------------------------
// Players can copy-paste a JSON blob between machines without needing cloud
// saves. We wrap with btoa to discourage casual editing (it's not encryption,
// but stops the "I'll just change badges to 99 in devtools" instinct). The
// server-side leaderboard is the authoritative anti-cheat, this is just UX.

export const exportSaveToString = (): string | null => {
    const file = loadSave();
    if (!file) return null;
    const json = JSON.stringify(file);
    try {
        return btoa(unescape(encodeURIComponent(json)));
    } catch {
        return json;
    }
};

export const importSaveFromString = (payload: string): SaveFile | null => {
    const trimmed = payload.trim();
    if (!trimmed) return null;
    let jsonText: string;
    // Try base64-decoded first, then raw JSON.
    try {
        jsonText = decodeURIComponent(escape(atob(trimmed)));
    } catch {
        jsonText = trimmed;
    }
    try {
        const parsed = JSON.parse(jsonText) as SaveFile;
        if (!parsed.player || typeof parsed.version !== 'number') return null;
        window.localStorage.setItem(SAVE_KEY, jsonText);
        return parsed;
    } catch (err) {
        console.warn('[save] Import failed:', err);
        return null;
    }
};

// --- Pretty timestamp for UI -----------------------------------------------
export const formatSavedAt = (ts: number | null): string => {
    if (!ts) return 'never';
    const diff = Date.now() - ts;
    if (diff < 60_000) return 'just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    const d = new Date(ts);
    return d.toLocaleString();
};
