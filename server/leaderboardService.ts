/**
 * Server-side leaderboard service.
 *
 * Tamper-proofing strategy (defense in depth):
 *   1. Clients NEVER submit a score -- they submit the raw ScoreInputs snapshot.
 *      The server re-runs computeExplorerScore() from the shared util so the
 *      weights are a single source of truth and cannot be fudged.
 *   2. Each input field is hard-clamped to a plausible maximum (badges <= 8,
 *      distance <= 10000, etc). Anything beyond is silently pinned to the cap,
 *      denying an attacker infinite score without breaking legitimate saves
 *      that happen to exceed our sanity ranges.
 *   3. Submissions require a Firebase ID token (verified via JWKS). The
 *      leaderboard key is the verified UID, not a client-sent id, so scores
 *      cannot be written under someone else's name.
 *   4. A session must be started before the first submission and the server
 *      remembers `sessionStartedAt`. Submissions must satisfy a per-stat
 *      minimum-duration budget, rejecting "8 badges in 3 seconds" bots.
 *   5. Per-UID rate limit (configurable) prevents flood/DoS.
 *   6. Every accepted submission is appended to an HMAC-chained JSONL journal
 *      so tampering with the on-disk file is detectable.
 *   7. Only the HIGH-WATER-MARK score per UID is kept on the public board.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { computeExplorerScore, ScoreInputs } from '../utils/explorerScore';

// --- Hard clamps -------------------------------------------------------------
// These bounds are intentionally very generous: a player should never hit them
// through legitimate play. They exist to kill `Number.MAX_SAFE_INTEGER` grief.
export const CLAMPS: Record<keyof ScoreInputs, number> = {
    farthestDistance:   10_000,
    chunksDiscovered:   50_000,
    badges:             8,
    totalCaptures:     100_000,
    shiniesCaught:      2_000,
    trainersDefeated:  100_000,
    biggestStreak:      50_000,
    totalMoneyEarned:10_000_000,
    // riftStabilityCleared is boolean, handled separately.
    riftStabilityCleared: 1,
};

/** Minimum seconds of session time required per unit of each stat. */
const DURATION_COST_SECONDS: Partial<Record<keyof ScoreInputs, number>> = {
    badges:            45,   // ~45s per badge at the absolute minimum
    farthestDistance:   1.5, // walking out to a new chunk
    chunksDiscovered:   0.8,
    trainersDefeated:   8,   // even a sweep takes this long
    totalCaptures:      0.5,
    shiniesCaught:     30,
    biggestStreak:      2,
    totalMoneyEarned:   0,
};

export const clampInputs = (raw: Partial<ScoreInputs>): ScoreInputs => {
    const clampN = (n: unknown, max: number): number => {
        const v = typeof n === 'number' && Number.isFinite(n) ? n : 0;
        return Math.max(0, Math.min(max, Math.floor(v)));
    };
    return {
        farthestDistance:   clampN(raw.farthestDistance,   CLAMPS.farthestDistance),
        chunksDiscovered:   clampN(raw.chunksDiscovered,   CLAMPS.chunksDiscovered),
        badges:             clampN(raw.badges,             CLAMPS.badges),
        totalCaptures:      clampN(raw.totalCaptures,      CLAMPS.totalCaptures),
        shiniesCaught:      clampN(raw.shiniesCaught,      CLAMPS.shiniesCaught),
        trainersDefeated:   clampN(raw.trainersDefeated,   CLAMPS.trainersDefeated),
        biggestStreak:      clampN(raw.biggestStreak,      CLAMPS.biggestStreak),
        totalMoneyEarned:   clampN(raw.totalMoneyEarned,   CLAMPS.totalMoneyEarned),
        riftStabilityCleared: Boolean(raw.riftStabilityCleared),
    };
};

