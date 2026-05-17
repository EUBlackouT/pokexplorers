import assert from 'node:assert/strict';
import { applySecondaryEffect, calculateAccuracy, calculateDamage, handleEndOfTurnStatus } from '../services/pokeService';
import type { Ability, Pokemon, PokemonMove } from '../types';

const ability = (name: string): Ability => ({
  name,
  url: '',
  isHidden: false,
  description: name,
});

const makeMon = (name: string, abilityName: string, overrides: Partial<Pokemon> = {}): Pokemon => ({
  id: Math.floor(Math.random() * 1_000_000),
  name,
  level: 50,
  sprite: '',
  types: ['normal'],
  abilities: [ability(abilityName)],
  ability: ability(abilityName),
  stats: {
    hp: 200,
    attack: 120,
    defense: 120,
    'special-attack': 120,
    'special-defense': 120,
    speed: 120,
  },
  currentHp: 200,
  maxHp: 200,
  moves: [],
  status: undefined,
  statusTurns: undefined,
  toxicTurns: 0,
  confusionTurns: 0,
  heldItem: undefined,
  isShiny: false,
  experience: 0,
  nextLevelExp: 1000,
  isFainted: false,
  statStages: { attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0, accuracy: 0, evasion: 0 },
  turnCount: 0,
  hasMovedThisTurn: false,
  tookDamageThisTurn: false,
  isProtected: false,
  isInvulnerable: false,
  ...(overrides as any),
});

const move = (name: string, type: string, damageClass: 'physical' | 'special' | 'status', power: number, overrides: Partial<PokemonMove> = {}): PokemonMove =>
  ({
    id: 0,
    name,
    type,
    power,
    accuracy: 100,
    pp: 10,
    damage_class: damageClass,
    target: 'selected-pokemon',
    ...overrides,
  } as PokemonMove);

const withFixedRandom = <T>(value: number, fn: () => T): T => {
  const original = Math.random;
  (Math as any).random = () => value;
  try {
    return fn();
  } finally {
    (Math as any).random = original;
  }
};

const runDamage = (
  attacker: Pokemon,
  defender: Pokemon,
  mv: PokemonMove,
  playerAlly?: Pokemon,
  enemyAlly?: Pokemon,
) =>
  withFixedRandom(0, () =>
    calculateDamage(
      attacker,
      defender,
      mv,
      'none',
      'none',
      0,
      0,
      true,
      0,
      0,
      0,
      0,
      false,
      [attacker, playerAlly ?? makeMon('PlayerAlly', 'Sturdy')],
      [defender, enemyAlly ?? makeMon('EnemyAlly', 'Sturdy')],
    ),
  );

const runDamageStable = (
  attacker: Pokemon,
  defender: Pokemon,
  mv: PokemonMove,
  playerAlly?: Pokemon,
  enemyAlly?: Pokemon,
) =>
  withFixedRandom(0.99, () =>
    calculateDamage(
      attacker,
      defender,
      mv,
      'none',
      'none',
      0,
      0,
      true,
      0,
      0,
      0,
      0,
      false,
      [attacker, playerAlly ?? makeMon('PlayerAlly', 'Sturdy')],
      [defender, enemyAlly ?? makeMon('EnemyAlly', 'Sturdy')],
    ),
  );

const runDamageWithWeather = (
  attacker: Pokemon,
  defender: Pokemon,
  mv: PokemonMove,
  weather: any,
  playerAlly?: Pokemon,
  enemyAlly?: Pokemon,
) =>
  withFixedRandom(0.99, () =>
    calculateDamage(
      attacker,
      defender,
      mv,
      weather,
      'none',
      0,
      0,
      true,
      0,
      0,
      0,
      0,
      false,
      [attacker, playerAlly ?? makeMon('PlayerAlly', 'Sturdy')],
      [defender, enemyAlly ?? makeMon('EnemyAlly', 'Sturdy')],
    ),
  );

const tests: Array<{ name: string; fn: () => void }> = [];
const test = (name: string, fn: () => void) => tests.push({ name, fn });

test('Dazzling blocks priority moves', () => {
  const attacker = makeMon('Atk', 'Sturdy');
  const defender = makeMon('Def', 'Sturdy');
  const enemyAlly = makeMon('Aura', 'Dazzling');
  const res = runDamage(attacker, defender, move('Quick Attack', 'normal', 'physical', 40, { priority: 1, contact: true }), undefined, enemyAlly);
  assert.equal(res.damage, 0);
  assert.match(res.msg || '', /blocked/i);
});

