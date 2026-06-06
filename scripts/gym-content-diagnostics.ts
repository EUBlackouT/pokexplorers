import { buildGym } from '../services/interiors';
import { getAllGymTeams } from '../data/gymTeams';
import { NEW_MOVES } from '../data/moves';

type CheckResult = { ok: boolean; label: string; detail?: string };

const expectedMooks: Record<number, number> = {
  1: 1,
  2: 2,
  3: 2,
  4: 3,
  5: 3,
  6: 3,
  7: 4,
  8: 4,
};

const puzzleTilesByGym: Record<number, number[]> = {
  2: [71],                 // boulder pushes
  3: [70],                 // ice slide
  4: [213, 214, 218, 219], // electric switch/fence
  6: [216, 217],           // teleport pads
  7: [70],                 // large ice field
};

const customMoveSet = new Set(Object.keys(NEW_MOVES).map((name) => name.toLowerCase()));

function countTiles(layout: number[][]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const row of layout) {
    for (const tile of row) counts.set(tile, (counts.get(tile) ?? 0) + 1);
  }
  return counts;
}

function checkGymInterior(badge: number): CheckResult[] {
  const zone = buildGym(badge, 'chunk_0_0,10,10', [], 0);
  const results: CheckResult[] = [];
  const trainers = Object.values(zone.trainers ?? {});
  const leader = trainers.find((t) => t.id === `gym_leader_${badge}`);
  const mooks = trainers.filter((t) => /^gym\d+_mook\d+$/.test(t.id));
  const tileCounts = countTiles(zone.layout);

  results.push({
    ok: zone.id === `interior:gym:${badge}`,
    label: `Gym ${badge} zone id`,
    detail: zone.id,
  });
  results.push({
    ok: !!leader,
    label: `Gym ${badge} has leader`,
    detail: leader?.name,
  });
  results.push({
    ok: mooks.length === expectedMooks[badge],
    label: `Gym ${badge} mook count`,
    detail: `expected ${expectedMooks[badge]}, got ${mooks.length}`,
  });
  results.push({
    ok: zone.portals?.['10,17'] != null,
    label: `Gym ${badge} return portal`,
  });

  const puzzleTiles = puzzleTilesByGym[badge] ?? [];
  if (puzzleTiles.length > 0) {
    const present = puzzleTiles.filter((tile) => (tileCounts.get(tile) ?? 0) > 0);
    results.push({
      ok: present.length === puzzleTiles.length,
      label: `Gym ${badge} puzzle tiles`,
      detail: `expected ${puzzleTiles.join(',')}; present ${present.join(',')}`,
    });
  }

  return results;
}

function checkGymTeam(badge: number): CheckResult[] {
  const gym = getAllGymTeams().find((g) => g.badgeId === badge);
  if (!gym) return [{ ok: false, label: `Gym ${badge} loadout`, detail: 'missing team definition' }];

  const checks: CheckResult[] = [];
  checks.push({
    ok: gym.loadout.length >= 4,
    label: `Gym ${badge} loadout size`,
    detail: `${gym.loadout.length} mons`,
  });

  const hasCustomMove = gym.loadout.some((mon) =>
    (mon.ensureMoves ?? []).some((m) => customMoveSet.has(String(m).toLowerCase())),
  );
  checks.push({
    ok: hasCustomMove,
    label: `Gym ${badge} uses custom moves`,
  });

  const hasFusionCue = gym.loadout.some((mon) =>
    (mon.ensureMoves ?? []).some((m) => /fusion|sync|resonance|link/i.test(String(m))),
  );
  const hasFusionAbility = gym.loadout.some((mon) =>
    ['AnchorSync', 'FusionMaster', 'HarmonyEngine', 'SyncPulse', 'SyncStrike', 'Resonance', 'SoulLink', 'Feedback'].includes(mon.ability || ''),
  );
  const requiresExplicitFusionKit = badge >= 6;
  checks.push({
    ok: !requiresExplicitFusionKit || hasFusionCue || hasFusionAbility,
    label: `Gym ${badge} fusion/sync kit ${requiresExplicitFusionKit ? '(required)' : '(recommended)'}`,
    detail: `cueMove=${hasFusionCue} fusionAbility=${hasFusionAbility}`,
  });

  return checks;
}

function main() {
  const all: CheckResult[] = [];
  const layoutHashes = new Set<string>();
  let duplicateLayouts = 0;

  for (let badge = 1; badge <= 8; badge++) {
    const zone = buildGym(badge, 'chunk_0_0,10,10', [], 0);
    const hash = JSON.stringify(zone.layout);
    if (layoutHashes.has(hash)) duplicateLayouts++;
    layoutHashes.add(hash);
    all.push(...checkGymInterior(badge));
    all.push(...checkGymTeam(badge));
  }

  all.push({
    ok: duplicateLayouts === 0,
    label: 'Unique interior layouts across 8 gyms',
    detail: duplicateLayouts === 0 ? 'all unique' : `${duplicateLayouts} duplicates`,
  });

  const failed = all.filter((r) => !r.ok);
  for (const r of all) {
    const tag = r.ok ? 'PASS' : 'FAIL';
    console.log(`[gym-diagnostics] ${tag} ${r.label}${r.detail ? ` -- ${r.detail}` : ''}`);
  }

  if (failed.length > 0) {
    console.error(`[gym-diagnostics] FAIL (${failed.length} issues)`);
    process.exit(1);
  }
  console.log(`[gym-diagnostics] PASS (${all.length} checks)`);
}

main();