/** Returns the minimum session duration (ms) required to legitimately achieve the given inputs. */
export const minRequiredDurationMs = (inputs: ScoreInputs): number => {
    let seconds = 0;
    for (const [key, costPerUnit] of Object.entries(DURATION_COST_SECONDS)) {
        const k = key as keyof ScoreInputs;
        const value = inputs[k] as number;
        if (typeof value === 'number' && costPerUnit) {
            seconds += value * costPerUnit;
        }
    }
    // Factor in a baseline minimum session of 20s so instant-submit is impossible.
    return Math.max(20_000, Math.floor(seconds * 1_000));
};

// --- Sessions ----------------------------------------------------------------
interface Session {
    sessionId: string;
    uid: string;
    startedAt: number;
    lastSubmitAt: number;
}
const sessions = new Map<string, Session>();

export const startSession = (uid: string): { sessionId: string; startedAt: number } => {
    const existing = sessions.get(uid);
    if (existing) {
        // Keep the earliest start time so reloading the page doesn't reset the
        // duration gate (otherwise an attacker would just re-call /start
        // immediately before /submit).
        return { sessionId: existing.sessionId, startedAt: existing.startedAt };
    }
    const sessionId = crypto.randomUUID();
    const now = Date.now();
    sessions.set(uid, { sessionId, uid, startedAt: now, lastSubmitAt: 0 });
    return { sessionId, startedAt: now };
};

export const getSession = (uid: string): Session | undefined => sessions.get(uid);

// --- Leaderboard store -------------------------------------------------------
export interface LeaderboardEntry {
    uid: string;
    name: string;
    score: number;
    title: string;
    farthestDistance: number;
    badges: number;
    shinies: number;
    chunksDiscovered: number;
    trainersDefeated: number;
    totalCaptures: number;
    biggestStreak: number;
    totalMoneyEarned: number;
    riftCleared: boolean;
    verified: true;
    updatedAt: number;
    firstSeenAt: number;
}

const MAX_ENTRIES = 1_000;
const LB_FILE = path.join(process.cwd(), 'leaderboard.json');
const JOURNAL_FILE = path.join(process.cwd(), 'leaderboard-journal.jsonl');

// HMAC key for the journal hash chain. If LEADERBOARD_JOURNAL_SECRET is set in
// the environment we use that; otherwise we generate an ephemeral per-process
// key (which still makes in-memory tampering detectable but not file-level).
const JOURNAL_SECRET =
    process.env.LEADERBOARD_JOURNAL_SECRET ||
    crypto.randomBytes(32).toString('hex');

let entries = new Map<string, LeaderboardEntry>();
let lastJournalHash = 'genesis';
let writeTimer: NodeJS.Timeout | null = null;

export const loadLeaderboard = async (): Promise<void> => {
    try {
        const raw = await fs.readFile(LB_FILE, 'utf-8');
        const data = JSON.parse(raw) as { entries: LeaderboardEntry[]; lastJournalHash?: string };
        const list = Array.isArray(data) ? (data as unknown as LeaderboardEntry[]) : data.entries;
        entries = new Map(list.map((e) => [e.uid, e]));
        if (data.lastJournalHash) lastJournalHash = data.lastJournalHash;
        console.log(`[Leaderboard] Loaded ${entries.size} verified entries from disk.`);
    } catch {
        console.log('[Leaderboard] No existing file -- starting fresh.');
    }
};

const scheduleWrite = () => {
    if (writeTimer) return;
    writeTimer = setTimeout(async () => {
        writeTimer = null;
        try {
            const out = { entries: Array.from(entries.values()), lastJournalHash };
            await fs.writeFile(LB_FILE, JSON.stringify(out, null, 2));
        } catch (err) {
            console.error('[Leaderboard] write failed:', err);
        }
    }, 2_000);
};

const appendJournal = async (record: Record<string, unknown>): Promise<void> => {
    const payload = { ...record, prev: lastJournalHash };
    const serialized = JSON.stringify(payload);
    const hash = crypto
        .createHmac('sha256', JOURNAL_SECRET)
        .update(serialized)
        .digest('hex');
    lastJournalHash = hash;
    const line = JSON.stringify({ ...payload, hash }) + '\n';
    try {
        await fs.appendFile(JOURNAL_FILE, line);
    } catch (err) {
        console.error('[Leaderboard] journal append failed:', err);
    }
};

