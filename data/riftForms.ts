/**
 * Rift Forms -- in-battle transform data.
 *
 * Lightweight definitions for Terastallization / Mega Evolution / Z-Moves.
 * These are intentionally simple: the full canon versions have hundreds of
 * per-species forms, which is out of scope for a fan game. Instead we treat
 * each transform as a "per-battle buff" applied to the active Pokémon:
 *
 *   - Tera -> override types to [teraType], 2x STAB on new type moves
 *   - Mega -> flat 1.3x atk/spAtk, 1.2x def/spDef for rest of battle
 *   - Z    -> next damaging move: 1.8x damage, always hits, pierces Protect
 *
 * The actual math is applied inside App.tsx's pre-damage shim and the
 * post-`calculateDamage` result patch. See the "RIFT TRANSFORM DAMAGE SHIM"
 * comment in App.tsx.
 */

/**
 * Tera type picker. Just the 18 canonical types so the UI stays tidy.
 * The "Stellar" type is out of scope -- we'd need a separate STAB rule.
 */
export const TERA_TYPES: string[] = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice',
    'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
    'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
];

/**
 * Pokédex IDs that can Mega Evolve. Canonical mega roster -- kept short to
 * avoid spec creep. Add future forms here and the UI picks them up for free.
 * Non-mega species simply see the MEGA button disabled with a helpful
 * tooltip.
 */
export const MEGA_ELIGIBLE: Set<number> = new Set([
    3,   // Venusaur
    6,   // Charizard
    9,   // Blastoise
    15,  // Beedrill
    18,  // Pidgeot
    65,  // Alakazam
    80,  // Slowbro
    94,  // Gengar
    115, // Kangaskhan
    127, // Pinsir
    130, // Gyarados
    142, // Aerodactyl
    150, // Mewtwo
    181, // Ampharos
    208, // Steelix
    212, // Scizor
    214, // Heracross
    229, // Houndoom
    248, // Tyranitar
    254, // Sceptile
    257, // Blaziken
    260, // Swampert
    282, // Gardevoir
    302, // Sableye
    303, // Mawile
    306, // Aggron
    308, // Medicham
    310, // Manectric
    319, // Sharpedo
    323, // Camerupt
    334, // Altaria
    354, // Banette
    359, // Absol
    362, // Glalie
    373, // Salamence
    376, // Metagross
    380, // Latias
    381, // Latios
    384, // Rayquaza
    428, // Lopunny
    445, // Garchomp
    448, // Lucario
    460, // Abomasnow
]);

/**
 * Tera damage patch. Clones the attacker with a tera-typed types array
 * so STAB / defensive typing calculations inside the damage formula
 * see the new type. The 2x instead of 1.5x STAB is approximated by
 * applying a further post-damage multiplier when `move.type === teraType`.
 */
export function teraStabBonus(moveType: string | undefined, teraType: string | undefined): number {
    if (!teraType || !moveType) return 1;
    // Already getting 1.5x STAB baseline from calculateDamage when
    // types include moveType. We bump to 2.0x total for tera-matched
    // moves: 1.5 * (2/1.5) = 2.0. Typed mismatched = same 1.5x.
    if (moveType === teraType) return 2 / 1.5;
    return 1;
}

/** Mega stat multipliers applied via a cloned attacker before damage calc. */
export const MEGA_ATK_MULT = 1.3;
export const MEGA_DEF_MULT = 1.2;

/** Z-move power boost applied to the raw damage number after calc. */
export const Z_DAMAGE_MULT = 1.8;
