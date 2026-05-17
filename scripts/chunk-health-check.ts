import { generateChunk } from '../services/mapData';
import { EARLY_IDS, MID_IDS, LATE_IDS } from '../services/pokeService';

type Bucket = 'early' | 'mid' | 'late';

interface Stats {
    total: number;
    emptyTrainer: number;
    invalidNpcChallenge: number;
    trainerTeamCount: number;
    trainerDuplicateTeamCount: number;
    trainerSpeciesCounts: Record<number, number>;
    progressionLeaks: number;
}

const stats: Record<Bucket, Stats> = {
    early: { total: 0, emptyTrainer: 0, invalidNpcChallenge: 0, trainerTeamCount: 0, trainerDuplicateTeamCount: 0, trainerSpeciesCounts: {}, progressionLeaks: 0 },
    mid: { total: 0, emptyTrainer: 0, invalidNpcChallenge: 0, trainerTeamCount: 0, trainerDuplicateTeamCount: 0, trainerSpeciesCounts: {}, progressionLeaks: 0 },
    late: { total: 0, emptyTrainer: 0, invalidNpcChallenge: 0, trainerTeamCount: 0, trainerDuplicateTeamCount: 0, trainerSpeciesCounts: {}, progressionLeaks: 0 },
};

const EARLY = new Set<number>(EARLY_IDS);
const MID = new Set<number>(MID_IDS);
const LATE = new Set<number>(LATE_IDS);
const inEarly = (id: number) => EARLY.has(id);
const inMid = (id: number) => MID.has(id);
const inLate = (id: number) => LATE.has(id);
const bandOf = (id: number): 'early' | 'mid' | 'late' | 'unknown' => {
    if (inEarly(id)) return 'early';
    if (inMid(id)) return 'mid';
    if (inLate(id)) return 'late';
    return 'unknown';
};

const bucketFor = (dist: number): Bucket => {
    if (dist <= 6) return 'early';
    if (dist <= 25) return 'mid';
    return 'late';
};

const validTypes = new Set(['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy']);

let failures = 0;
const originalWarn = console.warn;
console.warn = () => {};

for (let cx = -30; cx <= 30; cx++) {
    for (let cy = -30; cy <= 30; cy++) {
        const dist = Math.sqrt(cx * cx + cy * cy);
        if (dist < 1 || dist > 30) continue;
        const b = bucketFor(dist);
        const chunk = generateChunk(cx, cy, 0);
        stats[b].total += 1;

        const trainerCount = Object.keys(chunk.trainers || {}).length;
        if (b === 'early' && trainerCount <= 0) {
            stats[b].emptyTrainer += 1;
            failures += 1;
        }
        Object.values(chunk.trainers || {}).forEach((trainer: any) => {
            const team = Array.isArray(trainer?.team) ? trainer.team.filter((id: any) => Number.isFinite(id)) : [];
            if (team.length === 0) return;
            const trainerId = String(trainer?.id || '');
            const isRouteTrainer = trainerId.startsWith('route_') || trainerId.startsWith('route_fallback_');
            if (!isRouteTrainer) return;
            stats[b].trainerTeamCount += 1;
            if (new Set(team).size < team.length) {
                stats[b].trainerDuplicateTeamCount += 1;
            }
            for (const id of team) {
                stats[b].trainerSpeciesCounts[id] = (stats[b].trainerSpeciesCounts[id] || 0) + 1;
                // Progression integrity:
                // - early routes: early species only
                // - mid routes: early + mid only
                // - late routes: all bands allowed
                const band = bandOf(id);
                const leak =
                    (b === 'early' && band === 'late') ||
                    (b === 'mid' && band === 'late');
                if (leak) {
                    stats[b].progressionLeaks += 1;
                    failures += 1;
                }
            }
        });

        Object.values(chunk.npcs || {}).forEach((npc) => {
            const ch = npc.challenge as any;
            if (!ch) return;
            const type = ch.type;
            if (['battle', 'collect', 'explore', 'type_trial'].includes(type)) {
                if (!Number.isFinite(ch.rewardPokemonId) || ch.rewardPokemonId < 1 || ch.rewardPokemonId > 1025) {
                    stats[b].invalidNpcChallenge += 1;
                    failures += 1;
                }
            }
            if (type === 'type_trial') {
                if (typeof ch.requiredType !== 'string' || !validTypes.has(ch.requiredType)) {
                    stats[b].invalidNpcChallenge += 1;
                    failures += 1;
                }
            }
            if (type === 'speed') {
                if (!Number.isFinite(ch.timeLimit) || ch.timeLimit <= 0) {
                    stats[b].invalidNpcChallenge += 1;
                    failures += 1;
                }
            }
        });
    }
}

