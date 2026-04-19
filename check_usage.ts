
import { NEW_MOVES } from './data/moves';
import { NEW_ABILITIES } from './data/abilities';
import { POKEMON_ASSIGNMENTS } from './data/assignments';

const usedMoves = new Set<string>();
for (const assignment of POKEMON_ASSIGNMENTS) {
    for (const addition of assignment.learnset_additions) {
        usedMoves.add(addition.move);
    }
}

const unusedMoves: string[] = [];
for (const moveName in NEW_MOVES) {
    if (!usedMoves.has(moveName)) {
        unusedMoves.push(moveName);
    }
}

const usedAbilities = new Set<string>();
for (const assignment of POKEMON_ASSIGNMENTS) {
    for (const ability of assignment.abilities_new) {
        usedAbilities.add(ability);
    }
}

const unusedAbilities: string[] = [];
for (const abilityName in NEW_ABILITIES) {
    if (!usedAbilities.has(abilityName)) {
        unusedAbilities.push(abilityName);
    }
}

console.log('Unused moves:', unusedMoves.length);
if (unusedMoves.length > 0) {
    console.log('First 10 unused moves:', unusedMoves.slice(0, 10));
}

console.log('Unused abilities:', unusedAbilities.length);
if (unusedAbilities.length > 0) {
    console.log('First 10 unused abilities:', unusedAbilities.slice(0, 10));
}
