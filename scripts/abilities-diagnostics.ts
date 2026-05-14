import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NEW_ABILITIES } from '../data/abilities';
import { POKEMON_ASSIGNMENTS } from '../data/assignments';
import { TYPE_ABILITY_POOL, UNVERIFIED_CUSTOM_ABILITIES } from '../services/pokeService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const read = (rel: string): string => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const appCode = read('App.tsx');
const pokeCode = read('services/pokeService.ts');
const combinedCode = `${appCode}\n${pokeCode}`;

const normalize = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const toDisplay = (s: string): string => s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/-/g, ' ');
const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const abilityNames = Object.keys(NEW_ABILITIES).sort((a, b) => a.localeCompare(b));
const missingRefs: string[] = [];
const weakRefs: string[] = [];
const totalRefsByAbility = new Map<string, number>();

for (const name of abilityNames) {
    const exactRx = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'g');
    const displayRx = new RegExp(`\\b${escapeRegExp(toDisplay(name))}\\b`, 'gi');
    const exactHits = (combinedCode.match(exactRx) || []).length;
    const displayHits = (combinedCode.match(displayRx) || []).length;
    const total = exactHits + displayHits;
    totalRefsByAbility.set(name, total);
    if (total === 0) {
        missingRefs.push(name);
    } else if (total === 1) {
        weakRefs.push(name);
    }
}

// Ability assignment sources that can appear in gameplay.
const assignableCustomAbilities = new Set<string>();
for (const a of POKEMON_ASSIGNMENTS) {
    for (const n of a.abilities_new || []) {
        if (NEW_ABILITIES[n]) assignableCustomAbilities.add(n);
    }
}
Object.values(TYPE_ABILITY_POOL).forEach((pool) => {
    pool.forEach((n) => {
        if (NEW_ABILITIES[n]) assignableCustomAbilities.add(n);
    });
});
for (const name of UNVERIFIED_CUSTOM_ABILITIES) {
    assignableCustomAbilities.delete(name);
}
const assignableWeak = [...assignableCustomAbilities]
    .filter((n) => (totalRefsByAbility.get(n) || 0) <= 1)
    .sort((a, b) => a.localeCompare(b));
const assignableMissing = [...assignableCustomAbilities]
    .filter((n) => (totalRefsByAbility.get(n) || 0) === 0)
    .sort((a, b) => a.localeCompare(b));

const hasGenericAbilityPopupHook =
    appCode.includes('maybeTriggerAbilityPopupFromLine') &&
    appCode.includes("line.match(/^([^']+?)'s ([^.!?\\n]+)/)") &&
    appCode.includes('popupAbility(');

console.log('[abilities] Custom ability count:', abilityNames.length);
console.log('[abilities] Missing trigger/reference coverage:', missingRefs.length);
if (missingRefs.length > 0) {
    console.log('[abilities] Missing list:', missingRefs.join(', '));
}
console.log('[abilities] Weak (single-hit) references:', weakRefs.length);
if (weakRefs.length > 0) {
    console.log('[abilities] Weak list:', weakRefs.slice(0, 40).join(', '));
}
console.log('[abilities] Assignable custom abilities:', assignableCustomAbilities.size);
console.log('[abilities] Assignable weak references:', assignableWeak.length);
if (assignableWeak.length > 0) {
    console.log('[abilities] Assignable weak list:', assignableWeak.join(', '));
}
console.log('[abilities] Assignable missing references:', assignableMissing.length);
if (assignableMissing.length > 0) {
    console.log('[abilities] Assignable missing list:', assignableMissing.join(', '));
}
console.log('[abilities] Generic popup hook detected:', hasGenericAbilityPopupHook ? 'YES' : 'NO');

if (missingRefs.length > 0 || assignableWeak.length > 0 || assignableMissing.length > 0 || !hasGenericAbilityPopupHook) {
    console.error('[abilities] FAIL');
    process.exit(1);
}

console.log('[abilities] PASS');