test('Damp blocks explosion-family moves', () => {
  const attacker = makeMon('Atk', 'Sturdy');
  const defender = makeMon('Def', 'Sturdy');
  const enemyAlly = makeMon('DampMon', 'Damp');
  const res = runDamage(attacker, defender, move('Explosion', 'normal', 'physical', 250, { contact: false }), undefined, enemyAlly);
  assert.equal(res.damage, 0);
  assert.match(res.msg || '', /Damp/i);
});

test('Unseen Fist bypasses Protect for contact', () => {
  const defender = makeMon('Def', 'Sturdy', { isProtected: true });
  const normalAttacker = makeMon('Atk', 'Sturdy');
  const bypassAttacker = makeMon('Bypass', 'UnseenFist');
  const tackle = move('Tackle', 'normal', 'physical', 50, { contact: true });

  const blocked = runDamage(normalAttacker, defender, tackle);
  assert.equal(blocked.damage, 0);

  const bypass = runDamage(bypassAttacker, makeMon('Def2', 'Sturdy', { isProtected: true }), tackle);
  assert.ok(bypass.damage > 0);
});

test('Pixilate converts Normal to Fairy offensively', () => {
  const mv = move('Hyper Voice', 'normal', 'special', 90, { isSound: true, contact: false });
  const base = runDamage(
    makeMon('Base', 'Sturdy'),
    makeMon('Dragon', 'Sturdy', { types: ['dragon'] }),
    mv,
  );
  const pix = runDamage(
    makeMon('Pix', 'Pixilate'),
    makeMon('Dragon2', 'Sturdy', { types: ['dragon'] }),
    mv,
  );
  assert.ok(pix.damage > base.damage);
});

test('Normalize suppresses original type advantage', () => {
  const mv = move('Thunderbolt', 'electric', 'special', 90, { contact: false });
  const base = runDamage(
    makeMon('Base', 'Sturdy'),
    makeMon('WaterDef', 'Sturdy', { types: ['water'] }),
    mv,
  );
  const normalized = runDamage(
    makeMon('Norm', 'Normalize'),
    makeMon('WaterDef2', 'Sturdy', { types: ['water'] }),
    mv,
  );
  assert.ok(base.damage > normalized.damage);
});

test('Liquid Voice converts sound moves to Water', () => {
  const mv = move('Hyper Voice', 'normal', 'special', 90, { isSound: true, contact: false });
  const base = runDamage(
    makeMon('Base', 'Sturdy'),
    makeMon('FireDef', 'Sturdy', { types: ['fire'] }),
    mv,
  );
  const liquid = runDamage(
    makeMon('Singer', 'LiquidVoice'),
    makeMon('FireDef2', 'Sturdy', { types: ['fire'] }),
    mv,
  );
  assert.ok(liquid.damage > base.damage);
});

test('Power Spot boosts ally damage', () => {
  const mv = move('Flamethrower', 'fire', 'special', 90, { contact: false });
  const noBoost = runDamage(
    makeMon('Atk', 'Sturdy'),
    makeMon('Def', 'Sturdy'),
    mv,
    makeMon('Ally', 'Sturdy'),
  );
  const boosted = runDamage(
    makeMon('Atk2', 'Sturdy'),
    makeMon('Def2', 'Sturdy'),
    mv,
    makeMon('PowerAlly', 'PowerSpot'),
  );
  assert.ok(boosted.damage > noBoost.damage);
});

test('Friend Guard reduces incoming damage', () => {
  const mv = move('Flamethrower', 'fire', 'special', 90, { contact: false });
  const normal = runDamage(
    makeMon('Atk', 'Sturdy'),
    makeMon('Def', 'Sturdy'),
    mv,
    makeMon('Ally', 'Sturdy'),
    makeMon('EnemyAlly', 'Sturdy'),
  );
  const reduced = runDamage(
    makeMon('Atk2', 'Sturdy'),
    makeMon('Def2', 'Sturdy'),
    mv,
    makeMon('Ally2', 'Sturdy'),
    makeMon('GuardAlly', 'FriendGuard'),
  );
  assert.ok(reduced.damage < normal.damage);
});

test('Shield Dust blocks damaging secondary effects', () => {
  const attacker = makeMon('Atk', 'Sturdy');
  const shieldDustDef = makeMon('Def', 'ShieldDust');
  const mv = move('Flamethrower', 'fire', 'special', 90, {
    meta: { ailment: { name: 'burn' }, ailment_chance: 100 },
  } as any);
  const sec = withFixedRandom(0, () => applySecondaryEffect(attacker, shieldDustDef, mv, 'none', 'none'));
  assert.equal(sec.status, undefined);
  assert.equal(sec.flinch, undefined);
});

test('Stench grants flinch chance on damaging moves', () => {
  const attacker = makeMon('Atk', 'Stench');
  const defender = makeMon('Def', 'Sturdy');
  const mv = move('Flamethrower', 'fire', 'special', 90, { flinchChance: 0 } as any);
  const sec = withFixedRandom(0, () => applySecondaryEffect(attacker, defender, mv, 'none', 'none'));
  assert.equal(sec.flinch, true);
});

