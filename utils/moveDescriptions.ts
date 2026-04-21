import type { PokemonMove } from '../types';
import { NEW_MOVES } from '../data/moves';

/**
 * Resolve a human-readable description for a `PokemonMove`.
 *
 * Priority:
 *  1. Custom NEW_MOVES entry -> use the hand-written `effect`/`flavor`.
 *  2. Move meta fields -> synthesize "Has a X% chance to <ailment>" style
 *     sentences from PokeAPI's normalized `meta` block.
 *  3. Stat changes -> "Raises own Attack by 1" etc.
 *  4. Last resort -> bare "<Type> <category> move."
 *
 * Designed to be cheap and synchronous so it can be called in render; we
 * never hit the network here. If PokeAPI flavor text becomes available on
 * the move object in the future (we don't store it yet), add that branch
 * above #2.
 */
export const describeMove = (m: PokemonMove | undefined | null): string => {
    if (!m) return '';
    const key = Object.keys(NEW_MOVES).find((k) => k.toLowerCase() === (m.name || '').toLowerCase());
    if (key) {
        const nm = NEW_MOVES[key];
        const parts: string[] = [];
        if (nm.effect) parts.push(nm.effect);
        if (nm.flavor) parts.push(nm.flavor);
        if (parts.length) return parts.join(' ');
    }

    const pieces: string[] = [];

    // --- Ailment (burn / poison / sleep / etc.)
    const ailment = m.meta?.ailment?.name as string | undefined;
    const ailmentChance = m.meta?.ailment_chance as number | undefined;
    if (ailment && ailment !== 'none' && ailmentChance && ailmentChance > 0) {
        pieces.push(`${ailmentChance}% chance to inflict ${ailment.replace('-', ' ')}.`);
    } else if (ailment && ailment !== 'none' && (m.damage_class === 'status' || !m.power)) {
        pieces.push(`Inflicts ${ailment.replace('-', ' ')}.`);
    }

    // --- Flinch
    if (m.flinchChance && m.flinchChance > 0) {
        pieces.push(`${Math.round(m.flinchChance)}% chance to flinch.`);
    } else if (m.meta?.flinch_chance && m.meta.flinch_chance > 0) {
        pieces.push(`${m.meta.flinch_chance}% chance to flinch.`);
    }

    // --- Multi-hit
    if ((m.min_hits && m.max_hits && m.max_hits > 1) ||
        (m.meta?.min_hits && m.meta?.max_hits && m.meta.max_hits > 1)) {
        const lo = m.min_hits || m.meta?.min_hits;
        const hi = m.max_hits || m.meta?.max_hits;
        pieces.push(lo === hi ? `Strikes ${lo} times.` : `Hits ${lo}-${hi} times per use.`);
    }

    // --- Stat changes
    const statChanges = m.stat_changes || [];
    if (statChanges.length > 0) {
        for (const sc of statChanges) {
            const statName = (sc.stat?.name || '').replace(/-/g, ' ');
            if (!statName) continue;
            const change = sc.change || 0;
            if (change === 0) continue;
            const dir = change > 0 ? 'Raises' : 'Lowers';
            const magnitude = Math.abs(change) >= 2 ? 'sharply ' : '';
            const target = m.target === 'user' || m.target === 'users-field' ? 'own' : "foe's";
            pieces.push(`${dir} ${target} ${statName} ${magnitude}(${change > 0 ? '+' : ''}${change}).`);
        }
    }

    // --- Weather / terrain
    if (m.weatherChange) pieces.push(`Changes weather to ${m.weatherChange}.`);
    if (m.terrainChange) pieces.push(`Sets ${m.terrainChange} terrain.`);

    // --- Priority
    if (m.priority && m.priority > 0) pieces.push(`+${m.priority} priority.`);
    if (m.priority && m.priority < 0) pieces.push(`${m.priority} priority.`);

    if (pieces.length === 0) {
        const cat = m.damage_class || 'physical';
        const typ = m.type || 'normal';
        return `${typ.charAt(0).toUpperCase() + typ.slice(1)} ${cat} move.`;
    }

    return pieces.join(' ');
};
