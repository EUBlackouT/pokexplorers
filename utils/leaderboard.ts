/**
 * Leaderboard client (tamper-proof variant).
 *
 * The authoritative scoreboard lives server-side. The client only ever submits
 *   (a) a Firebase ID token (so the server learns our UID without us being
 *       able to lie about it), and
 *   (b) a raw ScoreInputs snapshot -- the SERVER computes the score.
 *
 * We keep a small offline/local cache so the pause-menu leaderboard still
 * renders without a network connection, but local-only entries are clearly
 * badged as such and never mixed into the public "verified" rankings.
 */

import { auth } from '../firebase';
import { computeExplorerScore, type ScoreInputs } from './explorerScore';

export interface LeaderboardEntry {
    uid: string;
    name: string;
    score: number;
    title: string;
    farthestDistance: number;
    badges: number;
    shinies: number;
    chunksDiscovered?: number;
    trainersDefeated?: number;
    totalCaptures?: number;
    biggestStreak?: number;
    totalMoneyEarned?: number;
    riftCleared?: boolean;
    verified?: boolean;
    updatedAt?: number;
    firstSeenAt?: number;
    local?: boolean;
}

export type LeaderboardWindow = 'all' | 'weekly';

const NAME_KEY = 'pokexplorers:leaderboard:lastName:v2';
const LOCAL_ENTRIES_KEY = 'pokexplorers:local-scores:v2';
const MAX_LOCAL = 50;

// --- Offline mirror ---------------------------------------------------------
const readLocal = (): LeaderboardEntry[] => {
    try {
        const raw = localStorage.getItem(LOCAL_ENTRIES_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as LeaderboardEntry[];
    } catch { return []; }
};

const writeLocal = (entries: LeaderboardEntry[]): void => {
    try {
        const trimmed = [...entries].sort((a, b) => b.score - a.score).slice(0, MAX_LOCAL);
        localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(trimmed));
    } catch { /* quota */ }
};

/** Local stand-in used while offline or before Firebase auth finishes. */
const addLocalEntry = (entry: Omit<LeaderboardEntry, 'uid' | 'updatedAt' | 'firstSeenAt' | 'local' | 'verified'>): LeaderboardEntry => {
    const uid = auth.currentUser?.uid ?? 'local-' + (localStorage.getItem('pokexplorers:localuid') || (() => {
        const id = 'local-' + Math.random().toString(36).slice(2, 10);
        try { localStorage.setItem('pokexplorers:localuid', id); } catch { /* ignore */ }
        return id;
    })());
    const full: LeaderboardEntry = {
        ...entry,
        uid,
        updatedAt: Date.now(),
        firstSeenAt: Date.now(),
        verified: false,
        local: true,
    };
    const existing = readLocal().filter((e) => e.uid !== full.uid);
    existing.push(full);
    writeLocal(existing);
    return full;
};

export const getLocalEntries = (): LeaderboardEntry[] =>
    readLocal().map((e) => ({ ...e, local: true })).sort((a, b) => b.score - a.score);

// --- Auth helpers -----------------------------------------------------------
const waitForUser = async (timeoutMs = 8_000): Promise<boolean> => {
    if (auth.currentUser) return true;
    return new Promise<boolean>((resolve) => {
        const off = auth.onAuthStateChanged((u) => {
            if (u) { off(); resolve(true); }
        });
        setTimeout(() => { off(); resolve(!!auth.currentUser); }, timeoutMs);
    });
};

const idToken = async (): Promise<string | null> => {
    if (!await waitForUser()) return null;
    try { return await auth.currentUser!.getIdToken(); } catch { return null; }
};

// --- Session ---------------------------------------------------------------
let sessionPromise: Promise<{ sessionId: string; startedAt: number } | null> | null = null;

export const getSession = (): Promise<{ sessionId: string; startedAt: number } | null> => {
    if (sessionPromise) return sessionPromise;
    sessionPromise = (async () => {
        const token = await idToken();
        if (!token) return null;
        try {
            const res = await fetch('/api/leaderboard/session/start', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: '{}',
            });
            if (!res.ok) throw new Error('session start ' + res.status);
            return (await res.json()) as { sessionId: string; startedAt: number };
        } catch (err) {
            console.warn('[Leaderboard] Could not start session; will retry later.', err);
            sessionPromise = null; // allow retry
            return null;
        }
    })();
    return sessionPromise;
};