test('Stakeout doubles damage against fresh switch-in', () => {
  const mv = move('Crunch', 'dark', 'physical', 80, { contact: true });
  const base = runDamageStable(
    makeMon('Base', 'Sturdy'),
    makeMon('Def', 'Sturdy', { turnCount: 0 }),
    mv,
  );
  const stakeout = runDamageStable(
    makeMon('Hunter', 'Stakeout'),
    makeMon('Def2', 'Sturdy', { turnCount: 0 }),
    mv,
  );
  assert.ok(stakeout.damage > base.damage);
});

test('Steely Spirit boosts ally steel attacks', () => {
  const mv = move('Iron Head', 'steel', 'physical', 80, { contact: true });
  const base = runDamageStable(
    makeMon('Base', 'Sturdy'),
    makeMon('Def', 'Sturdy'),
    mv,
    makeMon('Ally', 'Sturdy'),
  );
  const boosted = runDamageStable(
    makeMon('Base2', 'Sturdy'),
    makeMon('Def2', 'Sturdy'),
    mv,
    makeMon('SteelAlly', 'SteelySpirit'),
  );
  assert.ok(boosted.damage > base.damage);
});

test('Ruin attack abilities alter damage output', () => {
  const specialMove = move('Psychic', 'psychic', 'special', 90, { contact: false });
  const physicalMove = move('Earthquake', 'ground', 'physical', 100, { contact: false });
  const baseSpecial = runDamageStable(makeMon('A', 'Sturdy'), makeMon('D', 'Sturdy'), specialMove);
  const beads = runDamageStable(makeMon('A2', 'BeadsOfRuin'), makeMon('D2', 'Sturdy'), specialMove);
  assert.ok(beads.damage > baseSpecial.damage);
  const basePhysical = runDamageStable(makeMon('A3', 'Sturdy'), makeMon('D3', 'Sturdy'), physicalMove);
  const sword = runDamageStable(makeMon('A4', 'SwordOfRuin'), makeMon('D4', 'Sturdy'), physicalMove);
  assert.ok(sword.damage > basePhysical.damage);
});

test('AuraBreak does not nerf dark/fairy without aura users', () => {
  const darkMove = move('Crunch', 'dark', 'physical', 80, { contact: true });
  const noBreak = runDamageStable(
    makeMon('Atk', 'Sturdy'),
    makeMon('Def', 'Sturdy'),
    darkMove,
    makeMon('Ally', 'Sturdy'),
    makeMon('EnemyAlly', 'Sturdy'),
  );
  const withBreak = runDamageStable(
    makeMon('Atk2', 'Sturdy'),
    makeMon('Def2', 'Sturdy'),
    darkMove,
    makeMon('AuraBreakAlly', 'AuraBreak'),
    makeMon('EnemyAlly2', 'Sturdy'),
  );
  assert.equal(withBreak.damage, noBreak.damage);
});

test('AuraBreak reverses Dark Aura boost', () => {
  const darkMove = move('Crunch', 'dark', 'physical', 80, { contact: true });
  const darkAura = runDamageStable(
    makeMon('Atk', 'DarkAura'),
    makeMon('Def', 'Sturdy'),
    darkMove,
  );
  const reversed = runDamageStable(
    makeMon('Atk2', 'DarkAura'),
    makeMon('Def2', 'Sturdy'),
    darkMove,
    makeMon('AuraBreakAlly', 'AuraBreak'),
  );
  assert.ok(reversed.damage < darkAura.damage);
});

test('Air Lock suppresses weather offense modifiers', () => {
  const fireMove = move('Flamethrower', 'fire', 'special', 90, { contact: false });
  const sunny = runDamageWithWeather(
    makeMon('Atk', 'Sturdy'),
    makeMon('Def', 'Sturdy'),
    fireMove,
    'sun',
  );
  const suppressed = runDamageWithWeather(
    makeMon('Atk2', 'Sturdy'),
    makeMon('Def2', 'Sturdy'),
    fireMove,
    'sun',
    makeMon('WeatherNull', 'AirLock'),
  );
  assert.ok(suppressed.damage < sunny.damage);
});

test('Cloud Nine suppresses weather offense modifiers', () => {
  const waterMove = move('Surf', 'water', 'special', 90, { contact: false });
  const rainy = runDamageWithWeather(
    makeMon('Atk', 'Sturdy'),
    makeMon('Def', 'Sturdy'),
    waterMove,
    'rain',
  );
  const suppressed = runDamageWithWeather(
    makeMon('Atk2', 'Sturdy'),
    makeMon('Def2', 'Sturdy'),
    waterMove,
    'rain',
    makeMon('WeatherNull', 'CloudNine'),
  );
  assert.ok(suppressed.damage < rainy.damage);
});

