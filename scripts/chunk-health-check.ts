import { generateChunk } from '../services/mapData';

type Bucket = 'early' | 'mid' | 'late';

interface Stats {
    total: number;
    emptyTrainer: number;
    invalidNpcChallenge: number;
}

const stats: Record<Bucket, Stats> = {
    early: { total: 0, emptyTrainer: 0, invalidNpcChallenge: 0 },
    mid: { total: 0, emptyTrainer: 0, invalidNpcChallenge: 0 },
    late: { total: 0, emptyTrainer: 0, invalidNpcChallenge: 0 },
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
    console.log(
        `[chunk-health] ${name.toUpperCase()} total=${s.total} emptyTrainer=${s.emptyTrainer} (${emptyRate}%) invalidNpcChallenge=${s.invalidNpcChallenge}`,
    );
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