// --- Fetch ----------------------------------------------------------------
interface CachedBoard {
    entries: LeaderboardEntry[];
    window: LeaderboardWindow;
    fetchedAt: number;
}
let cached: CachedBoard | null = null;
const CACHE_TTL = 30_000;

export const fetchLeaderboard = async (
    limit = 50,
    window: LeaderboardWindow = 'all',
): Promise<LeaderboardEntry[]> => {
    if (cached && cached.window === window && Date.now() - cached.fetchedAt < CACHE_TTL) {
        return cached.entries;
    }
    try {
        const res = await fetch(`/api/leaderboard/top?limit=${limit}&window=${window}`);
        if (!res.ok) throw new Error('bad status ' + res.status);
        const data = (await res.json()) as { entries: LeaderboardEntry[] };
        cached = { entries: data.entries, window, fetchedAt: Date.now() };
        const ids = new Set(data.entries.map((e) => e.uid));
        const localOnly = getLocalEntries().filter((e) => !ids.has(e.uid));
        return [...data.entries, ...localOnly].sort((a, b) => b.score - a.score);
    } catch {
        return getLocalEntries();
    }
};

export const invalidateLeaderboardCache = (): void => { cached = null; };

// --- Submit ---------------------------------------------------------------
export interface SubmitResult {
    entry: LeaderboardEntry;
    verified: boolean;
    isNewBest: boolean;
    reason?: string;
}

export const submitScore = async (
    inputs: ScoreInputs,
    name: string,
): Promise<SubmitResult> => {
    // Always mirror locally so the pause-menu board still updates if the
    // server rejects / is offline. The local score is advisory only -- the
    // server recomputes authoritatively and our cached copy will be replaced
    // on a successful submit.
    const localScore = computeExplorerScore(inputs);
    const localStub = addLocalEntry({
        name,
        score: localScore.total,
        title: localScore.title,
        farthestDistance: inputs.farthestDistance,
        badges: inputs.badges,
        shinies: inputs.shiniesCaught,
        chunksDiscovered: inputs.chunksDiscovered,
        trainersDefeated: inputs.trainersDefeated,
        totalCaptures: inputs.totalCaptures,
        biggestStreak: inputs.biggestStreak,
        totalMoneyEarned: inputs.totalMoneyEarned,
        riftCleared: inputs.riftStabilityCleared,
    });

    const session = await getSession();
    const token = await idToken();
    if (!session || !token) {
        return { entry: localStub, verified: false, isNewBest: true, reason: 'offline' };
    }

    try {
        const res = await fetch('/api/leaderboard/submit', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId: session.sessionId, name, inputs }),
        });
        if (!res.ok) {
            const reason = await res.json().catch(() => ({ error: 'unknown' }));
            return { entry: localStub, verified: false, isNewBest: false, reason: (reason as { error?: string }).error };
        }
        const data = (await res.json()) as { entry: LeaderboardEntry; isNewBest: boolean };
        invalidateLeaderboardCache();
        // Update the local mirror with the server-computed score so the
        // pause-menu board reflects reality.
        const updated = { ...data.entry, local: false, verified: true };
        const local = readLocal().filter((e) => e.uid !== updated.uid);
        local.push({ ...updated });
        writeLocal(local);
        return { entry: data.entry, verified: true, isNewBest: data.isNewBest };
    } catch {
        return { entry: localStub, verified: false, isNewBest: false, reason: 'network' };
    }
};

export const getLastSubmittedName = (): string => {
    try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; }
};

export const setLastSubmittedName = (name: string): void => {
    try { localStorage.setItem(NAME_KEY, name); } catch { /* ignore */ }
};

/** Returns the currently-authenticated UID, or null if Firebase hasn't finished. */
export const getCurrentUid = (): string | null => auth.currentUser?.uid ?? null;
