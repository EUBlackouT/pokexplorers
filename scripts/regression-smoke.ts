import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  EARLY_IDS,
  LATE_IDS,
  MID_IDS,
  calculateDamage,
  fetchPokemon,
  getEvolutionTarget,
  getWildPokemon,
} from '../services/pokeService';
import type { Pokemon, PokemonMove } from '../types';
import { getFusionMove } from '../data/fusionChart';

type TestCase = { name: string; run: () => Promise<void> | void };
const tests: TestCase[] = [];
const test = (name: string, run: TestCase['run']) => tests.push({ name, run });

const withFixedRandom = async <T>(value: number, fn: () => Promise<T> | T): Promise<T> => {
  const prev = Math.random;
  (Math as any).random = () => value;
  try {
    return await fn();
  } finally {
    (Math as any).random = prev;
  }
};

const makeMove = (name: string, type: string, power: number): PokemonMove => ({
  name,
  url: '',
  power,
  accuracy: 100,
  type,
  damage_class: 'special',
  pp: 10,
  target: 'selected-pokemon',
  priority: 0,
  meta: { ailment: { name: 'none' }, category: { name: 'damage' } } as any,
});

test('Evolution: Kakuna evolves exactly at level 10', async () => {
  const kakuna9 = await fetchPokemon(14, 9);
  const kakuna10 = await fetchPokemon(14, 10);
  assert.equal(await getEvolutionTarget(kakuna9), null);
  assert.equal(await getEvolutionTarget(kakuna10), 15);
});

test('Evolution: Charmander evolves exactly at level 16', async () => {
  const c15 = await fetchPokemon(4, 15);
  const c16 = await fetchPokemon(4, 16);
  assert.equal(await getEvolutionTarget(c15), null);
  assert.equal(await getEvolutionTarget(c16), 5);
});

test('Evolution: special-condition lines do not auto-evolve by raw level', async () => {
  const eevee = await fetchPokemon(133, 50);
  const poliwhirl = await fetchPokemon(61, 50);
  const golbat = await fetchPokemon(42, 50);
  assert.equal(await getEvolutionTarget(eevee), null);
  assert.equal(await getEvolutionTarget(poliwhirl), null);
  assert.equal(await getEvolutionTarget(golbat), null);
});

test('Wild progression: early routes never leak non-early species', async () => {
  const earlySet = new Set(EARLY_IDS);
  const biomes = ['forest', 'desert', 'lake'] as const;
  for (const biome of biomes) {
    const rolls = await getWildPokemon(150, [4, 8], biome, 2, 0, 1);
    const leaks = rolls.filter((m) => !earlySet.has(m.id));
    assert.equal(leaks.length, 0, `${biome} leaked ${leaks.slice(0, 5).map((m) => `${m.name}#${m.id}`).join(', ')}`);
  }
});

test('Wild progression: early danger tiles still respect early-only band', async () => {
  const earlySet = new Set(EARLY_IDS);
  const rolls = await getWildPokemon(150, [4, 8], 'canyon', 19, 0, 1);
  const leaks = rolls.filter((m) => !earlySet.has(m.id));
  assert.equal(leaks.length, 0, `danger-tile leak: ${leaks.slice(0, 5).map((m) => `${m.name}#${m.id}`).join(', ')}`);
});

test('Wild progression: mid routes never leak late species', async () => {
  const earlySet = new Set(EARLY_IDS);
  const midSet = new Set(MID_IDS);
  const lateSet = new Set(LATE_IDS);
  const bandOf = (id: number): 'early' | 'mid' | 'late' | 'unknown' => {
    if (earlySet.has(id)) return 'early';
    if (midSet.has(id)) return 'mid';
    if (lateSet.has(id)) return 'late';
    return 'unknown';
  };
  const rolls = await getWildPokemon(180, [20, 28], 'forest', 2, 0, 1);
  const leaks = rolls.filter((m) => bandOf(m.id) === 'late');
  assert.equal(leaks.length, 0, `mid leak: ${leaks.slice(0, 5).map((m) => `${m.name}#${m.id}`).join(', ')}`);
});

test('Fusion gauge payoff: fusion hit is materially stronger', async () => {
  const attacker = await fetchPokemon(6, 40);
  const defender = await fetchPokemon(3, 40);
  const a: Pokemon = {
    ...attacker,
    ability: { ...attacker.ability, name: 'Sturdy' },
    types: ['fire'],
    statStages: { attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0, accuracy: 0, evasion: 0 },
  };
  const d: Pokemon = {
    ...defender,
    ability: { ...defender.ability, name: 'Sturdy' },
    types: ['grass'],
    statStages: { attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0, accuracy: 0, evasion: 0 },
  };
  const baseMove = makeMove('Probe Beam', 'fire', 90);

  const [normal, fusion] = await withFixedRandom(0.5, async () => {
    const n = calculateDamage(a, d, { ...baseMove, isFusion: false }, 'none', 'none', 0, 0, true, 0, 0, 0, 0, true, [a], [d]);
    const f = calculateDamage(a, d, { ...baseMove, isFusion: true }, 'none', 'none', 100, 0, true, 0, 0, 0, 0, true, [a], [d]);
    return [n.damage, f.damage] as const;
  });

  assert.ok(fusion > normal, `fusion=${fusion} normal=${normal}`);
});

test('Fusion chart lookup resolves a real move for common pair', () => {
  const fm = getFusionMove('fire', 'water');
  assert.ok(fm);
  assert.equal(fm?.gauge, 100);
  assert.ok((fm?.power || 0) >= 80);
});

test('Battle loading safety hooks are present in App.tsx', async () => {
  const appPath = resolve(process.cwd(), 'App.tsx');
  const src = await readFile(appPath, 'utf8');
  assert.match(src, /Battle failed to initialize for this area/);
  assert.match(src, /setPhase\(GamePhase\.OVERWORLD\)/);
  assert.match(src, /Promise\.race\(\[/);
  assert.match(src, /delay\(2500\)\.then\(\(\) => fallbackBg\)/);
});

const main = async () => {
  let passed = 0;
  for (const t of tests) {
    try {
      await t.run();
      passed += 1;
      console.log(`[regression-smoke] PASS ${t.name}`);
    } catch (err) {
      console.error(`[regression-smoke] FAIL ${t.name}`);
      console.error(err);
      process.exit(1);
    }
  }
  console.log(`[regression-smoke] PASS (${passed}/${tests.length})`);
};

void main();

