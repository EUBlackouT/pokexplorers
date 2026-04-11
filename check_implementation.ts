
import { NEW_MOVES } from './data/moves';
import * as fs from 'fs';

const pokeService = fs.readFileSync('./services/pokeService.ts', 'utf8');
const app = fs.readFileSync('./App.tsx', 'utf8');

const missingMoves: string[] = [];

for (const moveName in NEW_MOVES) {
    const move = NEW_MOVES[moveName];
    const nameLower = moveName.toLowerCase();
    
    // Check if move is handled in pokeService or App.tsx by name
    const inService = pokeService.includes(`'${moveName}'`) || pokeService.includes(`"${moveName}"`) || pokeService.includes(`'${nameLower}'`) || pokeService.includes(`"${nameLower}"`);
    const inApp = app.includes(`'${moveName}'`) || app.includes(`"${moveName}"`) || app.includes(`'${nameLower}'`) || app.includes(`"${nameLower}"`);
    
    // Check for generic handling
    const hasAilment = move.meta?.ailment && move.meta.ailment.name !== 'none';
    const hasStatChanges = move.stat_changes && move.stat_changes.length > 0;
    const hasFlinch = move.flinchChance !== undefined;
    const hasWeather = move.weatherChange !== undefined;
    const hasTerrain = move.terrainChange !== undefined;
    const hasHealing = move.meta?.healing !== undefined;
    const hasDrain = move.meta?.drain !== undefined;
    const isStatus = (move as any).damage_class === 'status';
    
    // If it's a status move with ailment or stat changes, it's likely handled by generic logic in applySecondaryEffect
    const handledGenerically = (hasAilment || hasStatChanges || hasFlinch || hasWeather || hasTerrain || hasHealing || hasDrain);

    if (!inService && !inApp && !handledGenerically) {
        // Special cases for moves that don't need explicit logic (e.g. pure damage moves with no special properties)
        const isPureDamage = !move.effect || move.effect === 'High power, low accuracy.' || move.effect === 'No special effect.';
        if (!isPureDamage) {
            missingMoves.push(moveName);
        }
    }
}

console.log('Potentially missing moves:', missingMoves);