const printBucket = (name: Bucket) => {
    const s = stats[name];
    const emptyRate = s.total > 0 ? ((s.emptyTrainer / s.total) * 100).toFixed(2) : '0.00';
    const duplicateTeamRate = s.trainerTeamCount > 0 ? (s.trainerDuplicateTeamCount / s.trainerTeamCount) : 0;
    const speciesEntries = Object.values(s.trainerSpeciesCounts);
    const totalSpeciesRolls = speciesEntries.reduce((a, b) => a + b, 0);
    const topSpeciesRate = totalSpeciesRolls > 0 ? Math.max(...speciesEntries) / totalSpeciesRolls : 0;
    const uniqueSpecies = Object.keys(s.trainerSpeciesCounts).length;
    const speciesIds = Object.keys(s.trainerSpeciesCounts).map(Number);
    const lateShare = totalSpeciesRolls > 0
        ? speciesIds.reduce((sum, id) => sum + (inLate(id) ? s.trainerSpeciesCounts[id] : 0), 0) / totalSpeciesRolls
        : 0;
    const midLateShare = totalSpeciesRolls > 0
        ? speciesIds.reduce((sum, id) => sum + ((inMid(id) || inLate(id)) ? s.trainerSpeciesCounts[id] : 0), 0) / totalSpeciesRolls
        : 0;
    console.log(
        `[chunk-health] ${name.toUpperCase()} total=${s.total} emptyTrainer=${s.emptyTrainer} (${emptyRate}%) invalidNpcChallenge=${s.invalidNpcChallenge} duplicateTeams=${s.trainerDuplicateTeamCount}/${s.trainerTeamCount} (${(duplicateTeamRate * 100).toFixed(2)}%) topSpeciesRate=${(topSpeciesRate * 100).toFixed(2)}% uniqueSpecies=${uniqueSpecies} progressionLeaks=${s.progressionLeaks} midLateShare=${(midLateShare * 100).toFixed(2)}% lateShare=${(lateShare * 100).toFixed(2)}%`,
    );
    // Regression guardrails:
    // - Teams should almost never contain same-species duplicates.
    // - No one species should dominate a progression band.
    if (duplicateTeamRate > 0.12) {
        console.error(`[chunk-health] ${name.toUpperCase()} duplicate-team rate too high (${(duplicateTeamRate * 100).toFixed(2)}%).`);
        failures += 1;
    }
    if (topSpeciesRate > 0.18) {
        console.error(`[chunk-health] ${name.toUpperCase()} top species domination too high (${(topSpeciesRate * 100).toFixed(2)}%).`);
        failures += 1;
    }
    const uniqueSpeciesFloor = name === 'early' ? 20 : name === 'mid' ? 45 : 30;
    if (uniqueSpecies < uniqueSpeciesFloor) {
        console.error(`[chunk-health] ${name.toUpperCase()} unique species too low (${uniqueSpecies} < ${uniqueSpeciesFloor}).`);
        failures += 1;
    }
    if (s.progressionLeaks > 0) {
        console.error(`[chunk-health] ${name.toUpperCase()} progression leaks detected (${s.progressionLeaks}).`);
        failures += 1;
    }
    // Balance sanity:
    // - Mid band should meaningfully include MID species.
    // - Late band should include a real slice of LATE species.
    if (name === 'mid' && midLateShare < 0.30) {
        console.error(`[chunk-health] MID progression share too low (${(midLateShare * 100).toFixed(2)}% < 30%).`);
        failures += 1;
    }
    if (name === 'late' && lateShare < 0.10) {
        console.error(`[chunk-health] LATE species share too low (${(lateShare * 100).toFixed(2)}% < 10%).`);
        failures += 1;
    }
};

printBucket('early');
printBucket('mid');
printBucket('late');
console.warn = originalWarn;

if (failures > 0) {
    console.error(`[chunk-health] FAILED with ${failures} validation issue(s).`);
    process.exit(1);
}

console.log('[chunk-health] PASS');