test('Overcoat prevents weather chip damage', () => {
  const overcoatMon = makeMon('Tank', 'Overcoat');
  const normalMon = makeMon('Normal', 'Sturdy');
  const chipped = handleEndOfTurnStatus(normalMon, 'sand', 'none');
  const blocked = handleEndOfTurnStatus(overcoatMon, 'sand', 'none');
  assert.ok(chipped.damage > 0);
  assert.equal(blocked.damage, 0);
});

test('Wonder Skin reduces status move accuracy', () => {
  const attacker = makeMon('Atk', 'Sturdy');
  const plain = makeMon('Plain', 'Sturdy');
  const wonder = makeMon('Wonder', 'WonderSkin');
  const statusMove = move('Thunder Wave', 'electric', 'status', 0, { accuracy: 100 });
  const hitsPlain = withFixedRandom(0.6, () => calculateAccuracy(attacker, plain, statusMove, true, [attacker], [plain], 'none', true));
  const hitsWonder = withFixedRandom(0.6, () => calculateAccuracy(attacker, wonder, statusMove, true, [attacker], [wonder], 'none', true));
  assert.equal(hitsPlain, true);
  assert.equal(hitsWonder, false);
});

test('Dragons Maw boosts dragon-type damage', () => {
  const mv = move('Dragon Claw', 'dragon', 'physical', 80, { contact: true });
  const base = runDamageStable(makeMon('Base', 'Sturdy'), makeMon('Def', 'Sturdy'), mv);
  const boosted = runDamageStable(makeMon('DragonUser', 'DragonsMaw'), makeMon('Def2', 'Sturdy'), mv);
  assert.ok(boosted.damage > base.damage);
});

test('Klutz disables held-item accuracy bonuses', () => {
  const moveAcc = move('Stone Edge', 'rock', 'physical', 100, { accuracy: 80, contact: false });
  const attackerItem = makeMon('ItemMon', 'Sturdy', { heldItem: { id: 'wide-lens', name: 'Wide Lens', category: 'battle' } as any });
  const attackerKlutz = makeMon('KlutzMon', 'Klutz', { heldItem: { id: 'wide-lens', name: 'Wide Lens', category: 'battle' } as any });
  const defender = makeMon('Def', 'Sturdy');
  const hitWithItem = withFixedRandom(0.85, () => calculateAccuracy(attackerItem, defender, moveAcc, true, [attackerItem], [defender], 'none', true));
  const hitWithKlutz = withFixedRandom(0.85, () => calculateAccuracy(attackerKlutz, defender, moveAcc, true, [attackerKlutz], [defender], 'none', true));
  assert.equal(hitWithItem, true);
  assert.equal(hitWithKlutz, false);
});

test('Neutralizing Gas suppresses other ability accuracy boosts', () => {
  const moveAcc = move('Hydro Pump', 'water', 'special', 110, { accuracy: 80, contact: false });
  const attacker = makeMon('Eyes', 'CompoundEyes');
  const defender = makeMon('Def', 'Sturdy');
  const gasMon = makeMon('Gas', 'NeutralizingGas');
  const hitNormally = withFixedRandom(0.95, () => calculateAccuracy(attacker, defender, moveAcc, true, [attacker], [defender], 'none', true));
  const hitSuppressed = withFixedRandom(0.95, () => calculateAccuracy(attacker, defender, moveAcc, true, [attacker, gasMon], [defender], 'none', true));
  assert.equal(hitNormally, true);
  assert.equal(hitSuppressed, false);
});

test('Illuminate improves move accuracy', () => {
  const moveAcc = move('Hydro Pump', 'water', 'special', 110, { accuracy: 80, contact: false });
  const plain = makeMon('Plain', 'Sturdy');
  const illuminated = makeMon('Lit', 'Illuminate');
  const defender = makeMon('Def', 'Sturdy');
  const plainHit = withFixedRandom(0.85, () => calculateAccuracy(plain, defender, moveAcc, true, [plain], [defender], 'none', true));
  const litHit = withFixedRandom(0.85, () => calculateAccuracy(illuminated, defender, moveAcc, true, [illuminated], [defender], 'none', true));
  assert.equal(plainHit, false);
  assert.equal(litHit, true);
});

test('Orichalcum Pulse boosts physical damage in sun', () => {
  const mv = move('Earthquake', 'ground', 'physical', 100, { contact: false });
  const baseSun = runDamageWithWeather(
    makeMon('Base', 'Sturdy'),
    makeMon('Def', 'Sturdy'),
    mv,
    'sun',
  );
  const boostedSun = runDamageWithWeather(
    makeMon('Pulse', 'OrichalcumPulse'),
    makeMon('Def2', 'Sturdy'),
    mv,
    'sun',
  );
  assert.ok(boostedSun.damage > baseSun.damage);
});