const sanitizeName = (raw: string): string =>
    String(raw || 'Anon')
        .replace(/[^\w\s\-.'!]/g, '')
        .trim()
        .slice(0, 20) || 'Anon';

// --- Submission --------------------------------------------------------------
export interface SubmissionInput {
    uid: string;
    name: string;
    sessionId: string;
    isAnonymous: boolean;
    inputs: Partial<ScoreInputs>;
}

export type SubmissionResult =
    | { ok: true; entry: LeaderboardEntry; isNewBest: boolean }
    | { ok: false; reason: string };

const MIN_SUBMIT_INTERVAL_MS = 5_000;

export const submit = async (input: SubmissionInput): Promise<SubmissionResult> => {
    const session = sessions.get(input.uid);
    if (!session || session.sessionId !== input.sessionId) {
        return { ok: false, reason: 'session-invalid' };
    }
    const now = Date.now();
    if (now - session.lastSubmitAt < MIN_SUBMIT_INTERVAL_MS) {
        return { ok: false, reason: 'rate-limited' };
    }
    const duration = now - session.startedAt;

    const clamped = clampInputs(input.inputs);
    const minMs = minRequiredDurationMs(clamped);
    if (duration < minMs) {
        return { ok: false, reason: `duration-insufficient (need ${Math.ceil(minMs / 1000)}s, had ${Math.floor(duration / 1000)}s)` };
    }

    const score = computeExplorerScore(clamped);
    const cleanName = sanitizeName(input.name);

    const existing = entries.get(input.uid);
    const isNewBest = !existing || score.total > existing.score;
    const entry: LeaderboardEntry = {
        uid: input.uid,
        name: cleanName,
        score: isNewBest ? score.total : existing!.score,
        title: isNewBest ? score.title : existing!.title,
        farthestDistance: Math.max(existing?.farthestDistance ?? 0, clamped.farthestDistance),
        badges:           Math.max(existing?.badges ?? 0,           clamped.badges),
        shinies:          Math.max(existing?.shinies ?? 0,          clamped.shiniesCaught),
        chunksDiscovered: Math.max(existing?.chunksDiscovered ?? 0, clamped.chunksDiscovered),
        trainersDefeated: Math.max(existing?.trainersDefeated ?? 0, clamped.trainersDefeated),
        totalCaptures:    Math.max(existing?.totalCaptures ?? 0,    clamped.totalCaptures),
        biggestStreak:    Math.max(existing?.biggestStreak ?? 0,    clamped.biggestStreak),
        totalMoneyEarned: Math.max(existing?.totalMoneyEarned ?? 0, clamped.totalMoneyEarned),
        riftCleared:      (existing?.riftCleared ?? false) || clamped.riftStabilityCleared === true,
        verified:         true,
        updatedAt:        now,
        firstSeenAt:      existing?.firstSeenAt ?? now,
    };
    entries.set(input.uid, entry);
    session.lastSubmitAt = now;

    // Trim if we ever explode past the max.
    if (entries.size > MAX_ENTRIES * 2) {
        const sorted = Array.from(entries.values()).sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
        entries = new Map(sorted.map((e) => [e.uid, e]));
    }

    scheduleWrite();
    void appendJournal({
        type: 'submit',
        uid: input.uid,
        anon: input.isAnonymous,
        name: cleanName,
        score: entry.score,
        clamped,
        durationMs: duration,
        at: now,
    });

    return { ok: true, entry, isNewBest };
};

export const top = (limit: number, window?: 'all' | 'weekly'): LeaderboardEntry[] => {
    const all = Array.from(entries.values());
    const now = Date.now();
    const filtered = window === 'weekly'
        ? all.filter((e) => now - e.updatedAt < 7 * 24 * 3600 * 1000)
        : all;
    return filtered.sort((a, b) => b.score - a.score).slice(0, Math.max(1, Math.min(200, limit)));
};

export const getEntryForUid = (uid: string): LeaderboardEntry | undefined => entries.get(uid);

export const stats = () => ({ size: entries.size, sessions: sessions.size });
