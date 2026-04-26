import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { StatStages } from '../../types';

/* =============================================================================
 * StatStageStrip
 * =============================================================================
 * Persistent visual indicator of a battler's *current* stat stages, drawn as a
 * small horizontal row of color-coded chips next to (or under) the HealthBar.
 *
 * The popup bus + BattleBuffFx already give players a one-shot, dramatic burst
 * the moment a stat changes. But Pokemon battles also need a glance-readable
 * "what's the current state of buffs" -- otherwise a player who looks away or
 * tabs in mid-turn has no way to know that, say, Garchomp is sitting at +2
 * Attack and -1 Speed. The classic games handle this with the in-battle stat
 * summary screen; we surface it inline so it's always visible.
 *
 * Design notes:
 *   - Only stages != 0 are rendered. A neutral mon shows nothing.
 *   - Stages are clamped to the canonical -6..+6 range for display.
 *   - The chip uses the same per-stat hex palette as BattleBuffFx and
 *     BattlePopupLayer so all three feedback channels share a colour
 *     language.
 *   - Layout is a tight flex row so the strip fits beside the HP/level row
 *     even on the 256px-wide HealthBar.
 * ========================================================================== */

type StageKey = keyof StatStages;

const ORDER: StageKey[] = [
    'attack',
    'special-attack',
    'speed',
    'defense',
    'special-defense',
    'accuracy',
    'evasion',
];

const SHORT: Record<StageKey, string> = {
    attack: 'Atk',
    defense: 'Def',
    'special-attack': 'SpA',
    'special-defense': 'SpD',
    speed: 'Spe',
    accuracy: 'Acc',
    evasion: 'Eva',
};

const COLOR: Record<StageKey, { up: string; down: string; ring: string }> = {
    attack:           { up: '#ef4444', down: '#9f1239', ring: '#fca5a5' },
    defense:          { up: '#3b82f6', down: '#1e3a8a', ring: '#93c5fd' },
    'special-attack': { up: '#a855f7', down: '#581c87', ring: '#d8b4fe' },
    'special-defense':{ up: '#06b6d4', down: '#155e75', ring: '#67e8f9' },
    speed:            { up: '#facc15', down: '#854d0e', ring: '#fde68a' },
    accuracy:         { up: '#f1f5f9', down: '#475569', ring: '#cbd5e1' },
    evasion:          { up: '#c084fc', down: '#6b21a8', ring: '#e9d5ff' },
};

interface Props {
    stages?: StatStages;
    /** Optional align: by default the strip flows left-to-right; the player
     *  side passes 'left' for left-aligned, the enemy side 'left' as well
     *  since both health bars start from their inner edge. */
    align?: 'left' | 'right';
}

export const StatStageStrip: React.FC<Props> = ({ stages, align = 'left' }) => {
    if (!stages) return null;
    const active = ORDER
        .map(k => ({ key: k, value: Math.max(-6, Math.min(6, stages[k] ?? 0)) }))
        .filter(s => s.value !== 0);

    if (active.length === 0) return null;

    return (
        <div
            className={`flex flex-wrap gap-1 px-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}
            // Cap strip width to the HealthBar so a +6 in every stat (rare)
            // doesn't overflow the side panel.
            style={{ maxWidth: 280 }}
        >
            <AnimatePresence>
                {active.map(({ key, value }) => {
                    const c = COLOR[key];
                    const up = value > 0;
                    const arrows = (up ? '\u2191' : '\u2193').repeat(Math.min(3, Math.abs(value)));
                    return (
                        <motion.span
                            key={key}
                            layout
                            initial={{ opacity: 0, scale: 0.6, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.6, y: -4 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="inline-flex items-center gap-1 rounded-md border-2 px-1.5 py-[1px] text-[10px] font-black tracking-wider"
                            style={{
                                color: c.ring,
                                borderColor: c.ring,
                                backgroundColor: `${up ? c.up : c.down}cc`,
                                boxShadow: `0 0 8px ${up ? c.up : c.down}88, inset 0 0 4px rgba(0,0,0,0.4)`,
                                textShadow: '0 1px 1px rgba(0,0,0,0.85)',
                            }}
                        >
                            <span>{SHORT[key]}</span>
                            <span className="text-[12px] leading-none">{arrows}</span>
                        </motion.span>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