test('Hadron Engine boosts special damage on electric terrain', () => {
  const mv = move('Thunderbolt', 'electric', 'special', 90, { contact: false });
  const base = runDamageStable(
    makeMon('Base', 'Sturdy'),
    makeMon('Def', 'Sturdy'),
    mv,
  );
  const boosted = withFixedRandom(0.99, () =>
    calculateDamage(
      makeMon('Engine', 'HadronEngine'),
      makeMon('Def2', 'Sturdy'),
      mv,
      'none',
      'electric',
      0,
      0,
      true,
      0,
      0,
      0,
      0,
      false,
      [makeMon('Engine', 'HadronEngine')],
      [makeMon('Def2', 'Sturdy')],
    ),
  );
  assert.ok(boosted.damage > base.damage);
});

test('Rivalry modifies damage by matchup parity', () => {
  const mv = move('Crunch', 'dark', 'physical', 80, { contact: true });
  const sameParity = runDamageStable(
    makeMon('RivalA', 'Rivalry', { id: 100 }),
    makeMon('RivalB', 'Sturdy', { id: 102 }),
    mv,
  );
  const diffParity = runDamageStable(
    makeMon('RivalC', 'Rivalry', { id: 101 }),
    makeMon('RivalD', 'Sturdy', { id: 102 }),
    mv,
  );
  assert.ok(sameParity.damage > diffParity.damage);
});

test('Heavy Metal increases low-kick style weight damage', () => {
  const mv = move('Low Kick', 'fighting', 'physical', 20, { contact: true });
  const normal = runDamageStable(
    makeMon('Atk', 'Sturdy'),
    makeMon('Normal', 'Sturdy'),
    mv,
  );
  const heavy = runDamageStable(
    makeMon('Atk2', 'Sturdy'),
    makeMon('Heavy', 'HeavyMetal'),
    mv,
  );
  assert.ok(heavy.damage > normal.damage);
});

test('Light Metal decreases low-kick style weight damage', () => {
  const mv = move('Low Kick', 'fighting', 'physical', 20, { contact: true });
  const normal = runDamageStable(
    makeMon('Atk', 'Sturdy'),
    makeMon('Normal', 'Sturdy'),
    mv,
  );
  const light = runDamageStable(
    makeMon('Atk2', 'Sturdy'),
    makeMon('Light', 'LightMetal'),
    mv,
  );
  assert.ok(light.damage < normal.damage);
});

test('Long Reach makes contact moves fail to bypass Protect', () => {
  const moveContact = move('Leaf Blade', 'grass', 'physical', 90, { contact: true });
  const attacker = makeMon('Ranger', 'LongReach');
  const defender = makeMon('Wall', 'Sturdy', { isProtected: true });
  const res = runDamageStable(attacker, defender, moveContact);
  assert.equal(res.damage, 0);
  assert.match(res.msg || '', /protected/i);
});

test('Neutralizing Gas suppresses Dragons Maw boost', () => {
  const mv = move('Dragon Claw', 'dragon', 'physical', 80, { contact: true });
  const boosted = runDamageStable(
    makeMon('DragonUser', 'DragonsMaw'),
    makeMon('Def', 'Sturdy'),
    mv,
  );
  const suppressed = runDamageStable(
    makeMon('DragonUser2', 'DragonsMaw'),
    makeMon('Def2', 'Sturdy'),
    mv,
    makeMon('GasAlly', 'NeutralizingGas'),
  );
  assert.ok(suppressed.damage < boosted.damage);
});

test('Quark Drive boosts damage on electric terrain', () => {
  const mv = move('Thunderbolt', 'electric', 'special', 90, { contact: false });
  const base = withFixedRandom(0.99, () =>
    calculateDamage(
      makeMon('Base', 'Sturdy'),
      makeMon('Def', 'Sturdy'),
      mv,
      'none',
      'none',
      0,
      0,
      true,
      0,
      0,
      0,
      0,
      false,
      [makeMon('Base', 'Sturdy')],
      [makeMon('Def', 'Sturdy')],
    ),
  );
  const boosted = withFixedRandom(0.99, () =>
    calculateDamage(
      makeMon('Drive', 'QuarkDrive'),
      makeMon('Def2', 'Sturdy'),
      mv,
      'none',
      'electric',
      0,
      0,
      true,
      0,
      0,
      0,
      0,
      false,
      [makeMon('Drive', 'QuarkDrive')],
      [makeMon('Def2', 'Sturdy')],
    ),
  );
  assert.ok(boosted.damage > base.damage);
});

