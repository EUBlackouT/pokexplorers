
import { NEW_ABILITIES } from './data/abilities';
import * as fs from 'fs';

const pokeService = fs.readFileSync('./services/pokeService.ts', 'utf8');
const app = fs.readFileSync('./App.tsx', 'utf8');

const missingAbilities: string[] = [];

for (const abilityName in NEW_ABILITIES) {
    const ability = NEW_ABILITIES[abilityName];
    const nameLower = abilityName.toLowerCase();
    
    // Check if ability is handled in pokeService or App.tsx by name
    const inService = pokeService.includes(`'${abilityName}'`) || pokeService.includes(`"${abilityName}"`) || pokeService.includes(`'${nameLower}'`) || pokeService.includes(`"${nameLower}"`);
    const inApp = app.includes(`'${abilityName}'`) || app.includes(`"${abilityName}"`) || app.includes(`'${nameLower}'`) || app.includes(`"${nameLower}"`);
    
    if (!inService && !inApp) {
        missingAbilities.push(abilityName);
    }
}

console.log('Potentially missing abilities:', missingAbilities);
