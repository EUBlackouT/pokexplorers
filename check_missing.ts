
import { NEW_ABILITIES } from './data/abilities';
import * as fs from 'fs';

const appContent = fs.readFileSync('App.tsx', 'utf8');
const serviceContent = fs.readFileSync('services/pokeService.ts', 'utf8');

const missing = [];
for (const abilityName of Object.keys(NEW_ABILITIES)) {
    if (!appContent.includes(abilityName) && !serviceContent.includes(abilityName)) {
        missing.push(abilityName);
    }
}

console.log('Missing Abilities:', missing);
console.log('Total Missing:', missing.length);