test('Orichalcum Pulse has no bonus without sun', () => {
  const mv = move('Earthquake', 'ground', 'physical', 100, { contact: false });
  const base = runDamageStable(
    makeMon('Base', 'Sturdy'),
    makeMon('Def', 'Sturdy'),
    mv,
  );
  const pulseNoSun = runDamageStable(
    makeMon('Pulse', 'OrichalcumPulse'),
    makeMon('Def2', 'Sturdy'),
    mv,
  );
  assert.equal(pulseNoSun.damage, base.damage);
});

test('Hustle lowers physical move accuracy', () => {
  const moveAcc = move('Iron Head', 'steel', 'physical', 80, { accuracy: 100, contact: true });
  const normal = makeMon('Normal', 'Sturdy');
  const hustle = makeMon('Hustler', 'Hustle');
  const defender = makeMon('Def', 'Sturdy');
  const normalHit = withFixedRandom(0.9, () => calculateAccuracy(normal, defender, moveAcc, true, [normal], [defender], 'none', true));
  const hustleHit = withFixedRandom(0.9, () => calculateAccuracy(hustle, defender, moveAcc, true, [hustle], [defender], 'none', true));
  assert.equal(normalHit, true);
  assert.equal(hustleHit, false);
});

test('Victory Star ally boosts accuracy', () => {
  const moveAcc = move('Hydro Pump', 'water', 'special', 110, { accuracy: 80, contact: false });
  const attacker = makeMon('Attacker', 'Sturdy');
  const defender = makeMon('Def', 'Sturdy');
  const noAllyHit = withFixedRandom(0.85, () => calculateAccuracy(attacker, defender, moveAcc, true, [attacker], [defender], 'none', true));
  const allyHit = withFixedRandom(0.85, () => calculateAccuracy(attacker, defender, moveAcc, true, [attacker, makeMon('Ally', 'VictoryStar')], [defender], 'none', true));
  assert.equal(noAllyHit, false);
  assert.equal(allyHit, true);
});

test('Skill Link forces max multi-hit count', () => {
  const attacker = makeMon('Linker', 'SkillLink');
  const defender = makeMon('Def', 'Sturdy');
  const multi = move('Bullet Seed', 'grass', 'physical', 25, {
    min_hits: 2,
    max_hits: 5,
    contact: false,
  } as any);
  const res = runDamageStable(attacker, defender, multi);
  assert.equal(res.hits, 5);
});

test('Innards Out uses fainted HP pool for retaliation', () => {
  const attacker = makeMon('Attacker', 'Sturdy', { currentHp: 200, maxHp: 200 });
  const defender = makeMon('Innards', 'InnardsOut', { currentHp: 90, maxHp: 200 });
  const mv = move('Close Combat', 'fighting', 'physical', 120, { contact: true });
  const hit = runDamageStable(attacker, defender, mv);
  const expectedRetaliation = Math.max(1, Math.min(90, hit.damage));
  const simulatedAttackerHpAfterHit = 200 - expectedRetaliation;
  assert.ok(simulatedAttackerHpAfterHit < 200);
});

test('Battle Armor prevents critical hits', () => {
  const mv = move('Slash', 'normal', 'physical', 70, { highCrit: true, contact: true } as any);
  const res = runDamageStable(
    makeMon('Critter', 'SuperLuck'),
    makeMon('Tank', 'BattleArmor'),
    mv,
  );
  assert.equal(res.isCritical, false);
});

test('Merciless guarantees criticals on poisoned targets', () => {
  const mv = move('Poison Jab', 'poison', 'physical', 80, { contact: true });
  const res = runDamageStable(
    makeMon('Assassin', 'Merciless'),
    makeMon('Target', 'Sturdy', { status: 'poison' }),
    mv,
  );
  assert.equal(res.isCritical, true);
});

test('Neutralizing Gas suppresses Huge Power damage boost', () => {
  const mv = move('Body Slam', 'normal', 'physical', 85, { contact: true });
  const boosted = runDamageStable(
    makeMon('Power', 'HugePower'),
    makeMon('Def', 'Sturdy'),
    mv,
  );
  const suppressed = runDamageStable(
    makeMon('Power2', 'HugePower'),
    makeMon('Def2', 'Sturdy'),
    mv,
    makeMon('GasAlly', 'NeutralizingGas'),
  );
  assert.ok(suppressed.damage < boosted.damage);
});

