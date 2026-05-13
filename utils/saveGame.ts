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
const SAVE_BACKUP_KEY = 'pokexplorers_save_v1_backup';
const CURRENT_VERSION = 1;
const STORAGE_PROBE_KEY = '__pokexplorers_storage_probe__';
const MAX_DISCOVERED_CHUNKS = 3200;
const MAX_DEFEATED_TRAINERS = 2400;
const MAX_STORY_FLAGS = 2600;
const MAX_ROUTE_FLAGS = 300;
const MAX_ROUTE_RECENT_INCIDENTS = 60;
const MAX_ROUTE_RECENT_CHUNK_ROLES = 60;
const MAX_ROUTE_ARCS = 36;
const MAX_ROUTE_ECHOES = 36;
const MAX_ROUTE_MEMORIES = 240;

export interface SaveFile {
    version: number;
    savedAt: number;
    player: PlayerGlobalState;
}

const isBrowser = (): boolean =>
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

type StorageBackend = {
    name: 'localStorage' | 'sessionStorage';
    storage: Storage;
};

const getStorageBackends = (): StorageBackend[] => {
    if (!isBrowser()) return [];
    const out: StorageBackend[] = [];
    const tryBackend = (name: 'localStorage' | 'sessionStorage', storage: Storage | undefined) => {
        if (!storage) return;
        try {
            storage.setItem(STORAGE_PROBE_KEY, '1');
            storage.removeItem(STORAGE_PROBE_KEY);
            out.push({ name, storage });
        } catch {
            // Access blocked or quota exhausted for this backend.
        }
    };
    tryBackend('localStorage', window.localStorage);
    tryBackend('sessionStorage', window.sessionStorage);
    return out;
};

const readRawSave = (): string | null => {
    const backends = getStorageBackends();
    for (const backend of backends) {
        for (const key of [SAVE_KEY, SAVE_BACKUP_KEY]) {
            try {
                const raw = backend.storage.getItem(key);
                if (raw) return raw;
            } catch {
                // Try next backend.
            }
        }
    }
    return null;
};

const tail = <T,>(arr: T[] | undefined, max: number): T[] => {
    if (!Array.isArray(arr)) return [];
    return arr.length > max ? arr.slice(arr.length - max) : [...arr];
};

const trimChunkMemoryStates = (states: Record<string, string[]> | undefined, maxKeys: number): Record<string, string[]> => {
    if (!states || typeof states !== 'object') return {};
    const keys = Object.keys(states);
    const keep = keys.length > maxKeys ? keys.slice(keys.length - maxKeys) : keys;
    const out: Record<string, string[]> = {};
    for (const k of keep) out[k] = tail(states[k], 8);
    return out;
};

const compactPlayerForSave = (player: PlayerGlobalState, aggressive: boolean): PlayerGlobalState => {
    const route = player.routeState
        ? {
            ...player.routeState,
            routeFlags: tail(player.routeState.routeFlags, MAX_ROUTE_FLAGS),
            recentIncidentIds: tail(player.routeState.recentIncidentIds, MAX_ROUTE_RECENT_INCIDENTS),
            recentChunkRoles: tail(player.routeState.recentChunkRoles, MAX_ROUTE_RECENT_CHUNK_ROLES),
            activeRouteArcs: tail(player.routeState.activeRouteArcs, MAX_ROUTE_ARCS),
            completedRouteArcs: tail(player.routeState.completedRouteArcs, MAX_ROUTE_ARCS),
            failedRouteArcs: tail(player.routeState.failedRouteArcs, MAX_ROUTE_ARCS),
            queuedEchoes: tail(player.routeState.queuedEchoes, MAX_ROUTE_ECHOES),
            chunkMemoryStates: trimChunkMemoryStates(
                player.routeState.chunkMemoryStates,
                aggressive ? Math.floor(MAX_ROUTE_MEMORIES / 2) : MAX_ROUTE_MEMORIES,
            ),
        }
        : player.routeState;

    return {
        ...player,
        discoveredChunks: tail(player.discoveredChunks, aggressive ? Math.floor(MAX_DISCOVERED_CHUNKS / 2) : MAX_DISCOVERED_CHUNKS),
        defeatedTrainers: tail(player.defeatedTrainers, aggressive ? Math.floor(MAX_DEFEATED_TRAINERS / 2) : MAX_DEFEATED_TRAINERS),
        storyFlags: tail(player.storyFlags, aggressive ? Math.floor(MAX_STORY_FLAGS / 2) : MAX_STORY_FLAGS),
        routeState: route,
    };
};

export const hasSave = (): boolean => {
    return loadSave() !== null;
};

export const loadSave = (): SaveFile | null => {
    const raw = readRawSave();
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as SaveFile;
        if (!parsed.player || typeof parsed.version !== 'number') return null;
        return parsed;
    } catch (err) {
        console.warn('[save] Failed to parse save file:', err);
        return null;
    }
};

export const writeSave = (player: PlayerGlobalState): SaveFile | null => {
    const backends = getStorageBackends();
    if (backends.length === 0) return null;

    const attempts: Array<{ player: PlayerGlobalState; label: string }> = [
        { player, label: 'full' },
        { player: compactPlayerForSave(player, false), label: 'compact' },
        { player: compactPlayerForSave(player, true), label: 'compact-aggressive' },
    ];

    for (const attempt of attempts) {
        const file: SaveFile = { version: CURRENT_VERSION, savedAt: Date.now(), player: attempt.player };
        const payload = JSON.stringify(file);
        for (const backend of backends) {
            try {
                backend.storage.setItem(SAVE_KEY, payload);
                backend.storage.setItem(SAVE_BACKUP_KEY, payload);
                return file;
            } catch (err) {
                // Try next backend/compactness level.
                console.warn(`[save] Failed to write ${attempt.label} save to ${backend.name}:`, err);
            }
        }
    }
    return null;
};

export const deleteSave = (): void => {
    for (const backend of getStorageBackends()) {
        try {
            backend.storage.removeItem(SAVE_KEY);
            backend.storage.removeItem(SAVE_BACKUP_KEY);
        } catch {
            // noop
        }
    }
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
        const backends = getStorageBackends();
        if (backends.length === 0) return null;
        for (const backend of backends) {
            try {
                backend.storage.setItem(SAVE_KEY, jsonText);
                backend.storage.setItem(SAVE_BACKUP_KEY, jsonText);
                return parsed;
            } catch {
                // Try next backend.
            }
        }
        return null;
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
