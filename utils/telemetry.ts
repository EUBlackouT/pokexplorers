type CounterMap = Record<string, number>;

const STORAGE_KEY = 'pokexplorers.telemetry.counters.v1';

const isBrowser = (): boolean => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readCounters = (): CounterMap => {
    if (!isBrowser()) return {};
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return {};
        return parsed as CounterMap;
    } catch {
        return {};
    }
};

const writeCounters = (counters: CounterMap): void => {
    if (!isBrowser()) return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(counters));
    } catch {
        // Non-fatal; telemetry must never block gameplay.
    }
};

const bump = (key: string, delta: number = 1): void => {
    const counters = readCounters();
    counters[key] = (counters[key] || 0) + delta;
    writeCounters(counters);
};

const emitSummaryIfNeeded = (): void => {
    if (typeof console === 'undefined') return;
    const c = readCounters();
    const chunkTotal = c['chunk.visits.total'] || 0;
    const challengeAccepted = c['challenge.accepted.total'] || 0;
    if (chunkTotal > 0 && chunkTotal % 25 === 0) {
        const empty = c['chunk.visits.emptyTrainer'] || 0;
        const pct = ((empty / Math.max(1, chunkTotal)) * 100).toFixed(1);
        console.info(`[Telemetry] chunk.emptyTrainerRate=${pct}% (${empty}/${chunkTotal})`);
    }
    if (challengeAccepted > 0 && challengeAccepted % 10 === 0) {
        const done = c['challenge.completed.total'] || 0;
        const failed = c['challenge.failed.total'] || 0;
        console.info(`[Telemetry] challenge.outcomes completed=${done} failed=${failed} accepted=${challengeAccepted}`);
    }
};

export const trackChunkVisit = (trainerCount: number): void => {
    bump('chunk.visits.total', 1);
    if (trainerCount <= 0) bump('chunk.visits.emptyTrainer', 1);
    emitSummaryIfNeeded();
};

export const trackTrainerEngagement = (): void => {
    bump('trainer.engagement.total', 1);
};

export const trackChallengeAccepted = (type: string): void => {
    bump('challenge.accepted.total', 1);
    bump(`challenge.accepted.${type}`, 1);
    emitSummaryIfNeeded();
};

export const trackChallengeCompleted = (type: string): void => {
    bump('challenge.completed.total', 1);
    bump(`challenge.completed.${type}`, 1);
    emitSummaryIfNeeded();
};

export const trackChallengeFailed = (type: string): void => {
    bump('challenge.failed.total', 1);
    bump(`challenge.failed.${type}`, 1);
    emitSummaryIfNeeded();
};

export const getTelemetrySnapshot = (): CounterMap => readCounters();