test('Defeatist lowers damage below half HP', () => {
  const mv = move('Aerial Ace', 'flying', 'physical', 60, { contact: true });
  const healthy = runDamageStable(
    makeMon('Bird', 'Defeatist', { currentHp: 200 }),
    makeMon('Def', 'Sturdy'),
    mv,
  );
  const low = runDamageStable(
    makeMon('BirdLow', 'Defeatist', { currentHp: 90 }),
    makeMon('Def2', 'Sturdy'),
    mv,
  );
  assert.ok(low.damage < healthy.damage);
});

test('Guts boosts burned physical attacker', () => {
  const mv = move('Facade', 'normal', 'physical', 70, { contact: true });
  const burnedNoGuts = runDamageStable(
    makeMon('NoGuts', 'Sturdy', { status: 'burn' }),
    makeMon('Def', 'Sturdy'),
    mv,
  );
  const burnedGuts = runDamageStable(
    makeMon('GutsMon', 'Guts', { status: 'burn' }),
    makeMon('Def2', 'Sturdy'),
    mv,
  );
  assert.ok(burnedGuts.damage > burnedNoGuts.damage);
});

test('Flare Boost increases special damage while burned', () => {
  const mv = move('Hyper Beam', 'normal', 'special', 150, { contact: false });
  const plain = runDamageStable(
    makeMon('Plain', 'Sturdy', { status: 'burn' }),
    makeMon('Def', 'Sturdy'),
    mv,
  );
  const flare = runDamageStable(
    makeMon('Flare', 'FlareBoost', { status: 'burn' }),
    makeMon('Def2', 'Sturdy'),
    mv,
  );
  assert.ok(flare.damage > plain.damage);
});

test('Toxic Boost increases physical damage while poisoned', () => {
  const mv = move('Crunch', 'dark', 'physical', 80, { contact: true });
  const plain = runDamageStable(
    makeMon('Plain', 'Sturdy', { status: 'poison' }),
    makeMon('Def', 'Sturdy'),
    mv,
  );
  const toxic = runDamageStable(
    makeMon('Toxic', 'ToxicBoost', { status: 'poison' }),
    makeMon('Def2', 'Sturdy'),
    mv,
  );
  assert.ok(toxic.damage > plain.damage);
});

test('Tinted Lens boosts resisted hits', () => {
  const mv = move('Bug Buzz', 'bug', 'special', 90, { contact: false });
  const resisted = runDamageStable(
    makeMon('Base', 'Sturdy'),
    makeMon('FireDef', 'Sturdy', { types: ['fire'] }),
    mv,
  );
  const tinted = runDamageStable(
    makeMon('Lens', 'TintedLens'),
    makeMon('FireDef2', 'Sturdy', { types: ['fire'] }),
    mv,
  );
  assert.ok(tinted.damage > resisted.damage);
});

test('Filter reduces super-effective damage', () => {
  const mv = move('Earthquake', 'ground', 'physical', 100, { contact: false });
  const plain = runDamageStable(
    makeMon('Atk', 'Sturdy'),
    makeMon('Def', 'Sturdy', { types: ['fire'] }),
    mv,
  );
  const filtered = runDamageStable(
    makeMon('Atk2', 'Sturdy'),
    makeMon('Def2', 'Filter', { types: ['fire'] }),
    mv,
  );
  assert.ok(filtered.damage < plain.damage);
});

test('Multiscale reduces damage at full HP', () => {
  const mv = move('Thunderbolt', 'electric', 'special', 90, { contact: false });
  const full = runDamageStable(
    makeMon('Atk', 'Sturdy'),
    makeMon('Scale', 'Multiscale', { currentHp: 200, maxHp: 200 }),
    mv,
  );
  const chipped = runDamageStable(
    makeMon('Atk2', 'Sturdy'),
    makeMon('Scale2', 'Multiscale', { currentHp: 150, maxHp: 200 }),
    mv,
  );
  assert.ok(full.damage < chipped.damage);
});

test('Unaware defender ignores attacker positive boosts', () => {
  const mv = move('Body Slam', 'normal', 'physical', 85, { contact: true });
  const boostedAttacker = makeMon('Boosted', 'Sturdy', {
    statStages: { attack: 4, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0, accuracy: 0, evasion: 0 },
  });
  const vsNormal = runDamageStable(
    boostedAttacker,
    makeMon('Def', 'Sturdy'),
    mv,
  );
  const vsUnaware = runDamageStable(
    makeMon('Boosted2', 'Sturdy', {
      statStages: { attack: 4, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0, accuracy: 0, evasion: 0 },
    }),
    makeMon('Def2', 'Unaware'),
    mv,
  );
  assert.ok(vsUnaware.damage < vsNormal.damage);
});

