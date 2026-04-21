/**
 * Learnset helpers for the Move Relearner.
 *
 * A Pokemon's `movePool` (populated in pokeService.fetchPokemon) already stores
 * every level-up move plus custom assignment additions, so we can reconstruct
 * the full "moves learnable at or below current level" list without another
 * network round-trip. We also pull full move details from PokeAPI (via the
 * media proxy) when the player picks a move to learn, so power/accuracy/PP
 * badges render correctly in the UI.
 */

import { Pokemon, PokemonMove, MovePoolItem } from '../types';
import { NEW_MOVES } from '../data/moves';

const PROXY = (url: string) => `/api/media-proxy?url=${encodeURIComponent(url)}`;

// Cache PokeAPI move lookups for the session so repeated relearner opens don't
// re-fetch the same URL dozens of times.
const moveDetailCache = new Map<string, PokemonMove>();

export interface LearnableEntry {
    /** Slug / display key, e.g. "thunder-shock". */
    name: string;
    /** Level the move is learned at (ascending). */
    level: number;
    /** Matches movePool's URL; '' for custom NEW_MOVES entries. */
    url: string;
    /** True if already in the Pokemon's active moveset. */
    known: boolean;
}

/** All moves this Pokemon could legally know right now, sorted newest-first. */
export const getLearnableMoves = (mon: Pokemon): LearnableEntry[] => {
    const seen = new Set<string>();
    const out: LearnableEntry[] = [];
    for (const m of mon.movePool) {
        if (m.level > mon.level) continue;
        const key = m.name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const known = mon.moves.some((cur) => cur.name.toLowerCase() === key);
        out.push({ name: m.name, level: m.level, url: m.url, known });
    }
    // Newest first, then alphabetical for stable ordering within a level.
    out.sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));
    return out;
};

/**
 * Resolve a movePool entry into a fully-hydrated PokemonMove. Falls back to the
 * custom NEW_MOVES bank for entries with no URL (e.g. `Emberlance`).
 */
export const hydrateMove = async (entry: Pick<MovePoolItem, 'name' | 'url'>): Promise<PokemonMove | null> => {
    const cacheKey = entry.url || `custom:${entry.name}`;
    const cached = moveDetailCache.get(cacheKey);
    if (cached) return cached;

    // Custom / competitive move bank.
    if (!entry.url && NEW_MOVES[entry.name]) {
        const md = NEW_MOVES[entry.name];
        const newMove: PokemonMove = {
            name: entry.name,
            url: '',
            power: md.power,
            accuracy: md.accuracy,
            type: md.type.toLowerCase(),
            damage_class: md.category.toLowerCase() as any,
            pp: md.pp,
            priority: md.priority,
            target: md.target,
            description: md.flavor,
        } as PokemonMove;
        moveDetailCache.set(cacheKey, newMove);
        return newMove;
    }

    if (!entry.url) return null;

    try {
        const r = await fetch(PROXY(entry.url));
        if (!r.ok) return null;
        const data = await r.json();
        const mv: PokemonMove = {
            name: data.name,
            url: entry.url,
            power: data.power || 0,
            accuracy: data.accuracy || 100,
            type: data.type?.name || 'normal',
            damage_class: data.damage_class?.name || 'physical',
            pp: data.pp,
            priority: data.priority,
            target: data.target?.name,
            stat_changes: data.stat_changes,
            meta: data.meta,
        } as PokemonMove;
        moveDetailCache.set(cacheKey, mv);
        return mv;
    } catch {
        return null;
    }
};

/** Replace the move at `slotIndex` with `newMove` on a fresh copy of the Pokemon. */
export const replaceMove = (mon: Pokemon, slotIndex: number, newMove: PokemonMove): Pokemon => {
    const moves = mon.moves.slice();
    if (slotIndex < 0 || slotIndex > moves.length) return mon;
    if (slotIndex === moves.length && moves.length < 4) {
        moves.push(newMove);
    } else {
        moves[slotIndex] = newMove;
    }
    return { ...mon, moves };
};

/**
 * Prevent soft-locks: returns true if removing `slotIndex` from the active
 * moveset would leave the Pokemon with zero damaging moves.
 */
export const wouldSoftLock = (mon: Pokemon, slotIndex: number): boolean => {
    if (mon.moves.length <= 1) return true;
    const remaining = mon.moves.filter((_, i) => i !== slotIndex);
    return remaining.every((m) => !m.power || m.power === 0);
};