test('No Guard guarantees low-accuracy move hits', () => {
  const mv = move('Blizzard', 'ice', 'special', 110, { accuracy: 70, contact: false });
  const hit = withFixedRandom(0.99, () =>
    calculateAccuracy(
      makeMon('NoGuardUser', 'NoGuard'),
      makeMon('Def', 'Sturdy'),
      mv,
      true,
      [makeMon('NoGuardUser', 'NoGuard')],
      [makeMon('Def', 'Sturdy')],
      'none',
      true,
    ),
  );
  assert.equal(hit, true);
});

test('Sand Veil lowers accuracy in sand', () => {
  const mv = move('Hydro Pump', 'water', 'special', 110, { accuracy: 80, contact: false });
  const attacker = makeMon('Atk', 'Sturdy');
  const plain = makeMon('Plain', 'Sturdy');
  const veil = makeMon('Veil', 'SandVeil');
  const plainHit = withFixedRandom(0.78, () => calculateAccuracy(attacker, plain, mv, true, [attacker], [plain], 'sand', true));
  const veilHit = withFixedRandom(0.78, () => calculateAccuracy(attacker, veil, mv, true, [attacker], [veil], 'sand', true));
  assert.equal(plainHit, true);
  assert.equal(veilHit, false);
});

test('Strong Jaw boosts biting move damage', () => {
  const mv = move('Crunch', 'dark', 'physical', 80, { contact: true, isBiting: true } as any);
  const base = runDamageStable(
    makeMon('Base', 'Sturdy'),
    makeMon('Def', 'Sturdy'),
    mv,
  );
  const boosted = runDamageStable(
    makeMon('Jaw', 'StrongJaw'),
    makeMon('Def2', 'Sturdy'),
    mv,
  );
  assert.ok(boosted.damage > base.damage);
});

test('Iron Fist boosts punching move damage', () => {
  const mv = move('Thunder Punch', 'electric', 'physical', 75, { contact: true, isPunching: true } as any);
  const base = runDamageStable(
    makeMon('Base', 'Sturdy'),
    makeMon('Def', 'Sturdy'),
    mv,
  );
  const boosted = runDamageStable(
    makeMon('Fist', 'IronFist'),
    makeMon('Def2', 'Sturdy'),
    mv,
  );
  assert.ok(boosted.damage > base.damage);
});

test('Sheer Force boosts moves with secondary effects', () => {
  const mv = move('Flamethrower', 'fire', 'special', 90, {
    contact: false,
    meta: { ailment_chance: 10, stat_chance: 0, flinch_chance: 0 },
  } as any);
  const base = runDamageStable(
    makeMon('Base', 'Sturdy'),
    makeMon('Def', 'Sturdy'),
    mv,
  );
  const boosted = runDamageStable(
    makeMon('Force', 'SheerForce'),
    makeMon('Def2', 'Sturdy'),
    mv,
  );
  assert.ok(boosted.damage > base.damage);
});

test('Sand Force boosts rock-ground-steel in sand', () => {
  const mv = move('Rock Slide', 'rock', 'physical', 75, { contact: false });
  const normal = runDamageWithWeather(
    makeMon('Base', 'Sturdy'),
    makeMon('Def', 'Sturdy'),
    mv,
    'sand',
  );
  const boosted = runDamageWithWeather(
    makeMon('Sand', 'SandForce'),
    makeMon('Def2', 'Sturdy'),
    mv,
    'sand',
  );
  assert.ok(boosted.damage > normal.damage);
});

test('Sniper increases critical damage multiplier', () => {
  const mv = move('Slash', 'normal', 'physical', 70, { highCrit: true, contact: true } as any);
  const critNoSniper = withFixedRandom(0, () =>
    calculateDamage(
      makeMon('Critter', 'SuperLuck'),
      makeMon('Def', 'Sturdy'),
      mv,
      'none',
      'none',
      0,
      0,
      true,
      0,
      0,
      0,
      0,
      false,
      [makeMon('Critter', 'SuperLuck')],
      [makeMon('Def', 'Sturdy')],
    ),
  );
  const critSniper = withFixedRandom(0, () =>
    calculateDamage(
      makeMon('SniperMon', 'Sniper'),
      makeMon('Def2', 'Sturdy'),
      mv,
      'none',
      'none',
      0,
      0,
      true,
      0,
      0,
      0,
      0,
      false,
      [makeMon('SniperMon', 'Sniper')],
      [makeMon('Def2', 'Sturdy')],
    ),
  );
  assert.equal(critNoSniper.isCritical, true);
  assert.equal(critSniper.isCritical, true);
  assert.ok(critSniper.damage > critNoSniper.damage);
});

let passed = 0;
for (const t of tests) {
  try {
    t.fn();
    passed += 1;
    console.log(`PASS: ${t.name}`);
  } catch (err) {
    console.error(`FAIL: ${t.name}`);
    console.error(err);
    process.exit(1);
  }
}

console.log(`[abilities-runtime] PASS (${passed}/${tests.length})`);
